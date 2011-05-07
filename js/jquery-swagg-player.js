/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/swaggplayer

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.9.1
   
   Change Log
   - Exposed onError function
   - Fixes for repeat mode
   - Fixed end of playlist bug
   - Added morhpArt option
   - Playlist does not repeat
   - Use classes as opposed to div id's
*/
(function ($){
		/*global soundManager: false, setInterval: false, console: false, $: false */
		
		// logging utility
		var LOGGER = {		
			error: function(errMsg){
				if (Config.props.debug === true && Data.isIe === false) {
					console.log('Swagg Player::Error::' + errMsg);	
				}
			},
			info: function(info){
				if (Config.props.debug === true && Data.isIe === false) {
					console.log('Swagg Player::Info::' + info);
				}
			},
			warn: function(warning) {
				if (Config.props.debug === true && Data.isIe === false) {
					console.log('Swagg Player::Warning::' + warning);
				}
			},
			apierror: function(errMsg) {
				if (Config.props.debug === true && Data.isIe === false) {
					console.log('Swagg Player::API Error::' + errMsg);	
				}
			}
		};
		
		// swagg player data and configuration
		var Data = {
			last_song:0,
			songs:{},
			song:{},
			curr_sprite_class: '',
			isIe: false,
			curr_song:0,
			vol_interval:20,
			interval_id:-1,
			processSongs: function(theData){
				LOGGER.info('Processing songs.');
				var size = theData.length;
				var _config_ = Config;
				// preload song album  and append an IDs to the songs - make configurable in the future
				// to avoid having to loop through JSON array
				for (var i = 0; i < size; i++) {
					LOGGER.info('Using album art');
					if (_config_.props.useArt === true && theData[i].thumb !== undefined) {
						theData[i].image = new Image();
						theData[i].image.src = theData[i].thumb;
					}
					theData[i].id = i.toString();
				}
				Data.songs = theData;
				Data.last_song= Data.songs.length - 1;			
			},
			
			getSongs: function() {				
				var theData = Config.props.data;
				
				
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
			div:null,
			player: null,
			playlist: null,
			art: null,
			loading_indication: null,
			progress_wrapper: null,
			bar: null,
			loaded: null,
			song_info: null,
			controls_div: null,
			bridge_data: null,
			user_art_css: {height:0, width:0},
			
			setupProgressBar : function() {
				LOGGER.info('SetupProgressBar()');
				if (this.progress_wrapper.length > 0) {
					var wrapper = $('#' + this.player + ' div.swagg-player-progress-wrapper');
					var height = wrapper.css('height');
					loaded = $('<div></div>');
					loaded.addClass("swagg-player-loaded");
					loaded.css('height', height).css('width',0).css('float','left').css('margin-left','0');
					wrapper.append(loaded);
					this.loaded = $('#' + this.player + ' div.swagg-player-loaded');
					
					var progress = $('<div></div>');
					progress.addClass('swagg-player-bar');
					progress.css('height', height).css('width',0).css('float','left').css('margin-left','auto');
					loaded.append(progress);
					this.bar = $('#' + this.player + ' div.swagg-player-bar');
				}
			},
			
			initHtml: function() {
				LOGGER.info("initHtml()");
				this.div = $('#' + this.player);
				this.playlist = $('#' + this.player + ' div.swagg-player-list');
				this.art = $('#' + this.player + ' div.swagg-player-album-art');
				this.loading_indication = $('#' + this.player + ' img.swagg-player-loading');
				this.progress_wrapper = $('#' + this.player + ' div.swagg-player-progress-wrapper');
				this.bar = $('#' + this.player + ' div.swagg-player-bar');
				this.loaded = $('#' + this.player + ' div.swagg-player-loaded');
				this.song_info = $('#' + this.player + ' label.swagg-player-song-info');
				this.controls_div = $('#' + this.player + ' div.swagg-player-controls');
				this.user_art_css = {height:0, width:0};
			}
		};
		
		var Config = {
			props : {},
			setup : function(){
				Data.isIe = Browser.isIe();
				Config.props.useArt = (Html.art.length > 0);
				Config.props.playList = (Html.playlist.length > 0);
			}
		};
		
		// encapsulate controlls
		var Controls = {
			play:	null,
			skip:	null,
			back:	null,
			stop:	null,
			
			setup : function() {
				
				this.play =	$('#' + Html.player + ' .swagg-player-play-button');
				this.skip =	$('#' + Html.player + ' .swagg-player-skip-button');
				this.back =	$('#' + Html.player + ' .swagg-player-back-button');
				this.stop =	$('#' + Html.player + ' .swagg-player-stop-button');
				
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
				var usehover = (Config.props.buttonHover === undefined) ? false : Config.props.buttonHover;
				
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
						var id = Html.player + '-song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - Html.loaded.offset().left;
						var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						var wrapper_width = parseFloat(Html.progress_wrapper.css('width'));
						
						var loaded = wrapper_width * loaded_ratio;
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);
						if (loaded >= wrapper_width) {
							soundobj.setPosition(seekTo);
						}
					}
				});
				
				// seek preview data
				Html.loaded.bind( 'mouseover hover mousemove', 
					function(e){
						var id = Html.player + '-song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - Html.loaded.offset().left;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						Controller.millsToTime(seekTo, -1);
						
						// fire off onSeekPreview event
						if (Config.props.onSeekPreview !== undefined && $.isFunction(Config.props.onSeekPreview)) {
							internal.event_ref = e;
							Config.props.onSeekPreview.apply(this, []);	
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
			art:null,
			imagesLoaded:false,
			
			setup : function(config) {
				if (config.buttonsDir !== undefined) {
					Controls.setup();
					this.loadButtonImages(config.buttonsDir);
				}
				else {
					config.buttonHover = false;	
				}
				if (config.spriteImg !== undefined) {
					this.art = new Image();
					this.art.src = config.spriteImg;
				}
			},
			
			loadButtonImages: function(imagesDir) {
				var hover = (Config.props.buttonHover === undefined) ? false : Config.props.buttonHover;
				LOGGER.info('Loading images for controls');
				var controls = Controls;

				if (controls.play.length > 0) {
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
				
				if (controls.skip.length > 0) {
					this.skip = new Image();
					this.skip.src = imagesDir + 'skip.png';
					
					if (hover === true) {
						this.skipOver = new Image();
						this.skipOver.src = imagesDir + 'skip-over.png';
					}
				}
				
				if (controls.back.length > 0) {
					this.back = new Image();
					this.back.src = imagesDir + 'back.png';
					
					if (hover === true) {
						this.backOver = new Image();
						this.backOver.src = imagesDir + 'back-over.png';
					}
				}
				
				if (controls.stop.length > 0) {
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
				
				Config.props = $.extend(Config.props,config);
				
				Html.player = config.player;
				
				Html.initHtml();	
				
				// initialize configuration
				Config.setup();
				
				// get songs from server via XHR
				Data.getSongs();
				
				// init onSeek events
				Html.setupProgressBar();
				
				// create invisible element which will hold user accessible data
				Controller.setupApi();

				ImageLoader.setup(config);

				// check for soundManager support and warn or inform accordingly
				if (!soundManager.supported()) {
					LOGGER.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					LOGGER.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
				}
				
				soundManager.useHTML5Audio = true;
				
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
								id: Html.player + '-song-' + i.toString(),			// to button states
								url: songs_[i].url,
								autoLoad: true,
								onfinish: function(){
									if (internal.repeatMode === false){
										if (Data.curr_song !== Data.last_song) {
											Controller.skip(1);
										} else {
											Controller.playPauseButtonState(1);
											Controller.stopMusic(Data.curr_song);
											var obj = temp.setPosition(0);
										}
									}
									else {
										Controller.repeat();	
									}
								},
								onplay: function(){
									Controller.millsToTime(this.duration, 0);	
									Controller.playPauseButtonState(0);
									if(Config.props.onPlay !== undefined && jQuery.isFunction(Config.props.onPlay)){
										Config.props.onPlay.apply(this,[]);
									}
								},
								onpause: function(){
									Controller.playPauseButtonState(1); 
									if(Config.props.onPause !== undefined && jQuery.isFunction(Config.props.onPause)){
										Config.props.onPause.apply(this,[]);
									}
								},
								onstop: function(){
									Controller.playPauseButtonState(1); 
									if(Config.props.onStop !== undefined && jQuery.isFunction(Config.props.onStop)){
										Config.props.onStop.apply(this,[]);
									}
								},
								onresume: function(){
									Controller.playPauseButtonState(0); 
									if(Config.props.onResume !== undefined && jQuery.isFunction(Config.props.onResume)){
										Config.props.onResume.apply(this,[]);
									}
								},
								whileplaying: function(){
									Controller.progress(this);
									Controller.millsToTime(this.position, 1);
									if(jQuery.isFunction(Config.props.whilePlaying)){
										Config.props.whilePlaying.apply(this,[]);
									}
								}
							});
							temp.id = Html.player + '-song-' + i.toString();
							temp.repeat = internal.repeat;
							if (Config.props.playList !== undefined && Config.props.playList === true) {
								Controller.createElement(temp);
							}
						} // end for
						if (Config.props.useArt === true) {
							// initialize first song album 
							var songs = Data.songs;
							var index = Data.curr_song;
							Html.loading_indication.remove();
							Controller.setAlbumArtStyling(0);
						}
						Events.setupSeek();
						Controller.showSongInfo();
						if(Config.props.autoPlay !== undefined && Config.props.autoPlay === true) {
							setTimeout(function(){
									Controller.play('',Data.curr_song);
								},1000);
						}
						if (Config.props.onSetupComplete !== undefined && jQuery.isFunction(Config.props.onSetupComplete)) {
							Config.props.onSetupComplete.apply(this,[]);
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
						// call user defined onError function
					  	if(Config.props.onError !== undefined && jQuery.isFunction(Config.props.onError)){
							Config.props.onError.apply(this,[]);
						}
					}
				  },1500);
				}
			},
			
			// get the duration of a song in milliseconds
			getDuration : function(soundobj) {
				var duration;
				if (!soundobj.loaded === true)
					duration = soundobj.durationEstimate;
				else {
					duration = soundobj.duration;
				}
				return duration;
			},
			
			// repeats the currently playing track
			repeat : function(track) {
				LOGGER.info('repeat()');
				var sound_id = Html.player + '-song-' + Data.curr_song;
				var target = soundManager.getSoundById(sound_id);
				Controller.resetProgressBar();
				target.setPosition(0);
				target.play();
			},
			
			// Plays a song based on the ID
			play : function(caller, track){
				var sound_id = Html.player + '-song-' + track
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
			
			// creates the API element
			setupApi : function() {
				Html.div.append('<div id="swagg-player-data"></div>');
				$('#swagg-player-data').css('display','none').data('api', API);				
			},
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				LOGGER.info('createElement()');
				var song = Data.songs[parseInt(soundobj.id.split('-')[3])];
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
						if (Config.props.useArt === true) {
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
				var hover = (Config.props.buttonHover === undefined) ? false : Config.props.buttonHover;
				
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
				if (Config.props.useArt === true) {
					if (Config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(Config.props.onBeforeSkip)) {
						Config.props.onBeforeSkip.apply(this,[]);
					}
					Controller.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
						Controller.showSongInfo();
						Controller.play('skip',t);
				} // end else	
			},
			
			jumpTo : function(t) {
				var inst = Data;
				Controller.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (Config.props.useArt === true) {
					if (Config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(Config.props.onBeforeSkip)) {
						Config.props.onBeforeSkip.apply(this,[]);
					}
					Controller.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
						Controller.showSongInfo();
						Controller.play('skip',t);
				} // end else	
			},
			
			wipeArtCss : function() {
				var art = Html.art;
				art.removeClass(Data.curr_sprite_class);
				art.css('height','');
				art.css('width','');
				art.css('background-image','');
				art.css('background','');	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				Html.bar.css('width', 0);
				Html.loaded.css('width', 0);
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
				var sound_id = Html.player + '-song-' + track
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
			
			setAlbumArtStyling : function(track){
				var art = Html.art;
				var song = Data.songs[track];
				var songs = Data.songs;
				var data = Data;
				var config = Config;
				var html = Html;
				Controller.wipeArtCss();
				if (song.spriteClass !== undefined) {
					art.addClass(song.spriteClass);
					data.curr_sprite_class =  song.spriteClass;
				}
				else {				
					art.css('background', ' transparent url(' + songs[track].image.src + ')');
					if (config.props.morphArt === true) {
						if (song.thumbHeight !== undefined) {
							html.user_art_css.height = song.thumbHeight.toString() + 'px';
						}
						else {
							var height = (config.props.defaultAlbumArtHeight !== undefined) ? config.props.defaultAlbumArtHeight : '100';
							html.user_art_css.height = height.toString() + 'px';	
						}
						
						if (song.thumbWidth !== undefined) {
							html.user_art_css.width = song.thumbWidth.toString() + 'px';
						}
						else {
							var width = (config.props.defaultAlbumArtWidth !== undefined) ? config.props.defaultAlbumArtWidth : '100';						
							html.user_art_css.width = width.toString() + 'px';	
						}
						art.css(html.user_art_css);
					}
				}				
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track) {
				LOGGER.info('Will show  for song at index: ' + track);
				var sound_id = Html.player + '-song-' + track
				var art = Html.art;
				var config = Config;
				var data = Data;
				var controller = Controller;
				var songs = Data.songs;
				var song = songs[track];
				
				art.fadeOut('slow', function() {
					controller.wipeArtCss();
					controller.setAlbumArtStyling(track);
					$(this).fadeIn('slow', function(){
						controller.showSongInfo();
						controller.play('skip',track);
						if (config.props.onAfterSkip !== undefined && $.isFunction(config.props.onAfterSkip)){
							config.props.onAfterSkip.apply(this,[]);
						}
					});
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
				var duration = 0;
				var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					duration = soundobj.durationEstimate;
					Controller.millsToTime(duration, 0);
				}
				else {
					duration = soundobj.duration;
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
				Html.song_info.html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
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
			repeatMode:false,	
			
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
					setRepeat_ = function(flag) {
						internal.repeatMode = (flag === true || flag === false) ? flag : false;
					};
					
					inRepeat_ = function() {
						var r = internal.repeat;
						return (r === true || r === false) ? r : false;
					};
					
					volUp_ = function() {
						Controller.volume(Data.curr_song, 1);
					};
					
					volDown_ = function(){
						Controller.volume(Data.curr_song, 0);
					};
		
					return {
						setRepeat : setRepeat_,
						repeatMode : inRepeat_,
						volumeUp : volUp_,
						volumeDown : volDown_,
					}; // end return
				} // end playback
				
			}, // end song
			
			playback : function() {
				play_ = function(track) {
					var actualTrack = track - 1;
					if (actualTrack <= (Data.last_song) && actualTrack >= 0) {
						Controller.jumpTo(track - 1);
					} else {
						LOGGER.apierror("Invalid track number '" + track + "'");
					}
				}
				
				return {
					playTrack : play_
				}				
			}
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
			var opts = $.extend(options_,{player:this.attr("id")});
			Controller.init(opts);
		};
})(jQuery);