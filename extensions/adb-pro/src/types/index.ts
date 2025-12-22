export interface Device {
  id: string;
  type: "emulator" | "device" | "offline" | "unauthorized"; // Known as 'state' in some contexts
  state: string;
  model: string;
  product: string;
  device: string;
  transportId: string;
  isWifi: boolean;
}

export interface AdbResult {
  success: boolean;
  message: string;
  output?: string;
}

export interface App {
  name: string;
  package: string;
  type: "system" | "user";
  version?: string;
  path?: string;
}
