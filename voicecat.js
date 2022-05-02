const car = (xs) => xs[0];
const cdr = (xs) => xs.slice(1);
const cons = (x, xs) => [x].concat(xs);
const last = (xs) => xs[xs.length-1];

let Schedule = CLOS.define_class([], (x)=>{
    return CLOS.slot_exists(x, 'date')
        && CLOS.slot_exists(x, 'subject', 'string');
});

let vocab = {};

function define_word (...args) {
    let subq = args.slice(1,-1);
    let fn = last(args);
    let verb = car(args);
    if ( ! vocab[verb]) vocab[verb] = [];
    vocab[verb].push((st)=>{
        if (subq.every((id)=>eat(st.stack, id))) {
            fn(st);
            return true;
        }
        return false;
    });
}

define_word("読み上げる", (st)=>speak(st.stack.shift()));
define_word("入れ替える", (st)=>{
    let stk = st.stack.slice();
    st.stack[0] = stk[1];
    st.stack[1] = stk[0];
});
define_word("落とす", st=>st.stack.shift());
define_word("終わる", st=>recognition.stop());

define_word("入れる","予定", (st)=>{
    let d = new Date();
    let subject = st.stack.shift();
    (eat(st.stack, "分") && d.setMinutes(st.stack.shift()))
        || d.setMinutes(0);
    eat(st.stack, "時") && d.setHours(st.stack.shift());
    (eat(st.stack, "日") && d.setDate(st.stack.shift()))
        || eat(st.stack, "今日")
        || (eat(st.stack, "明日") && d.setDate(d.getDate()+1))
        || (eat(st.stack, "明後日") && d.setDate(d.getDate()+2))
        || d.setDate(0);
    eat(st.stack, "月") && d.setMonth(st.stack.shift() - 1);
    eat(st.stack, "年") && d.setYear(st.stack.shift());
    let schedule = new Schedule({date: d, subject: subject});
    st.nouns["予定"].unshift(schedule);
    speak(schedule);
});

define_word("する","検索",st=>{
    let query = st.stack.shift();
    let search_history = st.nouns["検索履歴"];
    if (query in search_history)
        speak(search_history[query].Abstract);
    else
        fetch("https://api.duckduckgo.com/?q=" +  query + "&format=json").then((res)=>{res.json().then((x)=>{
            speak(x.Abstract);
            st.nouns["検索履歴"][query] = x;
            console.log(x);
        });});
});
define_word("する","メール",st=>{
    let to = st.stack.shift();
    let text = st.stack.shift();
    /*
      let subject = ask("件名をどうぞ。");
      email(ensure(st.nouns[to].email), subject, text);*/
});
define_word("する","空", st=>st.stack=[]);
define_word("する","保存","記憶", st=>{
    localStorage.setItem(
        "nouns",
        JSON.stringify(st.nouns, (k,v)=>k==="状態" ? undefined : v));
    speak("名詞の記憶を保存しました。");
});
define_word("する", st=>speak(st.stack.shift() + "のしかたがわかりません。"));

define_word("作る","リスト", st=>{
    let xs = [];
    for (let i = 0; i < st.arity; i++)
        xs.unshift(st.stack.shift());
    st.stack.unshift(xs);
});

let state = {
    program: [],
    stack: [],
    arity: 0,
    vocab: vocab,
    nouns: {
        "これ": null, "それ": null, "あれ": null,
        "予定": named([], "予定"), "検索履歴": named({}, "検索履歴")
    },
    voice: ()=>window.speechSynthesis.getVoices().filter((x)=>x.lang==="ja-JP")[0]
};


Object.assign(state.nouns, JSON.parse(localStorage.nouns || "{}")); //load saved nouns
state.nouns["予定"] = named(state.nouns["予定"], "予定"); ///////fix this

function named (x, name) {
    x._name = name;
    return x;
}
function nameof (x) {
    return x._name || x.surface_form || x;
}
function eat (stk, x) {
    if (stk.length > 0 && (nameof(car(stk)) == x || CLOS.isA(car(stk), x))) {
        stk.shift();
        return true;
    } return false;
}

state.nouns["スタック"] = named(()=>state.stack.slice(), "スタック");
state.nouns["状態"] = named(state, "状態");

console.log(state.voice());


