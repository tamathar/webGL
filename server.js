/*****************************************************************
 * File: server.js
 * Description: Node.js Javascript to implement a base http server
 * Author: Tam
 ****************************************************************/

var http = require("http");
var url = require("url");

function start(route,handle)
{
	function onRequest(request,response)
	{
		var pathname = url.parse(request.url).pathname;
		console.log("request for " + pathname + " received.");
		route(pathname, handle, response, request);
	}
	

	http.createServer(onRequest).listen(8888);
	console.log("server has started.");
}

exports.start=start;
