import type { SyncStatus } from "@/lib/types";

interface StatusIndicatorProps {
  status: SyncStatus;
}

const labels: Record<SyncStatus, string> = {
  online: "Ao Vivo",
  saving: "Salvando...",
  error: "Erro de conexão",
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "online"
            ? "bg-neon animate-pulse-dot"
            : status === "saving"
            ? "bg-muted-foreground"
            : "bg-destructive"
        }`}
      />
      <span className="text-xs font-display font-medium tracking-wide">
        {labels[status]}
      </span>
    </div>
  );
}
