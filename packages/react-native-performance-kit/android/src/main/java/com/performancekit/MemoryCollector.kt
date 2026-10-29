package com.performancekit

import android.os.Debug

class MemoryUnavailableException(message: String) : Exception(message)

data class MemorySnapshot(val timestampMs: Long, val memoryUsageBytes: Long)

/**
 * Reads process memory as total PSS (Proportional Set Size) in bytes: the "TOTAL PSS" figure of
 * `dumpsys meminfo` and the Android Studio profiler's total. It is not RSS and not the managed heap.
 */
class MemoryCollector(
  private val readTotalPssKb: () -> Int = ::readProcessTotalPssKb,
  private val now: () -> Long = System::currentTimeMillis
) {
  @Throws(MemoryUnavailableException::class)
  fun snapshot(): MemorySnapshot {
    val kb = try {
      readTotalPssKb()
    } catch (e: RuntimeException) {
      throw MemoryUnavailableException("Reading PSS failed: ${e.message}")
    }
    if (kb <= 0) {
      throw MemoryUnavailableException("PSS is unavailable on this device (reported $kb KB)")
    }
    return MemorySnapshot(timestampMs = now(), memoryUsageBytes = kbToBytes(kb))
  }

  companion object {
    fun kbToBytes(kb: Int): Long = kb.toLong() * 1024L
  }
}

private fun readProcessTotalPssKb(): Int {
  val info = Debug.MemoryInfo()
  Debug.getMemoryInfo(info)
  return info.totalPss
}
