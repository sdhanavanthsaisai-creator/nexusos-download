import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SideRays from './effects/SideRays';
import SwarmCursor from './effects/SwarmCursor';
import RippleDistortion from './effects/RippleDistortion';

const DownloadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

/** Live media-query hook so effects can opt out on touch, narrow or reduced-motion setups. */
const useMedia = query => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = event => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
};

/** Soft light fan behind the hero — monochrome, leaning toward the cursor. */
const HeroBackground = () => {
  const still = useMedia('(prefers-reduced-motion: reduce)');
  const wide = useMedia('(min-width: 720px)');

  return (
    <SideRays
      rayColor1="#ffffff"
      rayColor2="#9aa3b2"
      blend={0.5}
      origin="top-right"
      speed={still ? 0 : 1.5}
      intensity={0.85}
      spread={2.8}
      density={11}
      sharpness={0.82}
      falloff={2.2}
      glow={0.5}
      dust={wide ? 0.1 : 0}
      opacity={wide ? 0.34 : 0.26}
      followMouse={!still}
      mouseInfluence={0.5}
      intro={!still}
      maxDevicePixelRatio={1.5}
    />
  );
};

/**
 * Ambient dust over the whole hero. It drifts across the area on its own, parts around the
 * cursor, and bursts on click. Touch, narrow and reduced-motion visitors get nothing at all.
 */
const SwarmField = () => {
  const fine = useMedia('(pointer: fine)');
  const wide = useMedia('(min-width: 900px)');
  const still = useMedia('(prefers-reduced-motion: reduce)');

  if (!fine || !wide || still) return null;

  return (
    <SwarmCursor
      className="swarm-field"
      count={1000}
      size={1.35}
      spread={115}
      speed={1.1}
      swirl={0.6}
      tail={0.6}
      trail={0.7}
      wander={0.5}
      depth={0.85}
      color="#ffffff"
      accentColor="#ffffff"
      clickEffect="burst"
      idle="roam"
      targets=""
      dpr={1.5}
    />
  );
};

/** The download actions. Plain links, so they work on every input type. */
const DownloadActions = () => (
  <div className="cta-row">
    <a className="button primary" href="/NexusOS-1.0.apk" download>
      <DownloadIcon />
      Download APK
    </a>
    <a
      className="button secondary"
      href="https://nexusos-sigma.vercel.app"
      target="_blank"
      rel="noreferrer noopener"
    >
      Use it in the browser
    </a>
  </div>
);

/** Rippling surface under the wordmark — hover or tap to disturb the texture. */
const ShowcaseTile = () => {
  const still = useMedia('(prefers-reduced-motion: reduce)');
  const small = useMedia('(max-width: 720px)');

  if (still) {
    return <img className="showcase-static" src="/art/spotlight.svg" alt="" aria-hidden="true" />;
  }

  return (
    <RippleDistortion
      src="/art/spotlight.svg"
      brushSize={small ? 118 : 168}
      strength={0.24}
      swirl={1}
      rings={4}
      spread={5}
      fade={3.2}
      spacing={14}
      dispersion={0.06}
      glint={0.55}
      tint="#ffffff"
      tintAmount={0.05}
      grayscale
      trigger="both"
      clickStrength={2.2}
      quality={small ? 'low' : 'medium'}
    />
  );
};

const mounts = {
  'hero-rays': HeroBackground,
  'hero-swarm': SwarmField,
  'cta-stage': DownloadActions,
  'ripple-tile': ShowcaseTile
};

document.querySelectorAll('[data-mount]').forEach(node => {
  const Component = mounts[node.dataset.mount];
  if (Component) createRoot(node).render(<Component />);
});
