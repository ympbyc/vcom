window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

window.tokenizer = null;

let repl = window.repl;
let recognition = new SpeechRecognition();
let grammarList = new SpeechGrammarList();
recognition.grammers = grammarList;

recognition.continuous = true;
recognition.lang = 'ja-JP';
recognition.interimResults = true;
recognition.maxAlternatives = 3;

const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const diagnostic = document.querySelector('#output');
const hints = document.querySelector('.hints');
const error_output = document.querySelector('#error');
const stack_display = document.querySelector("#stack");

function onrecognition (transcript) {
    transcript = specialform(transcript);
    if (kotoba(tokenizer.tokenize(transcript)))
        state.program.push(transcript);
    /*
      try { repl.forth.run(transcript, repl.onForthOutput); }
      catch (err) {
      console.log(err);
      if (typeof err === "string") error_output.innerHTML = err;
      }*/
    stack_display.innerHTML = state.stack.map((x)=>'<div class="stack-element">'+JSON.stringify(x)+'</div>').join("");
}

recognition.onresult = function(event) {
    let interimTranscript = ''; // 暫定(灰色)の認識結果
    for (let i = event.resultIndex; i < event.results.length; i++) {
        let transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            onrecognition(transcript);
        } else {
            interimTranscript = transcript;
        }
        console.log('Confidence: ' + event.results[i][0].confidence);
    }
    diagnostic.innerHTML = state.program.join(" ") + ' <i style="color:#ddd;">' + interimTranscript + '</i>';
};


function speak_synth (text) {
    let utt = new SpeechSynthesisUtterance(text);
    utt.voice = state.voice();
    window.speechSynthesis.speak(utt);
}


recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
};

recognition.onend = (event) => {
    document.bgColor = '#fff';
    if (rec) rec.recording = true;
};

startBtn.onclick = () => {
    recognition.start();
};
stopBtn.onclick = () => {
    recognition.stop();
};


kuromoji.builder({ dicPath: "lib/kuromoji.js/dict/" }).build(function (err, tokenizer) {
    window.tokenizer = tokenizer;
});


var rec;

document.querySelector("#clap-detect").addEventListener("click", (e)=>{
    rec = new Recording(function(data){
        if(detectClap(data) && this.recording){
            recognition.start();
            document.bgColor = 'rgb('+Math.random()*255+','+Math.random()*255+','+Math.random()*255+')';
            this.recording = false;
        }
    });
});
