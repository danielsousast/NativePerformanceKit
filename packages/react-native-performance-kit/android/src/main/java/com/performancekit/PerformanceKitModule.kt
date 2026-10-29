package com.performancekit

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class PerformanceKitModule(reactContext: ReactApplicationContext) :
  NativePerformanceKitSpec(reactContext) {

  private val session = MonitoringSession(MemoryCollector())

  override fun startMonitoring(intervalMs: Double, promise: Promise) {
    try {
      session.start(intervalMs)
      promise.resolve(null)
    } catch (e: IllegalArgumentException) {
      promise.reject("E_INVALID_INTERVAL", e.message, e)
    }
  }

  override fun stopMonitoring(promise: Promise) {
    session.stop()
    promise.resolve(null)
  }

  override fun isMonitoring(): Boolean = session.isMonitoring()

  override fun getSnapshot(promise: Promise) {
    try {
      val snapshot = session.snapshot()
      promise.resolve(
        Arguments.createMap().apply {
          putDouble("timestamp", snapshot.timestampMs.toDouble())
          putDouble("memoryUsageBytes", snapshot.memoryUsageBytes.toDouble())
          if (snapshot.fps != null) putDouble("fps", snapshot.fps) else putNull("fps")
        }
      )
    } catch (e: MemoryUnavailableException) {
      promise.reject("E_MEMORY_UNAVAILABLE", e.message, e)
    }
  }

  override fun invalidate() {
    session.stop()
    super.invalidate()
  }

  companion object {
    const val NAME = NativePerformanceKitSpec.NAME
  }
}
