import { useState, useCallback } from "react";
import { useNewsSyncStatus } from "@/hooks/useNewsSyncStatus";
import { supabase } from "@/integrations/supabase/client";

export function NewsStatusPanel() {
  const { lastFetchAt, lastStatus, lastError, todayRequestCount, cachedArticleCount, loading, refresh } =
    useNewsSyncStatus();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("sync-news", {
        method: "POST",
      });

      if (error) throw error;

      setSyncResult(
        data?.articles_synced != null
          ? `✅ ${data.articles_synced} artigos sincronizados`
          : "✅ Sincronização concluída"
      );
      await refresh();
    } catch (err) {
      setSyncResult(`❌ ${err instanceof Error ? err.message : "Erro na sincronização"}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  }, [refresh]);

  const statusColor =
    lastStatus === "success"
      ? "text-neon"
      : lastStatus === "error"
      ? "text-red-400"
      : "text-muted-foreground";

  const statusLabel =
    lastStatus === "success"
      ? "Online"
      : lastStatus === "error"
      ? "Erro / Limite"
      : "Sem dados";

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-8 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display font-semibold flex items-center gap-2">
        <span className="text-neon">📰</span> Status das Notícias
      </h3>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary border border-border rounded-lg p-3">
          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wide">Status API</p>
          <p className={`text-sm font-display font-semibold ${statusColor}`}>{statusLabel}</p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-3">
          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wide">Artigos em cache</p>
          <p className="text-sm font-display font-semibold text-foreground">{cachedArticleCount}</p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-3">
          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wide">Última atualização</p>
          <p className="text-xs font-body text-foreground">
            {lastFetchAt ? new Date(lastFetchAt).toLocaleString("pt-BR") : "—"}
          </p>
        </div>
        <div className="bg-secondary border border-border rounded-lg p-3">
          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wide">Requisições hoje</p>
          <p className="text-sm font-display font-semibold text-foreground">{todayRequestCount}</p>
        </div>
      </div>

      {/* Last error */}
      {lastStatus === "error" && lastError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-[10px] font-display text-red-400 uppercase tracking-wide mb-1">Último erro</p>
          <p className="text-xs font-body text-red-300">{lastError}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            ⚠️ Modo fallback ativo — exibindo notícias em cache
          </p>
        </div>
      )}

      {/* Manual sync */}
      <button
        onClick={handleManualSync}
        disabled={syncing}
        className="w-full bg-neon text-primary-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {syncing ? "Sincronizando..." : "🔄 Atualizar Agora"}
      </button>

      {syncResult && (
        <p className="text-xs font-body text-center">{syncResult}</p>
      )}
    </div>
  );
}
