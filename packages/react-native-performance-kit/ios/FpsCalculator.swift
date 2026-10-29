import Foundation

/// Estimates frames per second from observed frame timestamps (seconds, any monotonic clock) over a
/// sliding `window`. Holds at most one window of timestamps (refresh rate x window).
///
/// The estimate is `(frames - 1) / span`, the cadence between the first and last frame in the window.
/// It is nil (unavailable) until the window holds frames covering at least half of it, and again when
/// no frame arrived within the window (backgrounded or main thread blocked).
final class FpsCalculator {
  static let window: TimeInterval = 1

  private let window: TimeInterval
  private let lock = NSLock()
  private var frames: [TimeInterval] = []

  init(window: TimeInterval = FpsCalculator.window) {
    self.window = window
  }

  /// Ignores timestamps that do not advance (duplicate or out-of-order frames).
  func record(_ timestamp: TimeInterval) {
    lock.lock()
    defer { lock.unlock() }
    if let last = frames.last, timestamp <= last { return }
    frames.append(timestamp)
    evict(before: timestamp - window)
  }

  func fps(now: TimeInterval) -> Double? {
    lock.lock()
    defer { lock.unlock() }
    evict(before: now - window)
    guard frames.count >= 2, let first = frames.first, let last = frames.last else { return nil }
    let span = last - first
    guard span >= window / 2 else { return nil }
    return Double(frames.count - 1) / span
  }

  func reset() {
    lock.lock()
    defer { lock.unlock() }
    frames.removeAll()
  }

  private func evict(before cutoff: TimeInterval) {
    while let first = frames.first, first < cutoff { frames.removeFirst() }
  }
}
