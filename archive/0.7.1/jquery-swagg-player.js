/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   V0.7.1
   
   Change Log v0.7.1:
   -	Plugin now requires xml option (or will default to xml/songs.xml)
   -	Plugin now requires buttonsDir (or will default to images/
   -	Fixed play/pause button toggle bug
   -	Preload images for better performance
*/
(function($)
	{
				var songs = new Array();
				var pathtobutts;
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
				var loading = 'images/loading.gif'; // path to loading gif for when the songs array is still being populated
				soundManager.url = 'swf';
				soundManager.useHTML5Audio = true;
				
		$.fn.SwaggPlayer = function(config) {
				var swagg_div = this;
				swaggOn(swagg_div, config);
		}
			function swaggOn(swagg_div, config) {
				if (config.buttonsDir)
					pathtobutts = config.buttonsDir;
				else
					pathtobutts = 'images/';
				loadImages();
				document.getElementById('art').setAttribute('src', loading);
				isplaying = false;
				var mysongs;
				if (config.xml)
					mysongs = config.xml;
				else 
					mysongs = 'xml/songs.xml';
				// get songs from XML document						   
				$.ajax({
					type: "GET",
					url: mysongs,
					dataType: "text/xml",
					success: parseXml,
					error: function(xml){
					}
				});
			
				// ======================= mouse event hooks for play button ===========================
				$('#play-link').click(function() {
					 play();
				});
				$('#play-link').mouseover(function() {
					 document.getElementById('play').setAttribute('src', images[1].src);
				});
				$('#play-link').mouseout(function() {
					 document.getElementById('play').setAttribute('src', images[0].src);
				});
				
				// =================== mouse event hooks for skip button =========================
				$('#skip-link').click(function() {
					 skip();
				});
				$('#skip-link').mouseover(function() {
					 document.getElementById('skip').setAttribute('src', images[5].src);
				});
				$('#skip-link').mouseout(function() {
					 document.getElementById('skip').setAttribute('src', images[4].src);
				});
				
				// =================== mouse event hooks for stop button =========================
				$('#stop-link').click(function() {
					 stopMusic(curr_song.toString());
				});
				$('#stop-link').mouseover(function() {
					 document.getElementById('stop').setAttribute('src', images[7].src);
				});
				$('#stop-link').mouseout(function() {
					 document.getElementById('stop').setAttribute('src', images[6].src);
				});
				
				// =================== mouse event hooks for back button =========================
				$('#back-link').click(function() {
					 skipBack();
				});
				$('#back-link').mouseover(function() {
					 document.getElementById('back').setAttribute('src', images[9].src);
				});
				$('#back-link').mouseout(function() {
					 document.getElementById('back').setAttribute('src', images[8].src);
				});
			
				// init soundManager
				soundManager.onload =  function() {
					soundManager.useFastPolling = true;
					soundManager.useHighPerformance = true;
					while(songs == null){console.log('waiting...');}
					var temp;
					for (var i = 0; i < songs.length; i++) {
						temp = soundManager.createSound({
							id: i.toString(),
							url: songs[i].url,
						});
						soundObjs[i] = jQuery.extend(true, {}, temp);
						soundObjs[i].load();
					} // end for
					showSongInfo();
					document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);
				} // end soundManager onload function
			
				window.onbeforeunload = function() {
					for (var i = 0; i < soundObjs.length; i++) {
						var temp = soundObjs[i];
						temp.destroySound();
					}
				}
			}
			
			// plays the current track
			function play() {
				togglePlayPauseButton();
				soundManager.togglePause(curr_song.toString());
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
			
			function buttonPauseState() {
				document.getElementById('play').setAttribute('src', images[2].src);
				$('#play-link').mouseout(function() {
					document.getElementById('play').setAttribute('src', images[2].src);
				});
				$('#play-link').mouseover(function() {
					document.getElementById('play').setAttribute('src', images[3].src);
				});
			}
			
			function buttonPlayState() {
				document.getElementById('play').setAttribute('src', images[0].src);
				$('#play-link').mouseout(function() {
					document.getElementById('play').setAttribute('src', images[0].src);
				});
				$('#play-link').mouseover(function() {
					document.getElementById('play').setAttribute('src', images[1].src);
				});
			}
			
			// displays artist [song title]
			function showSongInfo(){
				document.getElementById('info').innerHTML = "<p>" + songs[curr_song].artist + "  [" + songs[curr_song].title + "] </p>";	
			}
			
			/*
			 goes to the previous song. if the currently playing song is the first
			 song, it goes to the last song in the list
			*/
			function skipBack() {
				var t = curr_song;
				if (t == 0){
					t = songs.length - 1;	
				}
				else{
					t = t - 1;	
				}
				//soundManager.stop(curr_song.toString());
				stopMusic();
				curr_song = t;
				switchArt();
				play();
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
				//soundManager.stop(curr_song.toString());
				stopMusic();
				curr_song = t;
				play();
				switchArt();
				buttonPauseState();
				isplaying = true;
				showSongInfo();
			}
			
			// switches to the currently playing song's album art using fancy jquery slide effect
			function switchArt(){
				//var art = albumart;
				//console.log(albumart[curr_song]);
				$('#art').hide('slide', function() {
											document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);
											//document.getElementById('art').setAttribute('src', albumart[curr_song]);
											$('#art').show('slide'); 
										});
			}
			  
			// stops the currently playing track and changes toggles the pause button back to the play button
			function stopMusic() {
				soundManager.stopAll();//(curr_song.toString());
				soundManager.unload(curr_song.toString());
				soundObjs[curr_song] = soundManager.load(curr_song.toString());
				isplaying = false;
				document.getElementById('play').setAttribute('src', images[0].src);
				$('#play-link').mouseover(function() {
						document.getElementById('play').setAttribute('src', images[1].src);
				});
				$('#play-link').mouseout(function() {
						document.getElementById('play').setAttribute('src', images[0].src);
				});
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
				var i = 0;
				if (getInternetExplorerVersion() != -1) {
					$(xml).filter("song").each(function()
					{
						var temp;
						song.id = $(this).attr("id");
						song.title = $(this).attr("track");
						song.url = $(this).attr("url");
						song.artist = $(this).attr("artist");
						song.thumb = new Image(); 
						song.thumb.src = $(this).attr("thumb");
						songs[i] = jQuery.extend(true, {}, song);
						i = i + 1;
					});
				} // end if
				else {
					$(xml).find("song").each(function()
					{
						var temp;
						song.id = $(this).attr("id");
						song.title = $(this).attr("track");
						song.url = $(this).attr("url");
						song.artist = $(this).attr("artist");
						song.thumb = new Image();
						song.thumb.src = $(this).attr("thumb");
						song.duration = $(this).attr("duration");
						songs[i] = jQuery.extend(true, {}, song);
						i = i + 1;
					});
				} // end else			
			}
			
			/*
				Preloads button images for decreased mouseover latency
			*/
			function loadImages() {
				
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