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
   releaseKey(event);
}
function mdown(event){
   console.log("mdown");
   mDown=true;
   pressKey(event);
}

var nowTouchOver;
function tend(event){
    console.log("tend");
    key=document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    mDown=false;
    nowTouchOver=null;
   stopNote(key.id);
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
        pressKey(event);
    }
}

function mout(event){
    console.log("mout");
    if (event.target.id==="keyboard"){
        mup(event)
    }
    if (mDown){
        releaseKey(event);
    }
}


function pressKey(event){
    stopQuiz(event.target.id);
    event.target.classList.add("pressed");
    playNote(event.target.id);
}

function playNote(id){
    var osc=oscillators[id];
    if (osc)
    {
        startSound(osc.gain)
        return;
    }
    const oktave=parseInt(id.substring(1,2));
    const note=id.substring(2, 4);
    osc=context.createOscillator();
    var g = context.createGain();
    g.gain.value=0.25;
    osc.connect(g);
    g.connect(context.destination);
    startSound(g.gain)
    oscillators[id]={osc: osc, gain: g.gain};
    osc.frequency.value=27.5*2**(oktave)*shift2A[note];
    var wave = waveTable["piano"];
    for (let i = wave.length-1; i >= 0; i--) {
        if (wave[i].freq <=osc.frequency){
            osc.setPeriodicWave(wave[i].wave);
            break;
        }
    }
    osc.start(0);

}

function releaseKey(event){
    event.target.classList.remove("pressed");
    stopNote(event.target.id);
    startQuiz();
}
function stopNote(id){ 
    var osc=oscillators[id];
    if (osc){
        osc.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
    }
}

function startSound(gain){
    gain.cancelAndHoldAtTime(context.currentTime);
    gain.exponentialRampToValueAtTime(0.05, context.currentTime)
    gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.001)
    gain.linearRampToValueAtTime(0, context.currentTime + 5)
}
var quiz=null;
var score=0;
function startQuiz(){
    if (null!=quiz){
        return;
    }
    oktave=Math.round(Math.random()*4)+3;
    note=Object.keys(shift2A)[Math.round(Math.random()*11)];
    quiz={note: "o"+oktave+note};
    quiz.timer=setTimeout(()=>{
        cs=document.getElementsByClassName("correct");
        Array.from(cs).forEach(c=>c.classList.remove("correct"));
        quiz.sounds=true; playNote(quiz.note)
    }, 3000);
    quiz.guesses=0;
}
function stopQuiz(id){
    if (null===quiz || null===quiz.sounds){
        return;
    }
    quiz.guesses++;
    if (id===quiz.note || quiz.guesses>=4){
        score+=3-quiz.guesses;
        document.getElementById("score").innerHTML="Score: "+score;
        if (quiz.guesses>=4){
            document.getElementById(quiz.note).classList.add("correct");
        }
        quiz=null;
        return
    }
 
}