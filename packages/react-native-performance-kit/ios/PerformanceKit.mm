#import "PerformanceKit.h"

@implementation PerformanceKit
- (NSNumber *)multiply:(double)a b:(double)b {
  NSNumber *result = @(a * b);

  return result;
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
