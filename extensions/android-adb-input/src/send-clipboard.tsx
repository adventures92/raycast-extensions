import { showToast, Toast, Clipboard } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function SendClipboard() {
  const [device, setDevice] = useState<Device | null>(null);

  async function send(targetDevice: Device) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Sending Clipboard..." });
    try {
      const text = await Clipboard.readText();
      if (!text) {
        toast.style = Toast.Style.Failure;
        toast.title = "Clipboard Empty";
        return;
      }

      await adb.inputText(targetDevice.id, text);

      toast.style = Toast.Style.Success;
      toast.title = "Text Sent";
      toast.message = `Typed "${text.substring(0, 20)}${text.length > 20 ? "..." : ""}"`;
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  if (!device) {
    return (
      <DevicePicker
        onSelect={(d) => {
          setDevice(d);
          send(d);
        }}
      />
    );
  }

  return null;
}
