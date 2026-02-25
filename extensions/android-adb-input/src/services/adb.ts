import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import { Device, AdbResult } from "../types";
import { checkAdbPath, checkEmulatorPath } from "./environment";
import {
  normalizeInputText,
  validateDensity,
  validateDeviceId,
  validateHost,
  validateKeycode,
  validatePackageName,
  validatePermissionName,
  validatePortValue,
  validateWmSize,
} from "./validators";

const SETTING_KEY_PATTERN = /^[A-Za-z0-9_.]+$/;
const AVD_NAME_PATTERN = /^[A-Za-z0-9_.()-]+$/;

class AdbService {
  private adbPath: string | null = null;
  private emulatorPath: string | null = null;
  private scrcpyPath: string | null = null;

  private async getAdb(): Promise<string> {
    if (this.adbPath) return this.adbPath;
    const path = await checkAdbPath();
    if (!path) {
      throw new Error("ADB not found");
    }
    this.adbPath = path;
    return path;
  }

  private async getEmulator(): Promise<string> {
    if (this.emulatorPath) return this.emulatorPath;
    const path = await checkEmulatorPath();
    if (!path) {
      return "emulator";
    }
    this.emulatorPath = path;
    return path;
  }

  private async getScrcpy(): Promise<string> {
    if (this.scrcpyPath) return this.scrcpyPath;

    const candidates = ["/opt/homebrew/bin/scrcpy", "/usr/local/bin/scrcpy", "/usr/bin/scrcpy", "scrcpy"];
    const discovered = candidates.find((candidate) => candidate === "scrcpy" || fs.existsSync(candidate));

    if (!discovered) {
      throw new Error("scrcpy is not installed. Install it with: brew install scrcpy");
    }

    this.scrcpyPath = discovered;
    return discovered;
  }

