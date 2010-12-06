/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.4.2
   
   Change Log v0.8.5.4.2
   - Added a logger object
   - Used jQuery data API to store song information within playlist
 */

(function ($){
		/*global soundManager: false, setInterval: false, console: false, BrowserDetect: false */
		var SwaggLog = {
			error: function(errMsg){
				console.log('Swagg Player::Error::' + errMsg);	
			},
			info: function(info){
				console.log('Swagg Player::Info::' + info);	
			},
			warn: function(warning) {
				console.log('Swagg Player::Warning::' + warning);	
			},
			echo: function(func, propName, propVal) {
				console.log('Swagg Player::Echo::From ' + func + ': ' + propName + '=' + propVal );	
			}
		};
		
		var PROPS = {
			songs : {},
			song: {
				id: '',
				title: '',
				url: '',
				artist: '',
				thumb: '',
				duration: '',
				img: []
			},
			config: {},
			img: {},
			curr_song: 0,
			vol_interval: 5,
			interval_id: -1 
		};	

		var swagg = {
			init : function(config) {
				PROPS.config = config;
					
				// check if we're using button images. if so, preload them. if not, ignore.
				if (config.buttonImages === undefined || config.buttonImages === true) {
					config.buttonImages = true;
					if (!config.buttonsDir) {
						config.buttonsDir = 'images/';
					}	
					// preload button images
					swagg.loadImages(config); 	
				}
				else {
					config.buttonImages === false;	
				}
	
				
				
				// path to song data - json file
				var data = (config.data !== undefined) ? config.data : 'json/songs.json';
					
				// determine which browser we're dealing with
				BrowserDetect.init(); 
					
				// Get songs from JSON document						   
				$.ajax({
					type: "GET",
					url: data,
					dataType: 'json',
					success: function(data){
						SwaggLog.info('Successfully fetched JSON...');
						var size = data.length;
						
						// preload song album art and append an IDs to the songs - make configurable in the future
						// to avoid having to loop through JSON array
						for (var i = 0; i < size; i++) {
							data[i].image = new Image();
							data[i].image.src = data[i].thumb;
							data[i].id = i.toString();
						}
						PROPS.songs = data;
					},
					error: function(xhr, ajaxOptions, thrownError){
						SwaggLog.error('There was a problem fetching your songs from the server: ' + thrownError);
					}
				});
				
				// event hooks for control buttons
				var initButtons = function() {
					SwaggLog.info('Initializing button event hooks');
					var inst = PROPS;
					var _images = inst.config.buttonImages === true;
					var i = inst.img;
					var $play = (inst.config.playButt !== undefined) ? inst.config.playButt : $('#play');
					var $skip = (inst.config.skipButt !== undefined) ? inst.config.skipButt : $('#skip');
					var $stop = (inst.config.stopButt !== undefined) ? inst.config.stopButt : $('#stop');
					var $back = (inst.config.backButt !== undefined) ? inst.config.backButt : $('#back');
					
					$play.bind({
						click: function() {
							 swagg.play('playlink click', PROPS.curr_song);
							 return false;
						},
						mouseover: function() {
							if (_images === true) {
								$play.attr('src', i[1].src);	
							}
						},
						mouseout: function() {
							if (_images === true) {
								$play.attr('src', i[0].src);	
							}
						}
					});
					
					$skip.bind({
						click: function() {
							swagg.skip(1);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$skip.attr('src', i[5].src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$skip.attr('src', i[4].src);	
							}
						}
					});

					$stop.bind({
						click: function() {
							swagg.stopMusic(PROPS.curr_song);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$stop.attr('src', i[7].src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$stop.attr('src', i[6].src);
							}
						}
					});

					$back.bind({
						click: function() {
							swagg.skip(0);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$back.attr('src', i[9].src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$back.attr('src', i[8].src);
							}
						}
					});
					
					// media key event hooks				
					$(document).keydown(function(e) {
	
						if (!e) e=window.event;
					
							switch(e.which) {
							  case 179:
								swagg.play('Media key event switch',PROPS.curr_song);
								return false;
						
							  case 178:
								swagg.stopMusic(PROPS.curr_song);
								return false;
						
							  case 176:
								swagg.skip(1);
								return false;
						
							  case 177:
								swagg.skip(0);
								return false;
								
							case 175:
								swagg.volume(PROPS.curr_song, 1);
								return false;
						
							case 174:
								swagg.volume(PROPS.curr_song, 0);
								return false;
						}
					});
				}
				
				// Safari HTML5 audio bug. ignore HTML5 audio if Safari
				if (BrowserDetect.browser !== 'Safari') { 
					soundManager.useHTML5Audio = true;
				}
				
				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					SwaggLog.info('createSongs()');
					if(PROPS.songs[0] !== undefined) {
						clearInterval(PROPS.interval_id);
						var songs_ = PROPS.songs;
						var localSoundManager = soundManager;
						localSoundManager.useFastPolling = true;
						localSoundManager.useHighPerformance = true;
						initButtons();
						var temp;
						for (var i = 0, end = songs_.length; i < end; i++) {
							temp = localSoundManager.createSound({	// create sound objects to hook event handlers
								id: 'song-' + i.toString(),			// to button states
								url: songs_[i].url,
								autoLoad: true,
								onfinish: function(){swagg.skip(1)},
								onplay: function(){swagg.playPauseButtonState(0);},
								onpause: function(){swagg.playPauseButtonState(1);},
								onstop: function(){swagg.playPauseButtonState(1);},
								onresume: function(){swagg.playPauseButtonState(0);},
								whileplaying: function(){swagg.progress(this);}
							});
							if (PROPS.config.playList !== undefined) {
								temp.id = 'song-' + i.toString();
								swagg.createElement(temp);
							}
						} // end for
						if (config.useArt === true) {
							// initialize first song album art
							$('#art').attr('src',songs_[PROPS.curr_song].image.src); 
						}
						swagg.showSongInfo();
					}
				};
			
				// init soundManager
				soundManager.onload =  function() {
					PROPS.interval_id = setInterval('soundManager.createSongs()', 5); // try to init sound manager every 5 milliseconds in case songs AJAX callback
																				// has not completed execution	
				}; // end soundManager onload function	
				
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  SwaggLog.error('An error has occured with loading Sound Manager! Rebooting...');
				  soundManager.flashLoadTimeout = 0;
				  clearInterval(PROPS.interval_id);
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
					  SwaggLog.error('Something went wrong with loading Sound Manager. No tunes for you!');
					}
				  },1500);
				}
			},
			
			// Plays a song based on the ID
			play : function(caller, track){
				var sound_id = 'song-' + track
				SwaggLog.info('Playing track: ' + sound_id + '. Oh and ' + caller + ' called me!');
				var target = soundManager.getSoundById(sound_id);
				
				if (target.paused === true) { // if current track is paused, unpause
					SwaggLog.info('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						SwaggLog.info('Pausing current track');
						target.pause();
					}
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						SwaggLog.info('Playing current track from beginning');
						target.play();
					}
				}
				swagg.showSongInfo();
			},
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				SwaggLog.info('createElement()');
				var song = PROPS.songs[parseInt(soundobj.id.split('-')[1])];
				var el = '<div class="playlist-item" id="item-' + soundobj.id + '><a href="#">' + song.title + ' - ' + song.artist + '</a></div>';
				PROPS.config.playList.append(el);
				
				var id = 'item-' + soundobj.id;
				var div = $('#' + id);
				div.data("song", song);
				SwaggLog.info(div.data("song"));
				
				div.click(function(){
					var track = $(this).data("song").id;
					swagg.stopMusic(PROPS.curr_song);
					var afterEffect = function() {
						swagg.showSongInfo();
						swagg.play('switchArt() - by way of createElement',track);
					}			
					PROPS.curr_song = track;
					if (PROPS.config.useArt === true) {
						swagg.switchArt(track, afterEffect);
					}
					else {
						swagg.showSongInfo();
						swagg.play('switchArt() - by way of createElement',track);	
					}
					return false;			
				});
			},
			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				SwaggLog.info('PlayButtonState() state: ' + state);
				var inst = PROPS;
				var i = inst.img;
				var out, over;
				var $play = (inst.config.playButt !== undefined) ? inst.config.playButt : $('#play');
				
				if (state === 1 ) { // play state
					out = 0;
					over = 1;
					if (inst.config.buttonImages === false) {
						$play.html('play');
					}
				}
				else if (state === 0) { // pause state
					out = 2; 
					over = 3;
					if (inst.config.buttonImages === false) {
						$play.html('pause');
					}
				}
				else { // invalid state
					SwaggLog.error('Invalid button state! : ' + state);	
					return false;
				};
				if (inst.config.buttonImages === true) {
					$play.attr('src', i[out].src);

					$play.bind({
						mouseout: function(){
							$play.attr('src', i[out].src);
						},
						mouseover: function(){
							$play.attr('src', i[over].src);
						}	
					});
				}
			},
		
			// Skips to the next song. If currently playing song is the last song in the list
			// it goes back to the first song
			skip : function(direction){
				SwaggLog.info('skip()');
				var inst = PROPS;
				//var songs_ = inst.songs;	
				var t = inst.curr_song;
				
				if (direction === 1) { // skip forward
					if (t < inst.songs.length){
						if (t == inst.songs.length - 1)
							t = 0;
						else
							t = t+1;
					}
				}
				else if (direction === 0) { // skip back
					if (t === 0){
						t = inst.songs.length - 1;	
					}
					else{
						t = t - 1;	
					}
				}
				else { // invalid flag
					SwaggLog.error('Invalid skip direction flag: ' + direction);
					return false;	
				}
				swagg.stopMusic(t);
				inst.curr_song = t;
				// if using album art, use art transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						swagg.showSongInfo();
						swagg.play('skip',t);
					}
					swagg.switchArt(t, afterEffect);
				} // end if
				// if not using album art, just go to the next song
				else {
						swagg.showSongInfo();
						swagg.play('skip',t);
				} // end else	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				$('#bar').css('width', 0);
				$('#loaded').css('width', 0);
			},	
			
			// Stops the specified song
			stopMusic : function(track) {
				SwaggLog.info('stopMusic()');
				soundManager.stopAll();
				swagg.resetProgressBar();	
			},
			
			// Preloads button images
			loadImages : function(config) {
				SwaggLog.info('loadImages()');
				if (config.buttonImages === true) {		
					var pathtobutts = config.buttonsDir;
					var img = PROPS.img;
					
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
				else {
					console.log('Swagg Player::You\'ve specified no button images yet, you\'ve given me an images directory! Ignoring...');	
				}
			},
			
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = 'song-' + track
				var sound = soundManager.getSoundById(sound_id);
				
				var curr_vol = sound.volume;
				if (flag === 1) {
					soundManager.setVolume(sound_id, curr_vol + PROPS.vol_interval);
				}
				else if (flag === 0) {
					soundManager.setVolume(sound_id, curr_vol - PROPS.vol_interval);
				}
				else {
					console.log('Swagg Player::Invalid volume flag!');	
				}
			},
			
			// switches to the currently playing song's album art using fancy jquery slide effect
			switchArt : function(track, afterEffect) {
				var sound_id = 'song-' + track
				var $art = $('#art');
				$art.hide('slide', function() {
					$art.attr('src',PROPS.songs[track].image.src);
					$art.show('slide', afterEffect); 
				});	
			},
			
			// updates the UI progress bar
			progress : function(soundobj) {
				if (!soundobj.loaded === true)
					var duration = soundobj.durationEstimate;
				else {
					var duration = soundobj.duration;
				}
				
				// get current position of currently playing song
				var pos = soundobj.position; 
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration; 
				
				// width of progress bar
				var wrapper_width = parseFloat($('#wrapper').css('width'));
				
				var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				var loaded = wrapper_width * loaded_ratio;
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = wrapper_width*pos_ratio;
				$('#bar').css('width', t);
				$('#loaded').css('width', loaded);	
					
					
			},
			
			// displays artist and song title
			showSongInfo : function() {
				var loc_inst = PROPS;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};
		
			
		// BROWSER DETECT SCRIPT FROM: http://www.quirksmode.org/js/detect.html	
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
				
		$.fn.SwaggPlayer = function(options) {
			soundManager.url = 'swf';
			soundManager.useFlashBlock = true;
			soundManager.flashLoadTimeout = 5000;
			swagg.init(options);
		};
})(jQuery);