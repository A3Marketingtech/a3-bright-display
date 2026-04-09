import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { MediaItem, AppSettings, SyncStatus } from "@/lib/types";

const DEFAULT_SETTINGS: AppSettings = {
  city: "São Paulo",
  cities: ["São Paulo"],
  weatherApiKey: "",
  newsApiKey: "",
  driveFolderId: "1WqYCtbsj2UPmb8Tlkpe0ubkxwDtgN8wf",
  password: "1234",
};

export function useFirestore() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("online");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    var mediaReady = false;
    var settingsReady = false;

    function checkReady() {
      if (mediaReady && settingsReady) setReady(true);
    }

    // Timeout: if Firestore hasn't responded in 15s, mark ready anyway
    var timeout = setTimeout(function () {
      if (!ready) {
        console.warn('[A3] Firestore snapshot timeout, proceeding with defaults');
        setReady(true);
        setSyncStatus("error");
      }
    }, 15000);

    var unsubMedia = onSnapshot(
      collection(db, "media"),
      function (snapshot) {
        var items: MediaItem[] = [];
        snapshot.forEach(function (d) { items.push({ id: d.id, ...d.data() } as MediaItem); });
        items.sort(function (a, b) { return a.order - b.order; });
        setMediaItems(items);
        setSyncStatus("online");
        mediaReady = true;
        checkReady();
      },
      function (err) {
        console.error('[A3] Firestore media error:', err.message);
        setSyncStatus("error");
        mediaReady = true;
        checkReady();
      }
    );

    var unsubSettings = onSnapshot(
      doc(db, "config", "settings"),
      function (snapshot) {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as AppSettings);
        }
        setSyncStatus("online");
        settingsReady = true;
        checkReady();
      },
      function (err) {
        console.error('[A3] Firestore settings error:', err.message);
        setSyncStatus("error");
        settingsReady = true;
        checkReady();
      }
    );

    return function () {
      clearTimeout(timeout);
      unsubMedia();
      unsubSettings();
    };
  }, []);

  const addMedia = useCallback(async (item: Omit<MediaItem, "id" | "order">) => {
    setSyncStatus("saving");
    var id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    await setDoc(doc(db, "media", id), { ...item, order: mediaItems.length });
  }, [mediaItems.length]);

  const removeMedia = useCallback(async (id: string) => {
    setSyncStatus("saving");
    await deleteDoc(doc(db, "media", id));
  }, []);

  const reorderMedia = useCallback(async (items: MediaItem[]) => {
    setSyncStatus("saving");
    var batch = writeBatch(db);
    items.forEach(function (item, i) {
      batch.update(doc(db, "media", item.id), { order: i });
    });
    await batch.commit();
  }, []);

  const updateMediaDuration = useCallback(async (id: string, duration: number) => {
    setSyncStatus("saving");
    await updateDoc(doc(db, "media", id), { duration });
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSyncStatus("saving");
    await setDoc(doc(db, "config", "settings"), newSettings);
  }, []);

  return {
    mediaItems,
    settings,
    syncStatus,
    ready,
    addMedia,
    removeMedia,
    reorderMedia,
    updateMediaDuration,
    saveSettings,
  };
}
