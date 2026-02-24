import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { useState } from "react";
import { Device } from "./types";

export default function SetProxy() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <ProxyForm device={device} />;
}

function ProxyForm({ device }: { device: Device }) {
  const { pop } = useNavigation();

  async function set(values: { host: string; port: string }) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Setting Proxy..." });
    try {
      await adb.setProxy(device.id, values.host, values.port);
      toast.style = Toast.Style.Success;
      toast.title = "Proxy Set";
      pop();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  async function clear() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Clearing Proxy..." });
    try {
      await adb.clearProxy(device.id);
      toast.style = Toast.Style.Success;
      toast.title = "Proxy Cleared";
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
          <Action.SubmitForm title="Set Proxy" onSubmit={set} />
          <Action title="Clear Proxy" style={Action.Style.Destructive} onAction={clear} />
        </ActionPanel>
      }
    >
      <Form.TextField id="host" title="Host IP" placeholder="192.168.1.10" />
      <Form.TextField id="port" title="Port" placeholder="8888" defaultValue="8888" />
      <Form.Description text="Setting a proxy allows you to inspect network traffic using tools like Charles Proxy or Proxyman." />
    </Form>
  );
}
