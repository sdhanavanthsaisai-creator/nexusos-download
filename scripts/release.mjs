// Reads the release facts straight out of the APK, so the download page can never drift from the
// file it serves. Android's manifest inside an APK is binary XML (AXML); this walks just enough of
// that format to pull the <manifest> attributes, then hashes the file.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

const RES_STRING_POOL = 0x0001;
const RES_XML_START_ELEMENT = 0x0102;
const TYPE_STRING = 0x03;
const TYPE_INT_DEC = 0x10;
const UTF8_FLAG = 0x100;
const NO_ENTRY = 0xffffffff;

const u16 = (buf, at) => buf.readUInt16LE(at);
const u32 = (buf, at) => buf.readUInt32LE(at);

/** Reads a pool string length, which is 1 byte (UTF-8) or 2 bytes unless the top bit says 4. */
const readLength = (buf, at, isUtf8) => {
  if (isUtf8) {
    const first = buf[at];
    return first & 0x80 ? [(first & 0x7f) << 8 | buf[at + 1], at + 2] : [first, at + 1];
  }
  const first = u16(buf, at);
  return first & 0x8000 ? [(first & 0x7fff) << 16 | u16(buf, at + 2), at + 4] : [first, at + 2];
};

const readStringPool = (buf, start) => {
  const chunkSize = u32(buf, start + 4);
  const count = u32(buf, start + 8);
  const flags = u32(buf, start + 16);
  const stringsStart = u32(buf, start + 20);
  const isUtf8 = (flags & UTF8_FLAG) !== 0;
  const offsetsAt = start + 28;
  const dataStart = start + stringsStart;
  const strings = new Array(count);

  for (let i = 0; i < count; i++) {
    const offset = u32(buf, offsetsAt + i * 4);
    if (offset === NO_ENTRY) continue;
    let at = dataStart + offset;
    if (isUtf8) {
      [, at] = readLength(buf, at, true); // skip the UTF-16 length
      const [byteLength, body] = readLength(buf, at, true);
      strings[i] = buf.toString('utf8', body, body + byteLength);
    } else {
      const [charLength, body] = readLength(buf, at, false);
      strings[i] = buf.toString('utf16le', body, body + charLength * 2);
    }
  }

  return { strings, end: start + chunkSize };
};

/** Collects android:* attributes of the first element with the given name. */
const readElement = (buf, start, strings) => {
  const headerSize = u16(buf, start + 2);
  const nameIndex = u32(buf, start + 20);
  const attributeStart = u16(buf, start + 24);
  const attributeSize = u16(buf, start + 26);
  const attributeCount = u16(buf, start + 28);
  const attributes = new Map();
  const base = start + headerSize + attributeStart;

  for (let i = 0; i < attributeCount; i++) {
    const at = base + i * attributeSize;
    const attrName = strings[u32(buf, at + 4)];
    const rawValue = u32(buf, at + 8);
    const dataType = buf[at + 15];
    const data = u32(buf, at + 16);
    if (dataType === TYPE_STRING && rawValue !== NO_ENTRY) attributes.set(attrName, strings[rawValue]);
    else if (dataType === TYPE_INT_DEC || dataType === TYPE_INT_HEX) attributes.set(attrName, data);
    else if (dataType === TYPE_STRING) attributes.set(attrName, strings[data]);
  }

  return { name: strings[nameIndex], attributes };
};

/** Pulls versionCode, versionName and package from an APK's binary AndroidManifest.xml. */
export const readManifest = apk => {
  const entries = [];
  let zipAt = apk.length - 22;
  while (zipAt >= 0 && u32(apk, zipAt) !== 0x06054b50) zipAt--;
  if (zipAt < 0) throw new Error('APK is not a zip archive');

  const directoryAt = u32(apk, zipAt + 16);
  const entryCount = u16(apk, zipAt + 10);
  let at = directoryAt;
  for (let i = 0; i < entryCount; i++) {
    const nameLength = u16(apk, at + 28);
    const extraLength = u16(apk, at + 30);
    const commentLength = u16(apk, at + 32);
    const localAt = u32(apk, at + 42);
    entries.push({
      name: apk.toString('utf8', at + 46, at + 46 + nameLength),
      localAt,
      method: u16(apk, at + 10),
      compressedSize: u32(apk, at + 20)
    });
    at += 46 + nameLength + extraLength + commentLength;
  }

  const entry = entries.find(item => item.name === 'AndroidManifest.xml');
  if (!entry) throw new Error('APK has no AndroidManifest.xml');

  const localNameLength = u16(apk, entry.localAt + 26);
  const localExtraLength = u16(apk, entry.localAt + 28);
  const dataAt = entry.localAt + 30 + localNameLength + localExtraLength;
  const stored = apk.subarray(dataAt, dataAt + entry.compressedSize);
  const manifest = entry.method === 0 ? stored : inflateRawSync(stored);
  let strings = [];
  let offset = u16(manifest, 2);

  while (offset + 8 <= manifest.length) {
    const type = u16(manifest, offset);
    const chunkSize = u32(manifest, offset + 4);
    if (chunkSize <= 0) break;

    if (type === RES_STRING_POOL) {
      const pool = readStringPool(manifest, offset);
      strings = pool.strings;
    } else if (type === RES_XML_START_ELEMENT && strings.length) {
      const element = readElement(manifest, offset, strings);
      if (element.name === 'manifest') {
        return {
          packageName: element.attributes.get('package') ?? null,
          versionName: element.attributes.get('versionName') ?? null,
          versionCode: element.attributes.get('versionCode') ?? null
        };
      }
    }

    offset += chunkSize;
  }

  throw new Error('No <manifest> element found');
};

const sizeLabel = bytes => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** The release the page describes: the APK file, its version, its size and its SHA-256. */
export const readRelease = async rootDir => {
  let dir = rootDir;
  let files = await readdir(dir);
  let apkFile = files.filter(name => /^NexusOS-.*\.apk$/i.test(name)).sort().pop();
  if (!apkFile) {
    dir = `${rootDir}/public`;
    files = await readdir(dir);
    apkFile = files.filter(name => /^NexusOS-.*\.apk$/i.test(name)).sort().pop();
  }
  if (!apkFile) throw new Error(`No NexusOS-*.apk found in ${rootDir} or ${rootDir}/public`);

  const apkPath = `${dir}/${apkFile}`;
  const bytes = await readFile(apkPath);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const fromName = apkFile.match(/^NexusOS-(.+)\.apk$/i)?.[1] ?? null;

  let manifest = null;
  try {
    manifest = readManifest(bytes);
  } catch (error) {
    console.warn(`[release] could not read the APK manifest (${error.message}); using the file name`);
  }

  if (!manifest?.versionName && !fromName) throw new Error(`Could not determine the version of ${apkFile}`);

  const version = manifest?.versionName ?? fromName;
  const versionCode = manifest?.versionCode;

  return {
    apkFile,
    apkPath,
    version,
    versionCode,
    versionLabel: versionCode === undefined || versionCode === null ? version : `${version} (${versionCode})`,
    packageName: manifest?.packageName ?? null,
    sizeBytes: bytes.length,
    sizeLabel: sizeLabel(bytes.length),
    sha256
  };
};
