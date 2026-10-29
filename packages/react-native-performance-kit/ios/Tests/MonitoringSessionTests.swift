import XCTest

private final class FakeTicker: Ticker {
  var task: (() -> Void)?
  var periodMs = 0
  var running = false

  func start(periodMs: Int, task: @escaping () -> Void) {
    self.periodMs = periodMs
    self.task = task
    running = true
  }

  func stop() { running = false }
  func tick() { task?() }
}

private final class FakeFrameObserver: FrameObserver {
  var onFrame: ((TimeInterval) -> Void)?
  var running = false

  func start(onFrame: @escaping (TimeInterval) -> Void) {
    self.onFrame = onFrame
    running = true
  }

  func stop() { running = false }
  func frame(_ time: TimeInterval) { onFrame?(time) }
}

// Not part of the pod (excluded in PerformanceKit.podspec). Run with ios/Tests/run.sh.
final class MonitoringSessionTests: XCTestCase {
  private var tickers: [FakeTicker] = []
  private var observers: [FakeFrameObserver] = []
  private var clock: TimeInterval = 0
  private var footprint: UInt64? = 1000
  private lazy var collector = MemoryCollector(readFootprintBytes: { self.footprint }, now: Date.init)

  private func makeSession() -> MonitoringSession {
    MonitoringSession(
      collector: collector,
      makeTicker: {
        let ticker = FakeTicker()
        self.tickers.append(ticker)
        return ticker
      },
      makeFrameObserver: {
        let observer = FakeFrameObserver()
        self.observers.append(observer)
        return observer
      },
      now: { self.clock })
  }

  /// Delivers 60 Hz frames from `from` for one second and moves the clock to its end.
  private func runFrames(_ observer: FakeFrameObserver, from: TimeInterval = 0) {
    for i in 0...60 { observer.frame(from + Double(i) / 60) }
    clock = from + 1
  }

  private func fps(_ session: MonitoringSession) throws -> Double? {
    (try session.snapshot()["fps"] as? NSNumber)?.doubleValue
  }

  private func memory(_ session: MonitoringSession) throws -> UInt64? {
    (try session.snapshot()["memoryUsageBytes"] as? NSNumber)?.uint64Value
  }

  func testStartAndStopToggleStatus() throws {
    let session = makeSession()
    XCTAssertFalse(session.isMonitoring)
    try session.start(intervalMs: 500)
    XCTAssertTrue(session.isMonitoring)
    XCTAssertEqual(tickers.first?.periodMs, 500)
    session.stop()
    XCTAssertFalse(session.isMonitoring)
    XCTAssertEqual(tickers.map(\.running), [false])
  }

  func testRejectsInvalidIntervalsWithoutStarting() throws {
    let session = makeSession()
    for bad in [0, 99, -5, Double.nan, Double.infinity] {
      XCTAssertThrowsError(try session.start(intervalMs: bad))
    }
    XCTAssertFalse(session.isMonitoring)
    XCTAssertTrue(tickers.isEmpty)
    try session.start(intervalMs: MonitoringSession.minIntervalMs)
    XCTAssertTrue(session.isMonitoring)
  }

  func testRepeatedStartWithSameIntervalKeepsOneTicker() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    try session.start(intervalMs: 500)
    XCTAssertEqual(tickers.count, 1)
    XCTAssertTrue(tickers[0].running)
  }

  func testStartWithNewIntervalReplacesTheTicker() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    try session.start(intervalMs: 250)
    XCTAssertEqual(tickers.map(\.running), [false, true])
    XCTAssertEqual(tickers[1].periodMs, 250)
  }

  func testInvalidRestartKeepsTheRunningSession() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    XCTAssertThrowsError(try session.start(intervalMs: 1))
    XCTAssertTrue(session.isMonitoring)
    XCTAssertTrue(tickers[0].running)
  }

  func testRepeatedStopAndRestartAreSafe() throws {
    let session = makeSession()
    session.stop()
    for _ in 0..<3 {
      try session.start(intervalMs: 500)
      session.stop()
      session.stop()
    }
    XCTAssertEqual(tickers.count, 3)
    XCTAssertTrue(tickers.allSatisfy { !$0.running })
  }

  func testSnapshotUsesLatestSampleWhileMonitoringAndReadsFreshOtherwise() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    XCTAssertEqual(try memory(session), 1000)  // before first tick: fresh read
    footprint = 2000
    tickers[0].tick()
    footprint = 3000
    XCTAssertEqual(try memory(session), 2000)
    session.stop()
    XCTAssertEqual(try memory(session), 3000)
  }

  func testFailedSampleKeepsSessionRunningAndReportsTheFailure() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    tickers[0].tick()
    footprint = nil
    tickers[0].tick()
    XCTAssertTrue(session.isMonitoring)
    XCTAssertThrowsError(try session.snapshot())
    footprint = 1000
    tickers[0].tick()
    XCTAssertEqual(try memory(session), 1000)
  }

  func testLateTickAfterStopIsDiscarded() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    let ticker = tickers[0]
    session.stop()
    footprint = 9000
    ticker.tick()
    footprint = 1234
    XCTAssertEqual(try memory(session), 1234)
  }

  func testFpsIsNilUntilTheWindowHasFrames() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    tickers[0].tick()
    XCTAssertNil(try fps(session))
  }

  func testSampleReportsFpsFromObservedFrames() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    runFrames(observers[0])
    tickers[0].tick()
    XCTAssertEqual(try fps(session) ?? 0, 60, accuracy: 0.5)
  }

  func testSnapshotWhileStoppedHasNoFps() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    runFrames(observers[0])
    tickers[0].tick()
    session.stop()
    XCTAssertNil(try fps(session))
  }

  func testStopAndRestartReleaseObserversAndClearFrames() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    runFrames(observers[0])
    try session.start(intervalMs: 250)
    XCTAssertEqual(observers.map(\.running), [false, true])
    tickers[1].tick()
    XCTAssertNil(try fps(session))
    session.stop()
    session.stop()
    XCTAssertTrue(observers.allSatisfy { !$0.running })
  }

  func testRepeatedStartWithSameIntervalKeepsOneObserver() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    try session.start(intervalMs: 500)
    XCTAssertEqual(observers.count, 1)
  }

  func testFramesStoppedForLongerThanTheWindowMakeFpsNil() throws {
    let session = makeSession()
    try session.start(intervalMs: 500)
    runFrames(observers[0])
    clock += 2
    tickers[0].tick()
    XCTAssertNil(try fps(session))
  }
}
