import { Action, Icon, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { AppList } from "./components/AppList";
import { DevicePicker } from "./components/DevicePicker";
import { appService } from "./services/apps";
import { Device } from "./types";

export default function OpenAppSettings() {
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
            title="Open App Info"
            icon={Icon.Gear}
            onAction={async () => {
              const toast = await showToast({ style: Toast.Style.Animated, title: "Opening Settings..." });
              try {
                await appService.openAppInfo(device.id, app.package);
                toast.style = Toast.Style.Success;
                toast.title = "Opened";
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
