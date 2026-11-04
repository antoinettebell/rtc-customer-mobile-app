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
  override init() {
    super.init()
    // UIKit scenes own the window on iOS 27+. The SceneDelegate creates the
    // React Native window for the app's single supported scene.
    automaticallyLoadReactNativeWindow = false
  }

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    GMSServices.provideAPIKey("AIzaSyAlopZi4IG0IPl083xL20FGxlZZ_m8lslc")
    FirebaseApp.configure()

    self.moduleName = "foodtruck"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)

    return result
  }

  func startReactNative(in window: UIWindow, launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) {
    reactNativeFactory.startReactNative(
      withModuleName: moduleName ?? "foodtruck",
      in: window,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    RCTLinkingManager.application(app, open: url, options: options)
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

/// Owns the app's one UIKit scene. Supporting one scene preserves the
/// existing single-window flow while satisfying the iOS 27 scene lifecycle.
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    let sceneWindow = UIWindow(windowScene: windowScene)
    window = sceneWindow
    // Keep a compatibility reference for native dependencies that still read
    // UIApplication.delegate.window. UIKit scene ownership remains here.
    appDelegate.window = sceneWindow
    appDelegate.startReactNative(
      in: sceneWindow,
      launchOptions: launchOptions(for: connectionOptions)
    )

    if let rootView = sceneWindow.rootViewController?.view {
      RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: openURLOptions(for: context.options)
      )
    }
  }

  private func launchOptions(
    for connectionOptions: UIScene.ConnectionOptions
  ) -> [UIApplication.LaunchOptionsKey: Any]? {
    guard let context = connectionOptions.urlContexts.first else { return nil }

    var options: [UIApplication.LaunchOptionsKey: Any] = [.url: context.url]
    if let sourceApplication = context.options.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }
    if let annotation = context.options.annotation {
      options[.annotation] = annotation
    }
    return options
  }

  private func openURLOptions(
    for options: UIScene.OpenURLOptions
  ) -> [UIApplication.OpenURLOptionsKey: Any] {
    var applicationOptions: [UIApplication.OpenURLOptionsKey: Any] = [
      .openInPlace: options.openInPlace
    ]

    if let sourceApplication = options.sourceApplication {
      applicationOptions[.sourceApplication] = sourceApplication
    }
    if let annotation = options.annotation {
      applicationOptions[.annotation] = annotation
    }
    return applicationOptions
  }
}
