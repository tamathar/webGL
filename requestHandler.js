/*******************************************************************
 * file: requestHandlers.js
 * Description: Handles requests for specific URLs for the server
 * Author: Tam
 *******************************************************************/

//required modules
var url = require("url");
var querystring = require("querystring");
var fs = require("fs");
var parseObject = require("./parseObj").parseObj;
//helper function to serve a requested file (for abstraction purposes)
function serveFile(response, path, type)
{
	console.log("serving " + path + " ...");
	fs.readFile(path, function(error, file)
	{
		if(error)
		{
			console.log(__dirname);
			console.log(error);
			response.writeHead(500, {"Content-Type": "text/html"});
			response.write("<html><body><h1>Internal Server Error.</h1></body></html>");
			response.end();
		}
		else
		{
			response.writeHead(200, {"Content-Type":type});
			response.write(file);
			response.end();
//			parseObject("./objs/square pillar.obj");
		}
	});
}


//Serve the requested resource
function serveResource(response, request)
{
	console.log("serving the requested resource");

	var resource = url.parse(request.url).pathname;
	
	var type = "text/";
	if(/\.js$/.test(resource))
		type += "JavaScript";
	else if(/\.css$/.test(resource))
		type += "css";
	else if(/\.png$/.test(resource))
		type = "image/png";

	serveFile(response, "." + resource, type);
}

function serveJson(response, request)
{
	var resource ="./jsons" +  url.parse(request.url).pathname;
	console.log("serving " + resource + " as json.");

	serveFile(response, resource, "application/json");
}
//serve the start.html page
function start(response, request)
{
	console.log("home page requested.");
	serveFile(response, "./page.html", "text/html");
}



exports.serveResource = serveResource;
exports.start = start;
exports.serveJson = serveJson;
