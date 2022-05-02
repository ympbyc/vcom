window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

window.tokenizer = null;

let repl = window.repl;
let recognition = new SpeechRecognition();
let grammarList = new SpeechGrammarList();
recognition.grammers = grammarList;



/*let CLOS = window.CLOS;

let Stack = CLOS.define_class();
let Text = CLOS.define_class([], (x)=>{
    return CLOS.slot_exists(x, "content", "string");
});

const car = (xs) => xs[0];
const cdr = (xs) => xs.slice(1);
const cons = (x, xs) => [x].concat(xs);

var exec = CLOS.define_generic();

CLOS.define_method(exec, [Stack, Function], (s, f)=>f(s));
CLOS.define_method(exec, [Stack, Array], (s, ws)=>ws.reduce((s, w)=>exec(s,w), s));
CLOS.define_method(exec, [Stack, Text], (s, x)=>[x].concat(s));
CLOS.define_method(exec, [Stack, undefined], (s, x)=>[x].concat(s)); //push
*/

let words = repl.forth.dataSpace.filter((x)=>x.name).map((x)=>x.name);

let grammar = '#JSGF V1.0; grammar words; public <word> = ' +
    [...Array(11).keys()].concat(words).join(' | ') + ' ;';
grammarList.addFromString(grammar, 1);

recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');
const diagnostic = document.querySelector('#output');
const hints = document.querySelector('.hints');
const error_output = document.querySelector('#error');


hints.innerHTML = grammar;

let program = [];

recognition.onresult = function(event) {
    let interimTranscript = ''; // 暫定(灰色)の認識結果
    for (let i = event.resultIndex; i < event.results.length; i++) {
        let transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            program.push(transcript);
            try { repl.forth.run(transcript, repl.onForthOutput); }
            catch (err) {
                console.log(err);
                if (typeof err === "string") error_output.innerHTML = err;
            }
        } else {
            interimTranscript = transcript;
        }
        console.log('Confidence: ' + event.results[i][0].confidence);
    }
    diagnostic.innerHTML = program.join(" ") + ' <i style="color:#ddd;">' + interimTranscript + '</i>';
};


recognition.onnomatch = function(event) {
    diagnostic.textContent = "I didn't recognise that color.";
};

recognition.onerror = function(event) {
    diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
};

recognition.onend = (event) => {
    // 一定時間入力が無いと終了するので継続する
    //recognition.start();
};

startBtn.onclick = () => {
    recognition.start();
};
stopBtn.onclick = () => {
    recognition.stop();
};


kuromoji.builder({ dicPath: "lib/kuromoji.js/dict/" }).build(function (err, tokenizer) {
    // tokenizer is ready
    //var path = tokenizer.tokenize("すもももももももものうち");
    window.tokenizer = tokenizer;
});
