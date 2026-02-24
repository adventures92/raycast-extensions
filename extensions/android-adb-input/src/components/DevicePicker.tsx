import { Icon, List, ActionPanel, Action } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { adb } from "../services/adb";
import { Device } from "../types";
import { SetupWizard } from "./SetupWizard";
import { checkAdbPath } from "../services/environment";
import { useState, useEffect } from "react";

interface DevicePickerProps {
  onSelect: (device: Device) => void;
}

export function DevicePicker({ onSelect }: DevicePickerProps) {
  const [adbPath, setAdbPath] = useState<string | null>(null);

  useEffect(() => {
    checkAdbPath().then(setAdbPath);
  }, []);

  const { data: devices, isLoading } = usePromise(
    async () => {
      if (!adbPath) return [];
      return await adb.listDevices();
    },
    [],
    { execute: !!adbPath },
  );

  if (!adbPath) {
    return <SetupWizard />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select a device...">
      <List.Section title="Connected Devices">
        {devices?.map((device) => (
          <List.Item
            key={device.id}
            title={`${device.model} (${device.product})`}
            subtitle={device.id}
            icon={device.type === "emulator" ? Icon.Monitor : Icon.Mobile}
            actions={
              <ActionPanel>
                <Action title="Select Device" onAction={() => onSelect(device)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
