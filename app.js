// DOM Elements
const turnoverSlider = document.getElementById('turnoverSlider');
const turnoverInput = document.getElementById('turnoverInput');
const feeSlider = document.getElementById('feeSlider');
const feeDisplay = document.getElementById('feeDisplay');
const irisSlider = document.getElementById('irisSlider');

const currentCostEl = document.getElementById('currentCost');
const irisCostEl = document.getElementById('irisCost');
const savingsCostEl = document.getElementById('savingsCost');

// Constants
let IRIS_FEE_PERCENT = 0.49;

// Secret URL Parameter Logic (5 Days)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('customFee') && urlParams.has('expires')) {
  const expires = parseInt(urlParams.get('expires'), 10);
  if (Date.now() < expires) {
    let customFee = parseFloat(urlParams.get('customFee'));
    if (!isNaN(customFee) && customFee >= 0) {
      IRIS_FEE_PERCENT = customFee;
    }
  } else {
    alert("Специалната оферта е изтекла.");
  }
}
window.IRIS_FEE_PERCENT = IRIS_FEE_PERCENT;

// Keep track of current values for animations
let currentCompetitorCost = 0;
let currentIrisCost = 0;
let currentSavings = 0;

// Format number with spaces (e.g. 1 000 000)
function formatNumber(num) {
  return num.toLocaleString('bg-BG');
}

// Format as currency (e.g. 15 000 €)
function formatCurrency(num) {
  return formatNumber(Math.round(num)) + ' €';
}

// Parse formatted number string back to integer
function parseNumberString(str) {
  const clean = str.replace(/\s/g, '').replace(/[^0-9]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Update background gradient of range sliders to show active progress fill
function updateSliderBackground(slider, min, max, value) {
  const percent = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--primary-blue) 0%, var(--primary-blue) ${percent}%, #dee4ec ${percent}%, #dee4ec 100%)`;
}

// Animate numeric changes smoothly
function animateNumber(element, startVal, endVal, duration = 300, isCurrency = true) {
  const startTime = performance.now();
  const range = endVal - startVal;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    if (elapsed >= duration) {
      element.innerHTML = isCurrency ? formatCurrency(endVal) : formatNumber(endVal);
      if (element.id === 'savingsCost') {
        element.innerHTML = formatCurrency(endVal) + '<span>' + (window.currentSavingsSuffix || '/ год.') + '</span>';
      }
      return;
    }

    const progress = elapsed / duration;
    // Ease out quad
    const easeProgress = progress * (2 - progress);
    const currentVal = startVal + range * easeProgress;
    
    if (element.id === 'savingsCost') {
      element.innerHTML = formatCurrency(currentVal) + '<span>' + (window.currentSavingsSuffix || '/ год.') + '</span>';
    } else {
      element.innerHTML = isCurrency ? formatCurrency(currentVal) : formatNumber(currentVal);
    }
    
    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Perform calculations and update UI
window.calculate = function calculate() {
  const turnover = parseNumberString(turnoverInput.value);
  const competitorFeePercent = parseFloat(feeSlider.value);

  // Math
  const competitorCost = (turnover * competitorFeePercent) / 100;
  const irisCost = (turnover * IRIS_FEE_PERCENT) / 100;
  const savings = competitorCost - irisCost;

  // Animate the values from their previous state
  animateNumber(currentCostEl, currentCompetitorCost, competitorCost);
  animateNumber(irisCostEl, currentIrisCost, irisCost);
  animateNumber(savingsCostEl, currentSavings, savings);

  // Store current states for next animation cycle
  currentCompetitorCost = competitorCost;
  currentIrisCost = irisCost;
  currentSavings = savings;
}

// Handle turnover slider movement
turnoverSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  turnoverInput.value = formatNumber(val);
  updateSliderBackground(turnoverSlider, 100000, 10000000, val);
  calculate();
});

