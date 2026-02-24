import { Action, ActionPanel, Form, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { checkAdbPath, saveAdbPath } from "../services/environment";

export function SetupWizard({ onJsonDetected }: { onJsonDetected?: () => void }) {
  const { push } = useNavigation();

  async function autoDetect() {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Searching for ADB..." });
    const path = await checkAdbPath();
    if (path) {
      await saveAdbPath(path);
      toast.style = Toast.Style.Success;
      toast.title = "ADB Found!";
      toast.message = path;
      if (onJsonDetected) onJsonDetected();
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "ADB Not Found";
      toast.message = "Could not automatically find adb in common locations.";
    }
  }

  return (
    <List navigationTitle="ADB Setup" searchBarPlaceholder="How do you want to set up ADB?">
      <List.EmptyView
        icon={Icon.Warning}
        title="ADB Not Found"
        description="The Android Debug Bridge (adb) was not found in your system path."
      />
      <List.Section title="Setup Options">
        <List.Item
          icon={Icon.MagnifyingGlass}
          title="Auto-Detect ADB"
          subtitle="Search common installation paths"
          actions={
            <ActionPanel>
              <Action title="Start Search" onAction={autoDetect} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Folder}
          title="Manually Locate ADB"
          subtitle="Select the adb executable from Finder"
          actions={
            <ActionPanel>
              <Action title="Set Custom Path" onAction={() => push(<ManualPathForm onSaved={onJsonDetected} />)} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Download}
          title="Install via Homebrew"
          subtitle="copy 'brew install --cask android-platform-tools'"
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Install Command"
                content="brew install --cask android-platform-tools"
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

function ManualPathForm({ onSaved }: { onSaved?: () => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { path: string }) {
    if (values.path) {
      await saveAdbPath(values.path);
      await showToast({ style: Toast.Style.Success, title: "Path Saved" });
      if (onSaved) onSaved();
      pop();
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Path" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="path" title="ADB Executable" allowMultipleSelection={false} />
    </Form>
  );
}
