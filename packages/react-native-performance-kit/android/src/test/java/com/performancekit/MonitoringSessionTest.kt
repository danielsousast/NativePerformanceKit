package com.performancekit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

private class FakeTicker : Ticker {
  var task: Runnable? = null
  var periodMs = 0L
  var running = false
  var stopCount = 0

  override fun start(periodMs: Long, task: Runnable) {
    this.periodMs = periodMs
    this.task = task
    running = true
  }

  override fun stop() {
    running = false
    stopCount++
  }

  fun tick() = task!!.run()
}

class MonitoringSessionTest {
  private val tickers = mutableListOf<FakeTicker>()
  private var pssKb = 1000
  private var failReads = false
  private val collector = MemoryCollector(
    readTotalPssKb = { if (failReads) throw SecurityException("denied") else pssKb },
    now = { 42L }
  )

  private fun session() = MonitoringSession(collector) { FakeTicker().also { tickers.add(it) } }

  @Test
  fun startAndStopToggleStatus() {
    val s = session()
    assertFalse(s.isMonitoring())
    s.start(500.0)
    assertTrue(s.isMonitoring())
    assertEquals(500L, tickers.single().periodMs)
    s.stop()
    assertFalse(s.isMonitoring())
    assertFalse(tickers.single().running)
  }

  @Test
  fun rejectsInvalidIntervalsWithoutStarting() {
    val s = session()
    for (bad in listOf(0.0, 99.0, -5.0, Double.NaN, Double.POSITIVE_INFINITY)) {
      assertThrows(IllegalArgumentException::class.java) { s.start(bad) }
    }
    assertFalse(s.isMonitoring())
    assertTrue(tickers.isEmpty())
    s.start(MonitoringSession.MIN_INTERVAL_MS)
    assertTrue(s.isMonitoring())
  }

  @Test
  fun repeatedStartWithSameIntervalKeepsOneTicker() {
    val s = session()
    s.start(500.0)
    s.start(500.0)
    assertEquals(1, tickers.size)
    assertTrue(tickers.single().running)
  }

  @Test
  fun startWithNewIntervalReplacesTheTicker() {
    val s = session()
    s.start(500.0)
    s.start(250.0)
    assertEquals(2, tickers.size)
    assertFalse(tickers[0].running)
    assertTrue(tickers[1].running)
    assertEquals(250L, tickers[1].periodMs)
  }

  @Test
  fun invalidRestartKeepsTheRunningSession() {
    val s = session()
    s.start(500.0)
    assertThrows(IllegalArgumentException::class.java) { s.start(1.0) }
    assertTrue(s.isMonitoring())
    assertTrue(tickers.single().running)
  }

  @Test
  fun repeatedStopIsSafe() {
    val s = session()
    s.stop()
    s.start(500.0)
    s.stop()
    s.stop()
    assertFalse(s.isMonitoring())
    assertFalse(tickers.single().running)
  }

  @Test
  fun restartAfterStopCreatesAFreshTicker() {
    val s = session()
    repeat(3) {
      s.start(500.0)
      s.stop()
    }
    assertEquals(3, tickers.size)
    assertTrue(tickers.none { it.running })
  }

  @Test
  fun snapshotUsesTheLatestSampleWhileMonitoringAndReadsFreshOtherwise() {
    val s = session()
    s.start(500.0)
    pssKb = 2000
    tickers.single().tick()
    pssKb = 3000
    assertEquals(2000L * 1024, s.snapshot().memoryUsageBytes)
    tickers.single().tick()
    assertEquals(3000L * 1024, s.snapshot().memoryUsageBytes)
    s.stop()
    pssKb = 4000
    assertEquals(4000L * 1024, s.snapshot().memoryUsageBytes)
  }

  @Test
  fun snapshotReadsFreshBeforeTheFirstTick() {
    val s = session()
    s.start(500.0)
    assertEquals(1000L * 1024, s.snapshot().memoryUsageBytes)
  }

  @Test
  fun failedSampleKeepsTheSessionRunningAndReportsTheFailure() {
    val s = session()
    s.start(500.0)
    tickers.single().tick()
    failReads = true
    tickers.single().tick()
    assertTrue(s.isMonitoring())
    assertThrows(MemoryUnavailableException::class.java) { s.snapshot() }
    failReads = false
    tickers.single().tick()
    assertEquals(1000L * 1024, s.snapshot().memoryUsageBytes)
  }

  @Test
  fun lateTickAfterStopIsDiscarded() {
    val s = session()
    s.start(500.0)
    val ticker = tickers.single()
    s.stop()
    pssKb = 9000
    ticker.tick()
    pssKb = 1234
    assertEquals(1234L * 1024, s.snapshot().memoryUsageBytes)
  }

  @Test
  fun tickerStartFailureReleasesItAndLeavesTheSessionStopped() {
    val failing = object : Ticker {
      var stopped = false
      override fun start(periodMs: Long, task: Runnable) = throw IllegalStateException("no thread")
      override fun stop() { stopped = true }
    }
    val s = MonitoringSession(collector) { failing }
    assertThrows(IllegalStateException::class.java) { s.start(500.0) }
    assertTrue(failing.stopped)
    assertFalse(s.isMonitoring())
  }
}
