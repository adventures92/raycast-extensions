import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function ToggleDarkMode() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <DarkModeControl device={device} />;
}

function DarkModeControl({ device }: { device: Device }) {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    try {
      const output = await adb.exec(`-s ${device.id} shell dumpsys uimode | grep mNightMode`);
      return output.includes("yes") ? "dark" : "light";
    } catch {
      return "unknown";
    }
  }, []);

  async function setMode(enable: boolean) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Switching Mode..." });
    try {
      await adb.toggleDarkMode(device.id, enable);
      toast.style = Toast.Style.Success;
      toast.title = enable ? "Dark Mode Enabled" : "Light Mode Enabled";
      revalidate();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select theme...">
      <List.Item
        title="Dark Mode"
        icon={{ source: Icon.Moon, tintColor: status === "dark" ? Color.Purple : Color.PrimaryText }}
        accessories={[{ text: status === "dark" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Enable Dark Mode" onAction={() => setMode(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Light Mode"
        icon={{ source: Icon.Sun, tintColor: status === "light" ? Color.Orange : Color.PrimaryText }}
        accessories={[{ text: status === "light" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Enable Light Mode" onAction={() => setMode(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
