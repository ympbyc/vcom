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
    hints.innerHTML = transcript;
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


recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
};

startBtn.onclick = () => {
    recognition.start();
};
stopBtn.onclick = () => {
    recognition.stop();
};
