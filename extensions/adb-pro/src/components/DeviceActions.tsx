import { Action, ActionPanel, Icon, useNavigation } from "@raycast/api";
import { Device } from "../types";
import ConnectIpForm from "./ConnectIpForm";

export default function DeviceActions({ device, onRefresh }: { device: Device; onRefresh: () => void }) {
  const { push } = useNavigation();

  return (
    <ActionPanel>
      <ActionPanel.Section title="Device Actions">
        <Action
          title="View Details"
          icon={Icon.Mobile}
          onAction={() => {
            // Placeholder for details view
          }}
        />
        {device.type === "device" && (
          <Action
            title="Connect Via Wi-Fi"
            icon={Icon.Wifi}
            onAction={() => push(<ConnectIpForm onConnected={onRefresh} />)}
          />
        )}
      </ActionPanel.Section>
      <ActionPanel.Section title="System">
        <Action
          title="Refresh List"
          icon={Icon.ArrowClockwise}
          onAction={onRefresh}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