  private runCommand(binaryPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(binaryPath, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr?.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
          return;
        }

        const detail = stderr.trim() || stdout.trim() || `Process exited with code ${code ?? "unknown"}`;
        reject(new Error(detail));
      });
    });
  }

  async runBinary(binaryPath: string, args: string[], options?: { detached?: boolean }): Promise<string> {
    if (options?.detached) {
      return new Promise((resolve, reject) => {
        const child = spawn(binaryPath, args, { detached: true, stdio: "ignore" });

        child.once("error", (error) => {
          reject(error);
        });

        child.once("spawn", () => {
          child.unref();
          resolve("");
        });
      });
    }

    return this.runCommand(binaryPath, args);
  }

  async runAdb(args: string[]): Promise<string> {
    const adb = await this.getAdb();
    return this.runBinary(adb, args);
  }

  async spawnAdb(args: string[]): Promise<ChildProcess> {
    const adb = await this.getAdb();
    return spawn(adb, args);
  }

  async getPid(deviceId: string, pkg: string): Promise<string | null> {
    try {
      const validDeviceId = validateDeviceId(deviceId);
      const validPackage = validatePackageName(pkg);
      const pid = await this.runAdb(["-s", validDeviceId, "shell", "pidof", "-s", validPackage]);
      return pid ? pid.trim() : null;
    } catch {
      return null;
    }
  }

  async listDevices(): Promise<Device[]> {
    try {
      const output = await this.runAdb(["devices", "-l"]);
      const lines = output.split("\n").slice(1);

      return lines
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const parts = line.split(/\s+/);
          const id = parts[0];
          const type = parts[1] as Device["type"];

          const modelPart = parts.find((p) => p.startsWith("model:"))?.split(":")[1] || "Unknown";
          const productPart = parts.find((p) => p.startsWith("product:"))?.split(":")[1] || "Unknown";
          const transportPart = parts.find((p) => p.startsWith("transport_id:"))?.split(":")[1] || "0";

          return {
            id,
            type,
            state: type,
            model: modelPart,
            product: productPart,
            device: parts.find((p) => p.startsWith("device:"))?.split(":")[1] || "Unknown",
            transportId: transportPart,
            isWifi: id.includes(":") || id.startsWith("192.168"),
          };
        });
    } catch (error) {
      console.error("Failed to list devices", error);
      return [];
    }
  }

  async spawnLogcat(deviceId: string): Promise<ChildProcess> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.spawnAdb(["-s", validDeviceId, "logcat", "-v", "threadtime"]);
  }

  async connectWireless(ip: string, port: string = "5555"): Promise<AdbResult> {
    try {
      const host = validateHost(ip);
      const portNumber = validatePortValue(port);
      const output = await this.runAdb(["connect", `${host}:${portNumber}`]);
      if (output.includes("connected to") || output.includes("already connected to")) {
        return { success: true, message: `Connected to ${host}:${portNumber}` };
      }
      return { success: false, message: output };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async connect(ip: string, port: number = 5555): Promise<string> {
    const host = validateHost(ip);
    const portNumber = validatePortValue(port);
    return this.runAdb(["connect", `${host}:${portNumber}`]);
  }

  async restartServer(): Promise<AdbResult> {
    try {
      await this.runAdb(["kill-server"]);
      await this.runAdb(["start-server"]);
      return { success: true, message: "ADB Server restarted successfully" };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async toggleWifi(deviceId: string, enable: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "svc", "wifi", enable ? "enable" : "disable"]);
  }

  async toggleMobileData(deviceId: string, enable: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "svc", "data", enable ? "enable" : "disable"]);
  }

  async getGlobalSetting(deviceId: string, key: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validKey = key.trim();
    if (!SETTING_KEY_PATTERN.test(validKey)) {
      throw new Error(`Invalid settings key "${key}".`);
    }
    return this.runAdb(["-s", validDeviceId, "shell", "settings", "get", "global", validKey]);
  }

  async toggleAirplaneMode(deviceId: string, enable: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    await this.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "settings",
      "put",
      "global",
      "airplane_mode_on",
      enable ? "1" : "0",
    ]);
    return this.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "am",
      "broadcast",
      "-a",
      "android.intent.action.AIRPLANE_MODE",
      "--ez",
      "state",
      enable ? "true" : "false",
    ]);
  }

  async toggleDarkMode(deviceId: string, enable: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "cmd", "uimode", "night", enable ? "yes" : "no"]);
  }

  async getDarkModeStatus(deviceId: string): Promise<"dark" | "light" | "unknown"> {
    try {
      const validDeviceId = validateDeviceId(deviceId);
      const output = await this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "uimode"]);
      const matchedLine = output
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("mNightMode="));
      if (!matchedLine) return "unknown";
      return matchedLine.includes("yes") ? "dark" : "light";
    } catch {
      return "unknown";
    }
  }

  async toggleLayoutBounds(deviceId: string, enable: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    await this.runAdb(["-s", validDeviceId, "shell", "setprop", "debug.layout", enable ? "true" : "false"]);
    return this.runAdb(["-s", validDeviceId, "shell", "service", "call", "activity", "1599295570"]);
  }

  async getSystemProperty(deviceId: string, propertyName: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validProperty = propertyName.trim();
    if (!SETTING_KEY_PATTERN.test(validProperty)) {
      throw new Error(`Invalid property name "${propertyName}".`);
    }
    return this.runAdb(["-s", validDeviceId, "shell", "getprop", validProperty]);
  }

  async getWifiStatus(deviceId: string): Promise<"enabled" | "disabled" | "unknown"> {
    try {
      const validDeviceId = validateDeviceId(deviceId);
      const output = await this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "wifi"]);
      const statusLine = output
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("Wi-Fi is "));
      if (!statusLine) return "unknown";
      if (statusLine.includes("enabled")) return "enabled";
      if (statusLine.includes("disabled")) return "disabled";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  async inputText(deviceId: string, text: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const normalizedText = normalizeInputText(text);
    return this.runAdb(["-s", validDeviceId, "shell", "input", "text", normalizedText]);
  }

  async getWlanIpAddress(deviceId: string): Promise<string | null> {
    const validDeviceId = validateDeviceId(deviceId);
    const output = await this.runAdb(["-s", validDeviceId, "shell", "ip", "-f", "inet", "addr", "show", "wlan0"]);
    const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)\//);
    return match ? match[1] : null;
  }

  async listAVDs(): Promise<string[]> {
    try {
      const emulator = await this.getEmulator();
      const res = await this.runBinary(emulator, ["-list-avds"]);
      return res.split("\n").filter((l) => l.trim().length > 0);
    } catch {
      try {
        const res = await this.runBinary("emulator", ["-list-avds"]);
        return res.split("\n").filter((l) => l.trim().length > 0);
      } catch {
        return [];
      }
    }
  }

  async launchAVD(avdName: string): Promise<string> {
    const emulator = await this.getEmulator();
    const validAvdName = avdName.trim();
    if (!AVD_NAME_PATTERN.test(validAvdName)) {
      throw new Error(`Invalid AVD name "${avdName}".`);
    }
    return this.runBinary(emulator, [`@${validAvdName}`], { detached: true });
  }

  async killEmulator(deviceId: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "emu", "kill"]);
  }

  async getPermissions(deviceId: string, pkg: string): Promise<{ name: string; granted: boolean }[]> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const output = await this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "package", validPackage]);
    const lines = output.split("\n");
    const permissions: { name: string; granted: boolean }[] = [];
    let inPermissions = false;

    for (const line of lines) {
      if (line.includes("runtime permissions:")) {
        inPermissions = true;
        continue;
      }
      if (inPermissions) {
        if (line.trim() === "" || !line.includes(":")) break;
        const parts = line.split(":");
        const name = parts[0].trim();
        const granted = parts[1].includes("true");
        permissions.push({ name, granted });
      }
    }
    return permissions;
  }

  async grantPermission(deviceId: string, pkg: string, permission: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const validPermission = validatePermissionName(permission);
    return this.runAdb(["-s", validDeviceId, "shell", "pm", "grant", validPackage, validPermission]);
  }

  async revokePermission(deviceId: string, pkg: string, permission: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const validPermission = validatePermissionName(permission);
    return this.runAdb(["-s", validDeviceId, "shell", "pm", "revoke", validPackage, validPermission]);
  }

  async setProxy(deviceId: string, host: string, port: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validHost = validateHost(host);
    const validPort = validatePortValue(port);
    return this.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "settings",
      "put",
      "global",
      "http_proxy",
      `${validHost}:${validPort}`,
    ]);
  }

  async clearProxy(deviceId: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "settings", "put", "global", "http_proxy", ":0"]);
  }

  async setSize(deviceId: string, size: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validSize = validateWmSize(size);
    return this.runAdb(["-s", validDeviceId, "shell", "wm", "size", validSize]);
  }

  async setDensity(deviceId: string, density: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validDensity = validateDensity(density);
    return this.runAdb(["-s", validDeviceId, "shell", "wm", "density", validDensity]);
  }

  async resetDisplay(deviceId: string): Promise<void> {
    const validDeviceId = validateDeviceId(deviceId);
    await this.runAdb(["-s", validDeviceId, "shell", "wm", "size", "reset"]);
    await this.runAdb(["-s", validDeviceId, "shell", "wm", "density", "reset"]);
  }

  async sendKeyEvent(deviceId: string, keycode: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validKeycode = validateKeycode(keycode);
    return this.runAdb(["-s", validDeviceId, "shell", "input", "keyevent", validKeycode]);
  }

  async tcpip(deviceId: string, port: number = 5555): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPort = validatePortValue(port);
    return this.runAdb(["-s", validDeviceId, "tcpip", String(validPort)]);
  }

  async mirrorScreen(deviceId: string): Promise<void> {
    const validDeviceId = validateDeviceId(deviceId);
    try {
      const scrcpy = await this.getScrcpy();
      const adb = await this.getAdb();
      await new Promise<void>((resolve, reject) => {
        const child = spawn(scrcpy, ["-s", validDeviceId], {
          detached: true,
          stdio: ["ignore", "ignore", "pipe"],
          env: { ...process.env, ADB: adb },
        });
        let stderr = "";
        let resolved = false;

        child.stderr?.on("data", (chunk: Buffer | string) => {
          stderr += chunk.toString();
        });

        child.once("error", (error) => {
          if (resolved) return;
          resolved = true;
          reject(error);
        });

        child.once("close", (code) => {
          if (resolved) return;
          resolved = true;
          const reason = stderr.trim() || `scrcpy exited with code ${code ?? "unknown"}.`;
          reject(new Error(reason));
        });

        // Consider startup successful only if it survives the first moment.
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          child.unref();
          resolve();
        }, 1200);
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new Error("scrcpy was not found in PATH. Install it with: brew install scrcpy");
      }
      if (error instanceof Error) {
        throw new Error(`Could not start scrcpy: ${error.message}`);
      }
      throw new Error("Could not start scrcpy.");
    }
  }

  async enableFirebaseDebug(deviceId: string, pkg: string): Promise<void> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    await this.runAdb(["-s", validDeviceId, "shell", "setprop", "debug.firebase.analytics.app", validPackage]);
  }

  async disableFirebaseDebug(deviceId: string): Promise<void> {
    const validDeviceId = validateDeviceId(deviceId);
    await this.runAdb(["-s", validDeviceId, "shell", "setprop", "debug.firebase.analytics.app", ".none."]);
  }

  async resolveLaunchableActivity(deviceId: string, pkg: string): Promise<string | null> {
    const validDeviceId = validateDeviceId(deviceId);
    const validPackage = validatePackageName(pkg);
    const output = await this.runAdb([
      "-s",
      validDeviceId,
      "shell",
      "cmd",
      "package",
      "resolve-activity",
      "--brief",
      validPackage,
    ]);
    const lines = output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;
    const candidate = lines[lines.length - 1];
    if (candidate === "No activity found") return null;
    return candidate;
  }

  async startActivityAndWait(deviceId: string, activityComponent: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    const validActivity = activityComponent.trim();
    if (!validActivity || /\s/.test(validActivity)) {
      throw new Error(`Invalid activity component "${activityComponent}".`);
    }
    return this.runAdb(["-s", validDeviceId, "shell", "am", "start", "-W", "-n", validActivity]);
  }

  async setBatteryUsb(deviceId: string, connected: boolean): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "battery", "set", "usb", connected ? "1" : "0"]);
  }

  async setBatteryLevel(deviceId: string, level: number): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    if (!Number.isInteger(level) || level < 0 || level > 100) {
      throw new Error("Battery level must be between 0 and 100.");
    }
    return this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "battery", "set", "level", String(level)]);
  }

  async resetBattery(deviceId: string): Promise<string> {
    const validDeviceId = validateDeviceId(deviceId);
    return this.runAdb(["-s", validDeviceId, "shell", "dumpsys", "battery", "reset"]);
  }
}

export const adb = new AdbService();
