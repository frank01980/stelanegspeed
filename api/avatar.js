// Vercel serverless function: GET /api/avatar?username=NAME
// Official Roblox Users + Thumbnails APIs, called from the server.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300");
  const name = String(req.query.username || "").trim();
  if (!name) return res.status(400).json({ error: "Username is required" });
  try {
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usernames: [name], excludeBannedUsers: true })
    });
    if (!r.ok) throw new Error("users api " + r.status);
    const j = await r.json();
    const u = j.data && j.data[0];
    if (!u) return res.status(200).json({});

    const [details, thumb] = await Promise.all([
      fetch("https://users.roblox.com/v1/users/" + u.id).then(x => x.json()),
      fetch("https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" + u.id +
            "&size=420x420&format=Png", { headers: { Accept: "application/json" } }).then(x => x.json())
    ]);

    res.status(200).json({
      id: u.id,
      name: u.name,
      displayName: details.displayName || u.name,
      created: details.created || null,
      imageUrl: (thumb.data && thumb.data[0] && thumb.data[0].imageUrl) ||
        "https://www.roblox.com/headshot-thumbnail/image?userId=" + u.id + "&width=420&height=420&format=png"
    });
  } catch (e) {
    res.status(500).json({ error: "Roblox request failed" });
  }
}
