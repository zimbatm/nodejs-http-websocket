#!/usr/bin/env node

// Devel mode
require.paths.unshift('../lib');

var http    = require('http'),
    ws      = require('http/websocket'),
    posix   = require('posix'),
    sys     = require('sys');
    
const publicDir = './public';

function ping(msg, conn) {
    sys.debug("PING: " + msg);
    conn.send(msg);
}

function notFound(req, res) {
    var msg = "<h1>File not found : " + req.uri.path + "</h1>";
    res.sendHeader(404, {
      "Content-Type": "text/html",
      "Content-Length": msg.length
    });
    res.sendBody(msg);
    res.finish();
}

var mimeReg = /\.[^\.]+$/
mimeMap = {
    ".html": "text/html",
    ".js":   "text/javascript",
    ".xml":  "application/xml",
    ".swf":  "application/x-shockwave-flash"
}

function sendFile(req, res, path) {
    var data;
    try {
        data = posix.cat(path, "binary").wait();
        if (data) {
            var cType = mimeMap[mimeReg.exec(path)[0]] || "application/octet-stream";
            res.sendHeader(200, {
                "Content-Length": data.length,
                "Content-Type": cType
                });
            res.sendBody(data, "binary");
            res.finish();
            return;
        }
    } catch(e) {
        sys.debug(e);
    }
    
    sys.debug("File not found: " + path);
    notFound(req, res);
}

var chat = new ws.Server();
chat.addListener("connect", function(conn) {
    sys.debug("onconnect");
    this.broadcast("new connection: " + conn.remoteAddress); 
});
chat.addListener("disconnect", function(conn) {
    sys.debug("ondisconnect");
    this.broadcast("disconnection of " + conn.remoteAddress);
})
chat.addListener("message", function(msg, conn) {
    sys.debug("onmessage");
    this.broadcast("Got " + msg); 
});

function handler(req, res) {
    sys.debug(req.method + ' ' + req.uri.path);
    if (ws.askUpgrade(req)) {
        sys.debug("Upgrading to WebSocket");
        chat.connect(req, res);
    } else {
        var filePath = publicDir + req.uri.path;
        sendFile(req, res, filePath);
    }
}

var srv = http.createServer();
srv.addListener("request", handler);
srv.listen(8000);
sys.puts("Connected on port :8000");
