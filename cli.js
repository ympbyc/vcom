// -*- coding: euc-jp -*- 

const kuromoji = require("kuromoji");
var tokenizer;
kuromoji.builder({ dicPath: "lib/kuromoji.js/dict/" }).build(function (err, tknzr) {
    tokenizer = tknzr;
    console.log(tokenizer.tokenize("今日はたくさん歩いた"));
});



