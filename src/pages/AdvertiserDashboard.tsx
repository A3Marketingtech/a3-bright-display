import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import a3Logo from "@/assets/a3-logo.png";
import type { Advertiser, MediaItem } from "@/lib/types";
import { I18nProvider, useI18n } from "@/lib/i18n";

interface Impression {
  mediaId: string;
  mediaName: string;
  advertiserId: string;
  driverId: string;
  driverName: string;
  duration: number;
  startTime: Timestamp;
  endTime: Timestamp;
  sessionId: string;
}

function DashboardContent() {
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useI18n();

  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [impressions, setImpressions] = useState<Impression[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");

  // Load advertiser from session
  useEffect(() => {
    const stored = sessionStorage.getItem("advertiser");
    if (!stored) {
      navigate("/advertiser");
      return;
    }
    setAdvertiser(JSON.parse(stored));
  }, [navigate]);

  // Subscribe to impressions for this advertiser
  useEffect(() => {
    if (!advertiser) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, "impressions"),
      where("advertiserId", "==", advertiser.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Impression[] = [];
      snap.forEach((d) => list.push(d.data() as Impression));
      setImpressions(list);
    });
    return unsub;
  }, [advertiser]);

  // Subscribe to media for this advertiser
  useEffect(() => {
    if (!advertiser) return;
    const q = query(
      collection(db, "media"),
      where("advertiserId", "==", advertiser.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: MediaItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MediaItem));
      setMediaItems(list);
    });
    return unsub;
  }, [advertiser]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("advertiser");
    navigate("/advertiser");
  }, [navigate]);

  // Filter impressions by period
  const filteredImpressions = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (period === "today") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "7days") {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
    }

    return impressions.filter((imp) => {
      const date = imp.startTime?.toDate ? imp.startTime.toDate() : new Date();
      return date >= cutoff;
    });
  }, [impressions, period]);

  // Today's impressions
  const todayImpressions = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return impressions.filter((imp) => {
      const date = imp.startTime?.toDate ? imp.startTime.toDate() : new Date();
      return date >= todayStart;
    });
  }, [impressions]);

  // Group impressions by day for chart
  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredImpressions.forEach((imp) => {
      const date = imp.startTime?.toDate ? imp.startTime.toDate() : new Date();
      const key = date.toISOString().split("T")[0];
      days[key] = (days[key] || 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filteredImpressions]);

  // Per-media impression counts
  const mediaImpressionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    impressions.forEach((imp) => {
      counts[imp.mediaId] = (counts[imp.mediaId] || 0) + 1;
    });
    return counts;
  }, [impressions]);

  // Active sessions (recent impressions within 2 minutes)
  const activeSessions = useMemo(() => {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
    const sessionMap = new Map<string, Impression>();
    impressions.forEach((imp) => {
      const date = imp.endTime?.toDate ? imp.endTime.toDate() : new Date();
      if (date >= twoMinAgo) {
        const existing = sessionMap.get(imp.sessionId);
        if (!existing || (imp.endTime?.toDate?.() || 0) > (existing.endTime?.toDate?.() || 0)) {
          sessionMap.set(imp.sessionId, imp);
        }
      }
    });
    return Array.from(sessionMap.values());
  }, [impressions]);

  const isContractActive = advertiser
    ? new Date(advertiser.contractEnd) >= new Date() || advertiser.autoRenew
    : false;

  // Max for chart bar scaling
  const maxDaily = Math.max(1, ...dailyData.map((d) => d.count));

  if (!advertiser) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/30 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={a3Logo} alt="A³" className="h-7 w-auto" />
            <span className="text-sm font-display font-semibold text-muted-foreground hidden sm:inline">
              {t("dash.title")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="text-xs font-display font-bold px-2 py-1 rounded border border-border hover:border-neon/50 transition-colors text-muted-foreground"
            >
              {lang === "pt" ? "EN" : "PT"}
            </button>
            <span className="text-sm font-body text-muted-foreground hidden sm:inline">
              {advertiser.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-display px-3 py-1.5 rounded-lg border border-border hover:border-destructive/50 hover:text-destructive transition-colors text-muted-foreground"
            >
              {t("dash.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Welcome */}
        <h2 className="text-lg font-display font-bold">
          {t("dash.welcome")}, {advertiser.name}
        </h2>

        {/* SECTION 1 — Real-Time Status */}
        <section className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
          <h3 className="text-sm font-display font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon" />
            </span>
            {t("rt.title")}
          </h3>

          {activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("rt.noVehicles")}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {activeSessions.map((session, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-background/50 p-3 border border-border/50">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-neon" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-display font-semibold truncate">
                      {t("rt.driver")}: {session.driverName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t("rt.showing")}: {session.mediaName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t("rt.activeVehicles")}: <span className="text-neon font-semibold">{activeSessions.length}</span>
          </p>
        </section>

        {/* SECTION 2 — Daily Metrics */}
        <section className="rounded-xl border border-border bg-secondary/30 p-4">
          <h3 className="text-sm font-display font-semibold mb-3">{t("dm.title")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label={t("dm.impressions")} value={todayImpressions.length} />
            <MetricCard label={t("dm.couponsGen")} value={0} />
            <MetricCard label={t("dm.couponsVal")} value={0} />
            <MetricCard
              label={t("dm.conversion")}
              value={todayImpressions.length > 0 ? "0%" : "—"}
            />
          </div>
        </section>

        {/* SECTION 3 — History */}
        <section className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-display font-semibold">{t("hist.title")}</h3>
            <div className="flex gap-1">
              {(["today", "7days", "30days"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-display px-2.5 py-1 rounded-md transition-colors ${
                    period === p
                      ? "bg-neon text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {t(`hist.${p}` as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Simple bar chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t("hist.impressions")}</p>
            {dailyData.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">—</p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {dailyData.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t bg-neon/80 min-h-[2px] transition-all"
                      style={{ height: `${(d.count / maxDaily) * 100}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground mt-1">{d.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t("dm.impressions")}: <span className="text-foreground font-semibold">{filteredImpressions.length}</span>
          </p>
        </section>

        {/* SECTION 4 — Active Media */}
        <section className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
          <h3 className="text-sm font-display font-semibold">{t("media.title")}</h3>

          {mediaItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("media.noMedia")}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {mediaItems.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg bg-background/50 p-3 border border-border/50">
                  {/* Thumbnail */}
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-16 w-24 rounded object-cover flex-shrink-0 bg-black"
                    />
                  ) : (
                    <div className="h-16 w-24 rounded flex items-center justify-center bg-black/60 flex-shrink-0">
                      <span className="text-lg">▶</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mediaImpressionCounts[item.id] || 0} {t("media.impressions")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isContractActive
                            ? "bg-neon/15 text-neon"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {isContractActive ? t("media.active") : t("media.expired")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t("media.until")} {advertiser.contractEnd}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-background/50 border border-border/50 p-3 text-center">
      <p className="text-lg sm:text-2xl font-display font-bold text-neon">{value}</p>
      <p className="text-[11px] text-muted-foreground font-body mt-0.5">{label}</p>
    </div>
  );
}

export default function AdvertiserDashboard() {
  return (
    <I18nProvider>
      <DashboardContent />
    </I18nProvider>
  );
}
