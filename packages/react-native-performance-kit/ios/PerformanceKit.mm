#import "PerformanceKit.h"

#if __has_include("PerformanceKit-Swift.h")
#import "PerformanceKit-Swift.h"
#else
#import <PerformanceKit/PerformanceKit-Swift.h>
#endif

@implementation PerformanceKit {
  PKMonitoringSession *_session;
}

- (instancetype)init
{
  if (self = [super init]) {
    _session = [PKMonitoringSession new];
  }
  return self;
}

- (void)startMonitoring:(double)intervalMs
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSError *error = nil;
  if ([_session startWithIntervalMs:intervalMs error:&error]) {
    resolve(nil);
  } else {
    reject(@"E_INVALID_INTERVAL", error.localizedDescription, error);
  }
}

- (void)stopMonitoring:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [_session stop];
  resolve(nil);
}

- (NSNumber *)isMonitoring
{
  return @(_session.isMonitoring);
}

- (void)getSnapshot:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  NSError *error = nil;
  NSDictionary *snapshot = [_session snapshotAndReturnError:&error];
  if (snapshot) {
    resolve(snapshot);
  } else {
    reject(@"E_MEMORY_UNAVAILABLE", error.localizedDescription, error);
  }
}

- (void)invalidate
{
  [_session stop];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePerformanceKitSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"PerformanceKit";
}

@end
