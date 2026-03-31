import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error — ws is a CJS module, vite.config runs in Node
import { WebSocketServer, WebSocket } from "ws";

const EXT_ORIGIN = "https://app.extended.exchange";
const EXT_API = "https://api.starknet.extended.exchange";
const EXT_WS = "wss://api.starknet.extended.exchange";
const EXT_UA = "Mozilla/5.0 Tegra/1.0";

/**
 * Dev-only proxy for Extended API (REST + WebSocket).
 * Cloudflare rejects browser headers, so we make clean
 */
function extendedProxy(): Plugin {
  return {
    name: "extended-proxy",
    configureServer(server) {
      // ── REST proxy ──
      server.middlewares.use("/api/extended", async (req, res) => {
        const path = req.url ?? "/";
        const target = `${EXT_API}${path}`;

        try {
          // Read request body for POST/PATCH/PUT
          let reqBody: string | undefined;
          if (req.method && ["POST", "PATCH", "PUT"].includes(req.method)) {
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            reqBody = Buffer.concat(chunks).toString();
          }

          // Forward relevant headers from browser request
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Origin: EXT_ORIGIN,
            "User-Agent": EXT_UA,
          };
          const forwardHeaders = [
            "x-api-key",
            "l1_signature",
            "l1_message_time",
            "l1-signature",
            "l1-message-time",
            "x-x10-active-account",
          ];
          for (const key of forwardHeaders) {
            const value = req.headers[key];
            if (typeof value === "string") headers[key] = value;
          }

          const response = await fetch(target, {
            method: req.method ?? "GET",
            headers,
            ...(reqBody ? { body: reqBody } : {}),
          });

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            if (!["content-encoding", "transfer-encoding"].includes(key)) {
              res.setHeader(key, value);
            }
          });
          const body = await response.arrayBuffer();
          res.end(Buffer.from(body));
        } catch {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: "Proxy fetch failed" }));
        }
      });

      // ── WebSocket relay ──
      const wss = new WebSocketServer({ noServer: true });

      server.httpServer?.on("upgrade", (req, socket, head) => {
        if (!req.url?.startsWith("/ws-extended/")) return;

        wss.handleUpgrade(
          req,
          socket,
          head,
          (clientWs: InstanceType<typeof WebSocket>) => {
            const targetPath = req.url!.replace("/ws-extended", "");
            const targetUrl = `${EXT_WS}${targetPath}`;

            const upstream = new WebSocket(targetUrl, {
              headers: { Origin: EXT_ORIGIN, "User-Agent": EXT_UA },
            });

            upstream.on("open", () => {
              clientWs.on("message", (msg: Buffer) => {
                if (upstream.readyState === WebSocket.OPEN) {
                  upstream.send(msg);
                }
              });
            });

            upstream.on("message", (msg: Buffer) => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(msg.toString());
              }
            });

            upstream.on("close", () => clientWs.close());
            upstream.on("error", () => clientWs.close());
            clientWs.on("close", () => upstream.close());
            clientWs.on("error", () => upstream.close());
          },
        );
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), extendedProxy()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
