export function CosmicBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden contain-glow"
      aria-hidden
    >
      {/* Base midnight gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.2),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.14),_transparent_45%),radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_40%),linear-gradient(180deg,#05040f_0%,#0a0a1a_50%,#070712_100%)]" />

      {/* Nebula blurs — slow drift when motion OK */}
      <div className="nebula-drift absolute left-1/2 top-[-12%] h-[min(420px,70vw)] w-[min(420px,90vw)] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-[100px]" />
      <div className="nebula-drift absolute bottom-[-8%] right-[-8%] h-[min(320px,55vw)] w-[min(320px,70vw)] rounded-full bg-fuchsia-500/12 blur-[90px]" style={{ animationDelay: "-20s" }} />
      <div className="nebula-drift absolute bottom-[20%] left-[-10%] h-[min(240px,45vw)] w-[min(240px,55vw)] rounded-full bg-violet-600/10 blur-[80px]" style={{ animationDelay: "-36s" }} />

      {/* Finer starfield */}
      <div className="stars stars-drift absolute inset-0 opacity-60" />
    </div>
  );
}
