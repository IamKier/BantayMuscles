/* One-off: generate app icon + splash assets from the BM logo. Run with `node scripts/make-icons.js`. */
const sharp = require('sharp');
const path = require('path');

const SRC = 'C:/Users/kenth.condez/Downloads/bantay muscle logo app.png';
const OUT = path.join(__dirname, '..', 'assets', 'images');

async function main() {
  // Sample the corner so the splash / adaptive background matches the artwork exactly.
  const { data } = await sharp(SRC).extract({ left: 4, top: 4, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const hex = '#' + [data[0], data[1], data[2]].map((n) => n.toString(16).padStart(2, '0')).join('');
  console.log('background:', hex);

  // Square app icon (iOS + base) and Android adaptive foreground — BM already sits
  // well inside the adaptive safe zone, so the same 1024 render works for both.
  await sharp(SRC).resize(1024, 1024).png().toFile(path.join(OUT, 'bm-icon.png'));
  await sharp(SRC).resize(1024, 1024).png().toFile(path.join(OUT, 'bm-adaptive.png'));

  // Splash: the full mark on its gray field; expo-splash-screen centers it.
  await sharp(SRC).resize(1024, 1024).png().toFile(path.join(OUT, 'bm-splash.png'));

  // Web favicon.
  await sharp(SRC).resize(48, 48).png().toFile(path.join(OUT, 'bm-favicon.png'));

  console.log('wrote bm-icon / bm-adaptive / bm-splash / bm-favicon to', OUT);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
