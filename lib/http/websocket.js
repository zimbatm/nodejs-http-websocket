var http    = require('http')
    sys     = require('sys');

function supportUpgrade(req) {
    return (req.method == 'GET' && req.httpVersion == '1.1' && req.headers.host && req.headers.origin);
}

function askUpgrade(req) {
    return supportUpgrade(req) && (req.headers.connection == 'Upgrade' && req.headers.upgrade == 'WebSocket');
}

// Hijack HTTP connection
function Connection(request, response) {
    process.EventEmitter.call(this);
    
    var self = this,
        conn = this.connection = request.connection;
    
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
    
    request.setBodyEncoding('utf-8');
    request.addListener("complete", function() {
        // Hijack connection after handshake
        conn.hijack();
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
    response.sendHeader(101, {
        "Upgrade": "WebSocket",
        "Connection": "Upgrade",
        "WebSocket-Origin": request.headers.origin,
        "WebSocket-Location": "ws://" + request.headers.host + request.uri.path
    });
    response.flush(); // send!!
}
sys.inherits(Connection, process.EventEmitter);

Connection.prototype.send = function(data) {
    this.connection.send('\u0000' + data + '\uffff');
}

Connection.prototype.close = function() {
    this.emit("close");
}


exports.askUpgrade = askUpgrade;
exports.Connection = Connection;