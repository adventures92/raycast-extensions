import { ActionPanel, Action, Icon, List } from "@raycast/api";
import { Device } from "../types";
import ConnectIpForm from "./ConnectIpForm";
import AppList from "./AppList";
import DeviceActions from "./DeviceActions";

interface DeviceListProps {
  devices: Device[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function DeviceList({ devices, isLoading, onRefresh }: DeviceListProps) {
  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search devices...">
      {devices.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Mobile}
          title="No Devices Connected"
          description="Plug in a device via USB or connect via Wireless Debugging."
          actions={
            <ActionPanel>
              <Action title="Refresh" icon={Icon.RotateClockwise} onAction={onRefresh} />
              <Action.Push
                title="Connect Via Network"
                icon={Icon.Wifi}
                target={<ConnectIpForm onConnect={onRefresh} />}
              />
            </ActionPanel>
          }
        />
      ) : (
        devices.map((device) => (
          <List.Item
            key={device.id}
            title={`${device.model} (${device.id})`}
            subtitle={device.isWifi ? "Wireless" : "USB"}
            accessories={[
              { text: device.state, tooltip: `State: ${device.state}` },
              { icon: device.isWifi ? Icon.Wifi : Icon.Plug },
            ]}
            actions={
              <ActionPanel>
                <Action.Push title="Manage Apps" icon={Icon.AppWindow} target={<AppList device={device} />} />
                <Action.Push
                  title="Device Actions"
                  icon={Icon.WrenchScrewdriver}
                  target={<DeviceActions device={device} />}
                />
                <Action.Push
                  title="Connect Via Network"
                  icon={Icon.Wifi}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                  target={<ConnectIpForm onConnect={onRefresh} />}
                />
                <Action title="Refresh" icon={Icon.RotateClockwise} onAction={onRefresh} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
