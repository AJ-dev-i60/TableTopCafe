/**
 * Generates PWA icon PNGs into public/.
 * Run once with: npx tsx scripts/generate-icons.ts
 */
import { writeFile, mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const BRAND = { r: 37, g: 99, b: 235 } // --color-brand #2563eb

const SIZES = [16, 32, 180, 192, 512]

async function run() {
  await mkdir('./public', { recursive: true })

  for (const size of SIZES) {
    const buf = await sharp({
      create: { width: size, height: size, channels: 3, background: BRAND },
    })
      .png()
      .toBuffer()
    await writeFile(`./public/icon-${size}.png`, buf)
    console.log(`  icon-${size}.png`)
  }

  // favicon.ico — just copy the 32px PNG and rename
  const fav = await sharp({
    create: { width: 32, height: 32, channels: 3, background: BRAND },
  })
    .png()
    .toBuffer()
  await writeFile('./public/favicon.ico', fav)
  console.log('  favicon.ico')

  console.log('Done.')
}

run().catch((e) => { console.error(e); process.exit(1) })
