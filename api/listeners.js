const TTL = 45;

let memory = new Map();
let peak = 0;

function redisConfig() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  return { url, token };
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  if (!url || !token) return null;

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command]),
  });

  if (!response.ok) throw new Error("Redis request failed");

  const data = await response.json();
  return data?.[0]?.result ?? null;
}

export default async function handler(req, res) {
  const now = Math.floor(Date.now() / 1000);

  try {
    if (req.method === "POST") {
      const body = req.body || {};
      const id = String(body.id || "");

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: "Missing listener id",
        });
      }

      if (body.active === false) {
        await redisCommand(["ZREM", "radio:listeners", id]);
        memory.delete(id);
      } else {
        const expires = now + TTL;

        await redisCommand([
          "ZADD",
          "radio:listeners",
          expires,
          id,
        ]);

        memory.set(id, expires);
      }
    }

    const redisCount = await redisCommand([
      "ZCOUNT",
      "radio:listeners",
      now,
      "+inf",
    ]);

    let listeners =
      redisCount !== null
        ? Number(redisCount)
        : [...memory.values()].filter((x) => x > now).length;

    peak = Math.max(peak, listeners);

    return res.status(200).json({
      ok: true,
      listeners,
      peak,
      real: true,
    });
  } catch (error) {
    const listeners = [...memory.values()].filter(
      (x) => x > now
    ).length;

    peak = Math.max(peak, listeners);

    return res.status(200).json({
      ok: true,
      listeners,
      peak,
      real: true,
      storage: "memory",
    });
  }
}
