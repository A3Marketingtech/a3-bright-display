import { useState, useCallback } from "react";
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

const Display = () => {
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
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-base tracking-tight">
            A<sup className="text-neon text-xs">3</sup> Marketing Display
          </h1>
          <StatusIndicator status={syncStatus} />
        </div>
        <div className="flex items-center gap-3">
          <WeatherWidget weatherList={weatherList} />
          <Clock />
          <button
            onClick={() => { setLogoutPrompt(true); setLogoutPassword(""); }}
            className="text-muted-foreground/30 hover:text-muted-foreground text-xs transition-colors"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </header>

      <main className="flex-1 flex min-h-0 p-4 gap-4">
        <div className="flex-1 min-w-0">
          <MediaCarousel items={filteredMedia} />
        </div>
        <div className="w-72 flex-shrink-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse-dot" />
            <span className="text-xs font-display font-semibold text-muted-foreground tracking-wide uppercase">
              Notícias
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <NewsFeed news={news} />
          </div>
        </div>
      </main>

      {logoutPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setLogoutPrompt(false)}
        >
          <div className="bg-card border border-border rounded-2xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-sm mb-2">Logout do Motorista</h3>
            <p className="text-xs text-muted-foreground mb-4">Digite a senha do painel para confirmar</p>
            <input
              type="password"
              value={logoutPassword}
              onChange={(e) => setLogoutPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogoutSubmit()}
              placeholder="Senha do painel"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors mb-4"
              autoFocus
            />
            <button
              onClick={handleLogoutSubmit}
              className="w-full bg-neon text-primary-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
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
