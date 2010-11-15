/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.1
   
   Change Log v8.5.1
   - Support for media keys
   - Progress bar added
   - Fixed potential play/pause bug
   - Improved caching to speed up performance
   - Made button dom element IDs configurable
   
 */

(function($)
	{
				var INSTANCE = {
						songs : {},
						song: {
								id:'',
								title:'',
								url:'',
								artist:'',
								thumb:'',
								duration:'',
								img:{},
							},
						config:{},
						img:{},
						curr_song:0
					};
				var interval_id;
				soundManager.url = 'swf';
				
		$.fn.SwaggPlayer = function(config) {
				var swagg_div = this;
				swaggOn(swagg_div, config);
		}
		
		function swaggOn(swagg_div, config) {
				INSTANCE.config = config;
				if (!config.buttonsDir)
					config.buttonsDir = 'images/';
					
				// shared images
				INSTANCE.img = (config.images !== undefined) ? config.images : new Array();	
						
				// preload button images
				loadImages(config); 
				
				// type of data to fetch - xml or json
				var data = (config.data !== undefined) ? config.data : 'json/songs.json';
					
				// determine which browser we're dealing with
				BrowserDetect.init(); 
				
				var format = (config.dataFormat !== undefined) ? config.dataFormat : "json";
					
				// Get songs from JSON or XML document						   
				$.ajax({
					type: "GET",
					url: data,
					dataType: format,
					success: function(data){
						if (format === "json") {
							console.log("Swagg Player::Using JSON...");
							var size = data.length;
							
							// append an IDs to the songs - make configurable in the future
							// to avoid having to loop through JSON array
							for(var i = 0; i < size; i++){
								data[i].image = new Image();
								data[i].image.src = data[i].thumb;
								data[i].id = i.toString();
							}
							
							INSTANCE.songs = data;
						}
						else if (format === "text/xml" || format === "xml"){
							console.log("Swagg Player::Parsing XML. You should think about switching to JSON, it's much faster!");
							parseXml(data);
						}
						else {
							console.log("Swagg Player::Couldn't determine data type!");	
						}
					},
					error: function(xhr, ajaxOptions, thrownError){
						console.log("Swagg Player::There was a problem fetching your songs from the server: " + thrownError);
					}
				});
				
				// event hooks for control buttons
				var initButtons = function() {
					console.log("Swagg Player::Initializing button event hooks");
					var inst = INSTANCE;
					i = INSTANCE.img;
					var $play = (inst.config.play_ !== undefined) ? inst.config.play_ : $('#play');
					var $skip = (inst.config.skip_ !== undefined) ? inst.config.skip_ : $('#skip');
					var $stop = (inst.config.stop_ !== undefined) ? inst.config.stop_ : $('#stop');
					var $back = (inst.config.back_ !== undefined) ? inst.config.back_ : $('#back');
					var $playlink = (inst.config.playlink !== undefined) ? inst.config.playlink : $('#play-link');
					var $skiplink = (inst.config.skiplink !== undefined) ? inst.config.skiplink : $('#skip-link');
					var $stoplink = (inst.config.stoplink !== undefined) ? inst.config.stoplink : $('#stop-link');
					var $backlink = (inst.config.backlink !== undefined) ? inst.config.backlink : $('#back-link');
					// ======================= mouse event hooks for play button ===========================
					$playlink.click(function() {
						 play(INSTANCE.curr_song);
						 return false;
					});
					$playlink.mouseover(function() {
						 $play.attr('src', i[1].src);
					});
					$playlink.mouseout(function() {
						 $play.attr('src', i[0].src);
					});
					
					// =================== mouse event hooks for skip button =========================
					$skiplink.click(function() {
						 skip();
						 return false;
					});
					$skiplink.mouseover(function() {
						 $skip.attr('src', i[5].src);
					});
					$skiplink.mouseout(function() {
						 $skip.attr('src', i[4].src);
					});
					
					// =================== mouse event hooks for stop button =========================
					$stoplink.click(function() {
						 stopMusic(INSTANCE.curr_song.toString());
						 return false;
					});
					$stoplink.mouseover(function() {
						 $stop.attr('src', i[7].src);
					});
					$stoplink.mouseout(function() {
						 $stop.attr('src', i[6].src);
					});
					
					// =================== mouse event hooks for back button =========================
					$backlink.click(function() {
						 skipBack();
						 return false;
					});
					$backlink.mouseover(function() {
						 $back.attr('src', i[9].src);
					});
					$backlink.mouseout(function() {
						 $back.attr('src', i[8].src);
					});
					
					// media key event hooks
					/*
					$(document).keydown(function(e) {

						if (!e) e=window.event;
					
							switch(e.which) {
							  case 179:
								play(INSTANCE.curr_song);
								return false;
								break;
						
							  case 178:
								stopMusic(INSTANCE.curr_song);
								return false;
								break;
						
							  case 176:
								skip();
								return false;
								break;
						
							  case 177:
								skipBack();
								return false;
								break;
								
							case 175:
								volUp(INSTANCE.curr_song);
								return false;
								break;
						
							case 174:
								volDown(INSTANCE.curr_song);
								return false;
								break;	
						}
					});*/
				}
				
				// Safari HTML5 audio bug. ignore HTML5 audio if Safari
				if (BrowserDetect.browser !== 'Safari') { 
					soundManager.useHTML5Audio = true;
				}
				
				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					if(INSTANCE.songs[0] !== undefined) {
						var songs_ = INSTANCE.songs;
						console.log("Swagg Player::Songs loaded. Creating sound objects for Sound Manager...");
						clearInterval(interval_id);
						var localSoundManager = soundManager;
						localSoundManager.useFastPolling = true;
						localSoundManager.useHighPerformance = true;
						initButtons();
						var temp;
						for (var i = 0, end = songs_.length; i < end; i++) {
							temp = localSoundManager.createSound({	// create sound objects to hook event handlers
								id: i.toString(),					// to button states
								url: songs_[i].url,
								onfinish: skip,
								onplay: buttonPauseState,
								onpause: buttonPlayState,
								onstop: buttonPlayState,
								onresume: buttonPauseState,
								whileplaying: function(){progress(this);}
							});
							temp.load();
						} // end for
						if (config.useArt === true) {
							// initialize first song album art
							$('#art').attr('src',songs_[INSTANCE.curr_song].image.src); 
						}
						showSongInfo();
					}
				}
			
				// init soundManager
				soundManager.onload =  function() {
					interval_id = setInterval('soundManager.createSongs()', 5); // try to init sound manager every 5 milliseconds in case songs AJAX callback
																				// has not completed execution	
				} // end soundManager onload function
			}
				
			// Plays a song based on the ID
			function play(track) {
				console.log('Swagg Player::playing track: ' + track);
				var target = soundManager.getSoundById(track.toString());
				
				if (target.paused === true) { // if current track is paused, unpause
					console.log('Swagg Player::unpausing');
					target.resume();
				}
				else { // track is not paused
					console.log('Swagg Player::playing from beginning');
					if (target.playState === 1) // if track is already playing, pause it
						target.pause();
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						target.play();
					}
				}
				
				showSongInfo();
			}
			
			// toggles the play/pause button to pause
			function buttonPauseState() {
				var inst = INSTANCE;
				var i = INSTANCE.img;
				var $play = (inst.config.play_ !== undefined) ? inst.config.play_ : $('#play');
				var $playlink = $('#play-link');
				
				$play.attr('src', i[2].src);
				
				$playlink.mouseout(function() {
					$play.attr('src', i[2].src);
				});
				$playlink.mouseover(function() {
					$play.attr('src', i[3].src);
				});
			}
			
			// toggles the play/pause button to the play state
			function buttonPlayState() {
				var inst = INSTANCE;
				var i = INSTANCE.img;
				var $play = (inst.config.play_ !== undefined) ? inst.config.play_ : $('#play');
				var $playlink = (inst.config.playlink !== undefined) ? inst.config.playlink : $('#play-link');
				
				$play.attr('src', i[0].src);
				
				$playlink.mouseout(function() {
					$play.attr('src', i[0].src);
				});
				$playlink.mouseover(function() {
					$play.attr('src', i[1].src);
				});
			}
			
			// displays artist and song title
			function showSongInfo(){
				var loc_inst = INSTANCE;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
			
			// updates the UI progress bar
			function progress(soundobj){
				if (!soundobj.loaded === true)
					var duration = soundobj.durationEstimate;
				else {
					var duration = soundobj.duration;
				}
				
				var pos = soundobj.position; // get current position of currently playing song
				
				// ratio of (current position / total duration of song)
				var factor = pos/duration; 
				
				// width of progress bar
				var a = parseFloat($('#wrapper').css('width'));
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = a*factor;
				$('#bar').css('width', t);
			}
						
			// Goes to the previous song. if the currently playing song is the first
			// song, it goes to the last song in the list	
			function skipBack() {
				var inst = INSTANCE;
				var t = inst.curr_song;
				if (t == 0){
					t = inst.songs.length - 1;	
				}
				else{
					t = t - 1;	
				}
				stopMusic(t);
				inst.curr_song = t;
				
				// if using album art, use art transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						resetProgressBar();
						showSongInfo();
						play(t);
					}
					switchArt(t, afterEffect);
				} // end if
				// if not using album art, just go to the next song
				else {						
					showSongInfo();
					play(t);
				} // end else
			} // end skipBack()
			
			// reset the progress bar to 0
			function resetProgressBar() {
				$('#bar').css('width', 0);
			}
			  
			// Skips to the next song. If currently playing song is the last song in the list
			// it goes back to the first song
			function skip() {
				var inst = INSTANCE;
				var songs_ = inst.songs;	
				var t = inst.curr_song;
				if (t < songs_.length){
					if (t == songs_.length - 1)
						t = 0;
					else
						t = t+1;
				}
				stopMusic(t);
				inst.curr_song = t;
				// if using album art, use art transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						resetProgressBar();
						showSongInfo();
						play(t);
					}
					switchArt(t, afterEffect);
				} // end if
				// if not using album art, just go to the next song
				else {
						showSongInfo();
						play(t);
				} // end else
			} // end skip()
			
			// switches to the currently playing song's album art using fancy jquery slide effect
			function switchArt(track, afterEffect){
				var $art = $('#art');
				$art.hide('slide', function() {
					$art.attr('src',INSTANCE.songs[track].image.src);
					$art.show('slide', afterEffect); 
				});
			}
			
			// increase volume for currently playing sound
			function volUp(track){
				var sound = soundManager.getSoundById(track.toString());
				var curr_vol = sound.volume;
				soundManager.setVolume(track.toString(), curr_vol + vol_interval);
			}
			
			// decrease volume for currently playing track
			function volDown(track){
				var sound = soundManager.getSoundById(track.toString());
				var curr_vol = sound.volume;
				soundManager.setVolume(track.toString(), curr_vol - vol_interval);
			}
			  
			// Stops the currently playing track and changes toggles the pause button back to the play button
			function stopMusic(track) {
				var localSoundManager = soundManager;
				localSoundManager.stopAll();
				resetProgressBar();
			}
			
			// Parse the xml which holds the song information and conver it
			// into a JSON object
			function parseXml(xml)
			{
				var local_song = INSTANCE.song;
				var temp;
				var songs_ = INSTANCE.songs;
				var i = 0;
				if (BrowserDetect.browser === "Explorer" && BrowserDetect.version != '9') {
					$(xml).filter("song").each(function()
					{
						local_song.id = $(this).attr("id");
						local_song.title = $(this).attr("track");
						local_song.url = $(this).attr("url");
						local_song.artist = $(this).attr("artist");
						local_song.image = new Image();
						local_song.image.src = $(this).attr("thumb"); 
						songs_[i] = jQuery.extend(true, {}, local_song);
						i = i + 1;
					});
				} // end if
				else {
					$(xml).find("song").each(function()
					{
						local_song.id = $(this).attr("id");
						local_song.title = $(this).attr("track");
						local_song.url = $(this).attr("url");
						local_song.artist = $(this).attr("artist");
						local_song.image = new Image();
						local_song.image.src = $(this).attr("thumb"); 
						local_song.duration = $(this).attr("duration");
						songs_[i] = jQuery.extend(true, {}, local_song);
						i = i + 1;
					});
				} // end else
			}
			
			/*
				Preloads button images for decreased mouseover latency
			*/
			function loadImages(config) {
				
				var pathtobutts = config.buttonsDir;
				var img = INSTANCE.img;
				
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