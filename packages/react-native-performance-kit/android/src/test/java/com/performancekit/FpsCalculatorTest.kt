package com.performancekit

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class FpsCalculatorTest {
  private val second = 1_000_000_000L

  private fun frames(calc: FpsCalculator, count: Int, intervalNs: Long, fromNs: Long = 0L): Long {
    var t = fromNs
    repeat(count) {
      calc.record(t)
      t += intervalNs
    }
    return t - intervalNs
  }

  @Test
  fun noFramesIsUnavailable() {
    assertNull(FpsCalculator().fps(0L))
  }

  @Test
  fun singleFrameIsUnavailable() {
    val calc = FpsCalculator()
    calc.record(0L)
    assertNull(calc.fps(0L))
  }

  @Test
  fun windowCoveringLessThanHalfIsUnavailable() {
    val calc = FpsCalculator()
    val last = frames(calc, 20, 16_666_667L) // ~0.32 s
    assertNull(calc.fps(last))
  }

  @Test
  fun steadySixtyHertzReportsSixty() {
    val calc = FpsCalculator()
    val last = frames(calc, 90, 16_666_667L)
    assertEquals(60.0, calc.fps(last)!!, 0.01)
  }

  @Test
  fun halfRateReportsThirty() {
    val calc = FpsCalculator()
    val last = frames(calc, 60, 33_333_333L)
    assertEquals(30.0, calc.fps(last)!!, 0.01)
  }

  @Test
  fun oldFramesLeaveTheWindowSoRateTracksRecentCadence() {
    val calc = FpsCalculator()
    var last = frames(calc, 60, 16_666_667L)
    last = frames(calc, 90, 33_333_333L, fromNs = last + 33_333_333L)
    assertEquals(30.0, calc.fps(last)!!, 0.5)
  }

  @Test
  fun duplicateAndOutOfOrderTimestampsAreIgnored() {
    val calc = FpsCalculator()
    val last = frames(calc, 61, 16_666_667L)
    calc.record(last)
    calc.record(last - 5_000_000L)
    calc.record(0L)
    assertEquals(60.0, calc.fps(last)!!, 0.01)
  }

  @Test
  fun noFrameWithinTheWindowIsUnavailable() {
    val calc = FpsCalculator()
    val last = frames(calc, 61, 16_666_667L)
    assertNull(calc.fps(last + second + 1))
  }

  @Test
  fun resetDropsFrames() {
    val calc = FpsCalculator()
    val last = frames(calc, 61, 16_666_667L)
    calc.reset()
    assertNull(calc.fps(last))
  }

  @Test
  fun storedFramesStayBoundedByTheWindow() {
    val calc = FpsCalculator()
    val last = frames(calc, 100_000, 1_000_000L) // 1 kHz for 100 s
    assertEquals(1000.0, calc.fps(last)!!, 1.0)
  }
}
