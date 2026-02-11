export default async function handler(req, res) {
  try {
    const instrument = (req.query.instrument || "").toUpperCase(); // e.g. XAG/USD
    if (!/^[A-Z0-9]{3}\/[A-Z0-9]{3}$/.test(instrument)) {
      res.status(400).json({ error: "Bad instrument" });
      return;
    }

    const url = `https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/${instrument}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) {
      res.status(502).json({ error: "Upstream error", status: r.status });
      return;
    }

    const data = await r.json();

    // Allow your GitHub Pages site to read this
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Proxy failed" });
  }
}
