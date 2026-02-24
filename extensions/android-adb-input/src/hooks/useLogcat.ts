import { useState, useEffect, useRef, useCallback } from "react";
import { adb } from "../services/adb";
import { Device } from "../types";
import { ChildProcess } from "child_process";

export interface LogEntry {
  id: string;
  raw: string;
  timestamp: string;
  pid: string;
  tid: string;
  level: "V" | "D" | "I" | "W" | "E" | "F";
  tag: string;
  message: string;
}

const MAX_LOGS = 200;

export function useLogcat(device: Device | null, pkg?: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const infoRef = useRef<{ process: ChildProcess | null; targetPid: string | null }>({
    process: null,
    targetPid: null,
  });

  // Clear logs when device or pkg changes
  useEffect(() => {
    setLogs([]);
    setIsLoading(true);
    setError(null);
  }, [device?.id, pkg]);

  // Poll for PID if pkg is scheduled
  useEffect(() => {
    if (!device || !pkg) {
      infoRef.current.targetPid = null;
      return;
    }

    let active = true;
    const checkPid = async () => {
      if (!active) return;
      const pid = await adb.getPid(device.id, pkg);
      if (pid) {
        infoRef.current.targetPid = pid;
      } else {
        infoRef.current.targetPid = null;
      }
    };

    // Check immediately and then every 2s to handle app restarts
    checkPid();
    const interval = setInterval(checkPid, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [device, pkg]);

  // Main Logcat Stream
  useEffect(() => {
    if (!device) return;

    let mounted = true;
    let buffer: LogEntry[] = [];
    const start = async () => {
      try {
        const child = await adb.spawnLogcat(device.id);
        infoRef.current.process = child;

        child.stdout?.on("data", (data) => {
          if (!mounted) return;
          const text = data.toString();
          const lines = text.split("\n");

          lines.forEach((line: string) => {
            if (!line.trim()) return;
            const parsed = parseLogcat(line);

            if (pkg) {
              if (!infoRef.current.targetPid) return;
              if (parsed.pid !== infoRef.current.targetPid) return;
            }

            buffer.unshift(parsed);
          });
        });

        child.stderr?.on("data", () => {
          // ignore
        });

        setIsLoading(false);
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
          setIsLoading(false);
        }
      }
    };

    start();

    // Flush buffer to state every 500ms
    const flushInterval = setInterval(() => {
      if (buffer.length > 0) {
        setLogs((prev) => {
          const next = [...buffer, ...prev];
          buffer = [];
          return next.slice(0, MAX_LOGS);
        });
      }
    }, 500);

    return () => {
      mounted = false;
      clearInterval(flushInterval);
      if (infoRef.current.process) {
        infoRef.current.process.kill();
      }
    };
  }, [device, pkg]);

  const clearLogs = useCallback(() => setLogs([]), []);
  return { logs, isLoading, error, clearLogs };
}

function parseLogcat(line: string): LogEntry {
  // Threadtime format: "MM-DD HH:MM:SS.ms ProcessID ThreadID LogLevel Tag: Message"
  const threadtimeRegex = /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([A-Z])\s+(.*?):\s+(.*)$/;
  const match = line.match(threadtimeRegex);

  if (match) {
    return {
      id: Math.random().toString(36).substring(7),
      timestamp: match[1],
      pid: match[2],
      tid: match[3],
      level: match[4] as LogEntry["level"],
      tag: match[5].trim(),
      message: match[6],
      raw: line,
    };
  }

  // Fallback
  return {
    id: Math.random().toString(36).substring(7),
    timestamp: "",
    pid: "",
    tid: "",
    level: "I",
    tag: "",
    message: line,
    raw: line,
  };
}
