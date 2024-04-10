import { existsSync, rmSync } from "fs";
import { emptyDir } from "fs-extra";
import { readdir } from "fs/promises";
import { prefixLog } from "../../util/log";
import {
  Champion,
  allSkins,
  getNeutralChampionName,
  randomSplashArtUrl,
  splashArtUrl,
} from "../riot/champs";
import { Guide } from "../store/guides";
import { renderPreview } from "./renderPreview";
import path = require("path");

function championDir(champion: Champion) {
  return path.join(process.cwd(), `_cache/${champion}`);
}

export async function randomPreview(champion: Champion, guide: Guide) {
  const dir = championDir(champion);
  if (existsSync(dir)) {
    const files = await readdir(dir);
    return Buffer.from(
      await Bun.file(
        path.join(dir, files[Math.floor(Math.random() * files.length)]),
      ).arrayBuffer(),
    );
  } else {
    const log = prefixLog(champion);
    log("Cache does not exist, skipping cache...");
    return await renderPreview(await randomSplashArtUrl(champion), guide);
  }
}

export async function cacheGuide(champion: Champion, guide: Guide) {
  const log = prefixLog(champion);
  const neutralChampion = await getNeutralChampionName(champion);
  const skins = await allSkins(neutralChampion);

  log(`Caching ${skins.length} skins...`);
  const cache = Object.fromEntries(
    (
      await Promise.allSettled(
        skins.map(async (skin) => [
          skin,
          await renderPreview(await splashArtUrl(neutralChampion, skin), guide),
        ]),
      )
    )
      .filter((result) => result.status == "fulfilled")
      .map((result) => {
        return (result as PromiseFulfilledResult<[number, Buffer]>).value;
      }),
  );

  const cacheSize = Object.keys(cache).length;
  if (cacheSize == 0) {
    log("No skins generated, skipping cache.");
    return;
  } else {
    log(
      `${cacheSize} skins successfully generated, writing to disk now! (${skins.length - cacheSize} failed)`,
    );
  }
  await emptyDir(championDir(champion)); // emptyDirSync also creates the folder if it doesn't exist
  for (const [skin, image] of Object.entries(cache)) {
    await Bun.write(path.join(championDir(champion), `${skin}.png`), image);
  }
  log("Caching done");
}

export function removeCache(champion: Champion) {
  rmSync(championDir(champion), { recursive: true, force: true });
}
