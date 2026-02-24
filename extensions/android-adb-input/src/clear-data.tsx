import { Action, Icon, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { useState } from "react";
import { AppList } from "./components/AppList";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function ClearData() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  return (
    <AppList
      device={device}
      actions={(app) => (
        <>
          <Action
            title="Clear Data"
            style={Action.Style.Destructive}
            icon={Icon.Trash}
            onAction={async () => {
              if (
                await confirmAlert({
                  title: "Clear App Data?",
                  message: `This will reset ${app.name} to its initial state.`,
                  primaryAction: { title: "Clear Data", style: Alert.ActionStyle.Destructive },
                })
              ) {
                const toast = await showToast({ style: Toast.Style.Animated, title: "Clearing..." });
                try {
                  await appService.clearData(device.id, app.package);
                  toast.style = Toast.Style.Success;
                  toast.title = "Data Cleared";
                } catch (e: unknown) {
                  toast.style = Toast.Style.Failure;
                  toast.title = "Failed";
                  toast.message = e instanceof Error ? e.message : String(e);
                }
              }
            }}
          />
        </>
      )}
    />
  );
}
