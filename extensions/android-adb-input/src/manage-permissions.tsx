import { ActionPanel, Action, List, showToast, Toast, Icon, Color, useNavigation } from "@raycast/api";
import { adb } from "./services/adb";
import { DevicePicker } from "./components/DevicePicker";
import { AppList } from "./components/AppList";
import { useState } from "react";
import { Device, App } from "./types";
import { usePromise } from "@raycast/utils";

export default function ManagePermissions() {
  const [device, setDevice] = useState<Device | null>(null);
  const { push } = useNavigation();

  if (!device) return <DevicePicker onSelect={setDevice} />;

  return <AppList device={device} onAppSelect={(app) => push(<PermissionList device={device} app={app} />)} />;
}

function PermissionList({ device, app }: { device: Device; app: App }) {
  const {
    data: permissions,
    isLoading,
    revalidate,
  } = usePromise((deviceId, pkg) => adb.getPermissions(deviceId, pkg), [device.id, app.package]);

  async function toggle(permName: string, currentGranted: boolean) {
    const toast = await showToast({ style: Toast.Style.Animated, title: "Updating Permission..." });
    try {
      if (currentGranted) {
        await adb.revokePermission(device.id, app.package, permName);
      } else {
        await adb.grantPermission(device.id, app.package, permName);
      }
      toast.style = Toast.Style.Success;
      toast.title = "Success";
      revalidate();
    } catch (e: unknown) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed";
      toast.message = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder={`Permissions for ${app.name}...`}>
      {permissions?.map((perm) => (
        <List.Item
          key={perm.name}
          title={perm.name.replace("android.permission.", "")}
          subtitle={perm.name}
          icon={{
            source: perm.granted ? Icon.CheckCircle : Icon.Circle,
            tintColor: perm.granted ? Color.Green : Color.Red,
          }}
          accessories={[{ text: perm.granted ? "Granted" : "Denied" }]}
          actions={
            <ActionPanel>
              <Action
                title={perm.granted ? "Revoke Permission" : "Grant Permission"}
                onAction={() => toggle(perm.name, perm.granted)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
