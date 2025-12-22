import { ActionPanel, Action, Form, useNavigation, showToast, Toast, Icon } from "@raycast/api";
import { useState } from "react";
import { adb } from "../services/adb";
import { Device } from "../types";

export default function InputTextForm({ device }: { device: Device }) {
  const { pop } = useNavigation();
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { text: string }) {
    setIsLoading(true);
    try {
      await adb.inputText(device.id, values.text);
      showToast({ style: Toast.Style.Success, title: "Sent", message: values.text });
      pop();
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to send text", message: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Send Text" onSubmit={handleSubmit} icon={Icon.Text} />
        </ActionPanel>
      }
    >
      <Form.TextField id="text" title="Text to Input" placeholder="Hello World" value={text} onChange={setText} />
    </Form>
  );
}
