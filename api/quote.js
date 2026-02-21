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

    // Parse and extract the bid and ask from the response
    const instrumentData = data[0];  // The first object in the response array
    const spreadProfilePrices = instrumentData.spreadProfilePrices || [];

    if (!spreadProfilePrices.length) {
      res.status(404).json({ error: "No price data available" });
      return;
    }

    // Extract bid and ask values from the first spreadProfilePrices object
    const { bid, ask } = spreadProfilePrices[0];

    if (bid == null || ask == null) {
      res.status(404).json({ error: "Missing bid/ask data" });
      return;
    }

    const mid = (bid + ask) / 2;

    // Return the parsed data with bid, ask, and mid
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");

    res.status(200).json({
      mid,
      bid,
      ask,
      timestamp: instrumentData.ts,  // Optional: Add the timestamp
    });

  } catch (e) {
    console.error("Error processing request:", e);
    res.status(500).json({ error: "Proxy failed", message: e.message });
  }
}
