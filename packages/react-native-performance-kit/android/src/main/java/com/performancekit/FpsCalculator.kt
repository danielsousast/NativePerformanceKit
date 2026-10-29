package com.performancekit

import java.util.ArrayDeque

/**
 * Estimates frames per second from observed frame timestamps (nanoseconds, any monotonic clock) over a
 * sliding [windowNs] window. Holds at most one window of timestamps (refresh rate x window).
 *
 * The estimate is `(frames - 1) / span`, the cadence between the first and last frame in the window.
 * It is null (unavailable) until the window holds frames covering at least half of it, and again when
 * no frame arrived within the window (backgrounded or main thread blocked).
 */
class FpsCalculator(private val windowNs: Long = WINDOW_NS) {
  private val frames = ArrayDeque<Long>()

  /** Ignores timestamps that do not advance (duplicate or out-of-order frames). */
  @Synchronized
  fun record(frameTimeNanos: Long) {
    if (frames.isNotEmpty() && frameTimeNanos <= frames.peekLast()) return
    frames.addLast(frameTimeNanos)
    evictBefore(frameTimeNanos - windowNs)
  }

  @Synchronized
  fun fps(nowNanos: Long): Double? {
    evictBefore(nowNanos - windowNs)
    if (frames.size < 2) return null
    val span = frames.peekLast() - frames.peekFirst()
    if (span < windowNs / 2) return null
    return (frames.size - 1) * NANOS_PER_SECOND / span
  }

  @Synchronized
  fun reset() = frames.clear()

  private fun evictBefore(cutoff: Long) {
    while (frames.isNotEmpty() && frames.peekFirst() < cutoff) frames.removeFirst()
  }

  companion object {
    const val WINDOW_NS = 1_000_000_000L
    private const val NANOS_PER_SECOND = 1e9
  }
}
