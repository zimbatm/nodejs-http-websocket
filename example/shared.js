
var posix   = require('posix');

const mimeReg = /\.[^\.]+$/
const mimeMap = {
    ".html": "text/html",
    ".js":   "text/javascript",
    ".xml":  "application/xml",
    ".swf":  "application/x-shockwave-flash"
}


function notFound(req, res) {
    var msg = "<h1>File not found : " + req.url + "</h1>";
    res.sendHeader(404, {
        "Content-Type": "text/html",
        "Content-Length": msg.length
    });
    res.sendBody(msg);
    res.finish();
}

function sendFile(req, res, path) {
    posix.cat(path, "binary").addCallback(function(data) {
        var cType = mimeMap[mimeReg.exec(path)[0]] || "application/octet-stream";
        res.sendHeader(200, {
            "Content-Type": cType,
            "Content-Length": data.length
        });
        res.sendBody(data, "binary");
        res.finish();
    }).addErrback(function() {
        notFound(req, res); 
    });
}

// Public functions
exports.notFound = notFound;
exports.sendFile = sendFile;
