package com.ea.rtcuser

import android.content.Context
import android.net.Uri
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TicketInstallReferrerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val preferences by lazy {
    reactContext.getSharedPreferences("ticket_install_referrer", Context.MODE_PRIVATE)
  }

  override fun getName() = "TicketInstallReferrer"

  @ReactMethod
  fun getTicketInvitationShareToken(promise: Promise) {
    if (preferences.getBoolean("consumed", false)) {
      promise.resolve(null)
      return
    }

    val client = InstallReferrerClient.newBuilder(reactContext).build()
    try {
      client.startConnection(object : InstallReferrerStateListener {
        override fun onInstallReferrerSetupFinished(responseCode: Int) {
          try {
            if (responseCode != InstallReferrerClient.InstallReferrerResponse.OK) {
              promise.resolve(null)
              return
            }

            val referrer = client.installReferrer.installReferrer.orEmpty()
            val token = referrer
              .split('&')
              .firstOrNull { it.startsWith("rtc_ticket_share=") }
              ?.removePrefix("rtc_ticket_share=")
              ?.let(Uri::decode)
              ?.takeIf { it.matches(Regex("[A-Za-z0-9_-]{16,256}")) }
            promise.resolve(token)
          } catch (_: Exception) {
            promise.resolve(null)
          } finally {
            client.endConnection()
          }
        }

        override fun onInstallReferrerServiceDisconnected() = Unit
      })
    } catch (_: Exception) {
      promise.resolve(null)
      client.endConnection()
    }
  }

  @ReactMethod
  fun consumeTicketInvitationShareToken() {
    preferences.edit().putBoolean("consumed", true).apply()
  }
}
