import { createCanvas, loadImage } from '@napi-rs/canvas'
import { getRunes, getStarterItemUrl, getSummonerUrl } from '../riot/assets';
import { Guide, Rune } from '../store/guides';

const COLOR = '#00ffae';

export async function renderPreview(splashUrl: string, guide: Guide) {
    const backgroundImage = await loadImage(splashUrl)
    const bottom = backgroundImage.height
    const right = backgroundImage.width

    const canvas = createCanvas(backgroundImage.width, backgroundImage.height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = COLOR

    async function drawRune(rune: Rune, x: number, y: number) {
        roundStroke(x, y, 80, 80)
        ctx.drawImage(await loadImage(getRunes()[rune]), x, y, 80, 80)
        strokeText(48, rune, x + 100, y + 56)
    }

    async function drawSummoner(summoner: string, x: number, y: number, w: number, h: number) {
        try {
            await strokeImage(getSummonerUrl(summoner), x, y, w, h)
            return true;
        } catch(e) {
            console.log("Couldn't load summoner", summoner)
            return false;
        }
    }

    function roundStroke(x: number, y: number, w: number, h: number) {
        ctx.strokeStyle = COLOR
        ctx.beginPath()
        ctx.arc(x + w/2, y + h/ 2, w / 2, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.stroke()
    }

    async function strokeImage(url: string, x: number, y: number, w: number, h: number) {
        const img = await loadImage(url)
        ctx.drawImage(img, x, y, w, h)
        ctx.lineWidth = 6
        ctx.strokeStyle = COLOR
        ctx.strokeRect(x, y, w, h)
    }

    async function strokeText(size: number, text: string, x: number, y: number) {
        ctx.font = `${size}px Arial`
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 6
        ctx.strokeText(text, x, y)
        ctx.fillText(text, x, y)
    }

    ctx.drawImage(backgroundImage, 0, 0)
    if (guide.image.smallText) {
        strokeText(48, guide.image.smallText, 20, 64)
    }
    await strokeImage(getStarterItemUrl(guide.image.starter), 20, bottom - 150, 128, 128)
    strokeText(64, "STARTER ITEM", 20 + 128 + 25, bottom - 150 + 128 / 2 + 18)
    await drawRune(guide.image.runes[0], 20, bottom - 350)
    await drawRune(guide.image.runes[1], 20, bottom - 250)

    {
        const sums = guide.image.sums?.split(',').map((sum) => sum.toLowerCase().trim()).filter(sum => sum != '').reverse() ?? []
        let sumX = 0
        const size = 100, distance = size + 20
        for (const sum of sums) {
            if (await drawSummoner(sum, right - 120 + sumX, bottom - 220, size, size))
                sumX -= distance
        }
    }

    ctx.drawImage(await loadImage(`./public/difficulty/${guide.image.difficulty}.png`), right - 450, bottom - 100)

    const pngData = await canvas.encode('webp')
    return pngData
}