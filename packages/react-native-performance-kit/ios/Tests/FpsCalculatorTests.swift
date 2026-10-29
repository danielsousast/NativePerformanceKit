import XCTest

final class FpsCalculatorTests: XCTestCase {
  @discardableResult
  private func frames(_ calc: FpsCalculator, _ count: Int, interval: TimeInterval, from: TimeInterval = 0) -> TimeInterval {
    var t = from
    for _ in 0..<count {
      calc.record(t)
      t += interval
    }
    return t - interval
  }

  func testNoOrSingleFrameIsUnavailable() {
    let calc = FpsCalculator()
    XCTAssertNil(calc.fps(now: 0))
    calc.record(0)
    XCTAssertNil(calc.fps(now: 0))
  }

  func testWindowCoveringLessThanHalfIsUnavailable() {
    let calc = FpsCalculator()
    let last = frames(calc, 20, interval: 1.0 / 60)
    XCTAssertNil(calc.fps(now: last))
  }

  func testSteadyRates() {
    let sixty = FpsCalculator()
    XCTAssertEqual(sixty.fps(now: frames(sixty, 90, interval: 1.0 / 60)) ?? 0, 60, accuracy: 0.01)
    let thirty = FpsCalculator()
    XCTAssertEqual(thirty.fps(now: frames(thirty, 60, interval: 1.0 / 30)) ?? 0, 30, accuracy: 0.01)
  }

  func testOldFramesLeaveTheWindow() {
    let calc = FpsCalculator()
    var last = frames(calc, 60, interval: 1.0 / 60)
    last = frames(calc, 90, interval: 1.0 / 30, from: last + 1.0 / 30)
    XCTAssertEqual(calc.fps(now: last) ?? 0, 30, accuracy: 0.5)
  }

  func testDuplicateAndOutOfOrderTimestampsAreIgnored() {
    let calc = FpsCalculator()
    let last = frames(calc, 61, interval: 1.0 / 60)
    calc.record(last)
    calc.record(last - 0.005)
    calc.record(0)
    XCTAssertEqual(calc.fps(now: last) ?? 0, 60, accuracy: 0.01)
  }

  func testNoFrameWithinTheWindowIsUnavailable() {
    let calc = FpsCalculator()
    let last = frames(calc, 61, interval: 1.0 / 60)
    XCTAssertNil(calc.fps(now: last + 1.001))
  }

  func testResetDropsFrames() {
    let calc = FpsCalculator()
    let last = frames(calc, 61, interval: 1.0 / 60)
    calc.reset()
    XCTAssertNil(calc.fps(now: last))
  }

  func testStoredFramesStayBoundedByTheWindow() {
    let calc = FpsCalculator()
    let last = frames(calc, 20_000, interval: 0.001)
    XCTAssertEqual(calc.fps(now: last) ?? 0, 1000, accuracy: 1)
  }
}
