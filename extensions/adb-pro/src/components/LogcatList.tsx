import { ActionPanel, Action, List, Icon, Color, useNavigation } from "@raycast/api";
import React, { useState, useMemo, useCallback } from "react";
import { Device, App } from "../types";
import { useLogcat, LogEntry } from "../hooks/useLogcat";
import { AppList } from "./AppList";

export function LogcatList({ device, initialApp }: { device: Device; initialApp: App | null }) {
  const [selectedApp, setSelectedApp] = useState<App | null>(initialApp);
  const [searchText, setSearchText] = useState("");
  const [minLevel, setMinLevel] = useState<string>("V");

  const { logs, isLoading, error, clearLogs } = useLogcat(device, selectedApp?.package);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by Level
    const levels = ["V", "D", "I", "W", "E", "F"];
    const minIndex = levels.indexOf(minLevel);
    if (minIndex > 0) {
      result = result.filter((l) => levels.indexOf(l.level) >= minIndex);
    }

    // Filter by Text (simple includes)
    if (searchText.trim().length > 0) {
      const lower = searchText.toLowerCase();
      result = result.filter((l) => l.message.toLowerCase().includes(lower) || l.tag.toLowerCase().includes(lower));
    }

    return result;
  }, [logs, minLevel, searchText]);

  const { push, pop } = useNavigation();

  const selectApp = useCallback(() => {
    // Use AppList to pick an app. Passed onAppSelect.
    push(
      <AppList
        device={device}
        onAppSelect={(app) => {
          setSelectedApp(app);
          pop(); // Pop the picker
        }}
      />,
    );
  }, [device, push, pop]);

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={`Search logs (${selectedApp ? selectedApp.name : "System All"})...`}
      searchBarAccessory={
        <List.Dropdown tooltip="Log Level" onChange={setMinLevel} defaultValue="V">
          <List.Dropdown.Item title="Verbose+" value="V" />
          <List.Dropdown.Item title="Debug+" value="D" />
          <List.Dropdown.Item title="Info+" value="I" />
          <List.Dropdown.Item title="Warning+" value="W" />
          <List.Dropdown.Item title="Error" value="E" />
        </List.Dropdown>
      }
      isShowingDetail={true}
    >
      {filteredLogs.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Logs"
          description={error || "Waiting for logs..."}
          actions={
            <ActionPanel>
              <Action title="Clear" onAction={clearLogs} />
              {!selectedApp ? (
                <Action
                  title="Filter by App…"
                  icon={Icon.AppWindow}
                  onAction={selectApp}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                />
              ) : (
                <Action
                  title="Show System Logs"
                  icon={Icon.ComputerChip}
                  onAction={() => setSelectedApp(null)}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                />
              )}
            </ActionPanel>
          }
        />
      ) : (
        filteredLogs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            selectedApp={selectedApp}
            clearLogs={clearLogs}
            selectApp={selectApp}
            setSelectedApp={setSelectedApp}
          />
        ))
      )}
    </List>
  );
}

const LogItem = React.memo(function LogItem({
  log,
  selectedApp,
  clearLogs,
  selectApp,
  setSelectedApp,
}: {
  log: LogEntry;
  selectedApp: App | null;
  clearLogs: () => void;
  selectApp: () => void;
  setSelectedApp: (app: App | null) => void;
}) {
  return (
    <List.Item
      title={log.message}
      subtitle={log.tag}
      keywords={[log.tag, log.pid, log.message]}
      icon={getLevelIcon(log.level)}
      detail={
        <List.Item.Detail
          markdown={`\`\`\`\n${log.raw}\n\`\`\``}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Time" text={log.timestamp} />
              <List.Item.Detail.Metadata.Label title="Level" text={log.level} />
              <List.Item.Detail.Metadata.Label title="Tag" text={log.tag} />
              <List.Item.Detail.Metadata.Label title="PID" text={log.pid} />
              <List.Item.Detail.Metadata.Label title="TID" text={log.tid} />
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Log Line" content={log.raw} />
          {!selectedApp ? (
            <Action
              title="Filter by App…"
              icon={Icon.AppWindow}
              onAction={selectApp}
              shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            />
          ) : (
            <Action
              title="Show System Logs"
              icon={Icon.ComputerChip}
              onAction={() => setSelectedApp(null)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            />
          )}
          <Action title="Clear Logs" onAction={clearLogs} shortcut={{ modifiers: ["cmd", "shift"], key: "k" }} />
          <Action.CopyToClipboard
            title="Copy Message"
            content={log.message}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
});

function getLevelIcon(level: string) {
  switch (level) {
    case "E":
    case "F":
      return { source: Icon.CircleFilled, tintColor: Color.Red };
    case "W":
      return { source: Icon.CircleFilled, tintColor: Color.Orange };
    case "I":
      return { source: Icon.Circle, tintColor: Color.Blue };
    case "D":
      return { source: Icon.Circle, tintColor: Color.Green };
    default:
      return { source: Icon.Circle, tintColor: Color.SecondaryText };
  }
}
