// CORS proxy URL
const corsProxy = 'https://api.allorigins.win/get?url=';

let prices = { gold: 0, silver: 0, goldHigh: 0, goldLow: Infinity, silverHigh: 0, silverLow: Infinity };
let fxRate = 3.6725;

// Unit Conversion Constants
const GRAMS_PER_OZ = 31.1035;
const TOLA_PER_OZ = 2.6667;

function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}

async function fetchFX() {
    try {
        const res = await fetch(corsProxy + encodeURIComponent('https://api.exchangerate.host/latest?base=USD&symbols=AED'));
        const data = await res.json();
        if (data.rates && data.rates.AED) {
            fxRate = data.rates.AED;
            console.log(`FX Rate (USD to AED): ${fxRate}`);
        } else {
            throw new Error('Unable to fetch FX rate');
        }
    } catch (e) {
        console.error("FX update failed", e);
    }
}

async function fetchMetals() {
    try {
        const [gRes, sRes] = await Promise.all([
            fetch(corsProxy + encodeURIComponent('https://api.metals.live/v1/spot/gold')),
            fetch(corsProxy + encodeURIComponent('https://api.metals.live/v1/spot/silver'))
        ]);
        
        const gData = await gRes.json();
        const sData = await sRes.json();

        // Check if the data is structured correctly
        if (gData.contents && sData.contents) {
            prices.gold = gData.contents[0][1];
            prices.silver = sData.contents[0][1];

            // Track session high/low
            if (prices.gold > prices.goldHigh) prices.goldHigh = prices.gold;
            if (prices.gold < prices.goldLow) prices.goldLow = prices.gold;
            if (prices.silver > prices.silverHigh) prices.silverHigh = prices.silver;
            if (prices.silver < prices.silverLow) prices.silverLow = prices.silver;

            console.log(`Gold Price: ${prices.gold}, Silver Price: ${prices.silver}`);
            document.getElementById('connection-status').innerText = "● LIVE DATA";
            document.getElementById('connection-status').style.color = "var(--green)";
            updateDisplay();
        } else {
            throw new Error('API data format error');
        }
    } catch (e) {
        console.error("Error fetching metals data", e);
        document.getElementById('connection-status').innerText = "● OFFLINE (CORS BLOCKED)";
        document.getElementById('connection-status').style.color = "red";
    }
}

function convert(val) {
    const unit = document.getElementById('unit').value;
    const curr = document.getElementById('currency').value;
    let result = val;

    if (unit === 'g') result = val / GRAMS_PER_OZ;
    if (unit === 'tola') result = val / TOLA_PER_OZ;
    if (curr === 'AED') result = result * fxRate;

    return result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateDisplay() {
    const gEl = document.getElementById('gold-price');
    const sEl = document.getElementById('silver-price');

    gEl.innerText = convert(prices.gold);
    sEl.innerText = convert(prices.silver);
    
    document.getElementById('gold-high').innerText = convert(prices.goldHigh);
    document.getElementById('gold-low').innerText = convert(prices.goldLow);
    document.getElementById('silver-high').innerText = convert(prices.silverHigh);
    document.getElementById('silver-low').innerText = convert(prices.silverLow);

    // Color Logic
    gEl.className = `price ${prices.gold >= prices.goldHigh ? 'high' : prices.gold <= prices.goldLow ? 'low' : 'neutral'}`;
    sEl.className = `price ${prices.silver >= prices.silverHigh ? 'high' : prices.silver <= prices.silverLow ? 'low' : 'neutral'}`;
}

setInterval(updateClock, 1000);
setInterval(fetchMetals, 1000); 
setInterval(fetchFX, 3600000); // Update FX hourly

fetchMetals();
fetchFX();
