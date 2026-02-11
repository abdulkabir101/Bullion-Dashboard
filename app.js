// Unit Conversion Constants
const GRAMS_PER_OZ = 31.1035;
const TOLA_PER_OZ = 2.6667;

// Initialize variables for unit and currency
const unit = document.getElementById('unit');  // Get the unit selector
const currency = document.getElementById('currency');  // Get the currency selector

const state = {
  fx: 3.6725, // Example: Set default FX rate
  gold: null,
  silver: null,
  goldHigh: -Infinity,
  goldLow: Infinity,
  silverHigh: -Infinity,
  silverLow: Infinity,
};

// Convert price based on unit and currency
function convert(value) {
  let result = value;

  // Convert based on selected unit
  if (unit.value === 'g') result = value / GRAMS_PER_OZ;  // Convert from oz to gram
  if (unit.value === 'tola') result = value / TOLA_PER_OZ;  // Convert from oz to tola

  // If currency is AED, convert using the current FX rate
  if (currency.value === 'AED') result = result * state.fx;

  return result.toFixed(2);  // Format to 2 decimal places
}

// Update the UI with the fetched and converted prices
function updateDisplay() {
  // Update Silver price (XAG)
  if (state.silver !== null) {
    document.getElementById('silver-price').textContent = convert(state.silver);
    document.getElementById('silver-high').textContent = convert(state.silverHigh);
    document.getElementById('silver-low').textContent = convert(state.silverLow);
    applyHighLowColor(document.getElementById('silver-price'), state.silver, state.silverHigh, state.silverLow);
  }

  // Update Gold price (XAU)
  if (state.gold !== null) {
    document.getElementById('gold-price').textContent = convert(state.gold);
    document.getElementById('gold-high').textContent = convert(state.goldHigh);
    document.getElementById('gold-low').textContent = convert(state.goldLow);
    applyHighLowColor(document.getElementById('gold-price'), state.gold, state.goldHigh, state.goldLow);
  }
}

// Apply color changes based on high/low prices
function applyHighLowColor(priceElement, currentPrice, highPrice, lowPrice) {
  priceElement.classList.remove('high', 'low', 'neutral');

  if (currentPrice === highPrice) {
    priceElement.classList.add('high');
  } else if (currentPrice === lowPrice) {
    priceElement.classList.add('low');
  } else {
    priceElement.classList.add('neutral');
  }
}

// Fetch prices from the API
async function fetchPrices() {
  const instrument = 'XAG/USD'; // or dynamically change this for XAU/USD
  const url = `https://bullion-dashboard.vercel.app/api/quote?instrument=${instrument}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const bid = data?.bboQuotes?.[0]?.bid;  // Adjust according to your API structure
    const ask = data?.bboQuotes?.[0]?.ask;

    if (bid && ask) {
      const mid = (bid + ask) / 2; // Calculate mid price

      // Update state with the fetched prices
      if (instrument === 'XAG/USD') {
        state.silver = mid;
        state.silverHigh = Math.max(state.silverHigh, mid);
        state.silverLow = Math.min(state.silverLow, mid);
      } else if (instrument === 'XAU/USD') {
        state.gold = mid;
        state.goldHigh = Math.max(state.goldHigh, mid);
        state.goldLow = Math.min(state.goldLow, mid);
      }

      // Apply the selected unit conversion
      updateDisplay();
    } else {
      console.error('Invalid bid/ask data');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

setInterval(fetchPrices, 1000); // Fetch prices every 1 second
