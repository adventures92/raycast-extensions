import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function ToggleWifi() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <WifiControl device={device} />;
}

function WifiControl({ device }: { device: Device }) {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    const output = await adb.exec(`-s ${device.id} shell dumpsys wifi | grep "Wi-Fi is"`);
    return output.includes("enabled") ? "enabled" : "disabled";
  }, []);

  async function setWifi(enable: boolean) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: enable ? "Enabling WiFi..." : "Disabling WiFi...",
    });
    try {
      await adb.toggleWifi(device.id, enable);
      toast.style = Toast.Style.Success;
      toast.title = enable ? "WiFi Enabled" : "WiFi Disabled";
      revalidate();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select option...">
      <List.Item
        title="Enable WiFi"
        icon={{ source: Icon.Wifi, tintColor: status === "enabled" ? Color.Green : Color.PrimaryText }}
        accessories={[{ text: status === "enabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Enable WiFi" onAction={() => setWifi(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Disable WiFi"
        icon={{ source: Icon.WifiDisabled, tintColor: status === "disabled" ? Color.Red : Color.PrimaryText }}
        accessories={[{ text: status === "disabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Disable WiFi" onAction={() => setWifi(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
