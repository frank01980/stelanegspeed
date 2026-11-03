// Speed Store helper - paste this whole file into a Cloudflare Worker.
// It finds a Roblox user by username and sends back their avatar picture.
// Use: https://YOUR-WORKER.workers.dev/user?name=Builderman

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const name = (url.searchParams.get("name") || "").trim();
    if (url.pathname !== "/user" || !/^[A-Za-z0-9_]{3,20}$/.test(name)) {
      return new Response(JSON.stringify({ error: "bad username" }), { status: 400, headers: CORS });
    }

    // 1. username -> user id
    const u = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [name], excludeBannedUsers: true })
    });
    const user = (await u.json()).data?.[0];
    if (!user) {
      return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: CORS });
    }

    // 2. user id -> avatar headshot picture
    const t = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`);
    const avatar = (await t.json()).data?.[0]?.imageUrl || "";

    return new Response(JSON.stringify({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatar
    }), { headers: { ...CORS, "Cache-Control": "max-age=300" } });
  }
};
