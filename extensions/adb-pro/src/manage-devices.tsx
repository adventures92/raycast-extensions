import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { adb } from "./services/adb";
import DeviceActions from "./components/DeviceActions";
import { SetupWizard } from "./components/SetupWizard";
import { checkAdbPath } from "./services/environment";
import { useState, useEffect } from "react";
import { SwitchToWifi, ConnectIpForm } from "./wireless-connect";

export default function ManageDevices() {
  const [adbPath, setAdbPath] = useState<string | null>(null);
  const [loadingPath, setLoadingPath] = useState(true);

  useEffect(() => {
    checkAdbPath().then((path) => {
      setAdbPath(path);
      setLoadingPath(false);
    });
  }, []);

  const {
    data: devices,
    isLoading,
    revalidate,
  } = usePromise(
    async () => {
      if (!adbPath) return [];
      return await adb.listDevices();
    },
    [],
    { execute: !!adbPath },
  );

  if (loadingPath) {
    return <List isLoading={true} />;
  }

  if (!adbPath) {
    return <SetupWizard onJsonDetected={() => setAdbPath("detected")} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search devices...">
      <List.Section title="Connected Devices" subtitle={devices?.length.toString()}>
        {devices?.map((device) => (
          <List.Item
            key={device.id}
            title={`${device.model} (${device.product})`}
            subtitle={device.id}
            accessories={[
              {
                tag: { value: device.type, color: Color.SecondaryText },
                tooltip: `Transport ID: ${device.transportId}`,
              },
              {
                tag: {
                  value: device.id.includes(".") && device.id.includes(":") ? "Wireless" : "Wired",
                  color: device.id.includes(".") && device.id.includes(":") ? Color.Blue : Color.Green,
                },
              },
            ]}
            icon={device.type === "emulator" ? Icon.Monitor : Icon.Mobile}
            actions={
              <ActionPanel>
                <DeviceActions device={device} onRefresh={revalidate} />
                {!device.id.includes(".") && !device.id.includes(":") && (
                  <Action.Push
                    title="Wireless Wizard"
                    icon={Icon.Wifi}
                    target={<SwitchToWifi device={device} />}
                    shortcut={{ modifiers: ["opt"], key: "w" }}
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      <List.Section title="General">
        <List.Item
          title="Connect New Device via IP"
          icon={Icon.Wifi}
          actions={
            <ActionPanel>
              <Action.Push title="Connect" target={<ConnectIpForm />} />
              <Action
                title="Refresh List"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
