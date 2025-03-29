// Pluralize helper function
// If count != 1, add 's' to noun, e.g. "1 heater" vs "3 heaters"
const pluralize = (count, noun, suffix = 's') =>
  `${count} ${noun}${count !== 1 ? suffix : ''}`;

// Sync the Heater Routing <-> Heaters count
function syncCount(source) {
  const routingElem = document.getElementById('routingCount');
  const heaterElem  = document.getElementById('heaterCount');
  const rVal = parseFloat(routingElem.value) || 0;
  const hVal = parseFloat(heaterElem.value)  || 0;

  if(source === 'routing') {
    // user changed the routing count => copy to heaters
    heaterElem.value = rVal;
  } else if(source === 'heater') {
    // user changed the heater count => copy to routing
    routingElem.value = hVal;
  }
}

// Sync the Heater Routing <-> Heaters current
function syncCurrent(source) {
  const routingCurElem = document.getElementById('routingCurrent');
  const heaterCurElem  = document.getElementById('heaterCurrent');
  const rv = parseFloat(routingCurElem.value) || 0;
  const hv = parseFloat(heaterCurElem.value)  || 0;

  if(source === 'routing') {
    // user changed routing => copy to heater
    heaterCurElem.value = rv;
  } else if(source === 'heater') {
    // user changed heaters => copy to routing
    routingCurElem.value = hv;
  }
}

// Format helper:
// - isCount = true => integer
// - else => two decimal places
function fmt(value, isCount=false) {
  if (isCount) {
    return parseInt(value, 10).toString(); // no decimals
  } else {
    if (!Number.isFinite(value)) {
      return "NaN";
    }
    return value.toFixed(2); // two decimal places
  }
}

