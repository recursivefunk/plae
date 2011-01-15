/*
This is a loader script for Swagg Player. It loads Swagg Player and SoundManager asynchronously
so that the UI doesn't get blocked
*/
var SwaggLoader = (function($) {
	var swaggProps;
	var load_interval;
	var swagg_interval;
	
	get_swagg_player =
	{
		init: function()
		{
			if(typeof jQuery !== 'undefined')
			{
				clearInterval(SwaggLoader.load_interval);
				var swagg_script = $('<script></script>');
				swagg_script.attr( 'type', 'text/javascript');
				swagg_script.attr('src', 'js/jquery-swagg-player.js');
				swagg_script.attr('async', 'true');
				$('head').append(swagg_script);
				SwaggLoader.swagg_interval = setInterval("this.swagg_player.init();", 5);
			}
		}
	};
	
	swagg_player =
	{
		init: function()
		{
			if(typeof soundManager !== 'undefined' && jQuery.isFunction($('#swagg-player').SwaggPlayer))
			{
				clearInterval(SwaggLoader.swagg_interval);	
				$('#swagg-player').SwaggPlayer(SwaggLoader.swaggProps);	
			}
		}
	};


	return {
		loadSwagg : function(props){
			window.SM2_DEFER = true;
			this.swaggProps = props;
			var loadSoundManager = function() {
				var sm_script = $('<script>');
				sm_script.attr( 'type', 'text/javascript');
				sm_script.attr('src', 'js/soundmanager2-nodebug-jsmin.js');
				sm_script.attr('async', 'true');
				sm_script.attr('id','soundManagerTag');
				$('head').append(sm_script);
			}();
			this.load_interval = setInterval("get_swagg_player.init();", 5);		
		}
	};
}(jQuery));