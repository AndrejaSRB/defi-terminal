import type { VercelRequest, VercelResponse } from "@vercel/node";

const ZERION_API = "https://api.zerion.io/v1";

/**
 * Example:
 * /api/zerion/wallets/0x123/positions
 * -> proxies to
 * https://api.zerion.io/v1/wallets/0x123/positions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? "";

  const allowedOrigins = [
    "http://localhost:5173",
    "https://defi-terminal-seven.vercel.app",
  ];

  const isAllowedOrigin =
    allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const apiKey = process.env.ZERION_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "Missing ZERION_API_KEY in Vercel environment variables",
    });
    return;
  }

  const pathSegments = req.query.path;
  const apiPath = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : (pathSegments ?? "");

  if (!apiPath) {
    res.status(400).json({
      error: "Missing Zerion API path",
    });
    return;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;

    const values = Array.isArray(value) ? value : [value];
    for (const val of values) {
      if (val != null) {
        params.append(key, String(val));
      }
    }
  }

  const search = params.toString() ? `?${params.toString()}` : "";
  const target = `${ZERION_API}/${apiPath}${search}`;

  try {
    const response = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        Accept: "application/json",
      },
    });

    const contentType =
      response.headers.get("content-type") ?? "application/json";

    res.setHeader("Content-Type", contentType);

    const body = Buffer.from(await response.arrayBuffer());

    if (!response.ok) {
      console.error("Zerion upstream error:", {
        status: response.status,
        url: target,
        body: body.toString(),
      });
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error("Zerion proxy failed:", error);

    res.status(502).json({
      error: "Zerion proxy failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
