import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { adb } from "./services/adb";
import { usePromise } from "@raycast/utils";

export default function LaunchEmulator() {
  const { data: avds, isLoading } = usePromise(() => adb.listAVDs());

  async function launch(avd: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Starting Emulator..." });
    try {
      await adb.launchAVD(avd);
      toast.style = Toast.Style.Success;
      toast.title = "Emulator Started";
      toast.message = "Give it a moment to boot up.";
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select AVD to launch...">
      {avds?.map((avd) => (
        <List.Item
          key={avd}
          title={avd}
          actions={
            <ActionPanel>
              <Action title="Launch Emulator" onAction={() => launch(avd)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
