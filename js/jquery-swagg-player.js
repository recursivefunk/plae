/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/swaggplayer

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.7.5
   
   Change Log v0.8.5.7.5
   - Added repeat functionality (API feature)
*/
(function ($){
		/*global soundManager: false, setInterval: false, console: false, $: false */
		
		// logging utility
		var LOGGER = {
			error: function(errMsg){
				if (Data.config.debug === true) {
					console.log( new Date().formatMMDDYYYY() + ' Swagg Player::Error::' + errMsg);
				}
			},
			info: function(info){
				if (Data.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Info::' + info);	
				}
			},
			warn: function(warning) {
				if (Data.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Warning::' + warning);	
				}
			},	
			setup : function(){
				if (Browser.isIe() && config.debug === true){
					config.debug = false; 
				}
				
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
		
		// swagg player data and configuration
		var Data = {
			songs:{},
			song:{},
			curr_song:0,
			config:{},
			vol_interval:5,
			interval_id:-1,
			processSongs: function(theData){
				LOGGER.info('Processing songs.');
				var size = theData.length;
				var _data_ = Data;
				// preload song album  and append an IDs to the songs - make configurable in the future
				// to avoid having to loop through JSON array
				for (var i = 0; i < size; i++) {
					if (_data_.config.useArt === true) {
						theData[i].image = new Image();
						theData[i].image.src = theData[i].thumb;
					}
					theData[i].id = i.toString();
				}
				Data.songs = theData;				
			},
			
			getSongs: function() {				
				var theData = Data.config.data;
				
				
				// Check if dataString points to a json file if so, fetch it.
				// if not, assume string is a literal JSON object
				if (typeof theData === 'string') {
					LOGGER.info('Fetching songs from the server.');
					$.ajax({
						type: "GET",
						url: theData,
						dataType: 'json',
						success: function(data){
							Data.processSongs(data);
						},
						error: function(xhr, ajaxOptions, thrownError){
							LOGGER.error('There was a problem fetching your songs from the server: ' + thrownError);
						}
					});	
				} // end if
				else {
					Data.processSongs(theData);
				}
			}
		};
		
		// UI elements (divs)
		var Html = {
			player: $('#swagg-player'),
			playlist: $('#swagg-player-list'),
			art: $('#swagg-player-art'),
			progress_wrapper: $('#swagg-player-progress-wrapper'),
			bar: $('#swagg-player-bar'),
			loaded: $('#swagg-player-loaded'),
			song_info: $('#swagg-player-song-info'),
			controls_div: $('#swagg-player-controls'),
			loading: '<img src="loading.gif"></img>',
			bridge_data: null,
			
			setupProgressBar : function() {
				LOGGER.info('SetupProgressBar()');
				if (this.progress_wrapper.length > 0) {
					var wrapper = $('#swagg-player-progress-wrapper');
					var height = wrapper.css('height');
					loaded = $('<div id="swagg-player-loaded"></div>');
					loaded.css('height', height).css('width',0).css('float','left').css('margin-left','0');
					wrapper.append(loaded);
					Html.loaded = loaded;
					
					var progress = $('<div id="swagg-player-bar"></div>');
					progress.css('height', height).css('width',0).css('float','left').css('margin-left','auto');
					loaded.append(progress);
					Html.bar = progress;
				}
			}
		};
		
		// encapsulate controlls
		var Controls = {
			play:	$('#swagg-player-play-button'),
			skip:	$('#swagg-player-skip-button'),
			back:	$('#swagg-player-back-button'),
			stop:	$('#swagg-player-stop-button'),
			
			setup : function() {
				if (ImageLoader.play !== null) {
					this.play.css('cursor','pointer');	
				}
				if (ImageLoader.skip !== null) {
					this.skip.css('cursor','pointer');		
				}
				if (ImageLoader.back !== null) {
					this.back.css('cursor','pointer');		
				}
				if (ImageLoader.stop !== null) {
					this.stop.css('cursor','pointer');		
				}
			}
		};
		
		var Events = {
			
			setup : function() {
				this.bindControllerEvents();
				this.bindMediaKeyEvents();
			},
			
			bindControllerEvents: function(){
				LOGGER.info('Binding controller button events');
				var inst = Data;
				var _images = ImageLoader.imagesLoaded;
				var i = inst.img;
				var usehover = (Data.config.buttonHover === 'undefined') ? false : Data.config.buttonHover;
				
				Controls.play.bind({
					click: function() {
						 Controller.play('playlink click', Data.curr_song);
						 return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.playOver.src);	
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.play.src);	
						}
					}
				});
				
				Controls.skip.bind({
					click: function() {
						Controller.skip(1);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.skipOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.skip.src);	
						}
					}
				});
	
				Controls.stop.bind({
					click: function() {
						Controller.stopMusic(Data.curr_song);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.stopOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.stop.src);
						}
					}
				});
	
				Controls.back.bind({
					click: function() {
						Controller.skip(0);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.backOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', ImageLoader.back.src);
						}
					}
				});				
			},
			
			bindMediaKeyEvents: function() {
				LOGGER.info('Binding media key events');			
				$(document).keydown(function(e) {
	
					if (!e) e = window.event;
				
						switch(e.which) {
						  case 179:
							Controller.play('Media key event switch',Data.curr_song);
							return false;
					
						  case 178:
							Controller.stopMusic(Data.curr_song);
							return false;
					
						  case 176:
							Controller.skip(1);
							return false;
					
						  case 177:
							Controller.skip(0);
							return false;
							
						case 175:
							Controller.volume(Data.curr_song, 1);
							return false;
					
						case 174:
							Controller.volume(Data.curr_song, 0);
							return false;
					}
				});				
			},
			
			setupSeek : function() {
				// seek to a position in the song
				Html.loaded.css('cursor', 'pointer').bind({
					click : function(e) {
						var id = 'song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						soundobj.setPosition(seekTo);
					}
				});
				
				// seek preview data
				Html.loaded.bind( 'mouseover hover mousemove', 
					function(e){
						var id = 'song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						Controller.millsToTime(seekTo, -1);
						
						// fire off onSeekPreview event
						if (Data.config.onSeekPreview !== undefined && $.isFunction(Data.config.onSeekPreview)) {
							internal.event_ref = e;
							Data.config.onSeekPreview();	
						}				
					}
				);	
			}
		};
		
		
		
		// images for button controls
		var ImageLoader = {
			play:null,
			playOver:null,
			pauseOver:null,
			pause:null,
			stop:null,
			stopOver:null,
			back:null,
			backOver:null,
			skip:null,
			skipOver:null,
			imagesLoaded:false,
			
			loadButtonImages: function(imagesDir) {
				var hover = (Data.config.buttonHover === 'undefined') ? false : Data.config.buttonHover;
				LOGGER.info('Loading images for controls...');

				if (Controls.play.length > 0) {
					this.play = new Image();
					this.play.src = imagesDir + 'play.png';
					this.pause = new Image();
					this.pause.src = imagesDir + 'pause.png';
					
					if (hover === true) {
						this.playOver = new Image();
						this.playOver.src = imagesDir + 'play-over.png';
						this.pauseOver = new Image();
						this.pauseOver.src = imagesDir + 'pause-over.png';
					}
				}
				
				if (Controls.skip.length > 0) {
					this.skip = new Image();
					this.skip.src = imagesDir + 'skip.png';
					
					if (hover === true) {
						this.skipOver = new Image();
						this.skipOver.src = imagesDir + 'skip-over.png';
					}
				}
				
				if (Controls.back.length > 0) {
					this.back = new Image();
					this.back.src = imagesDir + 'back.png';
					
					if (hover === true) {
						this.backOver = new Image();
						this.backOver.src = imagesDir + 'back-over.png';
					}
				}
				
				if (Controls.stop.length > 0) {
					this.stop = new Image();
					this.stop.src = imagesDir + 'stop.png';
					
					if (hover === true) {
						this.stopOver = new Image();
						this.stopOver.src = imagesDir + 'stop-over.png';
					}
				}
				this.imagesLoaded = true;
			}
		};
		
		// controller for the main functionality (play, pause etc)
		var Controller = {
			init : function(config) {
				Data.config = $.extend(Data.config,config);	
				
				// format date for log messages
				LOGGER.setup();
				
				// get songs from server via XHR
				Data.getSongs();
				
				// init onSeek events
				Html.setupProgressBar();
				
				// create invisible element which will hold user accessible data
				Controller.setupApi();

				// check for soundManager support and warn or inform accordingly
				if (!soundManager.supported()) {
					LOGGER.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					LOGGER.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
				}
					
				// check if we're using button images. if so, preload them. if not, ignore.
				if (config.buttonsDir !== undefined) {
					ImageLoader.loadButtonImages(config.buttonsDir);
					Controls.setup();	
				}
				else {
					config.buttonHover = false;	
				}
				
				if (Data.config.html5Audio === true && Browser.isSafari() === false) { // Safari HTML5 audio bug. ignore HTML5 audio if Safari
					soundManager.useHTML5Audio = true;
				}
				
				// setup controller events
				Events.setup();
				
				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					LOGGER.info('createSongs()');
					if(Data.songs[0] !== undefined) {
						clearInterval(Data.interval_id);
						var songs_ = Data.songs;
						var localSoundManager = soundManager;	
						var temp;
						for (var i = 0, end = songs_.length; i < end; i++) {
							temp = localSoundManager.createSound({	// create sound objects to hook event handlers
								id: 'song-' + i.toString(),			// to button states
								url: songs_[i].url,
								autoLoad: true,
								onfinish: function(){
									if (internal.repeat === false){
										Controller.skip(1);
									}
									else {
										Controller.repeat();	
									}
								},
								onplay: function(){
									Controller.millsToTime(this.duration, 0);	
									Controller.playPauseButtonState(0);
									if(Data.config.onPlay !== undefined && jQuery.isFunction(Data.config.onPlay)){
										Data.config.onPlay();
									}
								},
								onpause: function(){
									Controller.playPauseButtonState(1); 
									if(Data.config.onPause !== undefined && jQuery.isFunction(Data.config.onPause)){
										Data.config.onPause();
									}
								},
								onstop: function(){
									Controller.playPauseButtonState(1); 
									if(Data.config.onStop !== undefined && jQuery.isFunction(Data.config.onStop)){
										Data.config.onStop();
									}
								},
								onresume: function(){
									Controller.playPauseButtonState(0); 
									if(Data.config.onResume !== undefined && jQuery.isFunction(Data.config.onResume)){
										Data.config.onResume();
									}
								},
								whileplaying: function(){
									Controller.progress(this);
									Controller.millsToTime(this.position, 1);
									if(jQuery.isFunction(Data.config.whilePlaying)){
										Data.config.whilePlaying();
									}
									
								}
							});
							temp.id = 'song-' + i.toString();
							if (Data.config.playList !== undefined && Data.config.playList === true) {
								Controller.createElement(temp);
							}
						} // end for
						if (config.useArt === true) {
							// initialize first song album 
							Html.art.attr('src',songs_[Data.curr_song].image.src); 
						}
						//Controller.setupSeek();
						Events.setupSeek();
						if(Data.config.autoPlay !== 'undefined' && Data.config.autoPlay === true) {
						setTimeout(function(){
								Controller.play('',Data.curr_song);
							},1000);
						}
						else {
							Controller.showSongInfo();
						}
						if (Data.config.onSetupComplete !== 'undefined' && jQuery.isFunction(Data.config.onSetupComplete)) {
							Data.config.onSetupComplete();
						}
						LOGGER.info("Swagg Player ready!");
					}
				};
			
				// init soundManager
				soundManager.onload =  function() {
					// try to init sound manager every 5 milliseconds in case songs AJAX callback
					// has not completed execution	
					Data.interval_id = setInterval('soundManager.createSongs()', 5); 
				}; // end soundManager onload function	
				
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  LOGGER.error('An error has occured with loading Sound Manager! Rebooting.');
				  soundManager.flashLoadTimeout = 0;
				  clearInterval(Data.interval_id);
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
					  LOGGER.error('Something went wrong with loading Sound Manager. No tunes for you!');
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
			
			repeat : function(track) {
				LOGGER.info('repeat()');
				var sound_id = 'song-' + Data.curr_song;
				var target = soundManager.getSoundById(sound_id);
				Controller.resetProgressBar();
				target.setPosition(0);
				target.play();
			},
			
			// Plays a song based on the ID
			play : function(caller, track){
				var sound_id = 'song-' + track
				LOGGER.info('Playing track: ' + sound_id + '. Oh and ' + caller + ' called me!');
				var target = soundManager.getSoundById(sound_id);
				
				if (target.paused === true) { // if current track is paused, unpause
					LOGGER.info('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						LOGGER.info('Pausing current track');
						target.pause();
					}
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						internal.update();
						LOGGER.info('Playing current track from beginning');
						target.play();
					}
				}
				Controller.showSongInfo();
			},
			
			setupApi : function() {
				Html.player.append('<div id="swagg-player-data"></div>');
				$('#swagg-player-data').css('display','none').data('api', API);				
			},
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				LOGGER.info('createElement()');
				var song = Data.songs[parseInt(soundobj.id.split('-')[1])];
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
						Controller.stopMusic(Data.curr_song);
						var afterEffect = function() {
							Controller.showSongInfo();
							Controller.play('switchArt() - by way of createElement',track);
						}			
						Data.curr_song = track;
						if (Data.config.useArt === true) {
							Controller.switchArt(track, afterEffect);
						}
						else {
							Controller.showSongInfo();
							Controller.play('switchArt() - by way of createElement',track);	
						}
						return false;
					}
				});
				Html.playlist.append(listItem);
			},

			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				LOGGER.info('PlayButtonState() state: ' + state);
				var inst = Data;
				var i = inst.img;
				var imagesLoaded = ImageLoader.imagesLoaded;
				var out, over;
				var play = Controls.play;
				var hover = (Data.config.buttonHover === 'undefined') ? false : Data.config.buttonHover;
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						play.html('play ');
					}
					else {
						out = ImageLoader.play.src;
						if (hover === true) {
							over = ImageLoader.playOver.src;
						}
					}

				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						play.html('pause ');
					}
					else {
						out = ImageLoader.pause.src;
						if (hover === true) {
							over = ImageLoader.pauseOver.src;
						}
					}

				}
				else { // invalid state
					LOGGER.error('Invalid button state! : ' + state);	
					return false;
				};
				if (imagesLoaded === true) {
					play.attr('src', out);
					if (hover === true) {
						play.bind({
							mouseout: function(){
								play.attr('src', out);
							},
							mouseover: function(){
								play.attr('src', over);
							}	
						});
					} // end if
				}
			},
		
			// Skips to the next song. If the currently playing song is the last song in the list
			// it goes back to the first song
			skip : function(direction){
				LOGGER.info('skip()');
				var inst = Data;
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
					LOGGER.error('Invalid skip direction flag: ' + direction);
					return false;	
				}
				Controller.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						Controller.showSongInfo();
						Controller.play('skip',t);
					}
					Controller.switchArt(t, afterEffect);
				} // end if
				// if not using album , just go to the next song
				else {
						Controller.showSongInfo();
						Controller.play('skip',t);
				} // end else	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				$('#swagg-player-bar').css('width', 0);
				$('#swagg-player-loaded').css('width', 0);
			},	
			
			// resets the track time
			resetTrackTime : function() {
				LOGGER.info('Resetting track time');
				internal.fillTime(0,0,0,0);
			},
			
			// Stops the specified song
			stopMusic : function(track) {
				LOGGER.info('stopMusic()');
				soundManager.stopAll();
				Controller.resetProgressBar();
				Controller.resetTrackTime();
			},
			
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = 'song-' + track
				var sound = soundManager.getSoundById(sound_id);
				
				var curr_vol = sound.volume;

				if (flag === 1) {
					LOGGER.info('Vol up');
					soundManager.setVolume(sound_id, curr_vol + Data.vol_interval);
				}
				else if (flag === 0) {
					LOGGER.info('Vol down');
					soundManager.setVolume(sound_id, curr_vol - Data.vol_interval);
				}
				else {
					LOGGER.info('Invalid volume flag!');	
				}
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track, afterEffect) {
				LOGGER.info('Will show  for song at index: ' + track);
				var sound_id = 'song-' + track
				var art = Html.art;

				art.hide('slide', function() {
					$(this).attr('src',Data.songs[track].image.src);
					$(this).show('slide', afterEffect); 
				});	
			},
			
			// fills in song metadata based on ID3 tags
			// not being used for now, flash ID3 is too buggy
			id3Fill : function(soundobj) {
				var song = Data.songs[parseInt(soundobj.id.split('-')[1])];
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
					Controller.millsToTime(duration, 0);
				}
				else {
					var duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration; 
				
				// width of progress bar
				var wrapper_width = parseFloat(Html.progress_wrapper.css('width'));
				
				var loaded = wrapper_width * loaded_ratio;
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = wrapper_width*pos_ratio;
				Html.bar.css('width', t);
				Html.loaded.css('width', loaded);
					
			},
			
			// calculates the total duration of a sound in terms of minutes
			// and seconds based on the total duration in milliseconds.
			// flag 0 - says we're calculating the total duration of the song
			// flag 1 - says we're calculating the current potition of the song
			// flag -1 = says we're calculating the arbitrary position of a song (seek preview)
			millsToTime : function(duration, flag) {
					var seconds = Math.floor(duration / 1000);
					var minutes = 0;
					if (seconds > 60) {
						minutes = Math.floor(seconds / 60);
						seconds = Math.round(seconds % 60);		
					}
					
					
					// total duration
					if (flag === 0) { 
						internal.fillTotalTime(minutes,seconds);
					}
					// current position
					else if (flag === 1) { 
						internal.fillCurrentTime(minutes,seconds);
					}
					else if(flag === -1){
						internal.fillPreview(minutes,seconds);
					}
					else {
						LOGGER.error('Invalid flag passed to millsToTime()');	
					}
			},
			
			// displays ist and song title
			showSongInfo : function() {
				var loc_inst = Data;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#swagg-player-song-info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};
		
		var internal = {
			totalMinutes:null,
			totalSeconds:null,
			currMinutes:null,
			currSeconds:null,
			seconds:null,
			minutes:null,
			event_ref:null,
			currTitle:null,
			currArtist:null,
			currAlbum:null,
			currTempo:null,
			repeat:false,	
			
			update : function() {
				this.currTitle = Data.songs[Data.curr_song].title;
				this.currArtist = Data.songs[Data.curr_song].artist;
				this.currAlbum = Data.songs[Data.curr_song].album;	
				this.currTempo = Data.songs[Data.curr_song].tempo;
				LOGGER.info('Current song: [' + this.currArtist + '] [' + this.currTitle + '] [' + this.currTempo + ']'  );	
			},	
			
			fillTime : function(tMins, tSecs, cMins, cSecs) {
				var i = internal;
				this.totalMinutes = tMins;
				this.totalSeconds = tSecs;
				this.currMinutes = cMins;
				this.currSeconds = cSecs;
			},
						
			fillTotalTime : function(tMins, tSecs) {
				this.totalMinutes = tMins;
				internal.totalSeconds = tSecs; 	
			},
						
			fillCurrentTime : function(cMins, tSecs) {
				internal.currMinutes = cMins;
				internal.currSeconds = tSecs;
			},
			fillPreview : function(pMins,pSecs) {
				internal.minutes = pMins;
				internal.seconds = pSecs;	
			},
			
			setEventRef : function(e) {
				internal.event_ref = e;
			}						
		};

		// external API devs can use to extend Swagg Player. Exposes song data, events etc
		var API = {
			currentSong : {
				time : function() {			
					var privateFuncs = {
						currTimeAsString : function(){

							var i = internal;
							var currMin = (i.currMinutes > 9) ? i.currMinutes : '0' + 
								i.currMinutes.toString();
							var currSec = (i.currSeconds > 9) ? i.currSeconds : '0' + 
								i.currSeconds.toString();	
							return currMin + ':' + currSec;
						},
						
						totalTimeAsString : function() {
							var i = internal;
							var totalMin = (i.totalMinutes > 9) ? i.totalMinutes : '0' + 
								i.totalMinutes.toString();
							var totalSec = (i.totalSeconds > 9) ? i.totalSeconds : '0' + 
								i.totalSeconds.toString();	
							return totalMin + ':' + totalSec;	
						},
						
						getEventRef : function(){
							return internal.event_ref;
						},
						
						previewAsString : function() {
							var i = internal;
							if ( !isNaN(i.minutes) && !isNaN(i.seconds)) {
								var mins = (i.minutes > 9) ? i.minutes : '0' + 
									i.minutes.toString();
								var secs = (i.seconds > 9) ? i.seconds : '0' + 
									i.seconds.toString();	
								return mins + ':' + secs;			
							}
							else {
								return "wait."	
							}							
						} // end as string
					};
					
					// public methods
					return {
						previewAsString	:	privateFuncs.previewAsString,
						getSeekEvent	:	privateFuncs.getEventRef,
						getCurrTimeAsString	:	privateFuncs.currTimeAsString,
						getTotalTimeAsString:	privateFuncs.totalTimeAsString
					};
				}, // end time
				
				data : function(){
					var privateDataFuncs = {
						title : function() {
							return (internal.currTitle !== null) ? internal.currTitle : 'Unknown Title';	
						},
						artist : function() {
							return (internal.currArtist !== null) ? internal.currArtist : 'Unknown Artist';	
						},
						album : function() {
							return (internal.currAlbum !== null) ? internal.currAlbum : 'Unknown Album';	
						},
						tempo : function(){
							return (internal.currTempo !== null) ? internal.currTempo : 'Unknown Tempo'; 	
						}
					}; // end private
					return  {
						getTitle	: 	privateDataFuncs.title,
						getArtist	:	privateDataFuncs.artist,
						getAlbum	:	privateDataFuncs.album,
						getTempo	:	privateDataFuncs.tempo						
					};
				}, // end data
				
				playback : function() {
					repeat = function(flag) {
						internal.repeat = (flag === true || flag === false) ? repeat : false;	
					};
					
					inRepeat = function() {
						var r = internal.repeat;
						return (r === true || r === false) ? r : false;
					};
					
					return {
						setRepeat : repeat,
						repeatMode: inRepeat
					}; // end return
				} // end playback
				
			} // end song
		}; // end API
		
		
		//	BEGIN BROWSER DETECT
		var Browser = {
			isIe : function(){
				return (navigator.userAgent.indexOf('MSIE') > -1) ? true : false;
			},
			isSafari : function(){
				return (navigator.userAgent.indexOf('AppleWebKit') > -1 && navigator.userAgent.indexOf('Chrome') === -1);
			}
		}; // END BROWSER DETECT
		
		// initialize and configure SM2
		var initializeSoundManager = function() {
			LOGGER.info('Initializing SoundManager2');
			window.soundManager = new SoundManager();
			soundManager.wmode = 'transparent'
			soundManager.url = 'swf';
			soundManager.allowPolling = true;
			soundManager.useFastPolling = true;
			if (Browser.isSafari()) {
				soundManager.useHighPerformance = false;
			}
			else {
				soundManager.useHighPerformance = true;	
			}
			soundManager.flashLoadTimeout = 1000;
    		soundManager.beginDelayedInit();
		};
						
		$.fn.SwaggPlayer = function(options_) {
			initializeSoundManager();
			Controller.init(options_);
		};
})(jQuery);