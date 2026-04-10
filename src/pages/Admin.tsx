import { useState, useCallback } from "react";
import { ManagementPanel } from "@/components/management/ManagementPanel";
import { useFirestore } from "@/hooks/useFirestore";
import a3Logo from "@/assets/a3-logo.png";

const Admin = () => {
  const {
    mediaItems, settings, syncStatus,
    addMedia, removeMedia, reorderMedia, updateMediaDuration, saveSettings,
  } = useFirestore();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const handleSubmit = useCallback(() => {
    if (passwordInput === settings.password) {
      setAuthenticated(true);
      setPasswordInput("");
    }
  }, [passwordInput, settings.password]);

  if (!authenticated) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-sm px-6">
          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-2">
              <img src={a3Logo} alt="A³ Marketing" className="h-16 w-auto object-contain mx-auto" />
            </h1>
            <p className="text-xs text-muted-foreground font-display uppercase tracking-widest">
              Painel Administrativo
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Senha do painel"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!passwordInput}
              className="w-full bg-neon text-primary-foreground font-display font-bold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <ManagementPanel
        open={true}
        onClose={() => setAuthenticated(false)}
        mediaItems={mediaItems}
        settings={settings}
        syncStatus={syncStatus}
        onAddMedia={addMedia}
        onRemoveMedia={removeMedia}
        onReorderMedia={reorderMedia}
        onUpdateDuration={updateMediaDuration}
        onSaveSettings={saveSettings}
      />
    </div>
  );
};

export default Admin;
