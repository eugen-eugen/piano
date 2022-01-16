onload=function(){
    const borderWidth=1;
    const keyboardWidth=1400;
    const keyboardHeight=keyboardWidth*14.5/(2.2*52);
    const keyboard=this.document.getElementById("keyboard");
    keyboard.style.width=keyboardWidth+"px";
    keyboard.style.height=keyboardHeight+"px";
    const witheWidth=keyboardWidth/52;
    const blackWidth=witheWidth/2.2;
    const blackHeight=keyboardHeight*9.5/14.5;
    const blackOffsets={
        "c": witheWidth-blackWidth/2,
        "d": 2*witheWidth-blackWidth/2,
        "f": 4*witheWidth-blackWidth/2,
        "g": 5*witheWidth-blackWidth/2,
        "a": 6*witheWidth-blackWidth/2,
    }
    var whites= Array.from(this.document.getElementsByClassName("white"));
    whites.forEach(white => {
        white.style.width=(witheWidth-2*borderWidth)+"px";
        white.style.height=(keyboardHeight-2*borderWidth) + "px";
        white.style.borderWidth=borderWidth;
        white.innerHTML="*"
    });
    var blacks= Array.from(this.document.getElementsByClassName("black"));
    blacks.forEach(black => {
        const oktave=parseInt(black.id.substring(1,2));
        const note=black.id.substring(2,3);
        const oktaveShift=witheWidth*(oktave*7-5);
        const shift=oktaveShift+blackOffsets[note];
        black.style.left=shift+"px";
        black.style.width=blackWidth+"px";
        black.style.height=blackHeight+"px";
    });
}

const context = new AudioContext({latencyHint: 0.01});
osc=context.createOscillator();
osc.connect(context.destination);

const sqrt12=2**(1/12);
const shift2A={
    "c": 1/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12,
    "c#": 1/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12,
    "d": 1/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12,
    "d#": 1/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12,
    "e": 1/sqrt12/sqrt12/sqrt12/sqrt12/sqrt12,
    "f": 1/sqrt12/sqrt12/sqrt12/sqrt12,
    "f#": 1/sqrt12/sqrt12/sqrt12,
    "g": 1/sqrt12/sqrt12,
    "g#": 1/sqrt12,
    "a": 1,
    "a#": 1*sqrt12,
    "b": 1*sqrt12*sqrt12,
}

var real = new Float32Array(100);
var imag = new Float32Array(100);

real=[0, 0, -0.203569, 0.5, -0.401676, 0.137128, -0.104117, 0.115965,
    -0.004413, 0.067884, -0.00888, 0.0793, -0.038756, 0.011882,
    -0.030883, 0.027608, -0.013429, 0.00393, -0.014029, 0.00972,
    -0.007653, 0.007866, -0.032029, 0.046127, -0.024155, 0.023095,
    -0.005522, 0.004511, -0.003593, 0.011248, -0.004919, 0.008505];
imag= [0, 0.147621, 0, 0.000007, -0.00001, 0.000005, -0.000006, 0.000009,
        0, 0.000008, -0.000001, 0.000014, -0.000008, 0.000003,
        -0.000009, 0.000009, -0.000005, 0.000002, -0.000007, 0.000005,
        -0.000005, 0.000005, -0.000023, 0.000037, -0.000021, 0.000022,
        -0.000006, 0.000005, -0.000004, 0.000014, -0.000007, 0.000012];
waveTable=makeWaveTable(context);

var oscillators={};
var mDown = false;

function mup(event){
    console.log("mup:");
    mDown=false;
   stopNote(event);
}
function mdown(event){
   console.log("mdown");
   mDown=true;
   playNote(event);
}

var nowTouchOver;
function tend(event){
    console.log("tend");
    key=document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    mDown=false;
    nowTouchOver=null;
   stopNote({target: key});
}

function tstart(event){
    console.log("tstart");
    event.preventDefault();
   mDown=true;
   playNote(event);
}

function tmove(event){
    console.log("tmove", event.target);
    mDown=true;
    event.preventDefault();
    key=document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
    if (key){
        if (nowTouchOver != key){
            var keyout=nowTouchOver;
            var keyin=key;
            nowTouchOver=key;
            mout({target:keyout});
            mover({target: keyin});
        }
    }
}

function mover(event){
    console.log("mover");
    if (mDown){
        playNote(event);
    }
}

function mout(event){
    console.log("mout");
    if (event.target.id==="keyboard"){
        mup(event)
    }
    if (mDown){
        stopNote(event);
    }
}

function playNote(event){
    event.target.classList.add("pressed");
    var osc=oscillators[event.target.id];
    if (osc)
    {
        osc.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.1)
        osc.gain.linearRampToValueAtTime(0, context.currentTime + 2)
        return;
    }
    const oktave=parseInt(event.target.id.substring(1,2));
    const note=event.target.id.substring(2, 4);
    osc=context.createOscillator();
    var g = context.createGain();
    g.gain.value=0.25;
    g.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.1)
    g.gain.linearRampToValueAtTime(0, context.currentTime + 2)
    osc.connect(g);
    g.connect(context.destination);
    oscillators[event.target.id]={osc: osc, gain: g.gain};
    osc.frequency.value=27.5*2**(oktave)*shift2A[note];
    var wave = waveTable["piano"];
    for (let i = wave.length-1; i >= 0; i--) {
        if (wave[i].freq <=osc.frequency){
            osc.setPeriodicWave(wave[i].wave);
            break;
        }
    }
    osc.start(0);
//    osc.stop(context.currentTime + 3);

}

function stopNote(event){ 
    var osc=oscillators[event.target.id];
    if (osc){
        osc.gain.linearRampToValueAtTime(0, context.currentTime + 0.2);
    }
    event.target.classList.remove("pressed");
    document.getElementById("baseLatency").innerText=context.baseLatency;
    document.getElementById("outputLatency").innerText=context.outputLatency;

}