function specialform (transcript) {
    let match;
    if (match = transcript.match("文章|文字列|フレーズ|テキスト")) {
        kotoba([{pos: "名詞", pos_detail: "文字列", surface_form: transcript.substr(match[0].length)}]);
        return "";
    }
    if (match = transcript.match(".*動詞.*定義(します)*")) {
        speak("動詞を定義します。");
        state.definition = "verb";
        return transcript.substr(match[0].length);
    }
    return transcript;
}

let think = CLOS.define_generic(false, "think");

//unthunk
function thaw (val) {
    if (typeof(val) === "function") return val();
    return val;
}

CLOS.define_method(think, [(tok)=>tok.pos==="名詞"], (tok)=>{
    let noun;
    if (tok.pos_detail_1==="数")
        state.stack.unshift(parseInt(tok.surface_form));
    else if (tok.surface_form in state.nouns)
        state.stack.unshift(thaw(state.nouns[tok.surface_form]));
    else {
        tok.toString = function () {return this.surface_form;};
        state.stack.unshift(tok);
    }
});
CLOS.define_method(think, [(tok)=>tok.pos==="助詞" && tok.pos_detail_1==="格助詞"], (tok)=>{
    if (tok.basic_form === "と" || tok.basic_form === "から") state.arity++;
    else if (tok.basic_form === "は") state.nouns["これ"] = car(state.stack);
    //ignore を, で
});
CLOS.define_method(think, [(tok)=>tok.pos==="動詞"], (tok)=>{
    if (state.vocab[tok.basic_form]) {
        state.vocab[tok.basic_form].find(f=>f(state));
        state.arity = 0; //reset arity
    } else {
        speak(tok.basic_form + " という動詞の定義がありません。");
        throw new Error("MissingVerb: " + tok.basic_form);
    }
});
CLOS.define_method(think, [(tok)=>tok.pos==="感動詞"], (tok)=>{
    if (tok.basic_form === "ありがとう") speak("どういたしまして。");
    else if (tok.basic_form === "おめでとう") speak("ありがとう");
    else speak(tok.basic_form);
});
CLOS.define_method(think, [undefined], (tok)=>{
    //ignore
    return false;
});


let speak = CLOS.define_generic(false, "speak");

CLOS.define_method(speak, [Schedule._pred], (sch)=>{
    let d = CLOS.isA(sch.date, Date) ? sch.date : new Date(sch.date);
    speak_synth((1900 + d.getYear()) + "年" + (d.getMonth() + 1) + "月" + (d.getDate()) + "日" + dayName(d.getDay()) + "曜日" + d.getHours() + "時" + d.getMinutes() + "分に、" + sch.subject + "の予定があります。");
});
CLOS.define_method(speak, ['string'],  (text)=>{
    speak_synth(text);
});
CLOS.define_method(speak, [Array], (arr)=>{
    arr.forEach(speak); ///まとめた方が良いかも
    //speak_synth(arr.join("、　そして"));
});
CLOS.define_method(speak, [undefined],  (x)=>{
    speak_synth(""+x);
});

let is_token = (x) => CLOS.slot_exists(x, "basic_form")
    && CLOS.slot_exists(x, "pos")
    && CLOS.slot_exists(x, "surface_form")
    && CLOS.slot_exists(x, "reading")
    && CLOS.slot_exists(x, "pronunciation");

function merger (keys, o1, o2, merge_fn) {
    return keys.reduce((o, k)=>{
        o[k]=merge_fn(o1[k], o2[k]);
        return o;}, {});
}

let plus = CLOS.define_generic();
CLOS.define_method(plus, [is_token, is_token], (tk1, tk2)=>{
    return Object.assign({}, tk1, merger(["basic_form", "surface_form", "reading", "pronunciation"], tk1, tk2, (x,y)=>x+y));
});


function kotoba (tokens) {
    tokens = tokens.reduce((tks, tk)=>{ //名詞,名詞 --> 名詞.  e.g. 出初,式-->出初式 / 抹茶,プリン / 国産,車
        if (tks.length && tk.pos === "名詞" && tks[tks.length-1].pos === "名詞")
            tks[tks.length-1] = plus(tks[tks.length-1], tk);
        else tks.push(tk);
        return tks;
    }, []);
    console.log(tokens);
    tokens.map((token)=>{
        try {
            return think(token);
        } catch (err) {
            console.log(token);
            console.error(err);
            return false;
        }
    });
}
