// The release APK and the PNG icons live at the repo root in the published repo, while Vite only
// copies `public/`. Copy them into the build output so /NexusOS-1.0.apk keeps working; when a file
// is already served from `public/` there is nothing to copy.
import { access, copyFile } from 'node:fs/promises';

const release = ['NexusOS-1.0.apk', 'icon-192.png', 'icon-512.png'];
const copied = [];

for (const file of release) {
  try {
    await access(file);
    await copyFile(file, `dist/${file}`);
    copied.push(file);
  } catch {
    // Already published through public/ — nothing to do.
  }
}

console.log(copied.length ? `copied ${copied.join(', ')} into dist/` : 'dist/ already serves the release files');
