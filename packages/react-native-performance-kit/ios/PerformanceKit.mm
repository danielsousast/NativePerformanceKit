#import "PerformanceKit.h"

@implementation PerformanceKit
// Phase 2 contract stub: collectors and lifecycle arrive in phases 3-5.
- (void)startMonitoring:(double)intervalMs
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [self rejectUnimplemented:reject];
}

- (void)stopMonitoring:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self rejectUnimplemented:reject];
}

- (NSNumber *)isMonitoring
{
  return @NO;
}

- (void)getSnapshot:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [self rejectUnimplemented:reject];
}

- (void)rejectUnimplemented:(RCTPromiseRejectBlock)reject
{
  reject(@"E_UNIMPLEMENTED", @"Not implemented yet", nil);
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
