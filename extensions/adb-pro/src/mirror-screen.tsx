import { ActionPanel, Action, List, showToast, Toast, Icon } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function MirrorScreen() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  async function startMirror() {
    // We show a toast but don't await the result indefinitely because it might detach
    // But we await the initial spawn
    const toast = await showToast({ style: Toast.Style.Animated, title: "Launching Scrcpy..." });
    try {
      if (!device) return; // Should not happen
      await adb.mirrorScreen(device.id);
      toast.style = Toast.Style.Success;
      toast.title = "Mirroring Started";
      toast.message = "Check for the Scrcpy window.";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  // Auto-launch or show button?
  // Let's show a simple button to confirm actions
  return (
    <List searchBarPlaceholder="Ready to mirror...">
      <List.Item
        title={`Mirror ${device.model}`}
        icon={Icon.Monitor}
        actions={
          <ActionPanel>
            <Action title="Start Mirroring" onAction={startMirror} />
          </ActionPanel>
        }
      />
    </List>
  );
}
