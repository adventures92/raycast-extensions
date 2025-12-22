import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function SimulateBattery() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <BatteryForm device={device} />;
}

function BatteryForm({ device }: { device: Device }) {
  const { pop } = useNavigation();

  async function setBattery(values: { level: string; status: string }) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Updating Battery..." });
    try {
      // First we need to unplug it virtually
      await adb.exec(`-s ${device.id} shell dumpsys battery set usb 0`);

      // Set level
      const level = parseInt(values.level);
      await adb.exec(`-s ${device.id} shell dumpsys battery set level ${level}`);

      // Set status (not exposed in form yet, but implied by unplug)

      toast.style = Toast.Style.Success;
      toast.title = `Battery set to ${level}%`;
      pop();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  async function reset() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Resetting Battery..." });
    try {
      await adb.exec(`-s ${device.id} shell dumpsys battery reset`);
      toast.style = Toast.Style.Success;
      toast.title = "Battery Reset";
      pop();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Set Level" onSubmit={setBattery} />
          <Action title="Reset to Real Battery" style={Action.Style.Destructive} onAction={reset} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="level" title="Battery Level" defaultValue="50">
        <Form.Dropdown.Item value="100" title="100%" />
        <Form.Dropdown.Item value="50" title="50%" />
        <Form.Dropdown.Item value="20" title="20%" />
        <Form.Dropdown.Item value="10" title="10%" />
        <Form.Dropdown.Item value="5" title="5%" />
        <Form.Dropdown.Item value="1" title="1%" />
      </Form.Dropdown>

      <Form.Description text="This will simulate a disconnected charger and force the battery level. Use 'Reset' to restore normal behavior." />
    </Form>
  );
}
