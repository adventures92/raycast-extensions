import { Action, Icon, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { AppList } from "./components/AppList";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function ForceStop() {
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
            title="Force Stop"
            style={Action.Style.Destructive}
            icon={Icon.Stop}
            onAction={async () => {
              const toast = await showToast({ style: Toast.Style.Animated, title: "Stopping..." });
              try {
                await appService.forceStop(device.id, app.package);
                toast.style = Toast.Style.Success;
                toast.title = "App Stopped";
                toast.message = `${app.name} has been killed.`;
              } catch (e: unknown) {
                toast.style = Toast.Style.Failure;
                toast.title = "Failed";
                toast.message = e instanceof Error ? e.message : String(e);
              }
            }}
          />
        </>
      )}
    />
  );
}
