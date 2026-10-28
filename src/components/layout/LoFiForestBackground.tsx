
interface LoFiForestBackgroundProps {
  imageSrc?: string
  alt?: string
}

/**
 * Cinematic Lo-Fi Forest Background
 *
 * Simulates a peaceful 6 AM Himalayan pine forest in Sikkim:
 * - Photographic misty mountain forest base
 * - Slow-drifting translucent valley fog layers
 * - Subtle ambient morning dawn glow
 * - Tactile 35mm lo-fi film grain overlay
 * - Cinematic vignette for contrast and depth
 *
 * All decorative layers have pointer-events: none to guarantee zero interference
 * with user interactions, form fields, and buttons.
 */
export default function LoFiForestBackground({
  imageSrc = '/photos/misty-valley.jpg',
}: LoFiForestBackgroundProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      {/* 1. Base Photographic Layer: 6 AM Misty Himalayan Pine Forest */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('${imageSrc}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          filter: 'brightness(0.72) contrast(1.08) saturate(0.85)',
          animation: 'subtleCinematicZoom 45s ease-in-out infinite alternate',
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />

      {/* 2. Deep Forest-Green Tone Gradient: Blends photograph naturally with theme while keeping trees & mist visible */}
      <div
        className="lofi-forest-overlay"
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* 3. Soft Ambient 6 AM Morning Light Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: 1100,
          height: '450px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(230, 184, 120, 0.09) 0%, rgba(101, 201, 139, 0.05) 50%, transparent 75%)',
          filter: 'blur(35px)',
        }}
      />

      {/* 4. Drifting Fog Layer 1: Slow horizontal mist across the forest valley */}
      <div className="fog-layer-1" style={{ opacity: 0.75 }} />

      {/* 5. Drifting Fog Layer 2: Counter-drifting sage-green cloud layer */}
      <div className="fog-layer-2" style={{ opacity: 0.65 }} />

      {/* 6. Cinematic Vignette: Darkened edges to frame foreground content */}
      <div className="cinematic-vignette" style={{ opacity: 0.85 }} />

      {/* 7. Lo-Fi Film Grain Texture: Tactile 35mm analog travel journal grain */}
      <div className="film-grain" style={{ opacity: 0.28 }} />
    </div>
  )
}
