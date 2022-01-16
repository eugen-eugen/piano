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

const context = new AudioContext();
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

var real = new Float32Array(4);
var imag = new Float32Array(4);

real[0] =0;
imag[0] = 0;
real[1] = 1;
imag[1] = 0;
real[2] = 0;
imag[2] = 1;
real[3] = 0.5;
imag[3] = 0;
real[4] = 0.25;
imag[4] = 0.25;
real[5] = 0.20;
imag[5] = 0.20;
real[6] = 0.15;
imag[6] = 0.15;
real[7] = 0.10;
imag[7] = 0.10;

var wave = context.createPeriodicWave(real, imag, {disableNormalization: true});

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
    key=document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    mDown=false;
    nowTouchOver=null;
    console.log("tend", key);
   stopNote({target: key});
}

function tstart(event){
   event.preventDefault();
   console.log("tstart", event.target);
   mDown=true;
   playNote(event);
}

function tmove(event){
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
    console.log("pmove", event.touches[0].clientX+"/"+event.touches[0].clientY, document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY));
}

function mover(event){
    if (mDown){
        playNote(event);
    }
}

function mout(event){
    if (event.target.id==="keyboard"){
        mup(event)
    }
    if (mDown){
        stopNote(event);
    }
}

function playNote(event){
    event.target.classList.add("pressed");
    const oktave=parseInt(event.target.id.substring(1,2));
    const note=event.target.id.substring(2, 4);
    var osc=oscillators[event.target.id];
    osc=context.createOscillator();
    osc.setPeriodicWave(wave);
    var g = context.createGain();
    g.gain.value=0.25;
    osc.connect(g);
    g.connect(context.destination);
    oscillators[event.target.id]=osc;
    osc.frequency.value=27.5*2**(oktave)*shift2A[note];
    osc.start(0);
    osc.stop(context.currentTime + 1);

}

function stopNote(event){ 
    var osc=oscillators[event.target.id];
    osc.stop();
    event.target.classList.remove("pressed");
}