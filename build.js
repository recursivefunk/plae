var Lazy = require('lazy');
var fs = require('fs');
var child = require('child_process');

var version;

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

var yui = child.spawn('./yui.sh');

yui.on('exit', function(code){	
	if (code !== 0) process.exit(code);
	console.log('Successfully minified jquery.swaggplyer.js');
	new Lazy(fs.createReadStream('js/jquery.swaggplayer.js', {start:200,end:500}))
	 .lines
	 .forEach(
	      function(line) { 
	          var match = line.toString().trim().match(/^v[0-9]\.[0-9]\.[0-9]\.[0-9]/);
	          if (match) {
	          	version = match[0].split('v')[1];
	          	console.log('Version found: ' + version);
	          }
	      }
	);

	fs.readFile('package.json', function(err,data){
	  if(err) {
	    console.error("Could not open file: %s", err);
	    process.exit(1);
	  }

	  var packagejson = JSON.parse(data.toString());
	  packagejson.version = version;

	  fs.writeFile('package.json', JSON.stringify(packagejson, null, 2), function (err) {
	    if (err) throw err;
	    console.log('Done!!');
	  });
	});

});