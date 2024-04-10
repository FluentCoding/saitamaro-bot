import { Config, JsonDB } from "node-json-db";
type LeaderboardEntry = { id: string; region: string };
export type Leaderboard = Record<string, LeaderboardEntry>;
export type LeaderboardMessageLocation = {
  channelId: string;
  messageId: string;
};

const db = new JsonDB(new Config("leaderboard", true, false));

const leaderboardPath = (discordId: string) => `/leaderboard/${discordId}`;

export function getLeaderboard() {
  return db.getObjectDefault<Leaderboard>("/leaderboard", {});
}

export function getLeaderboardEntry(discordId: string) {
  return db.getObjectDefault<LeaderboardEntry | undefined>(
    leaderboardPath(discordId),
    undefined,
  );
}

export function addLeaderboardEntry(
  discordId: string,
  entry: LeaderboardEntry,
) {
  return db.push(leaderboardPath(discordId), entry);
}

export function removeLeaderboardEntry(discordId: string) {
  return db.delete(leaderboardPath(discordId));
}

export function getLeaderboardMessageLocation() {
  return db.getObjectDefault<LeaderboardMessageLocation | undefined>(
    "/messageId",
    undefined,
  );
}

export function setLeaderboardMessageLocation(
  data: LeaderboardMessageLocation,
) {
  return db.push("/messageId", data);
}
