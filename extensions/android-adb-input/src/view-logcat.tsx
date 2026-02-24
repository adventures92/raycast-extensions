import { useState } from "react";
import { Device, App } from "./types";
import { DevicePicker } from "./components/DevicePicker";
import { LogcatList } from "./components/LogcatList"; // Shared component

export default function ViewLogcat(props: { launchContext?: { device?: Device; app?: App } }) {
  const [device, setDevice] = useState<Device | null>(props.launchContext?.device || null);
  const [app] = useState<App | null>(props.launchContext?.app || null);

  if (!device) {
    return <DevicePicker onSelect={setDevice} />;
  }

  // Pass initial App if provided (e.g. context launch)
  return <LogcatList device={device} initialApp={app} />;
}
