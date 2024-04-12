import { error } from "elysia";
import { accounts } from "../../.env.json";

export default ({ request }: { request: Request }) => {
  const token = Buffer.from(
    request.headers.get("authorization") ?? "",
    "base64"
  ).toString("ascii");
  if (!accounts.includes(token)) {
    return error(401);
  }
};
