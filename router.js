/*********************************************************************
 * File: router.js
 * Description: File to route requests for server.js (Node.js server)
 * Author: Tam
 *********************************************************************/

var currentUpdate = require("./requestHandler").currentUpdate;
var ajaxQ = new Array();

function route(pathname, handle, response, request)
{
	console.log("routing request for " + pathname);	

	if(typeof handle[pathname] === 'function')
	{
		handle[pathname](response, request);
	}
	else if(/\.(js|css)$/.test(pathname))
	{
		handle['serveResource'](response, request);
	}
	//site specific code here
	else if(/\.(png)$/.test(pathname))
	{
		handle['serveResource'](response,request);
	}
	else if(/\.json$/.test(pathname))
	{
		handle['serveJson'](response, request);
	}
	else
	{
		console.log("No handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 not found");
		response.end();
	}
}


exports.route = route;
