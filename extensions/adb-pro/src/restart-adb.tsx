import { showToast, Toast } from "@raycast/api";
import { adb } from "./services/adb";

export default async function Command() {
  const toast = await showToast({ style: Toast.Style.Animated, title: "Restarting ADB Server..." });

  const result = await adb.restartServer();

  if (result.success) {
    toast.style = Toast.Style.Success;
    toast.title = "Server Restarted";
  } else {
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to Restart";
    toast.message = result.message;
  }
}
