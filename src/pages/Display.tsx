import { useState, useCallback, useMemo } from "react";
import { StatusIndicator } from "@/components/display/StatusIndicator";
import { WeatherWidget } from "@/components/display/WeatherWidget";
import { Clock } from "@/components/display/Clock";
import { NewsFeed } from "@/components/display/NewsFeed";
import { MediaCarousel } from "@/components/display/MediaCarousel";
import { DriverLogin } from "@/components/display/DriverLogin";
import { useFirestore } from "@/hooks/useFirestore";
import { useDriverAuth } from "@/hooks/useDriverAuth";
import { useWeather } from "@/hooks/useWeather";
import { useNews } from "@/hooks/useNews";
import { detectTV } from "@/lib/tvDetection";

const Display = () => {
  const tvCaps = useMemo(function () { return detectTV(); }, []);
  const { mediaItems, settings, syncStatus } = useFirestore();
  const { currentDriver, loginError, login, logout } = useDriverAuth();

  const weatherList = useWeather(settings.cities?.length ? settings.cities : [settings.city], settings.weatherApiKey);
  const news = useNews(settings.newsApiKey);

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
      <header className="flex items-center justify-between border-b border-border" style={{ height: "60px", flexShrink: 0, padding: "0 1.5vw" }}>
        <div className="flex items-center gap-[1vw]">
          <h1 className="font-display font-bold text-[clamp(0.75rem,1.2vw,1.5rem)] tracking-tight whitespace-nowrap">
            A<sup className="text-neon text-[0.6em]">3</sup> Marketing Display
          </h1>
          <StatusIndicator status={syncStatus} />
        </div>
        <div className="flex items-center gap-[0.8vw]">
          <WeatherWidget weatherList={weatherList} />
          <Clock />
          <button
            onClick={() => { setLogoutPrompt(true); setLogoutPassword(""); }}
            className="text-muted-foreground/30 hover:text-muted-foreground text-[clamp(0.7rem,1vw,1.2rem)] transition-colors"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </header>

      <main className="flex w-screen overflow-hidden" style={{ height: "calc(100vh - 60px)", minHeight: 0 }}>
        <div
          style={{ width: "calc(100vw - 280px)", height: "calc(100vh - 60px)", minHeight: 0, minWidth: 0, flexShrink: 0 }}
        >
          <MediaCarousel items={filteredMedia} tvCapabilities={tvCaps} />
        </div>

        <div
          className="flex flex-col overflow-hidden"
          style={{ width: "280px", height: "calc(100vh - 60px)", flexShrink: 0, padding: "1vw", paddingLeft: 0 }}
        >
          <div className="flex items-center gap-[0.4vw] mb-[0.8vh]">
            <span className="w-[0.4vw] h-[0.4vw] min-w-[6px] min-h-[6px] rounded-full bg-neon animate-pulse-dot" />
            <span className="text-[clamp(0.6rem,0.7vw,0.85rem)] font-display font-semibold text-muted-foreground tracking-wide uppercase">
              Notícias
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <NewsFeed news={news} />
          </div>
        </div>
      </main>

      {/* Logout modal */}
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
