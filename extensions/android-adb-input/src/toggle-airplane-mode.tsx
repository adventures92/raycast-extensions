import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function ToggleAirplaneMode() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <AirplaneModeControl device={device} />;
}

function AirplaneModeControl({ device }: { device: Device }) {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    const output = await adb.exec(`-s ${device.id} shell settings get global airplane_mode_on`);
    return output.trim() === "1" ? "enabled" : "disabled";
  }, []);

  async function setMode(enable: boolean) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: enable ? "Enabling Airplane Mode..." : "Disabling Airplane Mode...",
    });
    try {
      await adb.toggleAirplaneMode(device.id, enable);
      toast.style = Toast.Style.Success;
      toast.title = enable ? "Airplane Mode On" : "Airplane Mode Off";
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
        title="Airplane Mode On"
        icon={{ source: Icon.Airplane, tintColor: status === "enabled" ? Color.Green : Color.PrimaryText }}
        accessories={[{ text: status === "enabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Turn on" onAction={() => setMode(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Airplane Mode Off"
        icon={{ source: Icon.AirplaneFilled, tintColor: status === "disabled" ? Color.Red : Color.PrimaryText }}
        accessories={[{ text: status === "disabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Turn off" onAction={() => setMode(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
