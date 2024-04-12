import { emptyDir, exists, readdir } from "fs-extra";
import { customAlphabet } from "nanoid";
import * as path from "path";
import { Champion } from "../riot/champs";
import { Guide, allGuides } from "./guides";

interface GuideBackup {
  id: string;
  date: Date;
}
interface GuideBackupMetadata {
  guides: Record<Champion, Guide>;
  date: number;
}

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  10
);
const rootFolder = path.join(process.cwd(), "_backups");

export const backups = async (): Promise<GuideBackup[]> => {
  let result: GuideBackup[] = [];
  for (const backupId of await readdir(rootFolder)) {
    const metadata: GuideBackupMetadata = await Bun.file(
      path.join(rootFolder, backupId, "metadata.json")
    ).json();
    result.push({
      id: backupId,
      date: new Date(metadata.date),
    });
  }
  return result;
};

export const saveBackup = async (): Promise<GuideBackup> => {
  const guides = await allGuides();

  const id = nanoid();
  const date = new Date();

  const backupFolder = path.join(rootFolder, id);
  await emptyDir(backupFolder);

  async function copyImages() {
    const cacheFolder = path.join(process.cwd(), "_cache");

    if (!(await exists(cacheFolder))) {
      throw Error("Cache isn't generated");
    }

    for (const champ of await readdir(cacheFolder)) {
      await Bun.write(
        path.join(backupFolder, `${champ}.png`),
        Bun.file(path.join(cacheFolder, champ, "0.png"))
      );
    }
  }

  async function writeMetadata() {
    await Bun.write(
      path.join(backupFolder, "metadata.json"),
      JSON.stringify({
        guides,
        date: date.getTime(),
      } satisfies GuideBackupMetadata)
    );
  }

  await copyImages();
  await writeMetadata();

  // ...

  return { id, date };
};
