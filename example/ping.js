#!/usr/bin/env node

// Devel mode
require.paths.unshift('../lib');

var http        = require('http'),
    ws          = require('http/websocket'),
    sys         = require('sys'),
    notFound    = require('./shared').notFound,
    sendFile    = require('./shared').sendFile;
    
const publicDir = './public';

function ping(msg, conn) {
    sys.debug("PING: " + msg);
    conn.send(msg);
}

function handler(req, res) {
    sys.debug(req.method + ' ' + req.uri.path);
    if (ws.askUpgrade(req)) {
        sys.debug("Upgrading to WebSocket " + req.headers.cookie);
        var conn = new ws.Connection(req, res);
        conn.addListener("message", ping);
        conn.addListener("close", function() {
           sys.debug("Closing WebSocket"); 
        });
    } else {
        var filePath = publicDir + req.url;
        sendFile(req, res, filePath);
    }
}

var srv = http.createServer();
srv.addListener("request", handler);
srv.listen(8000);
sys.puts("Connected on port :8000");
