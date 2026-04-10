import { useState, useCallback, useMemo, useEffect } from "react";
import vanIcon from "@/assets/van-icon.png";
import a3Logo from "@/assets/a3-logo.png";

import { WeatherWidget } from "@/components/display/WeatherWidget";
import { Clock } from "@/components/display/Clock";
import { NewsFeed } from "@/components/display/NewsFeed";
import { MediaCarousel } from "@/components/display/MediaCarousel";
import { DriverLogin } from "@/components/display/DriverLogin";
import { DriverBadge } from "@/components/display/DriverBadge";
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
  const { currentDriver, loginError, login, logout } = useDriverAuth();

  const weatherList = useWeather(settings.cities?.length ? settings.cities : [settings.city], settings.weatherApiKey);
  const { news, error: newsError, lastUpdated } = useNews();
  const timeAgoLabel = useTimeAgoLabel(lastUpdated);

  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState("");

  const handleLogoutSubmit = useCallback(() => {
    if (logoutPassword === settings.password) {
      setLogoutPrompt(false);
      setLogoutPassword("");
      logout();
    }
  }, [logoutPassword, settings.password, logout]);

  const filteredMedia = currentDriver
    ? mediaItems.filter((item) => (item.categories || []).includes(currentDriver.categoryId))
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
            onClick={() => { setLogoutPrompt(true); setLogoutPassword(""); }}
            className="text-muted-foreground/20 hover:text-muted-foreground text-[clamp(0.7rem,1vw,1.2rem)] transition-colors"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </header>

      {/* ── 2. WELCOME MESSAGE (~6%) ── */}
      <div
        className="flex items-center justify-center"
        style={{ height: "6vh", flexShrink: 0 }}
      >
        <p className="text-[clamp(1.2rem,2vw,2.5rem)] font-display font-semibold text-foreground tracking-wide">
          Welcome — Enjoy Your Ride <img src={vanIcon} alt="van" className="inline-block h-[2em] w-auto align-middle ml-[0.3em]" />
        </p>
      </div>

      {/* ── 3. MAIN CONTENT (~78%) ── */}
      <main
        className="flex overflow-hidden"
        style={{ height: "78vh", minHeight: 0 }}
      >
        {/* Left column: Ad / Media — 70% */}
        <div
          className="relative overflow-hidden"
          style={{ width: "70%", height: "100%", minHeight: 0, minWidth: 0, flexShrink: 0 }}
        >
          <MediaCarousel items={filteredMedia} tvCapabilities={tvCaps} />
        </div>

        {/* Right column: News — 30% */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: "30%", height: "100%", flexShrink: 0, padding: "1.2vh 1.2vw" }}
        >
          <div className="flex items-center justify-between mb-[1vh]">
            <div className="flex items-center gap-[0.5vw]">
              <span className="text-[clamp(0.7rem,0.85vw,1rem)]">📰</span>
              <span className="text-[clamp(0.6rem,0.75vw,0.9rem)] font-display font-semibold text-muted-foreground tracking-wide uppercase">
                Notícias Locais
              </span>
            </div>
            {timeAgoLabel && (
              <span className="text-[clamp(0.45rem,0.55vw,0.65rem)] text-muted-foreground/60 font-body">
                {timeAgoLabel}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <NewsFeed news={news} emptyMessage={newsError ?? "Sem notícias disponíveis"} />
          </div>
        </div>
      </main>

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
            <p className="text-[clamp(0.65rem,0.75vw,0.85rem)] text-muted-foreground mb-[1.5vh]">Digite a senha do painel para confirmar</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogoutSubmit()}
              placeholder="Senha do painel"
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
    </div>
  );
};

export default Display;
