/***************************************************
 * File: Index.js
 * Description: Aggregation file for node.js server
 * Author: Tam
 **************************************************/


//standard requires
var server = require("./server");
var router = require("./router");
var requestHandler = require("./requestHandler");

//standard handlers
var handle = {};
 handle['/'] = requestHandler.start;
 handle['/start'] = requestHandler.start;
 handle['serveResource'] = requestHandler.serveResource;
//server specific
 handle['serveJson'] = requestHandler.serveJson;
//standard
server.start(router.route, handle);
