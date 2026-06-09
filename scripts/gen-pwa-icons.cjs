// Generate Marifest PWA icons (emblem on navy square) from the logo.
const sharp = require('sharp');
const NAVY = { r: 15, g: 42, b: 71, alpha: 1 };
async function icon(size, padFrac, file) {
  const inner = Math.round(size * (1 - padFrac * 2));
  const emblem = await sharp('public/marifest-emblem.png')
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: emblem, gravity: 'center' }])
    .png().toFile('public/' + file);
  console.log('  ' + file);
}
(async () => {
  await icon(192, 0.16, 'icon-192.png');
  await icon(512, 0.16, 'icon-512.png');
  await icon(180, 0.16, 'apple-touch-icon.png');
  await icon(512, 0.26, 'maskable-512.png');
  console.log('PWA icons done');
})().catch((e) => { console.log('err', e.message); process.exit(1); });
