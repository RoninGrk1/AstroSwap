/** Inline AstroSwap mark — abstract orbiting planet / stylised A */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="astro-mark-g" x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id="astro-core-g" x1="14" y1="14" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Soft plate */}
      <rect width="40" height="40" rx="12" fill="url(#astro-mark-g)" fillOpacity="0.18" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="url(#astro-mark-g)" strokeOpacity="0.55" />
      {/* Orbit ring */}
      <ellipse
        cx="20"
        cy="20"
        rx="13"
        ry="7.5"
        stroke="url(#astro-mark-g)"
        strokeWidth="1.5"
        transform="rotate(-28 20 20)"
        opacity="0.9"
      />
      {/* Planet core */}
      <circle cx="20" cy="20" r="5.5" fill="url(#astro-core-g)" />
      <circle cx="18.2" cy="18.4" r="1.4" fill="white" fillOpacity="0.45" />
      {/* Satellite */}
      <circle cx="30.5" cy="12.5" r="2.2" fill="#e9d5ff" />
    </svg>
  );
}
