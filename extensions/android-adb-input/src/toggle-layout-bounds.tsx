import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function ToggleLayoutBounds() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <LayoutBoundsControl device={device} />;
}

function LayoutBoundsControl({ device }: { device: Device }) {
  const {
    data: status,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    const output = await adb.exec(`-s ${device.id} shell getprop debug.layout`);
    return output.trim() === "true" ? "enabled" : "disabled";
  }, []);

  async function setBounds(enable: boolean) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Updating Layout Bounds..." });
    try {
      await adb.toggleLayoutBounds(device.id, enable);
      toast.style = Toast.Style.Success;
      toast.title = enable ? "Layout Bounds Showing" : "Layout Bounds Hidden";
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
        title="Show Layout Bounds"
        icon={{ source: Icon.Eye, tintColor: status === "enabled" ? Color.Red : Color.PrimaryText }}
        accessories={[{ text: status === "enabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Show Bounds" onAction={() => setBounds(true)} />
          </ActionPanel>
        }
      />
      <List.Item
        title="Hide Layout Bounds"
        icon={{ source: Icon.EyeDisabled, tintColor: status === "disabled" ? Color.Green : Color.PrimaryText }}
        accessories={[{ text: status === "disabled" ? "Active" : "" }]}
        actions={
          <ActionPanel>
            <Action title="Hide Bounds" onAction={() => setBounds(false)} />
          </ActionPanel>
        }
      />
    </List>
  );
}
