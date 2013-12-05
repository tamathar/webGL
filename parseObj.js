//This file uses node.js file IO to parse a .obj file into a json object
//	This functions as a preprocessor for WebGL - since a json file can be loaded/parsed 
//	much quicker on the client side js than a .obj file

var fs = require("fs");

function parseObj(/*string*/ filePath)
{
	var rstream = fs.createReadStream(filePath);
	rstream.setEncoding('utf8');
	//variables for intermediate storage--
	var fragment = "";
	var data = new Object();
	data.vertices = new Array();
	data.texCoord = new Array();
	data.vNormals = new Array();
	data.faces = new Array();
	data.mins = [null, null, null];
	data.maxs = [null, null, null];
	//------------------------------------

	rstream.on('data', function(chunk)
	{
		chunk = fragment + chunk;
		fragment = '';
		var needsPreserved = false;
		if(chunk.charAt(chunk.length-1)!= "\n")
			needsPreserved = true;
		var lines = chunk.split("\n");
		for(var i = 0; i < lines.length; i++)
		{
			if(i < lines.length-1 || !needsPreserved)
			{
				var pieces = lines[i].split(' ');
				if(pieces[0] == "v")
				{
					for(var z = 0; z < 3; z++)
					{
						if(parseInt(pieces[z+1]) < data.mins[z] || data.mins[z] == null)
							data.mins[z] = parseInt(pieces[z+1]);
						if(parseInt(pieces[z+1]) > data.maxs[z] || data.maxs[z] == null)
							data.maxs[z] = parseInt(pieces[z+1]);
					}
					data.vertices.push([pieces[1],pieces[2],pieces[3]]);
				}
				else if(pieces[0] == "vt")
				{
					data.texCoord.push([pieces[1],pieces[2]]);
				}
				else if(pieces[0] == "vn")
				{
					data.vNormals.push([pieces[1],pieces[2],pieces[3]]);
				}
				else if(pieces[0] == "f")
				{
					data.faces.push([pieces[1],pieces[2],pieces[3]]);
					if(pieces.length == 5) //it's a quad so grab the other triangle
					{
						data.faces.push([pieces[1],pieces[3],pieces[4]]);
					}
				}
			}
			else
				fragment = lines[i];
		}
	});


	rstream.on('end', function()
	{
		var processed = new Object();
		var usedCombos = new Object();
		processed.elements = new Array();
		processed.syncedVerts = new Array();
		processed.syncedTextC = new Array();
		processed.syncedNorms = new Array();

		for(var i = 0; i < data.faces.length; i++)
		{
			for(var j = 0; j < 3; j++)
			{
				var face = data.faces[i][j]
				if(!(face in usedCombos))
				{
					var components = face.split('/');
					processed.syncedVerts.push(parseInt(components[0])-1);
					processed.syncedTextC.push(parseInt(components[1])-1);
					processed.syncedNorms.push(parseInt(components[2])-1);
					usedCombos[face] = processed.syncedVerts.length-1;
				}
				processed.elements.push(usedCombos[face]);
			}
		}
		var filename = (/\/(\w| )+(?=\.obj$)/i).exec(filePath);
		writeToFile(data, processed, filename[0]);
	});	
}

function writeToFile(data, processed, name)
{
	var fileOut = fs.createWriteStream("./jsons" + name + ".json");
	var vDone = false;
	var tDone = false;
	var nDone = false;
	var eDone = false;
	var draining = false;

	write();
	function write()
	{
		if(!vDone && !draining)
		{
			fileOut.write('{"vertices" : [');
			var drained = true;
			for(var i = 0; i < processed.syncedVerts.length;i++)
			{
				var toWrite = data.vertices[processed.syncedVerts[i]].toString();
				if(i < processed.syncedVerts.length-1)
					toWrite += ",";
				drained = fileOut.write(toWrite);
			}
			if(!drained)
			{
				draining = true;
				fileOut.once('drain', function() {vDone = true; draining = false;});
			}
			else
				vDone = true;
		}
		else if(!tDone && !draining)
		{
			fileOut.write('], "texCoords" : [');
			var drained = true;
			for(var i = 0; i < processed.syncedTextC.length;i++)
			{
				var toWrite =data.texCoord[processed.syncedTextC[i]].toString();
				if(i < processed.syncedTextC.length-1)
					toWrite += ",";
				drained = fileOut.write(toWrite);
			}

			if(!drained)
			{
				draining = true;
				fileOut.on('drain', function() {console.log("done");tDone = true; draining = false;});
			}
			else
				tDone = true;

		}
		else if(!nDone && !draining)
		{
			fileOut.write('], "normals" : [');
			var drained = true;
			for(var i = 0; i < processed.syncedNorms.length;i++)
			{
				var toWrite =data.vNormals[processed.syncedNorms[i]].toString();
				if(i < processed.syncedNorms.length-1)
					toWrite += ",";
				drained = fileOut.write(toWrite);
			}
			if(!drained)
			{
				draining = true;
				fileOut.once('drain', function() {nDone = true; draining = false;});
			}
			else
				nDone = true;

		}
		else if(!eDone && !draining)
		{
			fileOut.write('], "elements" : [');
			fileOut.write(processed.elements.toString() + ']');
			fileOut.write(', "Offset" : [' + ((data.maxs[0]+data.mins[0])/2.0) + ',' + ((data.maxs[1]+data.mins[1])/2.0) + ',' + ((data.maxs[2]+data.mins[2])/2.0) + ']}');
			eDone = true;
		}
		
		if(draining || !eDone)
			setTimeout(write, 25);
	} 	
}

parseObj("./objs/squarepillar.obj");
exports.parseObj = parseObj;
