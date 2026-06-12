import { Rest } from "ably";

let ablyRest: Rest | null = null;

export function getAblyRest() {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;

  if (!ablyRest) {
    ablyRest = new Rest({ key });
  }

  return ablyRest;
}
