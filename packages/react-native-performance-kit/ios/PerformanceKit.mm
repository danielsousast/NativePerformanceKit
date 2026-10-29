#import "PerformanceKit.h"

#if __has_include("PerformanceKit-Swift.h")
#import "PerformanceKit-Swift.h"
#else
#import <PerformanceKit/PerformanceKit-Swift.h>
#endif

@implementation PerformanceKit {
  PKMemoryCollector *_memoryCollector;
}

- (instancetype)init
{
  if (self = [super init]) {
    _memoryCollector = [PKMemoryCollector new];
  }
  return self;
}

// Lifecycle and FPS arrive in phases 4-5; getSnapshot reports memory on demand.
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
  NSError *error = nil;
  NSDictionary *snapshot = [_memoryCollector snapshotAndReturnError:&error];
  if (snapshot) {
    resolve(snapshot);
  } else {
    reject(@"E_MEMORY_UNAVAILABLE", error.localizedDescription, error);
  }
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
