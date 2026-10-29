package com.performancekit

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class PerformanceKitModule(reactContext: ReactApplicationContext) :
  NativePerformanceKitSpec(reactContext) {

  // Phase 2 contract stub: collectors and lifecycle arrive in phases 3-5.
  override fun startMonitoring(intervalMs: Double, promise: Promise) = rejectUnimplemented(promise)

  override fun stopMonitoring(promise: Promise) = rejectUnimplemented(promise)

  override fun isMonitoring(): Boolean = false

  override fun getSnapshot(promise: Promise) = rejectUnimplemented(promise)

  private fun rejectUnimplemented(promise: Promise) {
    promise.reject("E_UNIMPLEMENTED", "Not implemented yet")
  }

  companion object {
    const val NAME = NativePerformanceKitSpec.NAME
  }
}
