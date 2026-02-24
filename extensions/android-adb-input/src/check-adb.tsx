import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { checkAdbPath } from "./services/environment";
import { SetupWizard } from "./components/SetupWizard";

export default function CheckAdb() {
  const [status, setStatus] = useState<"loading" | "found" | "missing">("loading");
  const [path, setPath] = useState<string>("");

  useEffect(() => {
    check();
  }, []);

  async function check() {
    setStatus("loading");
    const foundPath = await checkAdbPath();
    if (foundPath) {
      setPath(foundPath);
      setStatus("found");
    } else {
      setStatus("missing");
    }
  }

  if (status === "missing") {
    return <SetupWizard onJsonDetected={check} />;
  }

  return (
    <Detail
      markdown={`# ADB Status: Operational
      
**Located at:** \`${path}\`

Your Android Debug Bridge is correctly configured and ready to use. 
You can now use all generic ADB commands.`}
      actions={
        <ActionPanel>
          <Action title="Re-Check Status" onAction={check} />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Status" text="Active" icon={{ source: Icon.CheckCircle, tintColor: "green" }} />
          <Detail.Metadata.Label title="Path" text={path} />
        </Detail.Metadata>
      }
    />
  );
}
