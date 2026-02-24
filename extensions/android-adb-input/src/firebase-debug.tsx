import { ActionPanel, Action, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { AppList } from "./components/AppList";
import { useState } from "react";
import { Device, App } from "./types";

export default function FirebaseDebug() {
  const [device, setDevice] = useState<Device | null>(null);
  const [app, setApp] = useState<App | null>(null);

  if (!device) return <DevicePicker onSelect={setDevice} />;
  if (!app) return <AppList device={device} onAppSelect={setApp} />;

  return <DebugControl device={device} app={app} />;
}

function DebugControl({ device, app }: { device: Device; app: App }) {
  async function toggle(enable: boolean) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: enable ? "Enabling Debug..." : "Disabling Debug...",
    });
    try {
      if (enable) {
        await adb.enableFirebaseDebug(device.id, app.package);
      } else {
        await adb.disableFirebaseDebug(device.id);
      }
      toast.style = Toast.Style.Success;
      toast.title = enable ? "Debug Mode Enabled" : "Debug Mode Disabled";
      toast.message = enable ? `Logs for ${app.name} will appear in DebugView` : "Debug logging stopped";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List searchBarPlaceholder="Configure Firebase...">
      <List.Item
        title={`Enable Debug for ${app.name}`}
        icon={{ source: Icon.CheckCircle, tintColor: Color.Green }}
        actions={
          <ActionPanel>
            <Action title="Enable Debug Mode" onAction={() => toggle(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Disable Debug Mode"
        subtitle="Stop sending debug events"
        icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
        actions={
          <ActionPanel>
            <Action title="Disable Debug Mode" style={Action.Style.Destructive} onAction={() => toggle(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
