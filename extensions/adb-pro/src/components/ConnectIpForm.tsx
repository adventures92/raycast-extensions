import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { adb } from "../services/adb";

export default function ConnectIpForm({ onConnected }: { onConnected?: () => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { ip: string; port: string }) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Connecting..." });

    const result = await adb.connectWireless(values.ip, values.port);

    if (result.success) {
      toast.style = Toast.Style.Success;
      toast.title = "Connected";
      toast.message = result.message;
      if (onConnected) onConnected();
      pop();
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "Connection Failed";
      toast.message = result.message;
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Connect" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="ip" title="IP Address" placeholder="192.168.1.x" />
      <Form.TextField id="port" title="Port" placeholder="5555" defaultValue="5555" />
    </Form>
  );
}
