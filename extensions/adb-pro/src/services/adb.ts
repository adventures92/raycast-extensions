import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { Device, AdbResult } from "../types";
import { checkAdbPath } from "./environment";

const execAsync = promisify(exec);

class AdbService {
  private adbPath: string | null = null;

  private async getAdb(): Promise<string> {
    if (this.adbPath) return this.adbPath;
    const path = await checkAdbPath();
    if (!path) {
      throw new Error("ADB not found");
    }
    this.adbPath = path;
    return path;
  }

  async exec(command: string): Promise<string> {
    const adb = await this.getAdb();
    const { stdout } = await execAsync(`"${adb}" ${command}`);
    return stdout.trim();
  }

  async getPid(deviceId: string, pkg: string): Promise<string | null> {
    try {
      // pidof is available on most Android devices
      const pid = await this.exec(`-s ${deviceId} shell pidof -s ${pkg}`);
      return pid ? pid.trim() : null;
    } catch {
      return null;
    }
  }

  async listDevices(): Promise<Device[]> {
    try {
      const output = await this.exec("devices -l");
      const lines = output.split("\n").slice(1); // skip "List of devices attached"

      return lines
        .filter((line) => line.trim() !== "")
        .map((line) => {
          // Format: "emulator-5554 device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emulator64_arm64 transport_id:1"
          const parts = line.split(/\s+/);
          const id = parts[0];
          const type = parts[1] as Device["type"];

          const modelPart = parts.find((p) => p.startsWith("model:"))?.split(":")[1] || "Unknown";
          const productPart = parts.find((p) => p.startsWith("product:"))?.split(":")[1] || "Unknown";
          const transportPart = parts.find((p) => p.startsWith("transport_id:"))?.split(":")[1] || "0";

          return {
            id,
            type,
            model: modelPart,
            product: productPart,
            transportId: transportPart,
          };
        });
    } catch (error) {
      console.error("Failed to list devices", error);
      return [];
    }
  }

  async spawnLogcat(deviceId: string): Promise<ChildProcess> {
    const adb = await this.getAdb();
    return spawn(adb, ["-s", deviceId, "logcat", "-v", "threadtime"]);
  }