function calculate() {
  // 1) Grab user input
  const routingRho_uOhmM    = parseFloat(document.getElementById('routingRho').value);
  const routingLength_mm    = parseFloat(document.getElementById('routingLength').value);
  const routingWidth_um     = parseFloat(document.getElementById('routingWidth').value);
  const routingHeight_nm    = parseFloat(document.getElementById('routingHeight').value);
  const routingCount        = parseInt(document.getElementById('routingCount').value, 10);
  const routingCurrent_mA   = parseFloat(document.getElementById('routingCurrent').value);

  const heaterRho_uOhmM     = parseFloat(document.getElementById('heaterRho').value);
  const heaterLength_mm     = parseFloat(document.getElementById('heaterLength').value);
  const heaterWidth_um      = parseFloat(document.getElementById('heaterWidth').value);
  const heaterHeight_nm     = parseFloat(document.getElementById('heaterHeight').value);
  const heaterCount         = parseInt(document.getElementById('heaterCount').value, 10);
  const heaterCurrent_mA    = parseFloat(document.getElementById('heaterCurrent').value);

  const groundRho_uOhmM     = parseFloat(document.getElementById('groundRho').value);
  const groundLength_mm     = parseFloat(document.getElementById('groundLength').value);
  const groundWidth_um      = parseFloat(document.getElementById('groundWidth').value);
  const groundHeight_nm     = parseFloat(document.getElementById('groundHeight').value);
  const groundCount         = parseInt(document.getElementById('groundCount').value, 10);

  // 2) Convert to SI
  const rhoRouting_SI       = routingRho_uOhmM   * 1e-6;
  const rhoHeater_SI        = heaterRho_uOhmM    * 1e-6;
  const rhoGround_SI        = groundRho_uOhmM    * 1e-6;

  const routingLength_m     = routingLength_mm   * 1e-3;
  const heaterLength_m      = heaterLength_mm    * 1e-3;
  const groundLength_m      = groundLength_mm    * 1e-3;

  const routingWidth_m      = routingWidth_um    * 1e-6;
  const heaterWidth_m       = heaterWidth_um     * 1e-6;
  const groundWidth_m       = groundWidth_um     * 1e-6;

  const routingHeight_m     = routingHeight_nm   * 1e-9;
  const heaterHeight_m      = heaterHeight_nm    * 1e-9;
  const groundHeight_m      = groundHeight_nm    * 1e-9;

  const routingCurrent_A    = routingCurrent_mA  * 1e-3;
  const heaterCurrent_A     = heaterCurrent_mA   * 1e-3;

  // 3) Cross-sectional areas
  const routingArea_m2      = routingWidth_m     * routingHeight_m;
  const heaterArea_m2       = heaterWidth_m      * heaterHeight_m;
  const groundArea_m2       = groundWidth_m      * groundHeight_m;

  // 4) Resistances
  const routingResistance   = (rhoRouting_SI * routingLength_m) / routingArea_m2;
  const heaterResistance    = (rhoHeater_SI  * heaterLength_m ) / heaterArea_m2;
  const groundResistance    = (rhoGround_SI  * groundLength_m ) / groundArea_m2;

  // 5) Power => P = I^2 * R
  const routingPower_W      = routingCurrent_A * routingCurrent_A * routingResistance;
  const heaterPower_W       = heaterCurrent_A  * heaterCurrent_A  * heaterResistance;

  // totalIn = heaterCount*heaterCurrent or routingCount*routingCurrent
  const totalIn_mA = heaterCount * heaterCurrent_mA; 
  const soloGroundCurrent_mA = (groundCount > 0) ? totalIn_mA / groundCount : 0;
  const soloGroundCurrent_A  = soloGroundCurrent_mA * 1e-3;

  const groundPowerOne_W     = soloGroundCurrent_A * soloGroundCurrent_A * groundResistance;

  // Convert to mW
  const routingPower_mW      = routingPower_W   * 1e3;
  const heaterPower_mW       = heaterPower_W    * 1e3;
  const groundPowerOne_mW    = groundPowerOne_W * 1e3;

  // Multiply single-device power by count
  const routingPowerTotal_mW = routingPower_mW * routingCount;
  const heaterPowerTotal_mW  = heaterPower_mW  * heaterCount;
  const groundPowerTotal_mW  = groundPowerOne_mW * groundCount;

  // Power density => single-device power / length (mm)
  const routingPowerDensity_mWpermm = routingPower_mW / routingLength_mm;
  const heaterPowerDensity_mWpermm  = heaterPower_mW  / heaterLength_mm;
  const groundPowerDensity_mWpermm  = groundPowerOne_mW / groundLength_mm;

  // Sum all powers
  const combinedTotal_mW     = routingPowerTotal_mW + heaterPowerTotal_mW + groundPowerTotal_mW;

  // Solo Current row
  const routingSoloCurrent_mA = routingCurrent_mA;
  const heaterSoloCurrent_mA  = heaterCurrent_mA;
  const groundSoloCurrent_mA  = soloGroundCurrent_mA;

  // Set results
  // Optionally use a pluralize() for the count
  document.getElementById('resRoutingCount').textContent  = fmt(routingCount, true);
  document.getElementById('resHeaterCount').textContent   = fmt(heaterCount, true);
  document.getElementById('resGroundCount').textContent   = fmt(groundCount, true);

  document.getElementById('resRoutingSoloCurrent').textContent  = fmt(routingSoloCurrent_mA);
  document.getElementById('resHeaterSoloCurrent').textContent   = fmt(heaterSoloCurrent_mA);
  document.getElementById('resGroundSoloCurrent').textContent   = fmt(groundSoloCurrent_mA);

  document.getElementById('resRoutingResistance').textContent   = fmt(routingResistance);
  document.getElementById('resHeaterResistance').textContent    = fmt(heaterResistance);
  document.getElementById('resGroundResistance').textContent    = fmt(groundResistance);

  document.getElementById('resRoutingPower').textContent        = fmt(routingPower_mW);
  document.getElementById('resHeaterPower').textContent         = fmt(heaterPower_mW);
  document.getElementById('resGroundPower').textContent         = fmt(groundPowerOne_mW);

  document.getElementById('resRoutingPowerDensity').textContent = fmt(routingPowerDensity_mWpermm);
  document.getElementById('resHeaterPowerDensity').textContent  = fmt(heaterPowerDensity_mWpermm);
  document.getElementById('resGroundPowerDensity').textContent  = fmt(groundPowerDensity_mWpermm);

  document.getElementById('resRoutingTotalPower').textContent   = fmt(routingPowerTotal_mW);
  document.getElementById('resHeaterTotalPower').textContent    = fmt(heaterPowerTotal_mW);
  document.getElementById('resGroundTotalPower').textContent    = fmt(groundPowerTotal_mW);

  document.getElementById('resCombinedPower').textContent       = fmt(combinedTotal_mW);
  document.getElementById('resCombinedCurrent').textContent     = fmt(totalIn_mA);
}

// Optional: run calculate once on page load
window.addEventListener('DOMContentLoaded', () => {
  calculate();
});

