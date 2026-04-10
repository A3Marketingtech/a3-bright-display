import { useState } from "react";
import a3Logo from "@/assets/a3-logo.png";

interface DriverLoginProps {
  onLogin: (login: string, password: string) => Promise<boolean>;
  error: string;
}

export function DriverLogin({ onLogin, error }: DriverLoginProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!login || !password) return;
    setLoading(true);
    await onLogin(login, password);
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl tracking-tight mb-2">
            <img src={a3Logo} alt="A³ Marketing" className="h-32 w-auto object-contain mx-auto" />
          </h1>
          <p className="text-xs text-muted-foreground font-display uppercase tracking-widest">
            TARGETBOARD
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Login do motorista"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
            autoFocus
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
          />

          {error && (
            <p className="text-xs text-destructive font-body text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !login || !password}
            className="w-full bg-neon text-primary-foreground font-display font-bold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
