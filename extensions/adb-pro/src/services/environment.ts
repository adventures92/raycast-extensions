import { exec } from "child_process";
import { promisify } from "util";
import { getPreferenceValues, LocalStorage } from "@raycast/api";
import fs from "fs";
import os from "os";

const execAsync = promisify(exec);

export const ADB_PATH_KEY = "adb_custom_path";

export async function checkAdbPath(): Promise<string | null> {
  // 1. Check User Preference (LocalStorage)
  const storedPath = await LocalStorage.getItem<string>(ADB_PATH_KEY);
  if (storedPath && fs.existsSync(storedPath)) {
    return storedPath;
  }

  // 2. Check Extension Preferences
  const preferences = getPreferenceValues<{ adbPath?: string }>();
  if (preferences.adbPath && fs.existsSync(preferences.adbPath)) {
    return preferences.adbPath;
  }

  // 3. common system paths
  const systemPaths = [
    "/usr/bin/adb",
    "/usr/local/bin/adb",
    "/opt/homebrew/bin/adb",
    `${os.homedir()}/Library/Android/sdk/platform-tools/adb`,
    `${os.homedir()}/Android/Sdk/platform-tools/adb`,
  ];

  for (const p of systemPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // 4. Try 'which adb'
  try {
    const { stdout } = await execAsync("which adb");
    const whichPath = stdout.trim();
    if (whichPath && fs.existsSync(whichPath)) {
      return whichPath;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function saveAdbPath(path: string) {
  await LocalStorage.setItem(ADB_PATH_KEY, path);
}
