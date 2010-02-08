var http    = require('http')
    sys     = require('sys');

function supportUpgrade(req) {
    return (req.method == 'GET' && req.httpVersion == '1.1' && req.headers.host && req.headers.origin);
}

function askUpgrade(req) {
    return supportUpgrade(req) && (req.headers.connection == 'Upgrade' && req.headers.upgrade == 'WebSocket');
}

/*
websocket.Connection
*/
function Connection(request, response) {
    process.EventEmitter.call(this);
    
    var self = this,
        conn = this.connection = request.connection;
    
    this.request = request;
    this.remoteAddress = conn.remoteAddress;
    
    // TODO: fail differently if not compatible ?
    if (!supportUpgrade(request)) {
        conn.close();
    }
    
    conn.addListener("close", function() {
        self.close();
    });
    
    this.addListener("close", function() {
        conn.close();
    });
    
    request.addListener("complete", function() {
        // Hijack connection after handshake
        conn.hijack();
        conn.setTimeout(0);
        conn.addListener("receive", function(data) {
            if (data[0] !== '\u0000' && data[data.length - 1] !== '\ufffd') {
                // Invalid data
                self.close();
            } else {
                self.emit("message", data.substr(1, data.length - 2), self);
            }
        });
    });
    
    response.use_chunked_encoding_by_default = false;
    response.sendHeader([101, "Web Socket Protocol Handshake"], {
        "Upgrade": "WebSocket",
        "Connection": "Upgrade",
        "WebSocket-Origin": request.headers.origin,
        // TODO: wss://
        "WebSocket-Location": "ws://" + request.headers.host + request.url
    });
    response.flush(); // send!!
}
sys.inherits(Connection, process.EventEmitter);

Connection.prototype.send = function(data) {
    if (this.connection.readyState == "open" || this.connection.readyState == "writeOnly") {
        this.connection.send('\u0000' + data + '\uffff');
        return true;
    }
    return false;
}

Connection.prototype.close = function() {
    this.emit("close");
}

Connection.prototype.remoteAddress = null;


/*
websocket.Server

a connection manager
*/
function Server() {
    process.EventEmitter.call(this);
}
sys.inherits(Server, process.EventEmitter);

Server.prototype.connections = [];

Server.prototype.connect = function(request, response) {
    var self = this;
    var conn = new Connection(request, response);
    conn.addListener("message", function(msg) {
        self.emit("message", msg, conn);
    });
    conn.addListener("close", function() {
        self.disconnect(conn);
    });
    this.connections.push(conn);
    this.emit("connect", conn);
}

Server.prototype.disconnect = function(connection) {
    if (maybeRemove(this.connections, connection)) {
        connection.close();
        this.emit("disconnect", connection);
    }
}

Server.prototype.broadcast = function(msg) {
    for (i in this.connections) {
        this.connections[i].send(msg);
    }
}

exports.askUpgrade = askUpgrade;
exports.Connection = Connection;
exports.Server     = Server;


// Utils

function maybeRemove(arr, elem) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i] == elem) {
            arr.splice(i, 1);
            return true;
        }
    }
    return false;
}