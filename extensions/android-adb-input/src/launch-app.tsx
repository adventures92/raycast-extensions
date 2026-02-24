import { Action, Icon, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { AppList } from "./components/AppList";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function LaunchApp() {
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
            title="Launch App"
            icon={Icon.Rocket}
            onAction={async () => {
              const toast = await showToast({ style: Toast.Style.Animated, title: "Launching..." });
              try {
                await appService.launchApp(device.id, app.package);
                toast.style = Toast.Style.Success;
                toast.title = "Launched";
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
