import { Action, Icon, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { useState } from "react";
import { AppList } from "./components/AppList";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function UninstallApp() {
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
            title="Uninstall"
            style={Action.Style.Destructive}
            icon={Icon.Trash}
            onAction={async () => {
              if (
                await confirmAlert({
                  title: "Uninstall App?",
                  message: `Are you sure you want to uninstall ${app.name}?`,
                  primaryAction: { title: "Uninstall", style: Alert.ActionStyle.Destructive },
                })
              ) {
                const toast = await showToast({ style: Toast.Style.Animated, title: "Uninstalling..." });
                try {
                  await appService.uninstall(device.id, app.package);
                  toast.style = Toast.Style.Success;
                  toast.title = "Uninstalled";
                  // Ideally we should refresh the list here, but usePromise is inside List.
                  // For now, it will require a manual refresh or we need to lift state up.
                  // Or assume it's gone.
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
