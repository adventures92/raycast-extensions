import { ActionPanel, Action, List, showToast, Toast, Icon, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function SetResolution() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <ResolutionList device={device} />;
}

function ResolutionList({ device }: { device: Device }) {
  async function set(size: string, density: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Updating Display..." });
    try {
      if (size) await adb.setSize(device.id, size);
      if (density) await adb.setDensity(device.id, density);
      toast.style = Toast.Style.Success;
      toast.title = "Display Updated";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  async function reset() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Resetting Display..." });
    try {
      await adb.resetDisplay(device.id);
      toast.style = Toast.Style.Success;
      toast.title = "Display Reset";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  const presets = [
    { name: "Default", size: "", density: "", icon: Icon.Monitor },
    { name: "1080p Phone", size: "1080x1920", density: "420", icon: Icon.Mobile },
    { name: "1440p (2K) Phone", size: "1440x2560", density: "560", icon: Icon.Mobile },
    { name: "720p Phone", size: "720x1280", density: "320", icon: Icon.Mobile },
    { name: "Tablet (Adjust)", size: "1200x1920", density: "320", icon: Icon.Mobile },
    { name: "4K TV", size: "2160x3840", density: "640", icon: Icon.Monitor },
  ];

  return (
    <List searchBarPlaceholder="Select resolution preset...">
      <List.Item
        title="Reset to Default"
        icon={{ source: Icon.RotateAntiClockwise, tintColor: Color.Red }}
        actions={
          <ActionPanel>
            <Action title="Reset Display" onAction={reset} />
          </ActionPanel>
        }
      />
      {presets.slice(1).map((p) => (
        <List.Item
          key={p.name}
          title={p.name}
          subtitle={`${p.size} @ ${p.density}dpi`}
          icon={p.icon}
          actions={
            <ActionPanel>
              <Action title={`Set ${p.name}`} onAction={() => set(p.size, p.density)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
