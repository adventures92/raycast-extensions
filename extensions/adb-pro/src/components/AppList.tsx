import { ActionPanel, Action, Icon, List } from "@raycast/api";
import React from "react";
import { usePromise } from "@raycast/utils";
import { appService } from "../services/apps";
import { App, Device } from "../types";
import { LogcatList } from "./LogcatList";

interface AppListProps {
  device: Device;
  onAppSelect?: (app: App) => void;
  // We can also allow passing custom actions generator
  actions?: (app: App) => React.JSX.Element;
  isLoading?: boolean;
}

export function AppList({ device, onAppSelect, actions }: AppListProps) {
  const { data: recents, isLoading: loadingRecents } = usePromise(() => appService.getRecents(), []);
  const { data: allApps, isLoading: loadingAll } = usePromise((id: string) => appService.listApps(id), [device.id]);

  const handleSelect = async (app: App) => {
    await appService.trackInteraction(app.package);
    if (onAppSelect) {
      onAppSelect(app);
    }
  };

  const getActions = (app: App) => (
    <ActionPanel>
      {onAppSelect ? (
        <Action title="Select" icon={Icon.Check} onAction={() => handleSelect(app)} />
      ) : (
        <>
          {actions && actions(app)}
          <Action.Push
            title="View Logcat"
            icon={Icon.Terminal}
            target={<LogcatList device={device} initialApp={app} />}
            shortcut={{ modifiers: ["cmd"], key: "l" }}
          />
        </>
      )}
    </ActionPanel>
  );

  return (
    <List isLoading={loadingRecents || loadingAll} searchBarPlaceholder={`Search apps on ${device.model}...`}>
      {recents && recents.length > 0 && (
        <List.Section title="Recent Apps">
          {recents.map((app: App) => (
            <List.Item
              key={`recent-${app.package}`}
              title={app.name}
              subtitle={app.package}
              icon={Icon.Clock}
              actions={getActions(app)}
            />
          ))}
        </List.Section>
      )}

      <List.Section title="All User Apps">
        {allApps?.map((app: App) => (
          <List.Item
            key={app.package}
            title={app.name}
            subtitle={app.package}
            icon={Icon.AppWindow}
            actions={getActions(app)}
          />
        ))}
      </List.Section>
    </List>
  );
}
