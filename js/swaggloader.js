/*
This is a loader script for Swagg Player. It loads Swagg Player and SoundManager asynchronously
so that the UI doesn't get blocked

var SwaggHook = {
	data: {
		curr_song_total_minutes:null,
		curr_song_total_seconds:null,
		curr_song_curr_minutes:null,
		curr_song_curr_seconds:null		
	}
};*/
var SwaggLoader = {
		swaggProps:{},
		sound_manager:
		{
			init: function()
			{
				if(jQuery)
				{
					clearInterval(SwaggLoader.sound_interval);
					var swagg_script = $('<script></script>');
					swagg_script.attr( 'type', 'text/javascript');
					swagg_script.attr('src', 'js/jquery-swagg-player.js');
					swagg_script.attr('async', 'true');
					$('head').append(swagg_script);
					
					var sm_script = $('<script>');
					sm_script.attr( 'type', 'text/javascript');
					sm_script.attr('src', 'js/soundmanager2-nodebug-jsmin.js');
					sm_script.attr('async', 'true');
					sm_script.attr('id','soundManagerTag');
					$('head').append(sm_script);

				}
			}
		},
		
		swaggPlayer:
		{
			init: function()
			{
				if(typeof soundManager !== undefined)
				{
					clearInterval(SwaggLoader.swagg_interval);		
					SwaggHook = $('#swagg-player').SwaggPlayer(SwaggLoader.swaggProps);	
				}
			}
		},

		sound_interval:-1,
		swagg_interval:-1,

		loadSwagg : function(props){
			window.SM2_DEFER = true;
			SwaggLoader.swaggProps = props;
			SwaggLoader.sound_interval = setInterval("SwaggLoader.sound_manager.init()", 5);
			SwaggLoader.swagg_interval = setInterval("SwaggLoader.swaggPlayer.init()", 5);
		}
}