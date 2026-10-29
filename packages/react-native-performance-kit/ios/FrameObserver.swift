import Foundation

/// Delivers one display-frame timestamp (seconds, `CACurrentMediaTime` base) per frame until stopped.
protocol FrameObserver: AnyObject {
  func start(onFrame: @escaping (TimeInterval) -> Void)
  /// Must remove every pending callback; may be called repeatedly.
  func stop()
}

#if canImport(UIKit)
import QuartzCore

/// Observes frames with a `CADisplayLink` on the main run loop. The callback only records a timestamp.
/// The display link ticks continuously, so this measures display cadence (see FpsCalculator), not
/// whether React Native rendered each frame.
final class DisplayLinkFrameObserver: NSObject, FrameObserver {
  private var link: CADisplayLink?
  private var onFrame: ((TimeInterval) -> Void)?

  func start(onFrame: @escaping (TimeInterval) -> Void) {
    onMain {
      self.invalidate()
      self.onFrame = onFrame
      // CADisplayLink retains its target: a weak proxy keeps `stop()`/`deinit` able to release it.
      let link = CADisplayLink(target: WeakTarget(self), selector: #selector(WeakTarget.tick(_:)))
      link.add(to: .main, forMode: .common)
      self.link = link
    }
  }

  func stop() {
    onMain { self.invalidate() }
  }

  deinit {
    link?.invalidate()
  }

  fileprivate func handle(_ link: CADisplayLink) {
    onFrame?(link.timestamp)
  }

  private func invalidate() {
    link?.invalidate()
    link = nil
    onFrame = nil
  }

  /// Always async so start/stop keep their call order whichever thread they come from.
  private func onMain(_ work: @escaping () -> Void) {
    DispatchQueue.main.async(execute: work)
  }
}

private final class WeakTarget: NSObject {
  private weak var observer: DisplayLinkFrameObserver?

  init(_ observer: DisplayLinkFrameObserver) { self.observer = observer }

  @objc func tick(_ link: CADisplayLink) { observer?.handle(link) }
}
#endif
