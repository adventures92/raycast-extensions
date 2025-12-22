import { showToast, Toast } from "@raycast/api";
import { adb } from "./services/adb";
import { appService } from "./services/apps";
import { DevicePicker } from "./components/DevicePicker";
import { AppList } from "./components/AppList";
import { useState } from "react";
import { Device, App } from "./types";

export default function BenchmarkStart() {
  const [device, setDevice] = useState<Device | null>(null);

  if (!device) return <DevicePicker onSelect={setDevice} />;

  return <AppList device={device} onAppSelect={(app) => runBenchmark(device, app)} />;
}

async function runBenchmark(device: Device, app: App) {
  const toast = await showToast({ style: Toast.Style.Animated, title: `Benchmarking ${app.name}...` });
  try {
    // Stop it first to ensure cold start
    await appService.forceStop(device.id, app.package);

    // Run benchmarks
    // am start -W -n package/activity
    // We need main activity. AppService launchApp uses monkey which doesn't give stats nicely.
    // We'll try to find a launchable activity or just use monkey and cannot wait.
    // Wait, 'monkey' doesn't give TotalTime.
    // We need: 'cmd package resolve-activity --brief package | tail -n 1' to get activity.

    const activityOut = await adb.exec(
      `-s ${device.id} shell "cmd package resolve-activity --brief ${app.package} | tail -n 1"`,
    );
    const activityComponent = activityOut.trim();

    if (!activityComponent || activityComponent === "No activity found") {
      throw new Error("Could not find main activity");
    }

    const res = await adb.exec(`-s ${device.id} shell am start -W -n ${activityComponent}`);

    // Parse "TotalTime: 123"
    const match = res.match(/TotalTime: (\d+)/);
    const time = match ? match[1] : "Unknown";

    toast.style = Toast.Style.Success;
    toast.title = `Cold Start: ${time}ms`;
    toast.message = `${app.name}`;
  } catch (e: unknown) {
    toast.style = Toast.Style.Failure;
    toast.title = "Benchmark Failed";
    toast.message = e instanceof Error ? e.message : String(e);
  }
}
