import "https://deno.land/std@0.170.0/dotenv/load.ts";
import { parse } from "https://deno.land/std@0.170.0/flags/mod.ts";
import { serve, Status } from "https://deno.land/std@0.170.0/http/mod.ts";
import { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const args = parse(Deno.args, {
  string: ["dsn", "port", "secret"],
  alias: { "d": "dsn", "p": "port", "s": "secret" },
  default: {
    dsn: Deno.env.get("PG_DSN"),
    port: Deno.env.get("PORT") || "5499",
    secret: Deno.env.get("PG_SECRET"),
  },
});
const ac = new AbortController();
const pool = new Pool(args.dsn, 3, true);
addEventListener("unload", async () => {
  ac.abort("shutdown");
  await pool.end();
});

const sendJson = (data: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control":
        "max-age=0, private, no-cache, no-store, must-revalidate",
    },
  });
};

const jsonLikeContentType = ["application/json", "text/json", "json"];
const isJson = (req: Request) =>
  jsonLikeContentType.some((t) =>
    req.headers.get("content-type")?.startsWith(t)
  );

serve(async (req: Request) => {
  if (args.key) {
    const hkey = req.headers.get("authorization")?.split("Bearer ")[1];
    if (hkey !== args.secret) {
      return sendJson({ error: "Not Authorized" }, Status.Unauthorized);
    }
  }
  let dataType: "object" | "array" = "object";
  const url = new URL(req.url);
  if (url.pathname !== "/query") {
    return sendJson({ error: "Unknown route" }, Status.NotFound);
  }
  if (req.method !== "POST") {
    return sendJson({ error: "Not Allowed" }, Status.MethodNotAllowed);
  }
  if (url.searchParams.get("type") === "array") dataType = "array";
  if (!isJson(req)) {
    return sendJson(
      { error: "Not acceptable content-type" },
      Status.NotAcceptable,
    );
  }
  let client: PoolClient | undefined;
  try {
    const { query, args } = await req.json();
    if (typeof query !== "string") {
      return sendJson({ error: "Invalid Query" }, Status.BadRequest);
    }
    if (typeof args !== "undefined") {
      if (typeof args !== "object" || !Array.isArray(args)) {
        return sendJson({
          error: "Invalid query arguments. Expect [array | object]",
        }, Status.BadRequest);
      }
    }
    client = await pool.connect();
    const result = await (dataType === "array"
      ? client.queryArray(query, args)
      : client.queryObject(query, args));
    return sendJson({
      command: result.command,
      query: result.query,
      rows: result.rows,
      rowCount: result.rowCount,
      rowDescription: result.rowDescription,
    });
  } catch (e) {
    return sendJson({ error: e.message }, Status.InternalServerError);
  } finally {
    console.log("Release");
    client?.release();
  }
}, { port: parseInt(args.port), signal: ac.signal });
