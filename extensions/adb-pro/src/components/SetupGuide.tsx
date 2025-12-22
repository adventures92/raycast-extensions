import { ActionPanel, Action, Detail, Icon } from "@raycast/api";

export default function SetupGuide({ onRetry }: { onRetry: () => void }) {
  const markdown = `
  # ADB Not Found

  It seems irrelevant, but **ADB (Android Debug Bridge)** is required for this extension to work.

  ## How to install
  
  1. **Install Android Studio** (Recommended)
     - Includes ADB in "Platform Tools".
  
  2. **Install via Homebrew** (macOS)
     \`brew install android-platform-tools\`
  
  3. **Manually Download**
     - Download SDK Platform-Tools from developer.android.com.

  ## Configuration
  If you have ADB installed but it's not detected:
  - Add it to your system PATH.
  - Or specify the path manually below.
  `;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Retry Connection" icon={Icon.RotateClockwise} onAction={onRetry} />
          {/* Future: Add an action to open a form to set manual path */}
        </ActionPanel>
      }
    />
  );
}
