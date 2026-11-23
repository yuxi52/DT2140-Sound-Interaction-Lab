let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

let bellReady = true;
let bellStopTimer = null;

// Must match bells.wasm
const dspName = "bells";
const instance = new FaustWasm2ScriptProcessor(dspName);

if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// Load bells.wasm
bells.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);

        console.log("params:", dspNode.getParams());

        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams;
    })
    .catch(error => {
        console.error("Could not load bells.wasm:", error);
    });

// Phone upright in portrait orientation:
// acceleration Y becomes close to -9.8 or 9.8, depending on the device.
function accelerationChange(accx, accy, accz) {
    // Do nothing here
}

function rotationChange(rotx, roty, rotz) {
    // Phone is upright when Rotation X is close to +/- 90 degrees
    const phonePointsUp = Math.abs(rotx) > 70 && Math.abs(rotx) < 110;

    if (phonePointsUp && bellReady) {
        playBell();
        bellReady = false;
    }

    if (!phonePointsUp) {
        bellReady = true;
    }
}

function mousePressed() {
    // Do nothing: prevents the bell from playing when Turn On DSP is clicked
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}

function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

function playBell() {
    if (!dspNode || audioContext.state === "suspended") {
        return;
    }

    dspNode.setParamValue("/englishBell/gate", 1);

    clearTimeout(bellStopTimer);
    bellStopTimer = setTimeout(() => {
        dspNode.setParamValue("/englishBell/gate", 0);
    }, 100);
}