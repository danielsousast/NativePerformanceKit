import Foundation

enum MonitoringSessionError: Error, LocalizedError {
  case invalidInterval(Double)

  var errorDescription: String? {
    switch self {
    case .invalidInterval(let value):
      return "intervalMs must be a finite number >= \(MonitoringSession.minIntervalMs), got \(value)"
    }
  }
}

/// Repeating background tick. `stop()` must release the timer; both may be called repeatedly.
protocol Ticker: AnyObject {
  func start(periodMs: Int, task: @escaping () -> Void)
  func stop()
}

final class DispatchTicker: Ticker {
  private let queue = DispatchQueue(label: "PerformanceKit.sampler", qos: .utility)
  private var timer: DispatchSourceTimer?

  func start(periodMs: Int, task: @escaping () -> Void) {
    stop()
    let timer = DispatchSource.makeTimerSource(queue: queue)
    timer.schedule(deadline: .now(), repeating: .milliseconds(periodMs))
    timer.setEventHandler(handler: task)
    self.timer = timer
    timer.resume()
  }

  func stop() {
    timer?.cancel()
    timer = nil
  }

  deinit { stop() }
}

/// The single shared monitoring session. While running, one background timer samples memory every
/// interval and keeps only the latest sample (bounded: one value). Starting again never creates a
/// second timer; the interval is simply replaced.
@objc(PKMonitoringSession)
public final class MonitoringSession: NSObject {
  static let minIntervalMs = 100.0

  private let collector: MemoryCollector
  private let makeTicker: () -> Ticker
  private let lock = NSLock()
  private var ticker: Ticker?
  private var periodMs = 0
  private var latest: [String: Any]?

  @objc public override convenience init() {
    self.init(collector: MemoryCollector(), makeTicker: { DispatchTicker() })
  }

  init(collector: MemoryCollector, makeTicker: @escaping () -> Ticker) {
    self.collector = collector
    self.makeTicker = makeTicker
  }

  deinit { stop() }

  /// Throws `MonitoringSessionError.invalidInterval` unless the interval is finite and >= `minIntervalMs`.
  @objc public func start(intervalMs: Double) throws {
    guard intervalMs.isFinite, intervalMs >= MonitoringSession.minIntervalMs else {
      throw MonitoringSessionError.invalidInterval(intervalMs)
    }
    let period = Int(min(intervalMs, Double(Int32.max)))
    lock.lock()
    defer { lock.unlock() }
    if ticker != nil && period == periodMs { return }
    stopLocked()
    let started = makeTicker()
    ticker = started
    periodMs = period
    started.start(periodMs: period) { [weak self, weak started] in
      guard let self = self, let started = started else { return }
      self.sample(from: started)
    }
  }

  @objc public func stop() {
    lock.lock()
    defer { lock.unlock() }
    stopLocked()
  }

  @objc public var isMonitoring: Bool {
    lock.lock()
    defer { lock.unlock() }
    return ticker != nil
  }

  /// Latest sample while monitoring; a fresh read when stopped or before the first sample.
  @objc public func snapshot() throws -> [String: Any] {
    lock.lock()
    let cached = latest
    lock.unlock()
    return try cached ?? collector.snapshot()
  }

  private func stopLocked() {
    ticker?.stop()
    ticker = nil
    latest = nil
  }

  private func sample(from source: Ticker) {
    // A failed read must not stop the session; drop the stale value so snapshot() reports the failure.
    let result = try? collector.snapshot()
    lock.lock()
    defer { lock.unlock() }
    // Ignore a tick that raced with stop() or a restart.
    if ticker === source { latest = result }
  }
}
