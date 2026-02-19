/**
 * 将 resources/icon.png 转换为 resources/icon.ico
 * 支持 Windows CI 和本地环境
 */
const sharp = require('sharp')
const toIco = require('to-ico')
const fs = require('fs')
const path = require('path')

const INPUT = path.join(__dirname, '../resources/icon.png')
const OUTPUT = path.join(__dirname, '../resources/icon.ico')

const SIZES = [16, 32, 48, 64, 128, 256]

async function main() {
    console.log('Generating icon.ico from icon.png...')

    const pngBuffers = await Promise.all(
        SIZES.map((size) =>
            sharp(INPUT)
                .resize(size, size)
                .png()
                .toBuffer()
        )
    )

    const icoBuffer = await toIco(pngBuffers)
    fs.writeFileSync(OUTPUT, icoBuffer)

    console.log(`Done! icon.ico created (${(icoBuffer.length / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
    console.error('Failed to create icon.ico:', err)
    process.exit(1)
})
