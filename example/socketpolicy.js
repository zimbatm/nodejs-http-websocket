var sys = require("sys");
var tcp = require("tcp");

var server = tcp.createServer(function (socket) {
	socket.setEncoding("utf8");
	socket.inBuffer = "";
	socket.addListener("connect", function () {
		sys.debug("Connection to policy server from " + socket.remoteAddress);
	}).addListener("receive", function (data) {
		socket.inBuffer += data;
		if (socket.inBuffer.length > 32) {
			socket.close();
			return;
		}
		if (server.policyReqRegex.test(socket.inBuffer)) {
			socket.send(server.policyRes);
			socket.close();
		}
	});
})
server.policyReqRegex = /<\s*policy\-file\-request\s*\/>/i;
server.policyRes = "<cross-domain-policy><allow-access-from domain=\"*\" to-ports=\"*\" /></cross-domain-policy>";
server.listen(843);
sys.puts("Listening for Flash policy requests on port 843");

