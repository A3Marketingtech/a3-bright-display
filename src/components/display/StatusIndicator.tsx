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
    <div className="flex items-center gap-[0.4vw] bg-card/80 rounded-full px-[0.8vw] py-[0.4vh] border border-border">
      <span
        className={`w-[0.5vw] h-[0.5vw] min-w-[6px] min-h-[6px] rounded-full ${
          status === "online"
            ? "bg-neon animate-pulse-dot"
            : status === "saving"
            ? "bg-muted-foreground"
            : "bg-destructive"
        }`}
      />
      <span className="text-[clamp(0.55rem,0.7vw,0.85rem)] font-display font-medium tracking-wide">
        {labels[status]}
      </span>
    </div>
  );
}
