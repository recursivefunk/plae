/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/swaggplayer

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.6.4
   
   Change Log v0.8.5.6.4
   - Added time tracking object
   - Added onSnapshot event handler for seek preview functionality
   
*/
(function ($){
		/*global soundManager: false, setInterval: false, console: false, BrowserDetect: false, $: false */
		
		// logging utility
		var SwaggLog = {
			error: function(errMsg){
				if (Props.config.debug === true) {
					console.log( new Date().formatMMDDYYYY() + ' Swagg Player::Error::' + errMsg);
				}
			},
			info: function(info){
				if (Props.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Info::' + info);	
				}
			},
			warn: function(warning) {
				if (Props.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Warning::' + warning);	
				}
			},	
			formatDate : function(){
				Date.prototype.formatMMDDYYYY = function()
				{
					var amPm = '';
					var month = parseInt(this.getMonth()) + 1;
					var minutes = function(mns){
						if (mns < 10) {
							return '0' + mns;	
						}
						else {
							return mns;	
						}
					}
					var hours = function(hrs){
						if (hrs > 12) {
							amPm = 'PM';
							return hrs - 12;	
						} 
						else {
							amPm = 'AM';
							return hrs;	
						}
					};
					return this.getFullYear() + "-" + month + "-" +  this.getDate()  + " " + hours(this.getHours()) + ":" + minutes(this.getMinutes()) + amPm;
				};
			}
		};

		
		// global properties
		var Props = {
			songs : {},
			song: {},
			config: {},
			img: {},
			curr_song: 0,
			vol_interval: 5,
			interval_id:-1,
			html: {
				_loading: $('<img src="loading.gif"></img>'),
				_play:	$('#swagg-player-play-button'),
				_pause:	$('#swagg-player-pause-button'),
				_skip:	$('#swagg-player-skip-button'),
				_back:	$('#swagg-player-back-button'),
				_stop:	$('#swagg-player-stop-button') ,
				_controls: $('#swagg-player-controls'),
				_player: $('#swagg-player'),
				_playlist: $('#swagg-player-list'),
				_art: $('#swagg-player-art'),
				_progress_wrapper: $('#swagg-player-progress-wrapper'),
				_bar: $('#swagg-player-bar'),
				_loaded: $('#swagg-player-loaded'),
				_song_info: $('#swagg-player-song-info'),
				_data: null
			}
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
				Props.config = config;
				SwaggLog.formatDate();
				
				Props.html._data = $('<div></div>');
				Props.html._data.attr('id','swagg-player-data');
				Props.html._data.css('display','none');
				Props.html._player.append(Props.html._data);
				
				var trackTime = {
					totalMinutes:null,
					totalSeconds:null,
					currMinutes:null,
					currSeconds:null,
					currTimeAsString: function(){
						var currMin = (this.currMinutes > 9) ? this.currMinutes : '0' + 
							this.currMinutes.toString();
						var currSec = (this.currSeconds > 9) ? this.currSeconds : '0' + 
							this.currSeconds.toString();	
						return currMin + ':' + currSec;
					},
					totalTimeAsString: function() {
						var totalMin = (this.totalMinutes > 9) ? this.totalMinutes : '0' + 
							this.totalMinutes.toString();
						var totalSec = (this.totalSeconds > 9) ? this.totalSeconds : '0' + 
							this.totalSeconds.toString();	
						return totalMin + ':' + totalSec;	
					},
					snapShot:{
						seconds:null,
						minutes:null,
						asString: function(){
							var mins = (this.minutes > 9) ? this.minutes : '0' + 
								this.minutes.toString();
							var secs = (this.seconds > 9) ? this.seconds : '0' + 
								this.seconds.toString();	
							return mins + ':' + secs;							
						}
					}		
				};
				Props.html._data.data('time', trackTime);
				$('.swagg-player-button').css('cursor', 'pointer');
				
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
						var props = Props;
						// preload song album  and append an IDs to the songs - make configurable in the future
						// to avoid having to loop through JSON array
						for (var i = 0; i < size; i++) {
							if (props.config.useArt === true) {
								data[i].image = new Image();
								data[i].image.src = data[i].thumb;
							}
							data[i].id = i.toString();
						}
						Props.songs = data;
					},
					error: function(xhr, ajaxOptions, thrownError){
						SwaggLog.error('There was a problem fetching your songs from the server: ' + thrownError);
					}
				});
				
				// event hooks for control buttons
				var initButtons = function() {
					SwaggLog.info('Initializing button event hooks');
					var inst = Props;
					var _images = imageLoader._imagesLoaded;
					var i = inst.img;
					
					Props.html._play.bind({
						click: function() {
							 swagg.play('playlink click', Props.curr_song);
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
					
					Props.html._skip.bind({
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

					Props.html._stop.bind({
						click: function() {
							swagg.stopMusic(Props.curr_song);
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

					Props.html._back.bind({
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
								swagg.play('Media key event switch',Props.curr_song);
								return false;
						
							  case 178:
								swagg.stopMusic(Props.curr_song);
								return false;
						
							  case 176:
								swagg.skip(1);
								return false;
						
							  case 177:
								swagg.skip(0);
								return false;
								
							case 175:
								swagg.volume(Props.curr_song, 1);
								return false;
						
							case 174:
								swagg.volume(Props.curr_song, 0);
								return false;
						}
					});
				}
				
				if (Props.config.html5Audio === true && BrowserDetect.browser !== 'Safari') { // Safari HTML5 audio bug. ignore HTML5 audio if Safari
					soundManager.useHTML5Audio = true;
				}
				
				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					SwaggLog.info('createSongs()');
					if(Props.songs[0] !== undefined) {
						clearInterval(Props.interval_id);
						var songs_ = Props.songs;
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
									swagg.millsToTime(this.duration, 0);	
									swagg.playPauseButtonState(0);
									if(Props.config.onPlay !== undefined && jQuery.isFunction(Props.config.onPlay)){
										Props.config.onPlay();
									}
								},
								onpause: function(){
									swagg.playPauseButtonState(1); 
									if(Props.config.onPause !== undefined && jQuery.isFunction(Props.config.onPause)){
										Props.config.onPause();
									}
								},
								onstop: function(){
									swagg.playPauseButtonState(1); 
									if(Props.config.onStop !== undefined && jQuery.isFunction(Props.config.onStop)){
										Props.config.onStop();
									}
								},
								onresume: function(){
									swagg.playPauseButtonState(0); 
									if(Props.config.onResume !== undefined && jQuery.isFunction(Props.config.onResume)){
										Props.config.onResume();
									}
								},
								whileplaying: function(){
									swagg.progress(this);
									swagg.millsToTime(this.position, 1);
									if(Props.config.whilePlaying !== undefined && jQuery.isFunction(Props.config.whilePlaying)){
										Props.config.whilePlaying();
									}
								}
							});
							temp.id = 'song-' + i.toString();
							//swagg.id3Fill(temp);
							if (Props.config.playList !== undefined && Props.config.playList === true) {
								swagg.createElement(temp);
							}
						} // end for
						if (config.useArt === true) {
							// initialize first song album 
							Props.html._art.attr('src',songs_[Props.curr_song].image.src); 
						}
						swagg.setupSeek();
						swagg.showSongInfo();
						SwaggLog.info("Swagg Player ready!");
					}
				};
			
				// init soundManager
				soundManager.onload =  function() {
					Props.interval_id = setInterval('soundManager.createSongs()', 5); // try to init sound manager every 5 milliseconds in case songs AJAX callback
																						// has not completed execution	
				}; // end soundManager onload function	
				
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  SwaggLog.error('An error has occured with loading Sound Manager! Rebooting...');
				  soundManager.flashLoadTimeout = 0;
				  clearInterval(Props.interval_id);
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
					  SwaggLog.error('Something went wrong with loading Sound Manager. No tunes for you!');
					}
				  },1500);
				}
			},
			
			// get the duration of a song in milliseconds
			getDuration : function(soundobj) {
				var duration;
				if (!soundobj.loaded === true)
					uration = soundobj.durationEstimate;
				else {
					duration = soundobj.duration;
				}
				return duration;
			},
			
			// sets up the seek functionality 
			setupSeek : function() {
				// seek to a position in the song
				Props.html._loaded.css('cursor', 'pointer').bind({
					click : function(e) {
						var id = 'song-' + Props.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = swagg.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Props.html._progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						soundobj.setPosition(seekTo);
					}
				});
				
				// seek preview data
				Props.html._loaded.bind( 'mouseover hover mousemove', 
					function(e){
						var id = 'song-' + Props.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = swagg.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Props.html._progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						swagg.millsToTime(seekTo, -1);
						if (Props.config.onSnapshot !== undefined && $.isFunction(Props.config.onSnapshot)) {
							Props.config.onSnapshot();	
						}				
					}
				);
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
				var song = Props.songs[parseInt(soundobj.id.split('-')[1])];
				var id = 'item-' + song.id;
				var listItem = $('<li></li>');
				listItem.attr('id',id);
				listItem.addClass('swagg-player-playlist-item');
				listItem.html(song.title + ' - ' + song.artist);
				listItem.css('cursor','pointer');
							
				listItem.data('song', song);
				listItem.bind({
					click: function(){
						var track = parseInt($(this).data('song').id);
						swagg.stopMusic(Props.curr_song);
						var afterEffect = function() {
							swagg.showSongInfo();
							swagg.play('switchArt() - by way of createElement',track);
						}			
						Props.curr_song = track;
						if (Props.config.useArt === true) {
							swagg.switchArt(track, afterEffect);
						}
						else {
							swagg.showSongInfo();
							swagg.play('switchArt() - by way of createElement',track);	
						}
						return false;
					}
				});
				Props.html._playlist.append(listItem);
			},
			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				SwaggLog.info('PlayButtonState() state: ' + state);
				var inst = Props;
				var i = inst.img;
				var imagesLoaded = imageLoader._imagesLoaded;
				var out, over;
				var $play = Props.html._play;
				
				
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
				var inst = Props;
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
			
			// resets the track time
			resetTrackTime : function() {
				var bridge = Props.html._data;
				if (bridge !== undefined){
					SwaggLog.info('Resetting track time');
					bridge.data('time').totalMinutes = 0;
					bridge.data('time').totalSeconds = 0;
					bridge.data('time').currMinutes = 0;
					bridge.data('time').currSeconds = 0;
				}			
			},
			
			// Stops the specified song
			stopMusic : function(track) {
				SwaggLog.info('stopMusic()');
				soundManager.stopAll();
				swagg.resetProgressBar();
				swagg.resetTrackTime();
			},
			
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = 'song-' + track
				var sound = soundManager.getSoundById(sound_id);
				
				var curr_vol = sound.volume;

				if (flag === 1) {
					SwaggLog.info('Vol up');
					soundManager.setVolume(sound_id, curr_vol + Props.vol_interval);
				}
				else if (flag === 0) {
					SwaggLog.info('Vol down');
					soundManager.setVolume(sound_id, curr_vol - Props.vol_interval);
				}
				else {
					SwaggLog.info('Invalid volume flag!');	
				}
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track, afterEffect) {
				SwaggLog.info('Will show  for song at index: ' + track);
				var sound_id = 'song-' + track
				var art = Props.html._art;
				art.hide('slide', function() {
					$(this).attr('src',Props.songs[track].image.src);
					$(this).show('slide', afterEffect); 
				});	
			},
			
			// fills in song metadata based on ID3 tags
			// not being used for now, flash ID3 is too buggy
			id3Fill : function(soundobj) {
				var song = Props.songs[parseInt(soundobj.id.split('-')[1])];
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
				// get current position of currently playing song
				var pos = soundobj.position; 
				var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					var duration = soundobj.durationEstimate;
					swagg.millsToTime(duration, 0);
				}
				else {
					var duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration; 
				
				// width of progress bar
				var wrapper_width = parseFloat(Props.html._progress_wrapper.css('width'));
				
				var loaded = wrapper_width * loaded_ratio;
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = wrapper_width*pos_ratio;
				Props.html._bar.css('width', t);
				Props.html._loaded.css('width', loaded);
					
			},
			
			// calculates the total duration of a sound in terms of minutes
			// and seconds based on the total duration in milliseconds.
			// flag 0 - says we're calculating the total duration of the song
			// flag 1 - says we're calculating the current potition of the song
			// flag -1 = says we're calculating the arbitrary position of a song (seek preview)
			millsToTime : function(duration, flag) {
					var bridge = Props.html._data;
					var seconds = Math.floor(duration / 1000);
					var minutes = 0;
					if (seconds > 60) {
						minutes = Math.floor(seconds / 60);
						seconds = Math.round(seconds % 60);		
					}
					
					if (flag === 0) { // total duration
						bridge.data('time').totalMinutes = minutes
						bridge.data('time').totalSeconds = seconds
					}
					else if (flag === 1) { // current position
						bridge.data('time').currMinutes = minutes;
						bridge.data('time').currSeconds = seconds;
					}
					else if(flag === -1){
						bridge.data('time').snapShot.minutes = minutes;
						bridge.data('time').snapShot.seconds = seconds;
					}
					else {
						SwaggLog.error('Invalid flag passed to millsToTime()');	
					}
			},
			
			// displays ist and song title
			showSongInfo : function() {
				var loc_inst = Props;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#swagg-player-song-info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};
		
		var SwaggData = {
			curr_song_total_minutes:null,
			curr_song_total_seconds:null,
			curr_song_curr_minutes:null,
			curr_song_curr_seconds:null	
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
			$('#swagg-player-data').css('display','none');
			SwaggLog.info('Initializing SoundManager2');
			window.soundManager = new SoundManager(); // Flash expects window.soundManager.
    		soundManager.beginDelayedInit(); // start SM2 init.
			soundManager.wmode = 'transparent'
			soundManager.url = 'swf';
			soundManager.flashLoadTimeout = 1000;
			swagg.init(options);
		};
})(jQuery);