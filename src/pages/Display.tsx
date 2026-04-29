import { useState, useCallback, useMemo, useEffect } from "react";
import vanIcon from "@/assets/van-icon.png";
import a3Logo from "@/assets/a3-logo.png";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { Advertiser, MediaItem } from "@/lib/types";
import { startTracking, stopTracking, recordImpression, recordInstantEvent } from "@/lib/impressionTracker";
import type { ImpressionEvent } from "@/components/display/MediaCarousel";

import { WeatherWidget } from "@/components/display/WeatherWidget";
import { Clock } from "@/components/display/Clock";
import { NewsFeed } from "@/components/display/NewsFeed";
import { MediaCarousel } from "@/components/display/MediaCarousel";
import { DriverLogin } from "@/components/display/DriverLogin";
import { DriverBadge } from "@/components/display/DriverBadge";
import { ChangePasswordModal } from "@/components/display/ChangePasswordModal";
import { useFirestore } from "@/hooks/useFirestore";
import { useDriverAuth } from "@/hooks/useDriverAuth";
import { useWeather } from "@/hooks/useWeather";
import { useNews } from "@/hooks/useNews";
import { detectTV } from "@/lib/tvDetection";

function useTimeAgoLabel(date: Date | null): string {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!date) return;
    const update = () => {
      const mins = Math.floor((Date.now() - date.getTime()) / 60000);
      if (mins < 1) setLabel("Atualizado agora");
      else if (mins < 60) setLabel(`Atualizado há ${mins}min`);
      else setLabel(`Atualizado há ${Math.floor(mins / 60)}h`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [date]);
  return label;
}