// Handle manual text entry in turnover input box
turnoverInput.addEventListener('input', (e) => {
  // Strip non-digits and preserve cursor position as much as possible
  let cursorPosition = e.target.selectionStart;
  const rawLength = e.target.value.length;
  
  const rawVal = parseNumberString(e.target.value);
  
  if (rawVal === 0) {
    e.target.value = '';
    return;
  }
  
  e.target.value = formatNumber(rawVal);
  
  // Adjust cursor position to handle newly injected spaces
  const newLength = e.target.value.length;
  cursorPosition = cursorPosition + (newLength - rawLength);
  e.target.setSelectionRange(cursorPosition, cursorPosition);

  // Sync with slider (clamp value visually on slider)
  const clampedVal = Math.min(Math.max(rawVal, 100000), 10000000);
  turnoverSlider.value = clampedVal;
  updateSliderBackground(turnoverSlider, 100000, 10000000, clampedVal);
  
  calculate();
});

// Format input on blur if it's empty or below minimum
turnoverInput.addEventListener('blur', (e) => {
  let val = parseNumberString(e.target.value);
  if (val < 100000) {
    val = 100000;
    e.target.value = formatNumber(val);
    turnoverSlider.value = val;
    updateSliderBackground(turnoverSlider, 100000, 10000000, val);
    calculate();
  }
});

// Handle fee slider movement
feeSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  feeDisplay.textContent = val.toFixed(2) + '%';
  updateSliderBackground(feeSlider, 0.8, 3.0, val);
  calculate();
});

// Initialize on page load
function init() {
  const initialTurnover = parseInt(turnoverSlider.value, 10);
  const initialFee = parseFloat(feeSlider.value);
  
  turnoverInput.value = formatNumber(initialTurnover);
  feeDisplay.textContent = initialFee.toFixed(2) + '%';

  // Initialize sliders backgrounds
  updateSliderBackground(turnoverSlider, 100000, 10000000, initialTurnover);
  updateSliderBackground(feeSlider, 0.8, 3.0, initialFee);
  
  // IRIS Pay Slider is locked at 0.49%. Scale is 0% to 3.0%
  // Progress bar for IRIS Pay: Starts at padlock (0.49% / 0% width) and goes to 0.8% (50% width) to visually highlight the gap
  irisSlider.style.background = `linear-gradient(to right, var(--cyan-blue) 0%, var(--cyan-blue) 50%, #dee4ec 50%, #dee4ec 100%)`;

  // Initial calculations (no animation on load, just set initial state values)
  const competitorCost = (initialTurnover * initialFee) / 100;
  const irisCost = (initialTurnover * IRIS_FEE_PERCENT) / 100;
  const savings = competitorCost - irisCost;

  currentCompetitorCost = competitorCost;
  currentIrisCost = irisCost;
  currentSavings = savings;

  currentCostEl.innerHTML = formatCurrency(competitorCost);
  irisCostEl.innerHTML = formatCurrency(irisCost);
  savingsCostEl.innerHTML = formatCurrency(savings) + '<span>' + (window.currentSavingsSuffix || '/ год.') + '</span>';

  // Update visually if custom fee was applied
  if (IRIS_FEE_PERCENT !== 0.49) {
    irisSlider.value = IRIS_FEE_PERCENT;
    const irisFeeLabel = document.getElementById('irisFeeLabel');
    if (irisFeeLabel) irisFeeLabel.textContent = IRIS_FEE_PERCENT + '%';
  }
}

window.addEventListener('DOMContentLoaded', init);

// Secret Modal Logic
const secretTrigger = document.getElementById('irisFeeLabel');
let clickCount = 0;
let clickTimer = null;

if (secretTrigger) {
  secretTrigger.style.cursor = 'pointer';
  secretTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    if (clickCount === 3) {
      document.getElementById('secretModal').classList.add('active');
      clickCount = 0;
    }
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 500);
  });
}

const closeBtn = document.getElementById('secretCloseBtn');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    document.getElementById('secretModal').classList.remove('active');
    document.getElementById('secretLinkOutput').textContent = '';
  });
}

const generateBtn = document.getElementById('secretGenerateBtn');
if (generateBtn) {
  generateBtn.addEventListener('click', () => {
    const fee = document.getElementById('secretFeeInput').value;
    const expires = Date.now() + (5 * 24 * 60 * 60 * 1000); // 5 days
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('customFee', fee);
    newUrl.searchParams.set('expires', expires);
    
    const linkStr = newUrl.toString();
    document.getElementById('secretLinkOutput').innerHTML = `<a href="${linkStr}" target="_blank">${linkStr}</a><br><br><span style="color: green;">Линкът е валиден 5 дни!</span>`;
    window.open(linkStr, '_blank');
  });
}
