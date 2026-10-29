import XCTest

// Not part of the pod (excluded in PerformanceKit.podspec). Run with ios/Tests/run.sh.
final class MemoryCollectorTests: XCTestCase {
  func testSnapshotReportsBytesAndEpochMilliseconds() throws {
    let collector = MemoryCollector(
      readFootprintBytes: { 5_000_000_000 },
      now: { Date(timeIntervalSince1970: 1_700_000_000.1239) })
    let snapshot = try collector.snapshot()
    XCTAssertEqual((snapshot["timestamp"] as? NSNumber)?.int64Value, 1_700_000_000_123)
    XCTAssertEqual((snapshot["memoryUsageBytes"] as? NSNumber)?.uint64Value, 5_000_000_000)
    XCTAssertTrue(snapshot["fps"] is NSNull)
  }

  func testThrowsWhenReadFails() {
    let collector = MemoryCollector(readFootprintBytes: { nil }, now: Date.init)
    XCTAssertThrowsError(try collector.snapshot())
  }

  func testThrowsWhenFootprintIsZero() {
    let collector = MemoryCollector(readFootprintBytes: { 0 }, now: Date.init)
    XCTAssertThrowsError(try collector.snapshot())
  }

  func testRealReadIsPositive() throws {
    let bytes = try XCTUnwrap(MemoryCollector.readPhysFootprint())
    XCTAssertGreaterThan(bytes, 0)
  }
}
