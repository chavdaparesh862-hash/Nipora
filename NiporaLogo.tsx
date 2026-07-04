import react from "react";

interface NiporaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

export default function riporaLogo({ size = "md", showTagline = true }: NiporaLogoProps) {
  // Dimensions based on size
  const logoDimensions = {
    sm: { width: 140, height: 110, iconSize: 45, textStyle: "text-lg tracking-widest" },
    md: { width: 220, height: 170, iconSize: 70, textStyle: "text-2xl tracking-[0.2em]" },
    lg: { width: 340, height: 260, iconSize: 110, textStyle: "text-4xl tracking-[0.25em]" },
    xl: { width: 440, height: 340, iconSize: 150, textStyle: "text-5xl tracking-[0.3em] font-light" },
  };

  const dim = logoDimensions[size];

  return (
    <div className="flex flex-col items-center justify-center text-center select-none" id="nipora-brand-wrapper">
      {/* SVG Icon part */}
      <svg
        width={dim.iconSize * 1.5}
        height={dim.iconSize * 1.3}
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_12px_rgba(239,68,68,0.25)] filter"
        id="nipora-svg"
      >
        {/* Soft back glow */}
        <circle cx="80" cy="70" r="40" fill="url(#redGlow)" opacity="0.3" />

        {/* Orbit Swoosh (Back section - drawn first so N stands in front) */}
        <path
          d="M 12 100 C 10 120, 150 95, 125 50"
          stroke="url(#swooshGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* The 'N' letter with rounded modern edges and bevel gradient */}
        {/* We construct 'N' from 3 overlapping path layers or one single beautiful ribbon path */}
        <g id="letter-n">
          {/* Left Vertical Bar */}
          <path
            d="M 54 102 C 54 105, 52 107, 48 107 C 44 107, 42 105, 42 102 L 42 43 C 42 40, 44 38, 48 38 C 52 38, 54 40, 54 43 Z"
            fill="url(#redGradLeft)"
          />
          {/* Right Vertical Bar */}
          <path
            d="M 102 102 C 102 105, 100 107, 96 107 C 92 107, 90 105, 90 102 L 90 43 C 90 40, 92 38, 96 38 C 100 38, 102 40, 102 43 Z"
            fill="url(#redGradRight)"
          />
          {/* Diagonal Connection Bar (overlapping to form a continuous letter 'N') */}
          <path
            d="M 43.5 45 C 43.5 40.5, 47.5 39, 52.5 42 L 89 88 C 91.5 91, 95.5 92.5, 100.5 89 C 101.5 88.5, 102 87, 102 85 L 43.5 45 Z"
            fill="url(#redGradDiag)"
          />
        </g>

        {/* Orbit Swoosh (Front section - sweeps elegantly in front of the N) */}
        <path
          d="M 12 100 C -5 80, 50 40, 125 50"
          stroke="url(#swooshGrad)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Heart at the top right of the N */}
        {/* Placed around x: 104, y: 25 */}
        <g transform="translate(103, 14)">
          <path
            d="M 12 6 C 12 6, 9.5 0, 6 0 C 2.5 0, 0 2.5, 0 6 C 0 11, 7.5 15, 12 21 C 16.5 15, 24 11, 24 6 C 24 2.5, 21.5 0, 18 0 C 14.5 0, 12 6, 12 6 Z"
            fill="url(#heartGrad)"
            className="animate-pulse origin-center"
            style={{ transformOrigin: "12px 10px", animationDuration: "1.8s" }}
          />
        </g>

        {/* Gradients declarations */}
        <defs>
          <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="redGradLeft" x1="42" y1="38" x2="54" y2="107" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="redGradRight" x1="90" y1="38" x2="102" y2="107" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          <linearGradient id="redGradDiag" x1="43" y1="40" x2="100" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="swooshGrad" x1="12" y1="100" x2="125" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#991B1B" />
            <stop offset="30%" stopColor="#EF4444" />
            <stop offset="70%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#FCA5A5" />
          </linearGradient>

          <linearGradient id="heartGrad" x1="0" y1="0" x2="24" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8787" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>
      </svg>

      {/* NIPORA Wordmark */}
      <h1 className={`${dim.textStyle} text-white font-black tracking-[0.22em] flex items-center justify-center mt-4 uppercase font-sans`} id="nipora-wordmark">
        N I P
        {/* Stylized hollow red O ring exactly as shown in user's image */}
        <span className="inline-block border-[4.5px] border-red-600 bg-neutral-950 w-[0.7em] h-[0.7em] rounded-full mx-[0.1em] shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all duration-300 hover:scale-110" />
        R A
      </h1>

      {/* Tagline */}
      {showTagline && (
        <div className="mt-4 flex items-center justify-center gap-4 w-full max-w-md px-4" id="nipora-tagline-container">
          <div className="h-[2px] bg-red-600 w-10 rounded-full shrink-0" />
          <p className="text-[10px] md:text-xs font-black tracking-[0.2em] text-white whitespace-nowrap uppercase">
            Watch <span className="text-red-500 font-extrabold">Together</span>. Stay <span className="text-red-500 font-extrabold">Together</span>.
          </p>
          <div className="h-[2px] bg-red-600 w-10 rounded-full shrink-0" />
        </div>
      )}
    </div>
  );
}
