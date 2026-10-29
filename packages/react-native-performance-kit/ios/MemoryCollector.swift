import Foundation

enum MemoryCollectorError: Error, LocalizedError {
  case unavailable(String)

  var errorDescription: String? {
    switch self {
    case .unavailable(let reason): return reason
    }
  }
}

/// Reads process memory as `phys_footprint` (bytes) from `task_vm_info`: the figure behind Xcode's
/// memory gauge and Instruments' "Memory Footprint". It is not RSS (`resident_size`).
@objc(PKMemoryCollector)
public final class MemoryCollector: NSObject {
  private let readFootprintBytes: () -> UInt64?
  private let now: () -> Date

  @objc public override convenience init() {
    self.init(readFootprintBytes: MemoryCollector.readPhysFootprint, now: Date.init)
  }

  init(readFootprintBytes: @escaping () -> UInt64?, now: @escaping () -> Date) {
    self.readFootprintBytes = readFootprintBytes
    self.now = now
  }

  /// `{ timestamp: Unix epoch ms, memoryUsageBytes: bytes, fps: NSNull }`; throws if unavailable.
  @objc public func snapshot() throws -> [String: Any] {
    guard let bytes = readFootprintBytes(), bytes > 0 else {
      throw MemoryCollectorError.unavailable("phys_footprint is unavailable")
    }
    return [
      "timestamp": MemoryCollector.epochMilliseconds(now()),
      "memoryUsageBytes": NSNumber(value: bytes),
      "fps": NSNull(),
    ]
  }

  static func epochMilliseconds(_ date: Date) -> NSNumber {
    NSNumber(value: Int64((date.timeIntervalSince1970 * 1000).rounded(.down)))
  }

  static func readPhysFootprint() -> UInt64? {
    var info = task_vm_info_data_t()
    var count = mach_msg_type_number_t(
      MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
    let status = withUnsafeMutablePointer(to: &info) { pointer in
      pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
        task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
      }
    }
    return status == KERN_SUCCESS ? info.phys_footprint : nil
  }
}
