import fs from "fs";
import path from "path";
import net from "net";

const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_.$]+$/;
const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$/;
const SIZE_PATTERN = /^\d+x\d+$/;
const DIGITS_PATTERN = /^\d+$/;
const INPUT_UNSAFE_PATTERN = /[;&|<>`"$\\\r\n\t]/;

function assertNonEmpty(value: string, label: string): void {
  if (!value || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
}

export function validateDeviceId(deviceId: string): string {
  assertNonEmpty(deviceId, "Device ID");
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    throw new Error(`Invalid device ID "${deviceId}".`);
  }
  return deviceId;
}

export function validatePackageName(pkg: string): string {
  assertNonEmpty(pkg, "Package name");
  if (!IDENTIFIER_PATTERN.test(pkg)) {
    throw new Error(`Invalid package name "${pkg}".`);
  }
  return pkg;
}

export function validatePermissionName(permission: string): string {
  assertNonEmpty(permission, "Permission");
  if (!IDENTIFIER_PATTERN.test(permission)) {
    throw new Error(`Invalid permission "${permission}".`);
  }
  return permission;
}

export function validateHost(host: string): string {
  const normalizedHost = host.trim();
  assertNonEmpty(normalizedHost, "Host");
  if (net.isIP(normalizedHost) || HOSTNAME_PATTERN.test(normalizedHost)) {
    return normalizedHost;
  }
  throw new Error(`Invalid host "${host}".`);
}

export function validatePortValue(port: string | number): number {
  const normalized = String(port).trim();
  if (!DIGITS_PATTERN.test(normalized)) {
    throw new Error(`Invalid port "${port}".`);
  }
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Port must be between 1 and 65535.`);
  }
  return parsed;
}

export function validateWmSize(size: string): string {
  assertNonEmpty(size, "Display size");
  if (!SIZE_PATTERN.test(size)) {
    throw new Error(`Invalid display size "${size}".`);
  }
  return size;
}

export function validateDensity(density: string): string {
  const normalized = density.trim();
  assertNonEmpty(normalized, "Density");
  if (!DIGITS_PATTERN.test(normalized)) {
    throw new Error(`Invalid density "${density}".`);
  }
  return normalized;
}

export function validateKeycode(keycode: string): string {
  const normalized = keycode.trim();
  assertNonEmpty(normalized, "Keycode");
  if (!DIGITS_PATTERN.test(normalized)) {
    throw new Error(`Invalid keycode "${keycode}".`);
  }
  return normalized;
}

export function validateApkPath(apkPath: string): string {
  assertNonEmpty(apkPath, "APK path");
  const resolvedPath = path.resolve(apkPath);
  if (!path.isAbsolute(resolvedPath)) {
    throw new Error("APK path must be absolute.");
  }
  if (path.extname(resolvedPath).toLowerCase() !== ".apk") {
    throw new Error("Selected file must have .apk extension.");
  }
  const stat = fs.statSync(resolvedPath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    throw new Error("APK file does not exist.");
  }
  return resolvedPath;
}

export function normalizeInputText(text: string): string {
  assertNonEmpty(text, "Text");
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(text)) {
    throw new Error("Emojis and non-ASCII characters are not supported via ADB Input.");
  }
  if (INPUT_UNSAFE_PATTERN.test(text)) {
    throw new Error("Text contains unsupported shell control characters.");
  }
  return text.replace(/ /g, "%s");
}
