= Node http websocket server =

This is an implementation of the server-side of the WebSocket protocol,
based on the node http server.

One advantage over other implementations, is that you can still
server normal HTTP requests over the same port of the WebSocket server.

= About node patches =

The current node HTTP server implementation closes the connection
after a successful HTTP requests. The patch adds request.connection.hikack()
to change that behavior in case of WebSocket connections.

To apply the patches, go in the root of your nodejs code, and apply:
 `git am ../path-to/node-http-websocket/patches/*.patch`

= Licence =

Unless otherwise noted, all products created by me are free of copyright and
thus in the public domain. Have fun and be responsible.

Cheers,
   zimbatm
