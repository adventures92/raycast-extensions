import { LocalStorage } from "@raycast/api";
import { adb } from "./adb";
import { App } from "../types";

const RECENT_APPS_KEY = "recent_apps_list";

export class AppService {
  async listApps(deviceId: string): Promise<App[]> {
    try {
      // Use pm list packages -3 (third-party/user apps)
      // This is the fastest and most reliable way to list apps.
      const output = await adb.exec(`-s ${deviceId} shell pm list packages -3`);

      return output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("package:"))
        .map((line) => {
          const pkg = line.substring(8); // Remove "package:"
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

  /**
   * Records an interaction with an app to show in the "Recent" section.
   * Persisted via Raycast LocalStorage.
   */
  async trackInteraction(pkg: string) {
    try {
      const raw = await LocalStorage.getItem<string>(RECENT_APPS_KEY);
      let recents: string[] = raw ? JSON.parse(raw) : [];

      // Remove if exists, then add to front
      recents = recents.filter((p) => p !== pkg);
      recents.unshift(pkg);

      // Limit to top 10
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

  async launchApp(deviceId: string, pkg: string) {
    const res = await adb.exec(`-s ${deviceId} shell monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
    await this.trackInteraction(pkg);
    return res;
  }

  async forceStop(deviceId: string, pkg: string) {
    const res = await adb.exec(`-s ${deviceId} shell am force-stop ${pkg}`);
    await this.trackInteraction(pkg);
    return res;
  }

  async clearData(deviceId: string, pkg: string) {
    const res = await adb.exec(`-s ${deviceId} shell pm clear ${pkg}`);
    await this.trackInteraction(pkg);
    return res;
  }

  /**
   * Removes an app from recents (e.g. after uninstall).
   */
  async removeFromRecents(pkg: string) {
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

  async uninstall(deviceId: string, pkg: string) {
    const res = await adb.exec(`-s ${deviceId} uninstall ${pkg}`);
    await this.removeFromRecents(pkg);
    return res;
  }

  async install(deviceId: string, apkPath: string) {
    return await adb.exec(`-s ${deviceId} install -r "${apkPath}"`);
  }

  async openAppInfo(deviceId: string, pkg: string) {
    const res = await adb.exec(
      `-s ${deviceId} shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:${pkg}`,
    );
    await this.trackInteraction(pkg);
    return res;
  }
}

export const appService = new AppService();
