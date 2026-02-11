// Gold API (CORS enabled)
const API = {
  gold: "https://api.gold-api.com/price/XAU",
  silver: "https://api.gold-api.com/price/XAG"
};

const GRAMS_PER_OZ = 31.1035;
const TOLA_PER_OZ = 2.6667;

let state = {
  gold: null,
  silver: null,
  goldHigh: -Infinity,
  goldLow: Infinity,
  silverHigh: -Infinity,
  silverLow: Infinity
};

const goldEl = document.getElementById("gold-price");
const silverEl = document.getElementById("silver-price");

function updateClock() {
  document.getElementById("clock").innerText =
    new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

function convert(value) {
  const unit = document.getElementById("unit").value;
  const currency = document.getElementById("currency").value;

  let result = value;

  if (unit === "g") result = value / GRAMS_PER_OZ;
  if (unit === "tola") result = value / TOLA_PER_OZ;

  // Gold API already returns USD
  if (currency === "AED") result *= 3.6725;

  return result.toFixed(2);
}

function updateDisplay() {
  if (state.gold !== null) {
    goldEl.innerText = convert(state.gold);
    document.getElementById("gold-high").innerText = convert(state.goldHigh);
    document.getElementById("gold-low").innerText = convert(state.goldLow);

    goldEl.className =
      "price " +
      (state.gold >= state.goldHigh
        ? "high"
        : state.gold <= state.goldLow
        ? "low"
        : "neutral");
  }

  if (state.silver !== null) {
    silverEl.innerText = convert(state.silver);
    document.getElementById("silver-high").innerText = convert(state.silverHigh);
    document.getElementById("silver-low").innerText = convert(state.silverLow);

    silverEl.className =
      "price " +
      (state.silver >= state.silverHigh
        ? "high"
        : state.silver <= state.silverLow
        ? "low"
        : "neutral");
  }
}

async function fetchPrices() {
  try {
    const [goldRes, silverRes] = await Promise.all([
      fetch(API.gold),
      fetch(API.silver)
    ]);

    const goldData = await goldRes.json();
    const silverData = await silverRes.json();

    state.gold = goldData.price;
    state.silver = silverData.price;

    if (state.gold > state.goldHigh) state.goldHigh = state.gold;
    if (state.gold < state.goldLow) state.goldLow = state.gold;

    if (state.silver > state.silverHigh) state.silverHigh = state.silver;
    if (state.silver < state.silverLow) state.silverLow = state.silver;

    document.getElementById("connection-status").innerText = "● LIVE DATA";
    document.getElementById("connection-status").style.color = "#00ff88";

    updateDisplay();
  } catch (err) {
    document.getElementById("connection-status").innerText =
      "● OFFLINE";
    document.getElementById("connection-status").style.color = "red";
  }
}

document.getElementById("currency").addEventListener("change", updateDisplay);
document.getElementById("unit").addEventListener("change", updateDisplay);

setInterval(fetchPrices, 1000);
fetchPrices();
