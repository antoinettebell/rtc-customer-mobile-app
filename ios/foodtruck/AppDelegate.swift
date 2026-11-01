import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps
import RNBootSplash
import Firebase
import PassKit

@objc(RTCApplePayButtonManager)
final class RTCApplePayButtonManager: RCTViewManager {
  override func view() -> UIView! {
    RTCApplePayButtonView()
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}

private final class RTCApplePayButtonView: UIView {
  @objc var accessibilityLabel: NSString = "Apple Pay" {
    didSet { applePayButton.accessibilityLabel = accessibilityLabel as String }
  }

  @objc var buttonType: NSString = "plain" {
    didSet { replaceButton() }
  }

  @objc var disabled: Bool = false {
    didSet { applePayButton.isEnabled = !disabled }
  }

  @objc var onPress: RCTBubblingEventBlock?

  private var applePayButton = PKPaymentButton(
    paymentButtonType: .plain,
    paymentButtonStyle: .black
  )

  override init(frame: CGRect) {
    super.init(frame: frame)
    installButton()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    installButton()
  }

  private func installButton() {
    applePayButton.translatesAutoresizingMaskIntoConstraints = false
    applePayButton.addTarget(self, action: #selector(didPress), for: .touchUpInside)
    addSubview(applePayButton)
    NSLayoutConstraint.activate([
      applePayButton.leadingAnchor.constraint(equalTo: leadingAnchor),
      applePayButton.trailingAnchor.constraint(equalTo: trailingAnchor),
      applePayButton.topAnchor.constraint(equalTo: topAnchor),
      applePayButton.bottomAnchor.constraint(equalTo: bottomAnchor)
    ])
    applePayButton.accessibilityLabel = accessibilityLabel as String
    applePayButton.isEnabled = !disabled
  }

  private func replaceButton() {
    guard superview != nil || !subviews.isEmpty else { return }
    applePayButton.removeFromSuperview()
    applePayButton = PKPaymentButton(
      paymentButtonType: paymentButtonType,
      paymentButtonStyle: .black
    )
    installButton()
  }

  private var paymentButtonType: PKPaymentButtonType {
    switch (buttonType as String).lowercased() {
    case "buy": return .buy
    case "book": return .book
    case "checkout": return .checkout
    case "order": return .order
    default: return .plain
    }
  }

  @objc private func didPress() {
    onPress?([:])
  }
}

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    GMSServices.provideAPIKey("AIzaSyAlopZi4IG0IPl083xL20FGxlZZ_m8lslc")
    FirebaseApp.configure()

    self.moduleName = "foodtruck"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    if let rootViewController = self.window.rootViewController {
          RNBootSplash.init()
        }

    return result
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
