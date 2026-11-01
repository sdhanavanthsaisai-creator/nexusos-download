# NexusOS — Android download page

The public download page for [NexusOS](https://nexusos-sigma.vercel.app), the student
productivity workspace. Visitors land here, download the signed APK, and install the app
on a phone.

Static site: one HTML file, one stylesheet, three icons and the APK. No build step, no
dependencies, no JavaScript framework.

```
index.html              landing page (hero, install steps, FAQ, checksum)
styles.css              monochrome theme shared with the app
icon.svg/.png           app icons
NexusOS-1.0.apk         signed release build
vercel.json             serves the APK as application/vnd.android.package-archive
```

## Deploy

Vercel detects this as a static site — push to `main` and it deploys, no configuration
needed. Any static host works the same way (Netlify, Cloudflare Pages, GitHub Pages).

## Shipping a new build

1. Put the new signed APK in the repo, replacing the old one.
2. Update the filename in `index.html` (the two `href`s), the version line, and the
   `SHA-256` value.
3. Commit and push — Vercel redeploys automatically.

Get the checksum with:

```bash
sha256sum NexusOS-1.0.apk
```

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