  async connectWireless(ip: string, port: string = "5555"): Promise<AdbResult> {
    try {
      const output = await this.exec(`connect ${ip}:${port}`);
      if (output.includes("connected to")) {
        return { success: true, message: `Connected to ${ip}:${port}` };
      }
      return { success: false, message: output };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : String(e) };
    }
  }

  async restartServer(): Promise<AdbResult> {
    try {
      await this.exec("kill-server");
      await this.exec("start-server");
      return { success: true, message: "ADB Server restarted successfully" };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : String(e) };
    }
  }
  async toggleWifi(deviceId: string, enable: boolean) {
    return await this.exec(`-s ${deviceId} shell svc wifi ${enable ? "enable" : "disable"}`);
  }

  async toggleMobileData(deviceId: string, enable: boolean) {
    return await this.exec(`-s ${deviceId} shell svc data ${enable ? "enable" : "disable"}`);
  }

  async toggleAirplaneMode(deviceId: string, enable: boolean) {
    // Airplane mode requires two steps: setting the global setting and broadcasting the intent
    await this.exec(`-s ${deviceId} shell settings put global airplane_mode_on ${enable ? "1" : "0"}`);
    return await this.exec(
      `-s ${deviceId} shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state ${enable}`,
    );
  }

  async toggleDarkMode(deviceId: string, enable: boolean) {
    return await this.exec(`-s ${deviceId} shell cmd uimode night ${enable ? "yes" : "no"}`);
  }

  async toggleLayoutBounds(deviceId: string, enable: boolean) {
    // Requires System Properties debug.layout=true/false and then poking the system properties
    await this.exec(`-s ${deviceId} shell setprop debug.layout ${enable ? "true" : "false"}`);
    return await this.exec(`-s ${deviceId} shell service call activity 1599295570`); // Force layout update (SYSPROPS_TRANSACTION)
  }

  async inputText(deviceId: string, text: string) {
    // Escape only characters that are special inside double quotes in shell: \ " ` $
    // AND replace spaces with %s for Android input command.
    // Note: Emojis and non-ASCII characters are generally not supported by 'input text'.
    const escaped = text
      .replace(/\\/g, "\\\\") // Must be first
      .replace(/"/g, '\\"')
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$")
      .replace(/ /g, "%s");

    try {
      return await this.exec(`-s ${deviceId} shell input text "${escaped}"`);
    } catch (e: unknown) {
      // If valid command failed, it's likely due to unsupported characters (Emojis etc)
      // eslint-disable-next-line no-control-regex
      if (/[^\x00-\x7F]/.test(text)) {
        throw new Error("Emojis and non-ASCII characters are not supported via ADB Input.");
      }
      throw e;
    }
  }
  async listAVDs(): Promise<string[]> {
    try {
      await this.exec(`-s emulator-5554 shell echo "ignore" && $HOME/Library/Android/sdk/emulator/emulator -list-avds`);
      // Fallback to searching basic paths if command above fails or weirdness.
      // Actually, 'emulator' might not be in path for exec, we need full path usually.
      // But for now let's hope it's in path or we use the specific path.
      // Better: Use checkAdb-like logic to find emulator binary?
      // For simplify, start with assuming 'emulator' is in path or standard location.
      const res = await this.exec(`$HOME/Library/Android/sdk/emulator/emulator -list-avds`);
      return res.split("\n").filter((l) => l.trim().length > 0);
    } catch {
      // Try just 'emulator'
      try {
        const res = await this.exec(`emulator -list-avds`);
        return res.split("\n").filter((l) => l.trim().length > 0);
      } catch {
        return [];
      }
    }
  }

  async launchAVD(avdName: string) {
    // -dns-server 8.8.8.8 ensures internet often works better
    // Spawn detached process ideally, but here we just run it.
    // Needs nohup or similar to keep running after command returns?
    // Raycast might kill it. We'll use a detached spawn ideally, but exec waits.
    // 'screen' or 'nohup' might be needed.
    // Actually best to use open -a Terminal or similar?
    // Let's try simple backgrounding `&`
    return await this.exec(`$HOME/Library/Android/sdk/emulator/emulator @${avdName} &`);
  }

  async killEmulator(deviceId: string) {
    return await this.exec(`-s ${deviceId} emu kill`);
  }

  // --- Permissions ---
  async getPermissions(deviceId: string, pkg: string): Promise<{ name: string; granted: boolean }[]> {
    const output = await this.exec(`-s ${deviceId} shell dumpsys package ${pkg}`);
    // Basic parsing of "runtime permissions:" section
    const lines = output.split("\n");
    const permissions: { name: string; granted: boolean }[] = [];
    let inPermissions = false;

    for (const line of lines) {
      if (line.includes("runtime permissions:")) {
        inPermissions = true;
        continue;
      }
      if (inPermissions) {
        if (line.trim() === "" || !line.includes(":")) break; // End of section
        const parts = line.split(":");
        const name = parts[0].trim();
        const granted = parts[1].includes("true");
        permissions.push({ name, granted });
      }
    }
    return permissions;
  }

  async grantPermission(deviceId: string, pkg: string, permission: string) {
    return await this.exec(`-s ${deviceId} shell pm grant ${pkg} ${permission}`);
  }

  async revokePermission(deviceId: string, pkg: string, permission: string) {
    return await this.exec(`-s ${deviceId} shell pm revoke ${pkg} ${permission}`);
  }

  // --- Proxy ---
  async setProxy(deviceId: string, host: string, port: string) {
    return await this.exec(`-s ${deviceId} shell settings put global http_proxy ${host}:${port}`);
  }

  async clearProxy(deviceId: string) {
    return await this.exec(`-s ${deviceId} shell settings put global http_proxy :0`);
  }

  // --- Window Manager ---
  async setSize(deviceId: string, size: string) {
    return await this.exec(`-s ${deviceId} shell wm size ${size}`);
  }

  async setDensity(deviceId: string, density: string) {
    return await this.exec(`-s ${deviceId} shell wm density ${density}`);
  }

  async resetDisplay(deviceId: string) {
    await this.exec(`-s ${deviceId} shell wm size reset`);
    await this.exec(`-s ${deviceId} shell wm density reset`);
  }

  // --- Input ---
  async sendKeyEvent(deviceId: string, keycode: string) {
    return await this.exec(`-s ${deviceId} shell input keyevent ${keycode}`);
  }
  // --- Wireless ---
  async tcpip(deviceId: string, port: number = 5555) {
    return await this.exec(`-s ${deviceId} tcpip ${port}`);
  }

  async connect(ip: string, port: number = 5555) {
    return await this.exec(`connect ${ip}:${port}`);
  }

  // --- Scrcpy ---
  async mirrorScreen(deviceId: string) {
    // Try to find scrcpy
    try {
      // We use 'scrcpy -s <id>'
      // We need to run this so it persists.
      // Using nohup & to detach might work best in this environment.
      // But we need the path.
      // Assume it's in path or brew.
      const cmd = `scrcpy -s ${deviceId} > /dev/null 2>&1 &`;
      return await this.exec(cmd);
    } catch {
      throw new Error("Could not start scrcpy. Is it installed? (brew install scrcpy)");
    }
  }

  // --- Firebase ---
  async enableFirebaseDebug(deviceId: string, pkg: string) {
    await this.exec(`-s ${deviceId} shell setprop debug.firebase.analytics.app ${pkg}`);
  }

  async disableFirebaseDebug(deviceId: string) {
    await this.exec(`-s ${deviceId} shell setprop debug.firebase.analytics.app .none.`);
  }
}

export const adb = new AdbService();
