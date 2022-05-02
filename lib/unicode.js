//https://www.gadgety.net/shin/trivia/translate.html

// Unicode
function unescapeUnicode(str) {
	return str.replace(/\\[uU]([a-fA-F0-9]{4})/g, function(m0, m1){
		return String.fromCharCode(parseInt(m1,16));
	});
}

function escapeUnicode(str) {
    var code, pref = {1: '\\u000', 2: '\\u00', 3: '\\u0', 4: '\\u'};
    return str.replace(/\W/g, function(c) {
        return pref[(code = c.charCodeAt(0).toString(16)).length] + code;
    });
};
