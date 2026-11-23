//==========================================================================================
// AUDIO SETUP
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

let doorStopTimer = null;
const sideMoveThreshold = 2.5;
const maxSideAcceleration = 12;

// Must match door.wasm
const dspName = "door";
const instance = new FaustWasm2ScriptProcessor(dspName);

if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// Must match the WASM filename
door.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);

        console.log("params: ", dspNode.getParams());

        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams;
    });

//==========================================================================================
// INTERACTIONS
//==========================================================================================

// Phone lying flat: accx is approximately left-right acceleration.
function accelerationChange(accx, accy, accz) {
    const sideMovement = Math.abs(accx);

    // Ignore small accidental movements
    if (sideMovement < sideMoveThreshold) {
        return;
    }

    // Convert movement strength to door position: 0 to 0.5
    const doorPosition = Math.min(
        0.5,
        ((sideMovement - sideMoveThreshold) /
            (maxSideAcceleration - sideMoveThreshold)) * 0.5
    );

    playAudio(doorPosition);
}

function rotationChange(rotx, roty, rotz) {
}

// Click on a computer to test the door sound
function mousePressed() {
    playAudio(0.4);
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}

// Do not play the sound here: this detects shaking in every direction.
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);

    console.log("Min value:", exampleMinValue, "Max value:", exampleMaxValue);

    return [exampleMinValue, exampleMaxValue];
}

//==========================================================================================
// AUDIO INTERACTION
//==========================================================================================

function playAudio(doorPosition = 0.7) {
    if (!dspNode || audioContext.state === "suspended") {
        return;
    }

    // This parameter comes from door.dsp
    dspNode.setParamValue("/door/position", doorPosition);

    clearTimeout(doorStopTimer);

    // Stop the creaking shortly after movement stops
    doorStopTimer = setTimeout(() => {
        dspNode.setParamValue("/door/position", 0);
    }, 250);
}

//==========================================================================================
// END
//==========================================================================================