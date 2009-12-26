= Examples

== Prerequisites

Make sure to have a patched version of node.

Run socketpolicy.pl as root. This is needed by the flash WebSocket implementation that lookups crossdomain policies on port 843 to ask for connection.

== Examples

* ping.js : a simple ping-back websocket server
* chat.js : like ping but with connection broadcasting

Run `node ping.js` and open http://localhost:8000/sample.html with Firefox (other browsers not yet tested)

Some times, the page takes long to load (unknown bug). Try reloading.