const Display = () => {
  const tvCaps = useMemo(function () { return detectTV(); }, []);
  const { mediaItems, settings, syncStatus } = useFirestore();
  const { currentDriver, loginError, login, logout, updateDriver } = useDriverAuth();

  const weatherList = useWeather(settings.cities?.length ? settings.cities : [settings.city], settings.weatherApiKey);
  const { news, error: newsError, lastUpdated } = useNews();
  const timeAgoLabel = useTimeAgoLabel(lastUpdated);

  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "advertisers"), (snap) => {
      const list: Advertiser[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Advertiser));
      setAdvertisers(list);
    });
    return unsub;
  }, []);

  // Start/stop tracking on login/logout
  useEffect(() => {
    if (currentDriver) {
      startTracking();
      recordInstantEvent("driver_login", {
        driverId: currentDriver.id,
        driverName: currentDriver.name,
      });
    }
    return () => {
      if (currentDriver) {
        recordInstantEvent("driver_logout", {
          driverId: currentDriver.id,
          driverName: currentDriver.name,
        });
        stopTracking();
      }
    };
  }, [currentDriver]);

  const handleLogoutSubmit = useCallback(() => {
    if (currentDriver && logoutPassword === currentDriver.password) {
      recordInstantEvent("driver_logout", {
        driverId: currentDriver.id,
        driverName: currentDriver.name,
      });
      stopTracking();
      setLogoutPrompt(false);
      setLogoutPassword("");
      setShowChangePassword(false);
      logout();
    }
  }, [logoutPassword, currentDriver, logout]);

  // Handle impression from carousel
  const handleImpression = useCallback((event: ImpressionEvent) => {
    const advertiser = advertisers.find((a) => {
      const media = mediaItems.find((m) => m.id === event.mediaId);
      return media?.advertiserId && a.id === media.advertiserId;
    });
    recordImpression({
      mediaId: event.mediaId,
      mediaName: event.mediaName,
      advertiserId: advertiser?.id || "",
      advertiserName: advertiser?.name || "",
      driverId: currentDriver?.id || "",
      driverName: currentDriver?.name || "",
      startTime: event.startTime,
      endTime: event.endTime,
      duration: event.duration,
    });
  }, [advertisers, mediaItems, currentDriver]);

  // Re-evaluate contract expiry once per day at 15:00 local time.
  // Initial evaluation happens on mount; subsequent evaluations are scheduled
  // for the next 3PM (today if not yet past, otherwise tomorrow).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(15, 0, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
      }
      const delay = next.getTime() - now.getTime();
      timeoutId = setTimeout(() => {
        setNowTick(Date.now());
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  // Filter out media from expired (non-auto-renew) advertisers
  const expiredAdvertiserIds = useMemo(() => {
    const now = new Date(nowTick);
    return new Set(
      advertisers
        .filter((a) => {
          if (a.autoRenew) return false;
          if (!a.contractEnd) return false;
          const end = new Date(a.contractEnd);
          if (isNaN(end.getTime())) return false;
          // End-of-day: contract is valid through the entire end date
          end.setHours(23, 59, 59, 999);
          return end.getTime() < now.getTime();
        })
        .map((a) => a.id)
    );
  }, [advertisers, nowTick]);

  const driverCategoryIds = currentDriver
    ? (currentDriver.categoryIds && currentDriver.categoryIds.length > 0
        ? currentDriver.categoryIds
        : currentDriver.categoryId
        ? [currentDriver.categoryId]
        : [])
    : [];
  const filteredMedia = currentDriver
    ? mediaItems
        .filter((item) => (item.categories || []).some((c) => driverCategoryIds.includes(c)))
        .filter((item) => !item.advertiserId || !expiredAdvertiserIds.has(item.advertiserId))
    : [];

  if (!currentDriver) {
    return <DriverLogin onLogin={login} error={loginError} />;
  }

  

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* ── 1. TOP BAR (~8%) ── */}
      <header
        className="flex items-center justify-between border-b border-border/30 px-[2vw]"
        style={{ height: "8vh", flexShrink: 0 }}
      >
        {/* Left: weather */}
        <div className="flex items-center flex-1 min-w-0">
          {weatherList.length > 0 && (
            <WeatherWidget weatherList={weatherList} />
          )}
        </div>

        {/* Center: clock */}
        <div className="flex items-center justify-center flex-shrink-0">
          <Clock />
        </div>

        {/* Right: driver status + logout */}
        <div className="flex items-center justify-end gap-[1.5vw] flex-1 min-w-0">
          {currentDriver && (
            <DriverBadge name={currentDriver.name} />
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className="text-[clamp(0.6rem,0.8vw,1rem)] rounded-lg px-2 py-1 transition-colors"
            style={{ color: "#4CAF50", backgroundColor: "rgba(76,175,80,0.15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(76,175,80,0.30)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(76,175,80,0.15)")}
            title="Alterar Senha"
          >
            🔑
          </button>
          <button
            onClick={() => { setLogoutPrompt(true); setLogoutPassword(""); }}
            className="text-[clamp(0.7rem,1vw,1.2rem)] rounded-lg px-2 py-1 transition-colors"
            style={{ color: "#4CAF50", backgroundColor: "rgba(76,175,80,0.15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(76,175,80,0.30)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(76,175,80,0.15)")}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </header>

      {/* ── 2. WELCOME MESSAGE (~6%) ── */}
      <div
        className="flex items-center justify-center gap-[1vw]"
        style={{ height: "6vh", flexShrink: 0 }}
      >
        <p className="text-[clamp(1.2rem,2vw,2.5rem)] font-display font-semibold text-foreground tracking-wide">
          Welcome — Enjoy Your Ride
        </p>
        <img
          src={currentDriver?.vehiclePhoto || vanIcon}
          alt={currentDriver?.vehiclePhoto ? "Veículo" : "van"}
          className="object-cover rounded-md"
          style={{ width: "9vh", height: "5vh" }}
        />
      </div>

      {/* ── 3. MAIN CONTENT (~78%) ── */}
      <main
        className="flex overflow-hidden"
        style={{ height: "78vh", minHeight: 0 }}
      >
        {/* Left column: Ad / Media — 79% */}
        <div
          className="relative overflow-hidden"
          style={{ width: "79%", height: "100%", minHeight: 0, minWidth: 0, flexShrink: 0 }}
        >
          <MediaCarousel
            items={filteredMedia}
            tvCapabilities={tvCaps}
            onImpressionComplete={handleImpression}
            onCurrentItemChange={setCurrentMedia}
          />
        </div>

        {/* Right column: News — 21% */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: "21%", height: "100%", flexShrink: 0, padding: "10px 8px", background: "#0f0f0f" }}
        >
          <div className="flex items-center justify-between mb-[1vh]">
            <span
              className="font-display uppercase"
              style={{ fontSize: "7px", color: "#555", letterSpacing: "1.5px" }}
            >
              Noticias Locais
            </span>
            {timeAgoLabel && (
              <span style={{ fontSize: "6px", color: "#555" }} className="font-body">
                {timeAgoLabel}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <NewsFeed news={news} emptyMessage={newsError ?? "Sem notícias disponíveis"} />
          </div>
        </div>
      </main>

      {/* ── 3b. QR STRIP (68px, full width) — only when active media has couponQRCode ── */}
      {currentMedia?.couponQRCode && (
        <div
          className="w-full flex items-center justify-between transition-opacity duration-300 relative"
          style={{
            height: "68px",
            flexShrink: 0,
            background: "linear-gradient(90deg, #050d05, #0a130a, #060e06)",
            borderTop: "1px solid rgba(123,193,66,0.15)",
            padding: "0 18px",
            opacity: 1,
          }}
        >
          {/* Decorative top line */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(123,193,66,0.25), transparent)" }}
          />

          {/* Left block: Exclusive Offers */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: "28px",
                height: "28px",
                border: "1.5px solid #7bc142",
                borderRadius: "6px",
                color: "#7bc142",
                fontWeight: 900,
                fontSize: "13px",
              }}
            >
              %
            </div>
            <div className="flex flex-col justify-center">
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#7bc142", letterSpacing: "1.5px" }}>
                EXCLUSIVE OFFERS
              </span>
              <span style={{ fontSize: "7px", fontWeight: 700, color: "#fff", marginTop: "1px" }}>
                JUST FOR YOU
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {[
                { label: "DISCOUNTS", sub: "UP TO 30% OFF" },
                { label: "LOCAL DEALS", sub: "EVERY DAY" },
                { label: "CURATED", sub: "FOR YOU" },
              ].map((tag, i, arr) => (
                <div key={tag.label} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span style={{ fontSize: "6px", color: "#7bc142", fontWeight: 700, letterSpacing: "0.5px" }}>
                      {tag.label}
                    </span>
                    <span style={{ fontSize: "6px", color: "#666" }}>{tag.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: "1px", height: "10px", background: "#222" }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center divider */}
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(180deg, transparent, rgba(123,193,66,0.3), transparent)",
            }}
          />

          {/* Right block: Scan & Save + QR */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end justify-center">
              <span style={{ fontSize: "9px", fontWeight: 900, color: "#7bc142", letterSpacing: "1.5px" }}>
                SCAN & SAVE
              </span>
              <span style={{ fontSize: "6px", color: "#bbb", marginTop: "1px" }}>
                Open camera and scan the QR code.
              </span>
            </div>
            {/* Curved arrow */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M2 6 C 8 6, 14 8, 18 14"
                stroke="#7bc142"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M14 13 L18 14 L17 10"
                stroke="#7bc142"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* QR with corner frame */}
            <div className="relative" style={{ width: "60px", height: "60px" }}>
              {/* Corner brackets */}
              {[
                { top: 0, left: 0, borderTop: "2px solid #7bc142", borderLeft: "2px solid #7bc142" },
                { top: 0, right: 0, borderTop: "2px solid #7bc142", borderRight: "2px solid #7bc142" },
                { bottom: 0, left: 0, borderBottom: "2px solid #7bc142", borderLeft: "2px solid #7bc142" },
                { bottom: 0, right: 0, borderBottom: "2px solid #7bc142", borderRight: "2px solid #7bc142" },
              ].map((s, i) => (
                <div key={i} style={{ position: "absolute", width: "11px", height: "11px", ...s }} />
              ))}
              <div
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  top: "3px",
                  left: "3px",
                  width: "54px",
                  height: "54px",
                  background: "#fff",
                  borderRadius: "5px",
                  padding: "3px",
                }}
              >
                <img
                  key={currentMedia.id}
                  src={currentMedia.couponQRCode}
                  alt="QR Code do cupom"
                  className="object-contain transition-opacity duration-300"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            {currentMedia.couponDiscount && (
              <div
                className="flex items-center justify-center"
                style={{ fontSize: "6px", fontWeight: 700, color: "#7bc142", minWidth: "40px", textAlign: "center" }}
              >
                {currentMedia.couponDiscount}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. FOOTER (~8%) ── */}
      <footer
        className="flex items-center justify-center border-t border-border/20"
        style={{ height: "8vh", flexShrink: 0 }}
      >
        <div className="flex items-center gap-[0.4vw]">
          <span className="text-[clamp(0.55rem,0.7vw,0.85rem)] text-muted-foreground/60 font-body tracking-wider">Powered by</span>
          <img src={a3Logo} alt="A³ Marketing" className="h-[3vh] w-auto object-contain" />
        </div>
      </footer>

      {/* Logout modal — unchanged */}
      {logoutPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(10,10,10,0.85)" }}
          onClick={() => setLogoutPrompt(false)}
        >
          <div className="bg-card border border-border rounded-2xl p-[2vw] w-[clamp(280px,22vw,400px)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[clamp(0.8rem,1vw,1.1rem)] mb-[0.5vh]">Logout do Motorista</h3>
            <p className="text-[clamp(0.65rem,0.75vw,0.85rem)] text-muted-foreground mb-[1.5vh]">Digite sua senha para confirmar</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogoutSubmit()}
              placeholder="Sua senha"
              className="w-full bg-secondary border border-border rounded-lg px-[1vw] py-[0.8vh] text-[clamp(0.75rem,0.85vw,1rem)] font-body focus:outline-none focus:border-neon/50 transition-colors mb-[1.5vh]"
              autoFocus
            />
            <button
              onClick={handleLogoutSubmit}
              className="w-full bg-neon text-primary-foreground font-display font-semibold py-[0.8vh] rounded-lg text-[clamp(0.75rem,0.85vw,1rem)] hover:opacity-90 transition-opacity"
            >
              Confirmar Logout
            </button>
          </div>
        </div>
      )}

      {showChangePassword && currentDriver && (
        <ChangePasswordModal
          driver={currentDriver}
          onClose={() => setShowChangePassword(false)}
          onSuccess={(updated) => {
            updateDriver(updated);
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  );
};

export default Display;
