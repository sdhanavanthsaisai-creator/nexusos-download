# NexusOS — app download page

The public download page for [NexusOS](https://nexusos-sigma.vercel.app), the student
productivity workspace. Visitors land here, install the signed APK on Android, or add the
web app to their home screen on iOS.

Vite + React 19, with a WebGL ripple surface and a flying-button download CTA. Plain CSS,
no framework on the styling side.

```
index.html              landing page shell (hero, compare, install, FAQ, checksum)
src/main.jsx            page content and interactions
src/effects/            RippleDistortion, FlyingButton, SideRays, SwarmCursor
public/styles.css       monochrome theme shared with the app
public/styles-sections.css  section-level styles
public/NexusOS-1.0.apk  signed release build
public/icon*.{svg,png}  app icons
public/art/             ripple and spotlight surfaces
scripts/release.mjs     reads version, size and SHA-256 out of the APK
vite.config.js          build, plus APK-derived values injected into the page
vercel.json             serves the APK as application/vnd.android.package-archive
```

## Deploy

Vercel detects Vite: `npm run build` produces `dist`, and the site is served from there.
Push to `main` and it deploys. Any static host works the same way (Netlify, Cloudflare
Pages, GitHub Pages).

```bash
npm install
npm run build      # -> dist
npm run preview    # serve dist locally
```

## Shipping a new build

1. Put the new signed APK in `public/`, replacing the old one. If the filename changes,
   update `APK_URL`-consuming references — the page reads the name, version, version code,
   package, size and SHA-256 from the APK at build time, so no numbers are hand-typed.
2. Commit and push — Vercel redeploys automatically.

Get the checksum with:

```bash
sha256sum public/NexusOS-1.0.apk
```

## iOS

There is no `.ipa` here and no App Store listing yet. iOS installs through Safari: open
the site, tap Share, then Add to Home Screen. Apple only installs apps it has signed and
notarised, so a sideloaded build is not an option.

## About the APK

- Package: `app.nexusos.student` · version 1.0 (1) · 1.2 MB
- Requires Android 7.0+ and a browser that supports Android Custom Tabs (Chrome)
- It is a Trusted Web Activity: the app renders the live site fullscreen, so product
  updates ship without a new APK
- Signed with the NexusOS release key. The same key must sign every future build — a
  different key installs as a separate app and breaks updates.
- Digital Asset Links live in the main app repo at
  `public/.well-known/assetlinks.json` and are served from
  `https://nexusos-sigma.vercel.app`; they must keep matching the signing certificate.

## License

MIT — see [LICENSE](LICENSE).
