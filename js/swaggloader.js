/*
This is a loader script for Swagg Player. It loads Swagg Player and SoundManager asynchronously
so that the UI doesn't get blocked
*/
var SwaggLoader = {
		Props:{},
		sound_manager:
		{
			init: function()
			{
				if(jQuery)
				{
					
					clearInterval(SwaggLoader.sound_interval);
					if (SwaggLoader.Props.debug === true) {
						console.log('Swagg Player::jQuery Loaded. Loading Sound Manager.');
					}
					
					var swagg_script = $('<script>');
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
				if(soundManager !== undefined)
				{
					clearInterval(SwaggLoader.swagg_interval);		
					soundManager.url = 'swf';
					soundManager.wmode = 'transparent'
					if (SwaggLoader.Props.debug === true) {
						console.log('Swagg Player::Sound Manager Loaded. Loading Swagg Player.');
					}
					$('#swagg-player').SwaggPlayer(SwaggLoader.Props);	
				}
			}
		},
		sound_interval:-1,
		swagg_interval:-1,

		loadSwagg : function(props){
			SwaggLoader.Props = props;
			SwaggLoader.sound_interval = setInterval("SwaggLoader.sound_manager.init()", 5);
			SwaggLoader.swagg_interval = setInterval("SwaggLoader.swaggPlayer.init()", 5);
		}
}