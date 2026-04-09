import { useClock } from "@/hooks/useClock";

export function Clock() {
  const { time, date } = useClock();

  return (
    <div className="flex items-center gap-[0.6vw] bg-card/80 backdrop-blur-sm rounded-full px-[1vw] py-[0.4vh] border border-border">
      <span className="text-[clamp(0.7rem,0.85vw,1.1rem)] font-display font-bold tracking-widest">{time}</span>
      <span className="text-[clamp(0.55rem,0.7vw,0.85rem)] text-muted-foreground">{date}</span>
    </div>
  );
}
