window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

let commands = [ '-1', '0', '1', '2', 'rotate', 'swap', 'dup', 'add', 'subtract',  'multiply', 'divide'];
let grammar = '#JSGF V1.0; grammar commands; public <commands> = ' + commands.join(' | ') + ' ;';

let recognition = new SpeechRecognition();
let speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;

recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const diagnostic = document.querySelector('.output');
const hints = document.querySelector('.hints');

hints.innerHTML = commands.join(", ");

let program = [];

recognition.onresult = function(event) {
  let interimTranscript = ''; // 暫定(灰色)の認識結果
  for (let i = event.resultIndex; i < event.results.length; i++) {
    let transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      program.push(transcript);
    } else {
      interimTranscript = transcript;
    }
    console.log('Confidence: ' + event.results[i][0].confidence);
  }
  diagnostic.textContent = program.join(" ") + ' <i style="color:#ddd;">' + interimTranscript + '</i>';
};


recognition.onnomatch = function(event) {
  diagnostic.textContent = "I didn't recognise that color.";
};

recognition.onerror = function(event) {
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
};

recognition.onend = (event) => {
    // 一定時間入力が無いと終了するので継続する
    recognition.start();
};

startBtn.onclick = () => {
  recognition.start();
};
stopBtn.onclick = () => {
  recognition.stop();
};
