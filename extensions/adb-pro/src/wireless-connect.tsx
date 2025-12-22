import { ActionPanel, Action, Form, showToast, Toast, List, Icon, useNavigation } from "@raycast/api";
import { adb } from "./services/adb";
import { usePromise } from "@raycast/utils";
import { Device } from "./types";

export default function WirelessConnect() {
  // We offer two modes:
  // 1. Switch existing USB device to TCP/IP
  // 2. Connect to known IP

  const { data: devices, isLoading } = usePromise(() => adb.listDevices());
  const usbDevices = devices?.filter((d) => !d.id.includes(".") && !d.id.includes(":")) || []; // Simple heuristic for USB

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select device to switch or connect new IP...">
      <List.Section title="Switch USB Device to WiFi">
        {usbDevices.map((d) => (
          <List.Item
            key={d.id}
            title={d.model}
            subtitle="Switch to TCP/IP"
            icon={Icon.Wifi}
            actions={
              <ActionPanel>
                <Action.Push title="Configure WiFi Mode" target={<SwitchToWifi device={d} />} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Manual Connection">
        <List.Item
          title="Connect via IP Address"
          icon={Icon.Globe}
          actions={
            <ActionPanel>
              <Action.Push title="Enter IP" target={<ConnectIpForm />} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

export function SwitchToWifi({ device }: { device: Device }) {
  const { pop } = useNavigation();

  async function enableWifi() {
    // Step 1: Best-effort IP fetch (before breaking connection)
    let ip = null;
    const toast = await showToast({ style: Toast.Style.Animated, title: "Preparing..." });

    try {
      // Try to fetch IP, but ignore failure (device might already be acting up or logic differs)
      try {
        const output = await adb.exec(
          `-s ${device.id} shell "ip addr show wlan0 | grep 'inet ' | cut -d' ' -f6 | cut -d/ -f1"`,
        );
        if (output && output.trim().length > 0) {
          ip = output.trim();
        }
      } catch (ignore) {
        console.log("Failed to fetch IP (ignoring):", ignore);
      }

      // Step 2: Restart in TCP/IP mode
      toast.title = "Switching to TCP/IP...";
      await adb.tcpip(device.id);

      // Step 3: Success info
      toast.style = Toast.Style.Success;
      toast.title = "Mode Switched!";

      if (ip) {
        toast.message = `Device IP: ${ip}\nUnplug and Connect.`;
      } else {
        toast.message = "Unplug and use 'Connect via IP'.";
      }
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
          <Action.SubmitForm title="Enable WiFi Mode (Port 5555)" onSubmit={enableWifi} />
        </ActionPanel>
      }
    >
      <Form.Description text={`This will restart adbd on ${device.model} listening on port 5555.`} />
      <Form.Description text="1. Ensure device and Mac are on the SAME WiFi." />
      <Form.Description text="2. Run this command." />
      <Form.Description text="3. Unplug USB cable." />
      <Form.Description text="4. Go back and use 'Connect via IP'." />
    </Form>
  );
}

export function ConnectIpForm() {
  const { pop } = useNavigation();

  async function connect(values: { ip: string; port: string }) {
    const toast = await showToast({ style: Toast.Style.Animated, title: `Connecting to ${values.ip}...` });
    try {
      const res = await adb.connect(values.ip, parseInt(values.port));
      if (res.includes("connected")) {
        toast.style = Toast.Style.Success;
        toast.title = "Connected!";
        pop();
      } else {
        throw new Error(res);
      }
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Connection Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Connect" onSubmit={connect} />
        </ActionPanel>
      }
    >
      <Form.TextField id="ip" title="IP Address" placeholder="192.168.1.x" />
      <Form.TextField id="port" title="Port" defaultValue="5555" />
    </Form>
  );
}
