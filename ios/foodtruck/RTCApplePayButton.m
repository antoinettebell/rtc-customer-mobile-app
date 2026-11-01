#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RTCApplePayButtonManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(buttonType, NSString)
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end
