import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function ToggleMobileData() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <MobileDataControl device={device} />;
}

function MobileDataControl({ device }: { device: Device }) {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    const output = await adb.getGlobalSetting(device.id, "mobile_data");
    return output.trim() === "1" ? "enabled" : "disabled";
  }, []);

  async function setData(enable: boolean) {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: enable ? "Enabling Data..." : "Disabling Data...",
    });
    try {
      await adb.toggleMobileData(device.id, enable);
      toast.style = Toast.Style.Success;
      toast.title = enable ? "Data Enabled" : "Data Disabled";
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
        title="Enable Mobile Data"
        icon={{ source: Icon.Mobile, tintColor: status === "enabled" ? Color.Green : Color.PrimaryText }}
        accessories={[{ text: status === "enabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Enable Data" onAction={() => setData(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Disable Mobile Data"
        icon={{ source: Icon.Stop, tintColor: status === "disabled" ? Color.Red : Color.PrimaryText }}
        accessories={[{ text: status === "disabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Disable Data" onAction={() => setData(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
