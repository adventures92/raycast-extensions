import { ActionPanel, Action, List, showToast, Toast, Icon } from "@raycast/api";
import { adb } from "./services/adb";
import { Device } from "./types";
import { usePromise } from "@raycast/utils";

export default function KillEmulator() {
  const { data: devices, isLoading, revalidate } = usePromise(() => adb.listDevices());

  // Filter for emulators only
  const emulators = devices?.filter((d: Device) => d.type === "emulator") || [];

  async function kill(id: string) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Killing Emulator..." });
    try {
      await adb.killEmulator(id);
      toast.style = Toast.Style.Success;
      toast.title = "Emulator Stopped";
      revalidate();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select emulator to kill...">
      {emulators.length === 0 && !isLoading && (
        <List.EmptyView title="No Emulators Running" description="Use 'Launch Emulator' to start one." />
      )}
      {emulators.map((d: Device) => (
        <List.Item
          key={d.id}
          title={d.model}
          subtitle={d.id}
          icon={Icon.Mobile}
          actions={
            <ActionPanel>
              <Action title="Kill Emulator" style={Action.Style.Destructive} onAction={() => kill(d.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
