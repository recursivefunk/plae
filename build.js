var Lazy = require('lazy');
var fs = require('fs');
var child = require('child_process');
var clc = require('cli-color');
var version;

console.log(clc.green('\n   Optimizing jquery.swaggplayer.js'));
var yui = child.spawn('./yui.sh');

yui.on('exit', function(code){	
	if (code !== 0) {
		console.error(clc.red('   An error occured while optimizing jquery.swagplayer.js. Exiting with code %s', code));
		process.exit(code);
	}
	console.log(clc.green('   Successfully created jquery.swaggplyer.min.js'));
	console.log(clc.green('   Updating package.json'));
	new Lazy(fs.createReadStream('js/jquery.swaggplayer.js', {start:200,end:500}))
	 .lines
	 .forEach(
	      function(line) { 
	          var match = 
	          	line
	          	.toString()
	          	.replace(/^\s*/, "")
	          	.replace(/\s*$/, "")
	          	.match(/^v[0-9]\.[0-9]\.[0-9]\.[0-9]/);

	          if (match) {
	          	version = match[0].split('v')[1];
	          	console.log(clc.green('   Plugin version found: ' + version));
	          }
	      }
	);

	fs.readFile('package.json', function(err,data){
	  if(err) {
	    console.error(clc.red('   Could not open file: %s', err));
	    process.exit(1);
	  }

	  var packagejson = JSON.parse(data.toString());
	  packagejson.version = version;
	  console.log(clc.green('   Done updating package.json - persisting now'));
	  fs.writeFile('package.json', JSON.stringify(packagejson, null, 2), function (err) {
	    if (err) {
	    	console.error(clc.red(   'An error occured while persisting package.json: %s', err));
	    }
	    console.log(clc.green('   Done!!\n'));
	  });
	});

});