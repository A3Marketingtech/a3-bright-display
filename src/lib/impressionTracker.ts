import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface ImpressionRecord {
  mediaId: string;
  mediaName: string;
  advertiserId: string;
  advertiserName: string;
  driverId: string;
  driverName: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
}

const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let buffer: ImpressionRecord[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let currentSessionId: string | null = null;

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function flushBuffer(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = [...buffer];
  buffer = [];

  const col = collection(db, "impressions");
  const now = Timestamp.now();

  for (const record of batch) {
    try {
      await addDoc(col, {
        mediaId: record.mediaId,
        mediaName: record.mediaName,
        advertiserId: record.advertiserId,
        advertiserName: record.advertiserName,
        driverId: record.driverId,
        driverName: record.driverName,
        sessionId: record.sessionId,
        startTime: Timestamp.fromDate(record.startTime),
        endTime: Timestamp.fromDate(record.endTime),
        duration: record.duration,
        syncedAt: now,
      });
    } catch (err) {
      console.error("[A3] Failed to write impression:", err);
      // Re-add to buffer for next flush
      buffer.push(record);
    }
  }
}

export function startTracking(): void {
  if (flushTimer) return;
  currentSessionId = generateSessionId();
  flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL_MS);
  console.log("[A3] Impression tracking started, session:", currentSessionId);
}

export function stopTracking(): void {
  // Flush remaining before stopping
  flushBuffer();
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  currentSessionId = null;
}

export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  return currentSessionId;
}

export function recordImpression(data: Omit<ImpressionRecord, "sessionId">): void {
  buffer.push({ ...data, sessionId: getSessionId() });
}

/** Write an event instantly (login, logout, coupon) */
export async function recordInstantEvent(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await addDoc(collection(db, "events"), {
      eventType,
      sessionId: getSessionId(),
      timestamp: Timestamp.now(),
      ...data,
    });
  } catch (err) {
    console.error("[A3] Failed to write instant event:", err);
  }
}
