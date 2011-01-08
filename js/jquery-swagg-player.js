/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/swaggplayer

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.6
   
   Change Log v0.8.5.6
   - Event hooks for play, pause, resume and stop
   - SM2 Update
   - Ability to configure using html5 audio (best attempt as described by SM2 documentation)
   - Decreased flash timeout
 */

(function ($){
		/*global soundManager: false, setInterval: false, console: false, BrowserDetect: false, $: false */
		
		// logging utility
		var SwaggLog = {
			error: function(errMsg){
				if (PROPS.config.debug === true) {
					console.log( new Date() + ' Swagg Player::Error::' + errMsg);
				}
			},
			info: function(info){
				if (PROPS.config.debug === true) {
					console.log(new Date() + ' Swagg Player::Info::' + info);	
				}
			},
			warn: function(warning) {
				if (PROPS.config.debug === true) {
					console.log(new Date() + ' Swagg Player::Warning::' + warning);	
				}
			}
		};

		
		// global properties
		var PROPS = {
			songs : {},
			song: {},
			config: {},
			img: {},
			curr_song: 0,
			vol_interval: 5,
			interval_id:-1,
			_play:	$('#swagg-player-play-button'),
			_pause:	$('#swagg-player-pause-button'),
			_skip:	$('#swagg-player-skip-button'),
			_back:	$('#swagg-player-back-button'),
			_stop:	$('#swagg-player-stop-button') 
		};	
		
		// images for button controls
		var imageLoader = {
				_play:null,
				_playOver:null,
				_pauseOver:null,
				_pause:null,
				_stop:null,
				_stopOver:null,
				_back:null,
				_backOver:null,
				_skip:null,
				_skipOver:null,
				_imagesLoaded:false,
				
				loadButtonImages: function(imagesDir) {
					SwaggLog.info('Loading images for controls...');
					this._play = new Image();
					this._play.src = imagesDir + 'play.png';
					
					this._playOver = new Image();
					this._playOver.src = imagesDir + 'play-over.png';
					
					this._pause = new Image();
					this._pause.src = imagesDir + 'pause.png';
					
					this._pauseOver = new Image();
					this._pauseOver.src = imagesDir + 'pause-over.png';
					
					this._skip = new Image();
					this._skip.src = imagesDir + 'skip.png';
					
					this._skipOver = new Image();
					this._skipOver.src = imagesDir + 'skip-over.png';
					
					this._back = new Image();
					this._back.src = imagesDir + 'back.png';
					
					this._backOver = new Image();
					this._backOver.src = imagesDir + 'back-over.png';
					
					this._stop = new Image();
					this._stop.src = imagesDir + 'stop.png';
					
					this._stopOver = new Image();
					this._stopOver.src = imagesDir + 'stop-over.png';
					
					this._imagesLoaded = true;
				}
			};

		var swagg = {
			init : function(config) {
				PROPS.config = config;
				
				
				if (BrowserDetect.browser === 'Explorer' && config.debug === true){
					config.debug = false; // Sometimes, IE doesn't like the console object so, for now there is no debugging in IE
				}
				if (!soundManager.supported()) {
					SwaggLog.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					SwaggLog.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
				}
					
				// check if we're using button images. if so, preload them. if not, ignore.
				if (config.buttonsDir !== undefined) {
					imageLoader.loadButtonImages(config.buttonsDir);	
				}
	
				// path to song data - json file
				var data = (config.data !== undefined) ? config.data : 'json/songs.json';
					
				// Get songs from JSON document						   
				$.ajax({
					type: "GET",
					url: data,
					dataType: 'json',
					success: function(data){
						SwaggLog.info('Successfully fetched songs from the server.');
						var size = data.length;
						var props = PROPS;
						// preload song album  and append an IDs to the songs - make configurable in the future
						// to avoid having to loop through JSON array
						for (var i = 0; i < size; i++) {
							if (props.config.useArt === true) {
								data[i].image = new Image();
								data[i].image.src = data[i].thumb;
							}
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
					var _images = imageLoader._imagesLoaded;
					var i = inst.img;
					
					PROPS._play.bind({
						click: function() {
							 swagg.play('playlink click', PROPS.curr_song);
							 return false;
						},
						mouseover: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._playOver.src);	
							}
						},
						mouseout: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._play.src);	
							}
						}
					});
					
					PROPS._skip.bind({
						click: function() {
							swagg.skip(1);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._skipOver.src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._skip.src);	
							}
						}
					});

					PROPS._stop.bind({
						click: function() {
							swagg.stopMusic(PROPS.curr_song);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._stopOver.src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._stop.src);
							}
						}
					});

					PROPS._back.bind({
						click: function() {
							swagg.skip(0);
							return false;
						},
						mouseover: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._backOver.src);
							}
						},
						mouseout: function() {
							if (_images === true) {
								$(this).attr('src', imageLoader._back.src);
							}
						}
					});
					
					// media key event hooks				
					$(document).keydown(function(e) {
	
						if (!e) e = window.event;
					
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
				
				if (PROPS.config.html5Audio === true && BrowserDetect.browser !== 'Safari') { // Safari HTML5 audio bug. ignore HTML5 audio if Safari
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
								onfinish: function(){
									swagg.skip(1);
								},
								onplay: function(){
									swagg.playPauseButtonState(0);
									if(PROPS.config.onPlay !== undefined && jQuery.isFunction(PROPS.config.onPlay)){
										PROPS.config.onPlay();
									}
								},
								onpause: function(){
									swagg.playPauseButtonState(1); 
									if(PROPS.config.onPause !== undefined && jQuery.isFunction(PROPS.config.onPause)){
										PROPS.config.onPause();
									}
								},
								onstop: function(){
									swagg.playPauseButtonState(1); 
									if(PROPS.config.onStop !== undefined && jQuery.isFunction(PROPS.config.onStop)){
										PROPS.config.onStop();
									}
								},
								onresume: function(){
									swagg.playPauseButtonState(0); 
									if(PROPS.config.onResume !== undefined && jQuery.isFunction(PROPS.config.onResume)){
										PROPS.config.onResume();
									}
								},
								whileplaying: function(){
									swagg.progress(this);
								}
							});
							
							//swagg.id3Fill(temp);
							if (PROPS.config.playList !== undefined && PROPS.config.playList === true) {
								temp.id = 'song-' + i.toString();
								swagg.createElement(temp);
							}
						} // end for
						if (config.useArt === true) {
							// initialize first song album 
							$('#swagg-player-art').attr('src',songs_[PROPS.curr_song].image.src); 
						}
						swagg.showSongInfo();
						SwaggLog.info("Swagg Player ready!");
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
				var id = 'item-' + song.id;
				var el = '<div class="swagg-player-playlist-item" id="' + id + '"><a href="#">' + song.title + ' - ' + song.artist + '</a></div>';
				$('#swagg-player-list').append(el);
							
				var $div = $('#' + id);
				$div.data('song', song);
				$div.bind({
					click: function(){
						var track = parseInt($(this).data('song').id);
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
					}
				});
			},
			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				SwaggLog.info('PlayButtonState() state: ' + state);
				var inst = PROPS;
				var i = inst.img;
				var imagesLoaded = imageLoader._imagesLoaded;
				var out, over;
				var $play = PROPS._play;
				
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						$play.html('play ');
					}
					else {
						out = imageLoader._play.src;
						over = imageLoader._playOver.src;
					}

				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						$play.html('pause ');
					}
					else {
						out = imageLoader._pause.src; 
						over = imageLoader._pauseOver.src;
					}

				}
				else { // invalid state
					SwaggLog.error('Invalid button state! : ' + state);	
					return false;
				};
				if (imagesLoaded === true) {
					$play.attr('src', out);

					$play.bind({
						mouseout: function(){
							$play.attr('src', out);
						},
						mouseover: function(){
							$play.attr('src', over);
						}	
					});
				}
			},
		
			// Skips to the next song. If the currently playing song is the last song in the list
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
				// if using album , use  transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						swagg.showSongInfo();
						swagg.play('skip',t);
					}
					swagg.switchArt(t, afterEffect);
				} // end if
				// if not using album , just go to the next song
				else {
						swagg.showSongInfo();
						swagg.play('skip',t);
				} // end else	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				$('#swagg-player-bar').css('width', 0);
				$('#swagg-player-loaded').css('width', 0);
			},	
			
			// Stops the specified song
			stopMusic : function(track) {
				SwaggLog.info('stopMusic()');
				soundManager.stopAll();
				swagg.resetProgressBar();	
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
					SwaggLog.info('Invalid volume flag!');	
				}
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track, afterEffect) {
				SwaggLog.info('Will show  for song at index: ' + track);
				var sound_id = 'song-' + track
				var art = $('#swagg-player-art');
				art.hide('slide', function() {
					$(this).attr('src',PROPS.songs[track].image.src);
					$(this).show('slide', afterEffect); 
				});	
			},
			
			id3Fill : function(soundobj) {
				var song = PROPS.songs[parseInt(soundobj.id.split('-')[1])];
				if (typeof soundobj.id3.TIT2 !== undefined) {
					song.title = soundobj.id3.TIT2;	
				}
				else if(typeof soundobj.id3.songname !== undefined) {
					song.title = soundobj.id3.songname;	
				}
				else{}
				
				if(typeof soundobj.id3.TPE2 !== undefined) {
					song.artist = soundobj.id3.TPE2;	
				}
				else if (typeof soundobj.id3.artist !== undefined) {
					song.artist = soundobj.id3.artist;	
				}
				else{}
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
				var wrapper_width = parseFloat($('#swagg-player-progress-wrapper').css('width'));
				
				var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				var loaded = wrapper_width * loaded_ratio;
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = wrapper_width*pos_ratio;
				$('#swagg-player-bar').css('width', t);
				$('#swagg-player-loaded').css('width', loaded);		
			},
			
			// displays ist and song title
			showSongInfo : function() {
				var loc_inst = PROPS;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#swagg-player-song-info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};
		
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
				if (this.browser === 'GoogleTV') {
					window.location = 'http://johnnyray.tv';	
				}
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
					subString: "GoogleTV",
					identity: "GoogleTV"
				},
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
			SwaggLog.info('Initializing SoundManager2');
			window.soundManager = new SoundManager(); // Flash expects window.soundManager.
    		soundManager.beginDelayedInit(); // start SM2 init.
			soundManager.wmode = 'transparent'
			soundManager.url = 'swf';
			soundManager.flashLoadTimeout = 1000;
			swagg.init(options);
		};
})(jQuery);