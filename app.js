// Unit conversion constants
const GRAMS_PER_OZ = 31.1035;
const TOLA_PER_OZ = 2.6667;

// State object to hold data (daily high/low & session high/low)
const state = {
  fx: 3.6725, // Example: Set default FX rate for AED
  gold: null,
  silver: null,
  goldHigh: -Infinity, // Session high
  goldLow: Infinity, // Session low
  silverHigh: -Infinity, // Session high
  silverLow: Infinity, // Session low
  
  // Track daily high/low
  goldDailyHigh: -Infinity, 
  goldDailyLow: Infinity, 
  silverDailyHigh: -Infinity, 
  silverDailyLow: Infinity,
};

// Elements
const el = {
  status: document.getElementById("connection-status"),
  lastUpdated: document.getElementById("last-updated"),
  unit: document.getElementById("unit"),

  goldPrice: document.getElementById("gold-price"),
  goldHigh: document.getElementById("gold-high"),
  goldLow: document.getElementById("gold-low"),
  goldMeta: document.getElementById("gold-meta"),

  silverPrice: document.getElementById("silver-price"),
  silverHigh: document.getElementById("silver-high"),
  silverLow: document.getElementById("silver-low"),
  silverMeta: document.getElementById("silver-meta"),
};

// Unit Conversion
function convert(value) {
  let result = value;

  // Convert based on selected unit
  if (el.unit.value === "g") result = value / GRAMS_PER_OZ;
  else if (el.unit.value === "tola") result = value / TOLA_PER_OZ;

  // If currency is AED, convert using the current FX rate
  if (currency.value === "AED") result = result * state.fx;

  return result.toFixed(2); // Format to 2 decimal places
}

// Render the prices and update display
function render() {
  // Update Silver price (XAG)
  if (state.silver !== null) {
    el.silverPrice.textContent = convert(state.silver);
    el.silverHigh.textContent = convert(state.silverHigh);
    el.silverLow.textContent = convert(state.silverLow);
    el.silverMeta.textContent = `Daily High: ${convert(state.silverDailyHigh)} | Daily Low: ${convert(state.silverDailyLow)}`;
    setPriceColor(el.silverPrice, state.silver, state.silverHigh, state.silverLow);
  }

  // Update Gold price (XAU)
  if (state.gold !== null) {
    el.goldPrice.textContent = convert(state.gold);
    el.goldHigh.textContent = convert(state.goldHigh);
    el.goldLow.textContent = convert(state.goldLow);
    el.goldMeta.textContent = `Daily High: ${convert(state.goldDailyHigh)} | Daily Low: ${convert(state.goldDailyLow)}`;
    setPriceColor(el.goldPrice, state.gold, state.goldHigh, state.goldLow);
  }
}

// Set price color (High, Low, Neutral)
function setPriceColor(priceElement, currentPrice, highPrice, lowPrice) {
  priceElement.classList.remove("high", "low", "neutral");

  if (currentPrice === highPrice) priceElement.classList.add("high");
  else if (currentPrice === lowPrice) priceElement.classList.add("low");
  else priceElement.classList.add("neutral");
}

// Fetch price data from Vercel proxy (API)
async function fetchQuote(instrument) {
  // Ensure the instrument is correctly encoded
  const url = `/api/quote?instrument=${encodeURIComponent(instrument)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Process the data and update state
async function tick() {
  try {
    const [goldData, silverData] = await Promise.all([
      fetchQuote("XAU/USD"),
      fetchQuote("XAG/USD"),
    ]);

    if (!goldData || !silverData) throw new Error("Failed to fetch data");

    // Process Gold Data (XAU/USD)
    const goldMid = goldData.mid;
    const goldBid = goldData.bid;
    const goldAsk = goldData.ask;

    // Process Silver Data (XAG/USD)
    const silverMid = silverData.mid;
    const silverBid = silverData.bid;
    const silverAsk = silverData.ask;

    // Update the state with the new prices
    state.gold = goldMid;
    state.silver = silverMid;

    // Track session high/low
    if (state.gold > state.goldHigh) state.goldHigh = state.gold;
    if (state.gold < state.goldLow) state.goldLow = state.gold;

    if (state.silver > state.silverHigh) state.silverHigh = state.silver;
    if (state.silver < state.silverLow) state.silverLow = state.silver;

    // Track daily high/low
    if (state.gold > state.goldDailyHigh) state.goldDailyHigh = state.gold;
    if (state.gold < state.goldDailyLow) state.goldDailyLow = state.gold;

    if (state.silver > state.silverDailyHigh) state.silverDailyHigh = state.silver;
    if (state.silver < state.silverDailyLow) state.silverDailyLow = state.silver;

    // Update metadata for bid/ask
    el.goldMeta.textContent = `Bid: ${convert(goldBid)} | Ask: ${convert(goldAsk)}`;
    el.silverMeta.textContent = `Bid: ${convert(silverBid)} | Ask: ${convert(silverAsk)}`;

    // Update status and last updated time
    el.status.textContent = "● LIVE DATA";
    el.status.className = "status live";
    el.lastUpdated.textContent = `Updated: ${new Date().toLocaleString()}`;

    render();

  } catch (e) {
    console.error("Error processing data:", e);
    el.status.textContent = "● OFFLINE (Error fetching data)";
    el.status.className = "status offline";
  } finally {
    setTimeout(tick, 1000); // Refetch every second
  }
}

// Unit toggle should re-render immediately (no refetch needed)
el.unit.addEventListener("change", render);

// Start the process
render();
tick();
