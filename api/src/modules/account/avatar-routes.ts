import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { db } from "../../db/client.js"
import { users } from "../../db/schema/users.js"
import { getObjectBytes, isS3Configured } from "../../lib/s3.js"
import { verifyAvatarQuery } from "./avatar-url.js"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Public (HMAC-signed) avatar image stream.
 * GET /account/avatar/:userId?v=<ms>&sig=<hmac>
 */
export const avatarRoutes = new Hono()

avatarRoutes.get("/:userId", async (c) => {
  const userId = c.req.param("userId")
  if (!userId || !UUID_RE.test(userId)) {
    return c.body(null, 400)
  }

  const vRaw = c.req.query("v")
  const sig = c.req.query("sig") ?? ""
  const versionMs = Number(vRaw)
  if (!verifyAvatarQuery(userId, versionMs, sig)) {
    return c.body(null, 403)
  }

  if (!isS3Configured()) {
    return c.body(null, 404)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { avatarKey: true, updatedAt: true },
  })
  if (!user?.avatarKey) {
    return c.body(null, 404)
  }

  // Cache key must match the signed version so replace invalidates.
  const currentV = user.updatedAt.getTime()
  if (currentV !== versionMs) {
    return c.body(null, 404)
  }

  const object = await getObjectBytes(user.avatarKey)
  if (!object) {
    return c.body(null, 404)
  }

  // Vite serves the app with COEP require-corp (SharedArrayBuffer / C++ runner).
  // Cross-origin <img> from :5173 → :3000 needs CORP: cross-origin or COEP blocks it.
  return new Response(Buffer.from(object.body), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": "public, max-age=86400, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  })
})
