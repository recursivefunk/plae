/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.1
   
   Change Log v0.8.1
   - Compatible with IE 9
   - Support for no album art option!
   
 */

(function($)
	{
				var songs = new Array();
				var soundObjs = new Array();
				var globalConfig;
				var song = {
								id: " ",
								title: " ",
								url: " ",
								artist: " ",
								thumb: " ",
								duration: " "
							};
				var img = new Array();
				var curr_song = 0;
				var loading = new Image();
				loading.src = 'loading.gif';
				var interval_id;
				soundManager.url = 'swf';
				
		$.fn.SwaggPlayer = function(config) {
				var swagg_div = this;
				if (config.useArt === true) {
					document.getElementById('art').setAttribute('src', loading.src);
				}
				swaggOn(swagg_div, config);
		}
		
		function swaggOn(swagg_div, config) {
				globalConfig = config;
				if (!config.buttonsDir)
					config.buttonsDir = 'images/';
					
				if (config.images)
					img = images;
					
				loadImages(config);
				
				if (!config.xml)
					config.xml = 'xml/songs.xml';
					
				BrowserDetect.init(); // determine which browser we're dealing with
				
				// get songs from XML document						   
				$.ajax({
					type: "GET",
					url: config.xml,
					dataType: "text/xml",
					success: parseXml,
					error: function(xml){
					}
				});
				
				var initButtons = function() {
					i = img;
					var play_ = document.getElementById('play');
					var skip_ = document.getElementById('skip');
					var stop_ = document.getElementById('stop');
					var back_ = document.getElementById('back');
					// ======================= mouse event hooks for play button ===========================
					$('#play-link').click(function() {
						 play(curr_song);
						 return false;
					});
					$('#play-link').mouseover(function() {
						 play_.setAttribute('src', i[1].src);
					});
					$('#play-link').mouseout(function() {
						 play_.setAttribute('src', i[0].src);
					});
					
					// =================== mouse event hooks for skip button =========================
					$('#skip-link').click(function() {
						 skip();
						 return false;
					});
					$('#skip-link').mouseover(function() {
						 skip_.setAttribute('src', i[5].src);
					});
					$('#skip-link').mouseout(function() {
						 skip_.setAttribute('src', i[4].src);
					});
					
					// =================== mouse event hooks for stop button =========================
					$('#stop-link').click(function() {
						 stopMusic(curr_song.toString());
						 return false;
					});
					$('#stop-link').mouseover(function() {
						 stop_.setAttribute('src', i[7].src);
					});
					$('#stop-link').mouseout(function() {
						 stop_.setAttribute('src', i[6].src);
					});
					
					// =================== mouse event hooks for back button =========================
					$('#back-link').click(function() {
						 skipBack();
						 return false;
					});
					$('#back-link').mouseover(function() {
						 back_.setAttribute('src', i[9].src);
					});
					$('#back-link').mouseout(function() {
						 back_.setAttribute('src', i[8].src);
					});
				}
				
				if (BrowserDetect.browser !== 'Safari') { // HTML5 audio bug. ignore HTML5 audio if Safari
					soundManager.useHTML5Audio = true;
				}
				
				soundManager.createSongs = function() {
					if(songs[0] !== undefined) {
						clearInterval(interval_id);
						var localSoundManager = soundManager;
						localSoundManager.useFastPolling = true;
						localSoundManager.useHighPerformance = true;
						var temp;
						//var end = songs.length;
						var objs = soundObjs;
						for (var i = 0, end = songs.length; i < end; i++) {
							temp = localSoundManager.createSound({
								id: i.toString(),
								url: songs[i].url,
								onfinish: skip,
								onplay: buttonPauseState,
								onpause: buttonPlayState,
								onstop: buttonPlayState,
								onresume: buttonPauseState
							});
							temp.load();
							objs[i] = jQuery.extend(true, {}, temp);
						} // end for
						initButtons();
						showSongInfo();
						if (config.useArt === true) {
							document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);	
						}
					}
				}
			
				// init soundManager
				soundManager.onload =  function() {
					interval_id = setInterval('soundManager.createSongs()', 5); // try to init sound manager every 5 milliseconds in case songs are not ready	
				} // end soundManager onload function
			}
				
			// plays the current track
			function play(track) {
				soundManager.togglePause(track.toString());
				showSongInfo();
			}
			
			
			// toggles the play/pause button to pause
			function buttonPauseState() {
				var i = img;
				var play = document.getElementById('play');
				var play_link = document.getElementById('play-link');
				
				play.setAttribute('src', i[2].src);
				
				$('#play-link').mouseout(function() {
					play.setAttribute('src', i[2].src);
				});
				$('#play-link').mouseover(function() {
					play.setAttribute('src', i[3].src);
				});
			}
			
			// toggles the play/pause button to the play state
			function buttonPlayState() {
				var i = img;
				var play = document.getElementById('play');
				play.setAttribute('src', i[0].src);
				$('#play-link').mouseout(function() {
					play.setAttribute('src', i[0].src);
				});
				$('#play-link').mouseover(function() {
					play.setAttribute('src', i[1].src);
				});
			}
			
			// displays artist [song title]
			function showSongInfo(){
				var song_ = songs[curr_song];
				document.getElementById('info').innerHTML = "<p>" + song_.artist + "  </br>" + song_.title + " </p>";	
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
				
				if (globalConfig.useArt === true) {
					var afterEffect = function() {
						play(t);
						showSongInfo();
					}
					switchArt(t, afterEffect);
				}
				else {						
					play(t);
					buttonPauseState();
					showSongInfo();
				}

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
				if (globalConfig.useArt === true) {
					var afterEffect = function() {
						play(t);
						buttonPauseState();
						showSongInfo();
					}
					switchArt(t, afterEffect);
				}
				else {
						play(t);
						buttonPauseState();
						showSongInfo();
				}
			}
			
			// switches to the currently playing song's album art using fancy jquery slide effect
			function switchArt(track, afterEffect){
				$('#art').hide('slide', function() {
											document.getElementById('art').setAttribute('src',songs[track].thumb.src);
											$('#art').show('slide', afterEffect); 
										});
			}
			  
			// stops the currently playing track and changes toggles the pause button back to the play button
			function stopMusic(track) {
				var localSoundManager = soundManager;
				var play = document.getElementById('play');
				localSoundManager.stopAll();
				localSoundManager.unload(track.toString());
				soundObjs[track] = localSoundManager.load(track.toString());
			}
			
			// Parse the xml which holds the song information and conver it
			// into a JSON object
			function parseXml(xml)
			{
				var local_song = song;
				var temp;
				var i = 0;
				if (BrowserDetect.browser === "Explorer" && BrowserDetect.version != '9') {
					$(xml).filter("song").each(function()
					{
						console.log('def not IE 9');
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
						console.log('might b ie9');
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
				
				img[0] = new Image();
				img[0].src = pathtobutts + 'play.png';
				
				img[1] = new Image();
				img[1].src = pathtobutts + 'play-over.png';
				
				img[2] = new Image();
				img[2].src = pathtobutts + 'pause.png';
				
				img[3] = new Image();
				img[3].src = pathtobutts + 'pause-over.png';
				
				img[4] = new Image();
				img[4].src = pathtobutts + 'skip.png';
				
				img[5] = new Image();
				img[5].src = pathtobutts + 'skip-over.png';
				
				img[6] = new Image();
				img[6].src = pathtobutts + 'stop.png';
				
				img[7] = new Image();
				img[7].src = pathtobutts + 'stop-over.png';
				
				img[8] = new Image();
				img[8].src = pathtobutts + 'back.png';
				
				img[9] = new Image();
				img[9].src = pathtobutts + 'back-over.png';
			}
			
	/*
		BROWSER DETECT SCRIPT FROM: http://www.quirksmode.org/js/detect.html
	*/		
	var BrowserDetect = {
		
		init: function () {
			this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
			this.version = this.searchVersion(navigator.userAgent)
				|| this.searchVersion(navigator.appVersion)
				|| "an unknown version";
			this.OS = this.searchString(this.dataOS) || "an unknown OS";
		},
		searchString: function (data) {
			for (var i=0;i<data.length;i++)	{
				var dataString = data[i].string;
				var dataProp = data[i].prop;
				this.versionSearchString = data[i].versionSearch || data[i].identity;
				if (dataString) {
					if (dataString.indexOf(data[i].subString) != -1)
						return data[i].identity;
				}
				else if (dataProp)
					return data[i].identity;
			}
		},
		searchVersion: function (dataString) {
			var index = dataString.indexOf(this.versionSearchString);
			if (index == -1) return;
			return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
		},
	
	dataBrowser: [
			{
				string: navigator.userAgent,
				subString: "Chrome",
				identity: "Chrome"
			},
			{ 	string: navigator.userAgent,
				subString: "OmniWeb",
				versionSearch: "OmniWeb/",
				identity: "OmniWeb"
			},
			{
				string: navigator.vendor,
				subString: "Apple",
				identity: "Safari",
				versionSearch: "Version"
			},
			{
				prop: window.opera,
				identity: "Opera"
			},
			{
				string: navigator.vendor,
				subString: "iCab",
				identity: "iCab"
			},
			{
				string: navigator.vendor,
				subString: "KDE",
				identity: "Konqueror"
			},
			{
				string: navigator.userAgent,
				subString: "Firefox",
				identity: "Firefox"
			},
			{
				string: navigator.vendor,
				subString: "Camino",
				identity: "Camino"
			},
			{		// for newer Netscapes (6+)
				string: navigator.userAgent,
				subString: "Netscape",
				identity: "Netscape"
			},
			{
				string: navigator.userAgent,
				subString: "MSIE",
				identity: "Explorer",
				versionSearch: "MSIE"
			},
			{
				string: navigator.userAgent,
				subString: "Gecko",
				identity: "Mozilla",
				versionSearch: "rv"
			},
			{ 		// for older Netscapes (4-)
				string: navigator.userAgent,
				subString: "Mozilla",
				identity: "Netscape",
				versionSearch: "Mozilla"
			}
		],
		dataOS : [
			{
				string: navigator.platform,
				subString: "Win",
				identity: "Windows"
			},
			{
				string: navigator.platform,
				subString: "Mac",
				identity: "Mac"
			},
			{
				   string: navigator.userAgent,
				   subString: "iPhone",
				   identity: "iPhone/iPod"
			},
			{
				string: navigator.platform,
				subString: "Linux",
				identity: "Linux"
			}
		]
	};
})(jQuery);