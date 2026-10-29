package com.performancekit

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class PerformanceKitModule(reactContext: ReactApplicationContext) :
  NativePerformanceKitSpec(reactContext) {

  private val memoryCollector = MemoryCollector()

  // Lifecycle and FPS arrive in phases 4-5; getSnapshot reports memory on demand.
  override fun startMonitoring(intervalMs: Double, promise: Promise) = rejectUnimplemented(promise)

  override fun stopMonitoring(promise: Promise) = rejectUnimplemented(promise)

  override fun isMonitoring(): Boolean = false

  override fun getSnapshot(promise: Promise) {
    try {
      val snapshot = memoryCollector.snapshot()
      promise.resolve(
        Arguments.createMap().apply {
          putDouble("timestamp", snapshot.timestampMs.toDouble())
          putDouble("memoryUsageBytes", snapshot.memoryUsageBytes.toDouble())
          putNull("fps")
        }
      )
    } catch (e: MemoryUnavailableException) {
      promise.reject("E_MEMORY_UNAVAILABLE", e.message, e)
    }
  }

  private fun rejectUnimplemented(promise: Promise) {
    promise.reject("E_UNIMPLEMENTED", "Not implemented yet")
  }

  companion object {
    const val NAME = NativePerformanceKitSpec.NAME
  }
}
