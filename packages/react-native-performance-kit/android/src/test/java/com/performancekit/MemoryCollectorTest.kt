package com.performancekit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class MemoryCollectorTest {
  @Test
  fun convertsKilobytesToBytes() {
    assertEquals(1024L, MemoryCollector.kbToBytes(1))
    assertEquals(0L, MemoryCollector.kbToBytes(0))
  }

  @Test
  fun doesNotOverflowIntRange() {
    // 4 GiB in KB would overflow an Int when multiplied by 1024.
    assertEquals(4L * 1024 * 1024 * 1024, MemoryCollector.kbToBytes(4 * 1024 * 1024))
  }

  @Test
  fun buildsSnapshotWithBytesAndTimestamp() {
    val snapshot = MemoryCollector(readTotalPssKb = { 2048 }, now = { 1_700_000_000_123L }).snapshot()
    assertEquals(1_700_000_000_123L, snapshot.timestampMs)
    assertEquals(2048L * 1024L, snapshot.memoryUsageBytes)
  }

  @Test
  fun failsWhenPssIsNotPositive() {
    assertThrows(MemoryUnavailableException::class.java) {
      MemoryCollector(readTotalPssKb = { 0 }).snapshot()
    }
    assertThrows(MemoryUnavailableException::class.java) {
      MemoryCollector(readTotalPssKb = { -1 }).snapshot()
    }
  }

  @Test
  fun failsWhenReaderThrows() {
    assertThrows(MemoryUnavailableException::class.java) {
      MemoryCollector(readTotalPssKb = { throw SecurityException("denied") }).snapshot()
    }
  }
}
