package com.performancekit

import android.os.Handler
import android.os.Looper
import android.view.Choreographer

/** Delivers one display-frame timestamp (nanoseconds, `System.nanoTime` base) per frame until stopped. */
interface FrameObserver {
  fun start(onFrame: (Long) -> Unit)

  /** Must remove every pending callback; may be called repeatedly. */
  fun stop()
}

/**
 * Observes frames with a [Choreographer] callback on the main thread. The callback only records a
 * timestamp. Keeping it posted each frame makes the display tick continuously, so this measures display
 * cadence (see FpsCalculator), not whether React Native rendered each frame.
 */
class ChoreographerFrameObserver : FrameObserver {
  private val main = Handler(Looper.getMainLooper())

  @Volatile
  private var callback: Choreographer.FrameCallback? = null

  @Synchronized
  override fun start(onFrame: (Long) -> Unit) {
    stop()
    val cb = object : Choreographer.FrameCallback {
      override fun doFrame(frameTimeNanos: Long) {
        if (callback !== this) return
        onFrame(frameTimeNanos)
        Choreographer.getInstance().postFrameCallback(this)
      }
    }
    callback = cb
    main.post { if (callback === cb) Choreographer.getInstance().postFrameCallback(cb) }
  }

  @Synchronized
  override fun stop() {
    val cb = callback ?: return
    callback = null
    main.post { Choreographer.getInstance().removeFrameCallback(cb) }
  }
}
