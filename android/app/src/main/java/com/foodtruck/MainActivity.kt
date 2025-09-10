package com.ea.rtcuser

import android.graphics.Color
import android.os.Bundle
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "foodtruck"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // Initialize boot splash screen
    RNBootSplash.init(this, R.style.BootTheme)

    // Make status bar transparent with dark icons
    window.decorView.systemUiVisibility =
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
      View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR

    super.onCreate(savedInstanceState)
  }
}
