import { LocalStorage } from "@raycast/api";
import { adb } from "./adb";
import { App } from "../types";
import { validateApkPath, validateDeviceId, validatePackageName } from "./validators";

const RECENT_APPS_KEY = "recent_apps_list";

export class AppService {
  async listApps(deviceId: string): Promise<App[]> {
    try {
      const validDeviceId = validateDeviceId(deviceId);
      const output = await adb.runAdb(["-s", validDeviceId, "shell", "pm", "list", "packages", "-3"]);

      return output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("package:"))
        .map((line) => {
          const pkg = line.substring(8);
          return {
            name: pkg,
            package: pkg,
            type: "user",
          } as App;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error("Failed to list apps", e);
      return [];
    }
  }

  async trackInteraction(pkg: string): Promise<void> {
    try {
      const raw = await LocalStorage.getItem<string>(RECENT_APPS_KEY);
      let recents: string[] = raw ? JSON.parse(raw) : [];

      recents = recents.filter((p) => p !== pkg);
      recents.unshift(pkg);
      recents = recents.slice(0, 10);

      await LocalStorage.setItem(RECENT_APPS_KEY, JSON.stringify(recents));
    } catch (e) {
      console.error("Failed to track interaction", e);
    }
  }

  async getRecents(): Promise<App[]> {
    try {
      const raw = await LocalStorage.getItem<string>(RECENT_APPS_KEY);
      if (!raw) return [];

      const packageNames: string[] = JSON.parse(raw);
      return packageNames.map(
        (pkg) =>
          ({
            name: pkg,
            package: pkg,
            type: "user",
          }) as App,
      );
    } catch (e) {
      console.error("Failed to get recents from storage", e);
      return [];
    }
  }

  async launchApp(deviceId: string, pkg: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const res = await adb.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "monkey",
      "-p",
      validPackage,
      "-c",
      "android.intent.category.LAUNCHER",
      "1",
    ]);
    await this.trackInteraction(validPackage);
    return res;
  }

  async forceStop(deviceId: string, pkg: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const res = await adb.runAdb(["-s", validDeviceId, "shell", "am", "force-stop", validPackage]);
    await this.trackInteraction(validPackage);
    return res;
  }

  async clearData(deviceId: string, pkg: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const res = await adb.runAdb(["-s", validDeviceId, "shell", "pm", "clear", validPackage]);
    await this.trackInteraction(validPackage);
    return res;
  }

  async removeFromRecents(pkg: string): Promise<void> {
    try {
      const raw = await LocalStorage.getItem<string>(RECENT_APPS_KEY);
      if (!raw) return;
      let recents: string[] = JSON.parse(raw);
      recents = recents.filter((p) => p !== pkg);
      await LocalStorage.setItem(RECENT_APPS_KEY, JSON.stringify(recents));
    } catch (e) {
      console.error("Failed to remove from recents", e);
    }
  }

  async uninstall(deviceId: string, pkg: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const res = await adb.runAdb(["-s", validDeviceId, "uninstall", validPackage]);
    await this.removeFromRecents(validPackage);
    return res;
  }

  async install(deviceId: string, apkPath: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validApkPath = validateApkPath(apkPath);
    return adb.runAdb(["-s", validDeviceId, "install", "-r", validApkPath]);
  }

  async openAppInfo(deviceId: string, pkg: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const res = await adb.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "am",
      "start",
      "-a",
      "android.settings.APPLICATION_DETAILS_SETTINGS",
      "-d",
      `package:${validPackage}`,
    ]);
    await this.trackInteraction(validPackage);
    return res;
  }
}

export const appService = new AppService();
