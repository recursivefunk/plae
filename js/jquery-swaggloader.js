/*
   	Swagg Loader: jQuery plugin which loads all of a pages javascript asynchronously.
   	---------------------------------------------------------------------------------
	http://johnny-ray.com/
	---------------------------------------------------------------------------------

   	Copyright (c) 2011, Johnny Austin. All rights reserved.
   	Code provided under the MIT License:
   	http://www.opensource.org/licenses/mit-license.php
   
   
	v 0.5.1
	- script executes recursively as opposed to iteratively
*/
(function($) {
	
	var controller = {
		
		buildScriptTag : function(scriptPath) {
				console.log('Swagg Loader::Info::Loading Script ' + scriptPath);
				var script  = $('<script>');
				script.attr( 'type', 'text/javascript');
				script.attr('src', scriptPath);
				script.attr('async', 'true');
				script.attr('id','id-' + scriptPath);
				$('head').append(script);
				return script;
		},	
	
		loadScripts : function(array, index) {
				var script = controller.buildScriptTag(array[index]);
				if ((index + 1) < array.length) {
					script.ready(function(){
						controller.loadScripts(array, index + 1);
					});	
				}
		} // end loadScripts	
	} // end controller

	$.fn.SwaggLoader = function(config) {
		if (config.onBeforeLoad !== null && config.onBeforeLoad !== 'undefined') {
			config.onBeforeLoad.apply(this, []);
		}
		
		controller.loadScripts(config.scripts, 0);
		
		if (config.onLoad !== null && config.onLoad !== 'undefined') {
			config.onLoad.apply(this, []);
		}
	};

}(jQuery));