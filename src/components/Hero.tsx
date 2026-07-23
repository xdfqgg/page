import { ChevronDown } from "lucide-react";
import AvatarWithJelly from "@/components/AvatarWithJelly";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <style>{`
        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(8px); opacity: 0.8; }
        }
        @keyframes breathe-amber {
          0%, 100% { box-shadow: 0 0 20px 2px oklch(0.7 0.2 85 / 0.15), 0 0 50px 6px oklch(0.7 0.2 85 / 0.06); }
          50%      { box-shadow: 0 0 35px 10px oklch(0.7 0.2 85 / 0.3), 0 0 70px 18px oklch(0.7 0.2 85 / 0.12); }
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(251,191,36,0.6) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <AvatarWithJelly />

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">XDFQ</h1>
        <p className="mx-auto mt-5 max-w-lg text-xl text-muted-foreground">这里会热闹起来的!!!!</p>

        <button
          onClick={() => document.querySelector("#feature-grid")?.scrollIntoView({ behavior: "smooth" })}
          className="mx-auto mt-24 flex flex-col items-center gap-1 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer"
          aria-label="向下滚动">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-5 w-5" style={{ animation: "bounce-down 2s ease-in-out infinite" }} />
        </button>
      </div>
    </section>
  );
}
