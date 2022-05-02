function email (to, subject, text) {
    Email.send({
        Host : "smtp.yourisp.com",
        Username : "username",
        Password : "password",
        To : 'them@website.com',
        From : "you@isp.com",
        Subject : subject,
        Body : text
    }).then(
        message => alert(message)
    );
}

const daynames = ["日", "月", "火", "水", "木", "金", "土"];
function dayName (n) {
    return daynames[n];
}

var Recording = function(cb){
    var recorder = null;
    var audioInput = null;
    var volume = null;
    var audioContext = null;
    var callback = cb;
    this.recording = true;
    var self = this;

    navigator.getUserMedia = navigator.getUserMedia    || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if(navigator.getUserMedia){
        navigator.getUserMedia({audio:true},
                               function(e){ //success
                                   var AudioContext = window.AudioContext || window.webkitAudioContext;
                                   audioContext = new AudioContext();
                                   volume = audioContext.createGain(); // creates a gain node
                                   audioInput = audioContext.createMediaStreamSource(e); // creates an audio node from the mic stream
                                   audioInput.connect(volume);// connect the stream to the gain node
                                   recorder = audioContext.createScriptProcessor(2048, 1, 1);

                                   recorder.onaudioprocess = function(e){
                                       if(!self.recording) return;
                                       var left = e.inputBuffer.getChannelData(0);
                                       //var right = e.inputBuffer.getChannelData(1);
                                       callback.call(self, new Float32Array(left));
                                   };
                                   volume.connect(recorder);// connect the recorder
                                   recorder.connect(audioContext.destination);
                               },
                               function(e){ //failure
                                   alert('Error capturing audio.');
                               }
                              );
    } else {
        alert('getUserMedia not supported in this browser.');
    }
};

var lastClap = (new Date()).getTime();

function detectClap(data){
    var t = (new Date()).getTime();
    if(t - lastClap < 200) return false; // TWEAK HERE
    var zeroCrossings = 0, highAmp = 0;
    for(var i = 1; i < data.length; i++){
        if(Math.abs(data[i]) > 0.5) highAmp++; // TWEAK HERE
        if(data[i] > 0 && data[i-1] < 0 || data[i] < 0 && data[i-1] > 0) zeroCrossings++;
    }
    if(highAmp > 20 && zeroCrossings > 30){ // TWEAK HERE
        //console.log(highAmp+' / '+zeroCrossings);
        lastClap = t;
        return true;
    }
    return false;
}
