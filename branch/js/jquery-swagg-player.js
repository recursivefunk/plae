/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.1 - Branch
   
   Change Log v0.1 - Branch
   
*/
(function($)
	{
				var songs = new Array();
				var albumart = new Array();
				var soundObjs = new Array();
				var song = {
								id: " ",
								title: " ",
								url: " ",
								artist: " ",
								thumb: " ",
								duration: " "
							};
				var images = new Array();
				var curr_song = 0;
				var soundId = soundManager.sID;
				var isplaying = new Boolean(false);
				var loading = 'images/loading.gif';
				soundManager.url = 'swf';
				soundManager.useHTML5Audio = true;
				
		$.fn.SwaggPlayer = function(config) {
				var swagg_div = this;
				swaggOn(swagg_div, config);
		}
		
		function swaggOn(swagg_div, config) {
			
				if (!config.buttonsDir)
					config.buttonsDir = 'images/buttons/';
					
				loadImages(config);
				
				//document.getElementById('art').setAttribute('src', loading);
				isplaying = false;
				
				if (!config.xml)
					config.xml = 'xml/songs.xml';

				// get songs from XML document						   
				$.ajax({
					type: "GET",
					url: config.xml,
					dataType: "text/xml",
					success: parseXml,
					error: function(xml){
					}
				});
				var play_ = document.getElementById('play');
				var skip_ = document.getElementById('skip');
				var stop_ = document.getElementById('stop');
				var back_ = document.getElementById('back');
				// ======================= mouse event hooks for play button ===========================
				$('#play-link').click(function() {
					 play(curr_song);
				});
				$('#play-link').mouseover(function() {
					 play_.setAttribute('src', images[1].src);
				});
				$('#play-link').mouseout(function() {
					 play_.setAttribute('src', images[0].src);
				});
				
				// =================== mouse event hooks for skip button =========================
				$('#skip-link').click(function() {
					 skip();
				});
				$('#skip-link').mouseover(function() {
					 skip_.setAttribute('src', images[5].src);
				});
				$('#skip-link').mouseout(function() {
					 skip_.setAttribute('src', images[4].src);
				});
				
				// =================== mouse event hooks for stop button =========================
				$('#stop-link').click(function() {
					 stopMusic(curr_song.toString());
				});
				$('#stop-link').mouseover(function() {
					 stop_.setAttribute('src', images[7].src);
				});
				$('#stop-link').mouseout(function() {
					 stop_.setAttribute('src', images[6].src);
				});
				
				// =================== mouse event hooks for back button =========================
				$('#back-link').click(function() {
					 skipBack();
				});
				$('#back-link').mouseover(function() {
					 back_.setAttribute('src', images[9].src);
				});
				$('#back-link').mouseout(function() {
					 back_.setAttribute('src', images[8].src);
				});
			
				// init soundManager
				soundManager.onload =  function() {
					var localSoundManager = soundManager;
					localSoundManager.useFastPolling = true;
					localSoundManager.useHighPerformance = true;
					while(songs == null){console.log('waiting...');}
					var temp;
					for (var i = 0; i < songs.length; i++) {
						temp = localSoundManager.createSound({
							id: i.toString(),
							url: songs[i].url,
						});
						soundObjs[i] = jQuery.extend(true, {}, temp);
						soundObjs[i].load();
					} // end for
					showSongInfo();
					//document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);
					alert('ready');
				} // end soundManager onload function
			
				window.onbeforeunload = function() {
					for (var i = 0; i < soundObjs.length; i++) {
						var temp = soundObjs[i];
						temp.destroySound();
					}
				}
			}
			
			// plays the current track
			function play(track) {
				togglePlayPauseButton();
				//soundManager.togglePause(curr_song.toString());
				soundManager.togglePause(track.toString());
				showSongInfo();
			}
			
			// if music is playing, this function pauses the music and if it's not playing, this
			// function plays the current track
			function togglePlayPauseButton(){
					if (isplaying == true){
					buttonPlayState();
					isplaying = false;
				}
				else {
					buttonPauseState();
					isplaying = true;
				}
			}
			
			// toggles the play/pause button to pause
			function buttonPauseState() {
				var play = document.getElementById('play');
				var play_link = document.getElementById('play-link');
				
				play.setAttribute('src', images[2].src);
				
				$('#play-link').mouseout(function() {
					play.setAttribute('src', images[2].src);
				});
				$('#play-link').mouseover(function() {
					play.setAttribute('src', images[3].src);
				});
			}
			
			// toggles the play/pause button to the play state
			function buttonPlayState() {
				var play = document.getElementById('play');
				play.setAttribute('src', images[0].src);
				$('#play-link').mouseout(function() {
					play.setAttribute('src', images[0].src);
				});
				$('#play-link').mouseover(function() {
					play.setAttribute('src', images[1].src);
				});
			}
			
			// displays artist [song title]
			function showSongInfo(){
				//document.getElementById('info').innerHTML = "<p>" + songs[curr_song].artist + "  [" + songs[curr_song].title + "] </p>";	
			}
			
			
			//goes to the previous song. if the currently playing song is the first
			//song, it goes to the last song in the list
			
			function skipBack() {
				var t = curr_song;
				if (t == 0){
					t = songs.length - 1;	
				}
				else{
					t = t - 1;	
				}
				stopMusic(t);
				curr_song = t;
				//switchArt(t);
				play(t);
				isplaying = true;
				buttonPauseState();
				showSongInfo();
			}
			  
			// skips to the next song. if currently playing song is the last song in the list
			// it goes back to the first song
			function skip() {
				var t = curr_song;
				if (t < songs.length){
					if (t == songs.length - 1)
						t = 0;
					else
						t = t+1;
				}
				stopMusic(t);
				curr_song = t;
				play(t);
				//switchArt(t);
				buttonPauseState();
				isplaying = true;
				showSongInfo();
			}
			
			// switches to the currently playing song's album art using fancy jquery slide effect
			function switchArt(track){
				console.log('track is: ' + track);
				$('#art').hide('slide', function() {
											document.getElementById('art').setAttribute('src',songs[track].thumb.src);
											$('#art').show('slide'); 
										});
			}
			  
			// stops the currently playing track and changes toggles the pause button back to the play button
			function stopMusic(track) {
				var localSoundManager = soundManager;
				var play = document.getElementById('play');
				localSoundManager.stopAll();
				localSoundManager.unload(track.toString());
				soundObjs[track] = localSoundManager.load(track.toString());
				isplaying = false;
				buttonPlayState()
			}
			// for debugging purposes
			//function displaySongs() {
			//	for (j = 0; j < songs.length; j++) {
			//		$("#out").append(songs[j].title + " <br/>")	
			//	}
			//}
			
			// Parse the xml which holds the song information and conver it
			// into a JSON object
			function parseXml(xml)
			{
				var local_song = song;
				var i = 0;
				if (getInternetExplorerVersion() != -1) {
					$(xml).filter("song").each(function()
					{
						var temp;
						local_song.id = $(this).attr("id");
						local_song.title = $(this).attr("track");
						local_song.url = $(this).attr("url");
						local_song.artist = $(this).attr("artist");
						local_song.thumb = new Image(); 
						local_song.thumb.src = $(this).attr("thumb");
						songs[i] = jQuery.extend(true, {}, local_song);
						i = i + 1;
					});
				} // end if
				else {
					$(xml).find("song").each(function()
					{
						var temp;
						local_song.id = $(this).attr("id");
						local_song.title = $(this).attr("track");
						local_song.url = $(this).attr("url");
						local_song.artist = $(this).attr("artist");
						local_song.thumb = new Image();
						local_song.thumb.src = $(this).attr("thumb");
						local_song.duration = $(this).attr("duration");
						songs[i] = jQuery.extend(true, {}, local_song);
						i = i + 1;
					});
				} // end else			
			}
			
			/*
				Preloads button images for decreased mouseover latency
			*/
			function loadImages(config) {
				
				var pathtobutts = config.buttonsDir;
				
				images[0] = new Image();
				images[0].src = pathtobutts + 'play.png';
				
				images[1] = new Image();
				images[1].src = pathtobutts + 'play-over.png';
				
				images[2] = new Image();
				images[2].src = pathtobutts + 'pause.png';
				
				images[3] = new Image();
				images[3].src = pathtobutts + 'pause-over.png';
				
				images[4] = new Image();
				images[4].src = pathtobutts + 'skip.png';
				
				images[5] = new Image();
				images[5].src = pathtobutts + 'skip-over.png';
				
				images[6] = new Image();
				images[6].src = pathtobutts + 'stop.png';
				
				images[7] = new Image();
				images[7].src = pathtobutts + 'stop-over.png';
				
				images[8] = new Image();
				images[8].src = pathtobutts + 'back.png';
				
				images[9] = new Image();
				images[9].src = pathtobutts + 'back-over.png';
			}
			
			// ===========================================================================
			// Code to detect if the user is using internet explorer.
			// Barrowed from http://msdn.microsoft.com/en-us/library/ms537509(VS.85).aspx
			// ===========================================================================
			function getInternetExplorerVersion()
			// Returns the version of Internet Explorer or a -1
			// (indicating the use of another browser).
			{
			  var rv = -1; // Return value assumes failure.
			  if (navigator.appName == 'Microsoft Internet Explorer')
			  {
				var ua = navigator.userAgent;
				var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
				if (re.exec(ua) != null)
				  rv = parseFloat( RegExp.$1 );
			  }
			  return rv;
			}
			
			// In case I ever need to check IE version
			function checkVersion()
			{
			  var msg = "You're not using Internet Explorer.";
			  var ver = getInternetExplorerVersion();
			
			  if ( ver > -1 )
			  {
				if ( ver >= 8.0 ) 
				  msg = "You're using a recent copy of Internet Explorer."
				else
				  msg = "You should upgrade your copy of Internet Explorer.";
			  }
			}
})(jQuery);