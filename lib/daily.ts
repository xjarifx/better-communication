import { DAILY_API_KEY } from "./env";

const DAILY_API_URL = "https://api.daily.co/v1";

const headers = {
  Authorization: `Bearer ${DAILY_API_KEY}`,
  "Content-Type": "application/json",
};

export async function createDailyRoom() {
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: { exp },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      error: err?.message ?? "Failed to create room",
      status: 502,
    };
  }

  const data = await res.json();

  return {
    roomUrl: data.url as string,
    roomName: data.name as string,
  };
}

export async function getDailyRoom(name: string) {
  const res = await fetch(`${DAILY_API_URL}/rooms/${name}`, {
    headers,
  });

  if (res.status === 404) {
    return { error: "Room not found" as const, status: 404 };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      error: err?.message ?? "Failed to get room",
      status: 502,
    };
  }

  const data = await res.json();

  return {
    roomUrl: data.url as string,
    roomName: data.name as string,
    active: false as boolean,
  };
}
