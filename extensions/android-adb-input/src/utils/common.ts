export const parseDeviceList = (stdout: string): import("../types").Device[] => {
  const lines = stdout.split("\n").filter((line) => line.trim() !== "");
  // Skip the first line "List of devices attached"
  const deviceLines = lines.slice(1);

  return deviceLines
    .map((line) => {
      // Example line: "emulator-5554	device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emulator64_arm64 transport_id:1"
      const parts = line.split(/\s+/);
      const id = parts[0];
      const state = parts[1];

      if (!id || !state) return null;

      const modelPart = parts.find((p) => p.startsWith("model:"));
      const productPart = parts.find((p) => p.startsWith("product:"));
      const devicePart = parts.find((p) => p.startsWith("device:"));
      const transportIdPart = parts.find((p) => p.startsWith("transport_id:"));

      return {
        id,
        type: (state as import("../types").Device["type"]) || "device",
        state: state || "unknown",
        model: modelPart ? modelPart.split(":")[1] : "Unknown Model",
        product: productPart ? productPart.split(":")[1] : "",
        device: devicePart ? devicePart.split(":")[1] : "",
        transportId: transportIdPart ? transportIdPart.split(":")[1] : "",
        isWifi: id.includes(":") || id.startsWith("192.168"), // Simple heuristic for now
      };
    })
    .filter((d): d is import("../types").Device => d !== null);
};
