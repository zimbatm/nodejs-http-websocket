#!/usr/bin/env node

// Devel mode
require.paths.unshift('../lib');

var http        = require('http'),
    ws          = require('http/websocket'),
    sys         = require('sys'),
    notFound    = require('./shared').notFound,
    sendFile    = require('./shared').sendFile;

const publicDir = './public';

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
    sys.debug(req.method + ' ' + req.url);
    if (ws.askUpgrade(req)) {
        sys.debug("Upgrading to WebSocket");
        chat.connect(req, res);
    } else {
        var filePath = publicDir + req.url;
        sendFile(req, res, filePath);
    }
}

var srv = http.createServer();
srv.addListener("request", handler);
srv.listen(8000);
sys.puts("Connected on port :8000");
