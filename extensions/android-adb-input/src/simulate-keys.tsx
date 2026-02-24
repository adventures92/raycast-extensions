import { ActionPanel, Action, Grid, showToast, Toast, Icon, Color } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function SimulateKeys() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <KeyGrid device={device} />;
}

function KeyGrid({ device }: { device: Device }) {
  async function press(keycode: string, name: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: `Pressing ${name}...` });
    try {
      await adb.sendKeyEvent(device.id, keycode);
      toast.style = Toast.Style.Success;
      toast.title = "Sent";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  const sections = [
    {
      title: "Navigation",
      items: [
        { name: "Home", code: "3", icon: Icon.House, color: Color.Blue },
        { name: "Back", code: "4", icon: Icon.ArrowLeft, color: Color.Blue },
        { name: "Recents", code: "187", icon: Icon.AppWindow, color: Color.Blue },
        { name: "Menu", code: "82", icon: Icon.List, color: Color.Blue },
      ],
    },
    {
      title: "System",
      items: [
        { name: "Power", code: "26", icon: Icon.Power, color: Color.Red },
        { name: "Screenshot", code: "120", icon: Icon.Camera, color: Color.Magenta },
        { name: "Lock", code: "223", icon: Icon.Lock, color: Color.Red },
      ],
    },
    {
      title: "Media",
      items: [
        { name: "Volume Up", code: "24", icon: Icon.SpeakerUp, color: Color.Purple },
        { name: "Volume Down", code: "25", icon: Icon.SpeakerDown, color: Color.Purple },
        { name: "Mute", code: "164", icon: Icon.SpeakerSlash, color: Color.Purple },
        { name: "Play/Pause", code: "85", icon: Icon.Play, color: Color.Purple },
      ],
    },
    {
      title: "Input",
      items: [
        { name: "Enter", code: "66", icon: Icon.Check, color: Color.Green },
        { name: "Tab", code: "61", icon: Icon.Switch, color: Color.SecondaryText },
        { name: "Space", code: "62", icon: Icon.Minus, color: Color.SecondaryText },
        { name: "Backspace", code: "67", icon: Icon.Trash, color: Color.Orange },
      ],
    },
  ];

  return (
    <Grid searchBarPlaceholder="Press a key..." itemSize={Grid.ItemSize.Medium}>
      {sections.map((section) => (
        <Grid.Section key={section.title} title={section.title}>
          {section.items.map((key) => (
            <Grid.Item
              key={key.name}
              title={key.name}
              content={{ source: key.icon, tintColor: key.color }}
              actions={
                <ActionPanel>
                  <Action title={`Press ${key.name}`} onAction={() => press(key.code, key.name)} />
                </ActionPanel>
              }
            />
          ))}
        </Grid.Section>
      ))}
    </Grid>
  );
}
