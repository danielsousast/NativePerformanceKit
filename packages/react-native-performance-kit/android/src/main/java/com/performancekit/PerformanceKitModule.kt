package com.performancekit

import com.facebook.react.bridge.ReactApplicationContext

class PerformanceKitModule(reactContext: ReactApplicationContext) :
  NativePerformanceKitSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativePerformanceKitSpec.NAME
  }
}
