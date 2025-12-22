export interface Device {
  id: string;
  type: "emulator" | "device" | "offline" | "unauthorized";
  model: string;
  product: string;
  transportId: string;
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
