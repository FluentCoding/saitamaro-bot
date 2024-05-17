import { Config, JsonDB } from "node-json-db";
import { getSummonerNickname, regionFromStr } from "../riot/leaderboard";
type LeaderboardEntry = { id: string; region: string; tag?: string };
export type Leaderboard = Record<string, LeaderboardEntry>;
export type LeaderboardMessageLocation = {
  channelId: string;
  messageId: string;
};

const db = new JsonDB(new Config("leaderboard", true, false));

const leaderboardPath = (discordId: string) => `/leaderboard/${discordId}`;

export async function getLeaderboard() {
  const res = await db.getObjectDefault<Leaderboard>("/leaderboard", {});

  // for backwards-compatibility, fill in all missing tags
  {
    let updateRequired = false;
    for (const [k, v] of Object.entries(res)) {
      if (v.tag === undefined) {
        const tag = await getSummonerNickname(regionFromStr(v.region)!, v.id);
        if (!tag) continue;
        v.tag = tag;
        updateRequired = true;
      }
    }
    if (updateRequired) db.push("/leaderboard", res);
  }

  return res;
}

export function getLeaderboardEntry(discordId: string) {
  return db.getObjectDefault<LeaderboardEntry | undefined>(
    leaderboardPath(discordId),
    undefined
  );
}

export function addLeaderboardEntry(
  discordId: string,
  entry: LeaderboardEntry
) {
  return db.push(leaderboardPath(discordId), entry);
}

export function removeLeaderboardEntry(discordId: string) {
  return db.delete(leaderboardPath(discordId));
}

export function getLeaderboardMessageLocation() {
  return db.getObjectDefault<LeaderboardMessageLocation | undefined>(
    "/messageId",
    undefined
  );
}

export function setLeaderboardMessageLocation(
  data: LeaderboardMessageLocation
) {
  return db.push("/messageId", data);
}
