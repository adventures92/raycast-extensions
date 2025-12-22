import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function InstallApk() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return <InstallForm device={device} />;
}

function InstallForm({ device }: { device: Device }) {
  const { pop } = useNavigation();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: { files: string[] }) {
    if (values.files.length === 0) return;

    setLoading(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Installing APK..." });

    try {
      // We only take the first file for now, though multi-install is possible
      const apkPath = values.files[0];
      await appService.install(device.id, apkPath);

      toast.style = Toast.Style.Success;
      toast.title = "Install Successful";
      pop();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Install Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Install APK" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="files" title="Select APK" allowMultipleSelection={false} />
    </Form>
  );
}
