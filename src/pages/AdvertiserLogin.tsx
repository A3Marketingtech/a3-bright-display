import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import a3Logo from "@/assets/a3-logo.png";
import type { Advertiser } from "@/lib/types";

export default function AdvertiserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);

    try {
      // Fetch all advertisers and match email case-insensitively
      const snap = await getDocs(collection(db, "advertisers"));
      const match = snap.docs.find(
        (d) => (d.data().email || "").toLowerCase().trim() === email.trim().toLowerCase()
      );

      if (!match) {
        setError("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      const adv = { id: match.id, ...match.data() } as Advertiser;

      if (adv.password !== password.trim()) {
        setError("Email ou senha incorretos");
        setLoading(false);
        return;
      }

      // Store advertiser session
      sessionStorage.setItem("advertiser", JSON.stringify(adv));
      navigate("/advertiser/dashboard");
    } catch {
      setError("Erro de conexão — tente novamente");
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={a3Logo} alt="A³ Marketing" className="h-10 w-auto" />
        </div>

        <h1 className="text-center text-xl font-display font-bold text-foreground">
          ADVERTISER PORTAL
        </h1>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
            autoFocus
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-sm font-body focus:outline-none focus:border-neon/50 transition-colors"
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-neon text-primary-foreground font-display font-semibold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Conectando..." : "Entrar"}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/40">
          Powered by A³ Marketing
        </p>
      </div>
    </div>
  );
}
