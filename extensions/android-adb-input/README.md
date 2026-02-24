# ADB Pro

**The ultimate Android Debug Bridge (ADB) tool for Raycast.**

Stop typing disjointed ADB commands in your terminal. **ADB Pro** brings a full-featured Android development dashboard directly to your fingertips. Manage devices, toggle system settings, verify deep links, and debug apps with speed and elegance.

## Prerequisites

To use this extension, you need:

1.  **ADB Installed**: Usually included with Android Studio ("Android SDK Platform-Tools").
    *   *Alternative*: Install via Homebrew: `brew install --cask android-platform-tools`
2.  **Scrcpy (Optional)**: Required only for the "Mirror Screen" feature.
    *   Install via Homebrew: `brew install scrcpy`

## Features

### 📱 Device Management
*   **Manage Devices**: View all connected USB and Emulator devices. Connect/Disconnect wirelessly with one click.
*   **Wireless Wizard**: A smart scanner that finds devices on your network to connect over TCP/IP without needing a USB cable first.
*   **Restart Server**: Instantly fix "Device Offline" or connection issues by refreshing the ADB server.

### 🚀 App Control
Everything you need to manage installed applications. **Includes Smart History** to remember your recently used apps.

*   **Launch App**: Search and start any app's main intent.
*   **Install APK**: Drag & Drop `.apk` files to install them to specific devices.
*   **Uninstall App**: Safely remove apps (automatically cleans up your Recent History).
*   **Clear Data**: Wipe app data and cache for fresh testing.
*   **Manage Permissions**: Visual toggle for runtime permissions (Camera, Location, Storage, etc.).
*   **App Info**: Copy Package names, Versions, and UIDs.

### 🛠️ Professional Debugging
*   **Logcat Viewer**: sophisticated real-time log viewer.
    *   *Filter by App*: Focus only on logs from a specific PID/Package.
    *   *Smart Search*: Highlight or filter keywords instantly.
*   **Firebase Debug**: Toggle `debug.firebase.analytics.app` to force events to appear in Firebase DebugView.
*   **Proxy Manager**: Set or clear global Android HTTP proxy for Charles/Fiddler/Proxyman debugging.

### ⚡ System Utilities
*   **System Toggles**: Quickly switch **WiFi**, **Mobile Data**, **Airplane Mode**, or **Dark Mode**.
*   **Developer Options**: Toggle **Layout Bounds** and **Show Touches** without digging into settings.
*   **Simulate Keys**: Press physical buttons (Home, Back, Recents, Power, Volume, Screenshot) from your Mac.
*   **Send Clipboard**: Paste text from your Mac to the device (Emoji-safe error handling included!).
*   **Display Tools**: Simulate different resolutions (tablet/phone) and densities (DPI).

## Troubleshooting

### "ADB Not Found"
The extension tries to auto-detect ADB. If it fails, run the **Check ADB Status** command. It will launch a Setup Wizard to help you find and save the correct path.

### "Device Not Showing"
1.  Check your USB connection.
2.  Run the **Restart ADB Server** command.
3.  Ensure USB Debugging is enabled on the phone.

### "Command Failed"
If a command fails, check the Raycast toast message. Common reasons include:
*   **Device Locked**: Some commands (like `scrcpy`) require the device to be unlocked.
*   **App Not Found**: The app might have been uninstalled externally.
*   **ADB Offline**: The connection might have dropped; try restarting the server.