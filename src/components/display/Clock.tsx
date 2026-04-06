import { useClock } from "@/hooks/useClock";

export function Clock() {
  const { time, date } = useClock();

  return (
    <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-full px-4 py-1.5 border border-border">
      <span className="text-sm font-display font-bold tracking-widest">{time}</span>
      <span className="text-xs text-muted-foreground">{date}</span>
    </div>
  );
}
