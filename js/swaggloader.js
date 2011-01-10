/*
This is a loader script for Swagg Player. It loads Swagg Player and SoundManager asynchronously
so that the UI doesn't get blocked
*/
SwaggLoader = (function($) {
	var swaggProps, load_interval, swagg_interval;
	
	get_swagg_player =
	{
		init: function()
		{
			if(jQuery)
			{
				clearInterval(SwaggLoader.load_interval);
				var swagg_script = $('<script></script>');
				swagg_script.attr( 'type', 'text/javascript');
				swagg_script.attr('src', 'js/jquery-swagg-player.js');
				swagg_script.attr('async', 'true');
				$('head').append(swagg_script);
			}
		}
	};
	
	swagg_player =
	{
		init: function()
		{
			if(typeof soundManager !== undefined)
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
			this.load_interval = setInterval("this.get_swagg_player.init()", 5);
			this.swagg_interval = setInterval("this.swagg_player.init()", 5);
		}
	};
}(jQuery));