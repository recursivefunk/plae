/*
   Swagg Loader: jQuery plugin which loads all of a pages javascript asynchronously.
   --------------------------------------------
   http://johnny-ray.com/

   Copyright (c) 2011, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php
   
*/
(function($) {
	var buildScriptTag = function(scriptPath) {
			console.log('loading ' + scriptPath);
			var script  = $('<script>');
			script.attr( 'type', 'text/javascript');
			script.attr('src', scriptPath);
			script.attr('async', 'true');
			script.attr('id','id-' + scriptPath);
			$('head').append(script);
			return script;
	}	

	var loadScripts = function(config) {
		if (config.onBeforeLoad !== null && config.onBeforeLoad !== 'undefined') {
			config.onBeforeLoad.apply(this, []);
		}
		
		var array = config.scripts;
		for (var i = 0; i < array.length; i++) {
			var script = buildScriptTag(array[i]);
			if (array[i + 1] !== 'undefined') {
				script.ready(function(){
					buildScriptTag(array[i+1]);
					i++;
				});		
			}
		}
		if (config.onLoad !== null && config.onLoad !== 'undefined') {
			config.onLoad.apply(this, []);
		}
	}

	$.fn.SwaggLoader = function(config) {
		loadScripts(config);
	};

}(jQuery));