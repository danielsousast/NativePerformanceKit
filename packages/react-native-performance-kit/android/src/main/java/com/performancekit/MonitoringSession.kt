package com.performancekit

import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/** Repeating background tick. `stop()` must release the thread/timer; both may be called repeatedly. */
interface Ticker {
  fun start(periodMs: Long, task: Runnable)
  fun stop()
}

private class ExecutorTicker : Ticker {
  private var executor: ScheduledExecutorService? = null

  @Synchronized
  override fun start(periodMs: Long, task: Runnable) {
    stop()
    executor = Executors.newSingleThreadScheduledExecutor { r ->
      Thread(r, "PerformanceKit-sampler").apply { isDaemon = true }
    }.also { it.scheduleWithFixedDelay(task, 0L, periodMs, TimeUnit.MILLISECONDS) }
  }

  @Synchronized
  override fun stop() {
    executor?.shutdownNow()
    executor = null
  }
}

/**
 * The single shared monitoring session. While running, one frame observer feeds an [FpsCalculator] and
 * one background ticker samples memory and FPS every interval, keeping only the latest sample (bounded:
 * one value). Starting again never creates a second ticker or observer; a new interval restarts both
 * (so FPS is null until its window refills). While stopped, no frames are observed and FPS is null.
 */
class MonitoringSession(
  private val collector: MemoryCollector,
  private val newFrameObserver: () -> FrameObserver = { ChoreographerFrameObserver() },
  private val nanoTime: () -> Long = System::nanoTime,
  private val newTicker: () -> Ticker = { ExecutorTicker() }
) {
  private val fpsCalculator = FpsCalculator()
  private var frames: FrameObserver? = null
  private var ticker: Ticker? = null
  private var intervalMs: Long = 0L
  private var latest: MemorySnapshot? = null

  /** @throws IllegalArgumentException if the interval is not a finite number >= [MIN_INTERVAL_MS]. */
  @Synchronized
  fun start(intervalMs: Double) {
    require(intervalMs.isFinite() && intervalMs >= MIN_INTERVAL_MS) {
      "intervalMs must be a finite number >= $MIN_INTERVAL_MS, got $intervalMs"
    }
    val period = intervalMs.toLong()
    if (ticker != null && period == this.intervalMs) return
    stop()
    val started = newTicker()
    val observer = newFrameObserver()
    try {
      observer.start(fpsCalculator::record)
      started.start(period) { sample(started) }
    } catch (e: RuntimeException) {
      started.stop()
      observer.stop()
      fpsCalculator.reset()
      throw e
    }
    ticker = started
    frames = observer
    this.intervalMs = period
  }

  @Synchronized
  fun stop() {
    ticker?.stop()
    ticker = null
    frames?.stop()
    frames = null
    fpsCalculator.reset()
    latest = null
  }

  @Synchronized
  fun isMonitoring(): Boolean = ticker != null

  /** Latest sample while monitoring; a fresh read when stopped or before the first sample. */
  @Throws(MemoryUnavailableException::class)
  fun snapshot(): MemorySnapshot = synchronized(this) { latest } ?: collector.snapshot()

  private fun sample(source: Ticker) {
    // A failed read must not stop the session; drop the stale value so snapshot() reports the failure.
    val result = try {
      collector.snapshot().copy(fps = fpsCalculator.fps(nanoTime()))
    } catch (e: MemoryUnavailableException) {
      null
    }
    synchronized(this) {
      // Ignore a tick that raced with stop() or a restart.
      if (ticker === source) latest = result
    }
  }

  companion object {
    const val MIN_INTERVAL_MS = 100.0
  }
}
