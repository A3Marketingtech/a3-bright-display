import { useRef, useEffect, useState } from "react";

interface DriverBadgeProps {
  name: string;
}

export function DriverBadge({ name }: DriverBadgeProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        setOverflows(textRef.current.scrollWidth > containerRef.current.clientWidth + 1);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [name]);

  return (
    <div className="flex items-center gap-[0.8vw] bg-card/80 backdrop-blur-sm rounded-full px-[1vw] py-[0.4vh] border border-border overflow-hidden max-w-[22vw]">
      <span
        className="inline-block rounded-full bg-neon flex-shrink-0"
        style={{
          width: "clamp(10px, 0.9vw, 18px)",
          height: "clamp(10px, 0.9vw, 18px)",
          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
          boxShadow: "0 0 6px hsl(var(--neon) / 0.6)",
        }}
      />
      <span className="text-[clamp(0.7rem,0.9vw,1.05rem)] font-display font-bold text-foreground/90 whitespace-nowrap flex-shrink-0">
        On Trip
      </span>
      <span
        ref={containerRef}
        className="text-[clamp(0.65rem,0.85vw,1rem)] font-body text-foreground/70 whitespace-nowrap overflow-hidden"
      >
        <span
          ref={textRef}
          className="inline-block"
          style={overflows ? { animation: "driver-scroll 6s linear infinite" } : undefined}
        >
          {name}
        </span>
      </span>
    </div>
  );
}
