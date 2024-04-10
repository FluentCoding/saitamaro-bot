import { Image, createCanvas, loadImage } from "@napi-rs/canvas";
import {
  getPrimaryRuneUrl,
  getRunes,
  getStarterItemUrl,
  getSummonerUrl,
} from "../riot/assets";
import { Guide, Rune } from "../store/guides";

const COLOR = "#00ffae";
const imgCache: Record<string, Image> = {};

async function image(url: string) {
  if (imgCache[url]) return imgCache[url];
  return (imgCache[url] = await loadImage(url));
}

export async function renderPreview(splashUrl: string, guide: Guide) {
  const backgroundImage = await image(splashUrl);
  const bottom = backgroundImage.height;
  const right = backgroundImage.width;

  const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = COLOR;

  async function drawRune(rune: Rune, x: number, y: number) {
    roundStroke(x, y, 80, 80);
    ctx.drawImage(await image(getRunes()[rune]), x, y, 80, 80);
    strokeText(48, rune, x + 100, y + 56);
  }

  function roundStroke(x: number, y: number, w: number, h: number) {
    ctx.strokeStyle = COLOR;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
  }

  async function strokeImage(
    url: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const img = await image(url);
    ctx.drawImage(img, x, y, w, h);
    ctx.lineWidth = 6;
    ctx.strokeStyle = COLOR;
    ctx.strokeRect(x, y, w, h);
  }

  async function strokeText(size: number, text: string, x: number, y: number) {
    ctx.font = `${size}px Arial`;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  ctx.drawImage(backgroundImage, 0, 0);
  if (guide.image.smallText) {
    strokeText(48, guide.image.smallText, 20, 64);
  }
  await strokeImage(
    getStarterItemUrl(guide.image.starter),
    20,
    bottom - 150,
    128,
    128,
  );
  strokeText(64, "STARTER ITEM", 20 + 128 + 25, bottom - 150 + 128 / 2 + 18);
  await drawRune(guide.image.runes[0], 20, bottom - 350);
  await drawRune(guide.image.runes[1], 20, bottom - 250);

  {
    const primaryRunes =
      (guide.image.primaryRune
        ?.split(",")
        .map((pr) => getPrimaryRuneUrl(pr.toLowerCase().trim()))
        .filter((pr) => pr != undefined) as string[]) ?? [];
    let sumX = 0;
    const size = 130,
      distance = size + 20;
    for (const primaryRune of primaryRunes) {
      const x = 20 + sumX,
        y = bottom - 500,
        w = size,
        h = size;
      try {
        await image(primaryRune);
        ctx.fillStyle = "#141414";
        ctx.fillRect(x, y, w, h);
        await strokeImage(primaryRune, x, y, w, h);
        sumX += distance;
      } catch (e) {
        console.log("Couldn't load primary rune url (", primaryRune, ")");
      }
    }
  }
  {
    const sums =
      (guide.image.sums
        ?.split("|")
        .map((sumPair) =>
          sumPair
            .split(",")
            .map((sum) => sum.toLowerCase().trim())
            .filter((sum) => sum != "")
            .map((sum) => getSummonerUrl(sum)),
        )
        ?.filter((v) => v.length == 2) as [string, string][]) ?? [];
    let sumY = 0;
    const size = 100,
      distance = size + 20;
    for (const sum of sums) {
      try {
        // load and cache both sums, on error skip this sum pair
        await image(sum[0]), await image(sum[1]);
        await strokeImage(
          sum[0],
          right - 120 - distance,
          bottom - 220 + sumY,
          size,
          size,
        );
        await strokeImage(sum[1], right - 120, bottom - 220 + sumY, size, size);
        sumY -= distance + 10;
      } catch (e) {
        console.log("Couldn't load summoners (", sum[0], sum[1], ")");
      }
    }
  }
  ctx.drawImage(
    await image(`./public/difficulty/${guide.image.difficulty}.png`),
    right - 450,
    bottom - 100,
  );

  return await canvas.encode("webp");
}
