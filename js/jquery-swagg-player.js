/*
	Swagg Player: Music Player for the web
   	--------------------------------------------
   	http://swaggplayer.com

   	Copyright (c) 2010, Johnny Austin. All rights reserved.
   	Code provided under the MIT License:
   	http://www.opensource.org/licenses/mit-license.php

	v0.8.5.9.6
   
	Change Log
	- Major code refactoring
*/
(function ($){
	
		/*global soundManager: false, setInterval: false, console: false, $: false */

		var _logger,
			_data,
			_html,
			_config,
			_events,
			_controls,
			_imageLoader;
		
		$.fn.SwaggPlayer = function(options_) {
			if (!soundManager || soundManager === undefined || soundManager === 'undefined') {
				initializeSoundManager();
			}
			var opts = $.extend(options_,{player:this.attr("id")});
			Controller.init(opts);
		};

		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// --------------------------------------------------- classes for data model
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------


		// =============================================================== configuration		
		var Config = function() {
			this.props = {};
		}

		Config.prototype.setup = function() {
			this.props.useArt = (_html.art.length > 0);
			this.props.playList = (_html.playlist.length > 0);
		}
		
		// =============================================================== logging utility

		var Logger = function() {}
	
		Logger.prototype.error = function(errMsg){
			if (_config.props.debug === true && _data.isIe === false) {
				console.error('Swagg Player::Error::' + errMsg);	
			}
		};
		Logger.prototype.info = function(info){
			if (_config.props.debug === true && _data.isIe === false) {
				console.log('Swagg Player::Info::' + info);
			}
		};
		Logger.prototype.warn = function(warning) {
			if (_config.props.debug === true && _data.isIe === false) {
				console.log('Swagg Player::Warning::' + warning);
			}
		};
		Logger.prototype.apierror = function(errMsg) {
			if (_config.props.debug === true && _data.isIe === false) {
				console.log('Swagg Player::API Error::' + errMsg);	
			}
		};
	
		// =============================================================== swagg player data

		var Data = function() {
			this.last_song = 0;
			this.songs = {};
			this.curr_sprite_class = '';
			this.isIe = Browser.isIe();;
			this.curr_song = 0;
			this.vol_interval = 20;
			this.interval_id = -1;
		}

		Data.prototype.processSongs = function(theData){
			var _songs = new Array(),
				size = theData.length,
				_config_ = _config;
					
			var Song = function(obj, id) {
				this.url = obj.url;
				this.artist = obj.artist;
				this.title = obj.title;
				this.id = id;							
			};

			Song.prototype.configureArt = function(thumb) {
				this.image = new Image();
				this.image.src = thumb;
			};
					

			// preload SONG album  and append an IDs to the songs - make configurable in the future
			// to avoid having to loop through JSON array
			for (var i = 0; i < size; i++) {
				var tmp = new Song(theData[i], i);
				if (_config_.props.useArt === true && theData[i].thumb !== undefined) {
					tmp.configureArt(theData[i].thumb);
					theData[i].image = new Image();
					theData[i].image.src = theData[i].thumb;
				}
				_songs.push(tmp);

			}
			this.songs = _songs;
			this.last_song = this.songs.length - 1;			
		}

		Data.prototype.getSongs = function() {				
			var theData = _config.props.data;
			
			// Check if dataString points to a json file if so, fetch it.
			// if not, assume string is a literal JSON object
			if (typeof theData === 'string') {
				$.ajax({
					type: "GET",
					url: theData,
					dataType: 'json',
					success: function(data){
						_data.processSongs(data);
					},
					error: function(xhr, ajaxOptions, thrownError){
						_logger.error('There was a problem fetching your songs from the server: ' + thrownError);
					}
				});	
			} // end if
			else {
				this.processSongs(theData);
			}
		}
		
		// =============================================================== UI elements (divs)

		var Html = function() {
			this.div = null;
			this.player = null;
			this.playlist = null;
			this.art = null;
			this.loading_indication = null;
			this.progress_wrapper = null;
			this.bar = null;
			this.loaded = null;
			this.song_info = null;
			this.controls_div = null;
			this.bridge_data = null;
			this.user_art_css = 
			{
				height : {height:0, width:0}
			};
			this.metadata = 
			{
				progressWrapperWidth : 0
			}
		}

		Html.prototype.initHtml = function() {
			_logger.info("initHtml()");
			this.div = $('#' + this.player);
			this.playlist = $('#' + this.player + ' .swagg-player-list');
			this.art = $('#' + this.player + ' .swagg-player-album-art');
			this.loading_indication = $('#' + this.player + ' img.swagg-player-loading');
			this.progress_wrapper = $('#' + this.player + ' .swagg-player-progress-wrapper');
			this.bar = $('#' + this.player + ' .swagg-player-bar');
			this.loaded = $('#' + this.player + ' .swagg-player-loaded');
			this.song_info = $('#' + this.player + ' .swagg-player-song-info');
			this.controls_div = $('#' + this.player + ' .swagg-player-controls');
			this.user_art_css = {height:0, width:0};
		}

		Html.prototype.setupProgressBar = function() {
			_logger.info('SetupProgressBar()');
			if (this.progress_wrapper.length > 0) {
				var wrapper = $('#' + this.player + ' div.swagg-player-progress-wrapper'),
					height = wrapper.css('height'),
					progress = $('<div></div>'),
					loaded = $('<div></div>');
				loaded.addClass("swagg-player-loaded");
				loaded.css('height', height).css('width',0).css('float','left').css('margin-left','0');
				wrapper.append(loaded);
				this.loaded = $('#' + this.player + ' div.swagg-player-loaded');
				
				progress.addClass('swagg-player-bar');
				progress.css('height', height).css('width',0).css('float','left').css('margin-left','auto');
				loaded.append(progress);
				this.bar = $('#' + this.player + ' div.swagg-player-bar');
				this.metadata.progressWrapperWidth = parseFloat(this.progress_wrapper.css('width'));
			}
		}
		
		// =============================================================== player controlls

		var Controls = function() {
			this.play = null;
			this.skip = null;
			this.back = null;
			this.stop = null;
		}

		Controls.prototype.setup = function(img) {
			var imageLoader = _imageLoader;
			this.play =	$('#' + _html.player + ' .swagg-player-play-button');
			this.skip =	$('#' + _html.player + ' .swagg-player-skip-button');
			this.back =	$('#' + _html.player + ' .swagg-player-back-button');
			this.stop =	$('#' + _html.player + ' .swagg-player-stop-button');
				
			if (imageLoader.play !== null) {
				this.play.css('cursor','pointer');	
			}
			if (imageLoader.skip !== null) {
				this.skip.css('cursor','pointer');		
			}
			if (imageLoader.back !== null) {
				this.back.css('cursor','pointer');		
			}
			if (imageLoader.stop !== null) {
				this.stop.css('cursor','pointer');		
			}

			img.css('cursor', 'pointer');
		}


		// =============================================================== events

		var Events = function() {}

		Events.prototype.bindControllerEvents = function(controls) {
				_logger.info('Binding controller button events');
				var inst = Data,
					_images = _imageLoader.imagesLoaded,
					_config_ = _config,
					i = inst.img,
					imageLoader = _imageLoader,
					usehover = (_config_.props.buttonHover === undefined) ? false : _config_.props.buttonHover;
				
				controls.play.bind({
					click: function() {
						 Controller.play('playlink click', _data.curr_song);
						 return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.playOver.src);	
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.play.src);	
						}
					}
				});
				
				controls.skip.bind({
					click: function() {
						Controller.skip(1);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.skipOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.skip.src);	
						}
					}
				});
	
				controls.stop.bind({
					click: function() {
						Controller.stopMusic(_data.curr_song);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.stopOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.stop.src);
						}
					}
				});
	
				controls.back.bind({
					click: function() {
						Controller.skip(0);
						return false;
					},
					mouseover: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.backOver.src);
						}
					},
					mouseout: function() {
						if (_images === true && usehover) {
							$(this).attr('src', imageLoader.back.src);
						}
					}
				});				
			}

			Events.prototype.bindMediaKeyEvents = function() {
				_logger.info('Binding media key events');
				var curr_song = _data.curr_song;			
				$(document).keydown(function(e) {
	
					if (!e) e = window.event;
				
						switch(e.which) {
						  case 179:
							Controller.play('Media key event switch', curr_song);
							return false;
					
						  case 178:
							Controller.stopMusic(curr_song);
							return false;
					
						  case 176:
							Controller.skip(1);
							return false;
					
						  case 177:
							Controller.skip(0);
							return false;
							
						case 175:
							Controller.volume(curr_song, 1);
							return false;
					
						case 174:
							Controller.volume(curr_song, 0);
							return false;
					}
				});				
			}

			Events.prototype.setupSeek = function() {
			// seek to a position in the song
			var _html_ = _html;
			_html_.loaded.css('cursor', 'pointer').bind({
				click : function(e) {
					var id = _html_.player + '-song-' + _data.curr_song,
						progressWrapperWidth = _html_.metadata.progressWrapperWidth,
						soundobj = soundManager.getSoundById(id),
						x = e.pageX - _html_.loaded.offset().left,
						loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
						duration = 	Controller.getDuration(soundobj),
						// obtain the position clicked by the user
						newPosPercent = x / progressWrapperWidth,
						loaded = progressWrapperWidth * loaded_ratio,
						// find the position within the song to which the location clicked corresponds
						seekTo = Math.round(newPosPercent * duration);
					if (loaded >= progressWrapperWidth) {
						soundobj.setPosition(seekTo);
					}
				}
			});
			
			// seek preview data
			_html_.loaded.bind( 'mouseover hover mousemove', 
				function(e){
					var id = _html_.player + '-song-' + _data.curr_song,
						_config_ = _config,
						soundobj = soundManager.getSoundById(id),
						x = e.pageX - _html_.loaded.offset().left,
						duration = Controller.getDuration(soundobj),
						// obtain the position clicked by the user
						newPosPercent = x / _html_.metadata.progressWrapperWidth,
						// find the position within the song to which the location clicked corresponds
						seekTo = Math.round(newPosPercent * duration);

					Controller.millsToTime(seekTo, -1);
					
					// fire off onSeekPreview event
					if (_config_.props.onSeekPreview !== undefined && $.isFunction(_config_.props.onSeekPreview)) {
						internal.event_ref = e;
						_config_.props.onSeekPreview.apply(this, []);	
					}				
				}
			);	
		}


		// =============================================================== images for button controls

		var ImageLoader = function() {

			this.play = null;
			this.playOver = null
			this.pause = null;
			this.pauseOver = null;
			this.stop = null;
			this.stopOver = null;
			this.back = null;
			this.backOver = null;
			this.skip = null;
			this.skipOver = null;
			this.art = null;
			this.imagesLoaded = false;
		}

		ImageLoader.prototype.setup = function(config) {
			if (config.buttonsDir !== undefined) {
				_controls.setup(_html.controls_div);
				this.loadButtonImages(config.buttonsDir);
			}
			else {
				config.buttonHover = false;	
			}
			if (config.spriteImg !== undefined) {
				this.art = new Image();
				this.art.src = config.spriteImg;
			}
		}

		ImageLoader.prototype.loadButtonImages = function(imagesDir) {
			_logger.info('loading images........');
			var hover = (_config.props.buttonHover === undefined) ? false : _config.props.buttonHover,
				controls = _controls;
			_logger.info('Loading images for controls');
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


		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// --------------------------------------------------- controller for the main functionality (play, pause etc) 
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		var Controller = {
			init : function(config) {

				// initialize configuration
				_config = new Config();

				_config.props = $.extend(_config.props,config);

				_logger = new Logger();
				_data = new Data();
				_html = new Html();
				
				_html.player = config.player;
				_html.initHtml();
				
				_config.setup();

				
				// get songs from server via XHR
				_data.getSongs();
				
				// init onSeek events
				_html.setupProgressBar();
				
				// create invisible element which will hold user accessible data
				Controller.setupApi();

				_controls = new Controls();
				_imageLoader = new ImageLoader();
				_imageLoader.setup(config);


				// check for soundManager support and warn or inform accordingly
				if (!soundManager.supported()) {
					_logger.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					_logger.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
				}
				
				soundManager.useHTML5Audio = true;
				
				// setup controller events
				_events = new Events();
				_events.bindControllerEvents(_controls);
				_events.bindMediaKeyEvents();

				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					_logger.info('createSongs()');
					var _data_ = _data;
					if(_data_.songs[0] !== undefined) {
						clearInterval(_data_.interval_id);
						var songs_ = _data_.songs,
							localSoundManager = soundManager,
							config = _config,
							confLoad = true, //config.props.lazyLoad, // disable for now
							_html_ = _html,
							data = Data,
							controller = Controller,
							temp,
							autoload = (confLoad === 'undefined' || confLoad === undefined || confLoad === false) ? true : false;

						_logger.info("Auto load set to : " + autoload);	
						for (var i = 0, end = songs_.length; i < end; i++) {
							temp = localSoundManager.createSound({	// create sound objects to hook event handlers
								id: _html_.player + '-song-' + i.toString(),	// to button states
								url: songs_[i].url,
								autoLoad: autoload,
								onfinish: function(){
									if (internal.repeatMode === false){
										if (_data_.curr_song !== _data_.last_song) {
											controller.skip(1);
										} else {
											controller.playPauseButtonState(1);
											controller.stopMusic(_data_.curr_song);
											var obj = temp.setPosition(0);
										}
									}
									else {
										controller.repeat();	
									}
								},
								onplay: function(){
									controller.millsToTime(this.duration, 0);	
									controller.playPauseButtonState(0);
									if(config.props.onPlay !== undefined && $.isFunction(config.props.onPlay)){
										config.props.onPlay.apply(this,[]);
									}
									if (controller.loaded(this) === true) {
										controller.fillLoaded();
									}
								},
								onpause: function(){
									controller.playPauseButtonState(1); 
									if(config.props.onPause !== undefined && $.isFunction(config.props.onPause)){
										config.props.onPause.apply(this,[]);
									}
								},
								onstop: function(){
									controller.playPauseButtonState(1); 
									if(config.props.onStop !== undefined && $.isFunction(config.props.onStop)){
										config.props.onStop.apply(this,[]);
									}
								},
								onresume: function(){
									controller.playPauseButtonState(0); 
									if(config.props.onResume !== undefined && $.isFunction(config.props.onResume)){
										config.props.onResume.apply(this,[]);
									}
								},
								whileplaying: function(){
									controller.progress(this);
									controller.millsToTime(this.position, 1);
									if($.isFunction(config.props.whilePlaying)){
										config.props.whilePlaying.apply(this,[]);
									}
								},
								whileloading: function() {
									controller.whileLoading(this);
								},
								onerror: function() {
									_logger.error('An error occured while attempting to play this song. Sorry about that.')
									if(config.props.onError !== undefined && $.isFunction(config.props.onError)){
										config.props.onError.apply(this,[]);
									}
								}
							});
							temp.id = _html.player + '-song-' + i.toString();
							temp.repeat = internal.repeat;
							if (config.props.playList !== undefined && config.props.playList === true) {
								controller.createElement(temp);
							}
						} // end for
						if (config.props.useArt === true) {
							// initialize first song album 
							var songs = _data_.songs,
								index = _data_.curr_song;
							_html_.loading_indication.remove();
							controller.setAlbumArtStyling(0);
						}
						_events.setupSeek();
						controller.showSongInfo();
						if(config.props.autoPlay !== undefined && config.props.autoPlay === true) {
							setTimeout(function(){
									controller.play('', _data_.curr_song);
								},1000);
						}
						if (config.props.onSetupComplete !== undefined && $.isFunction(config.props.onSetupComplete)) {
							config.props.onSetupComplete.apply(this,[]);
						}
						_logger.info("Swagg Player ready!");
					} // end if (Data.songs[0] !== undefined) 
				};
			
				// init soundManager
				soundManager.onload =  function() {
					// try to init sound manager every 5 milliseconds in case songs AJAX callback
					// has not completed execution	
					_data.interval_id = setInterval('soundManager.createSongs()', 5); 
				}; // end soundManager onload function	
				
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  _logger.error('An error has occured with loading Sound Manager! Rebooting.');
				  soundManager.flashLoadTimeout = 0;
				  clearInterval(_data.interval_id);
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
						_logger.error('Something went wrong with loading Sound Manager. No tunes for you!');
						// call user defined onError function
					  	if(config.props.onError !== undefined && jQuery.isFunction(config.props.onError)){
							config.props.onError.apply(this,[]);
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
				_logger.info('repeat()');
				var sound_id = _html.player + '-song-' + _data.curr_song,
					target = soundManager.getSoundById(sound_id);
				Controller.resetProgressBar();
				target.setPosition(0);
				target.play();
			},
			
			// Plays a song based on the ID
			play : function(caller, track){
				_logger.info('Playing track: ' + sound_id + '. Oh and ' + caller + ' called me!');
				var sound_id = _html.player + '-song-' + track,
					target = soundManager.getSoundById(sound_id);
				
				if (target.paused === true) { // if current track is paused, unpause
					_logger.info('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						_logger.info('Pausing current track');
						target.pause();
					}
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						internal.update();
						_logger.info('Playing current track from beginning');
						target.play();
					}
				}
				Controller.showSongInfo();
			},
			
			// creates thße API element
			setupApi : function() {
				window.swaggPlayerApi = new API();				
			},
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				_logger.info('createElement()');
				var song = _data.songs[parseInt(soundobj.id.split('-')[3])],
					id = 'item-' + song.id,
					listItem = $('<li></li>');
				listItem.attr('id',id);
				listItem.addClass('swagg-player-playlist-item');
				listItem.html(song.title + ' - ' + song.artist);
				listItem.css('cursor','pointer');
							
				listItem.data('song', song);
				listItem.bind({
					click: function(){
						Controller.stopMusic(_data.curr_song);
						var track = parseInt($(this).data('song').id),
							afterEffect = function() {
								Controller.showSongInfo();
								Controller.play('switchArt() - by way of createElement',track);
							}			
						_data.curr_song = track;
						if (_config.props.useArt === true) {
							Controller.switchArt(track, afterEffect);
						}
						else {
							Controller.showSongInfo();
							Controller.play('switchArt() - by way of createElement',track);	
						}
						return false;
					}
				});
				_html.playlist.append(listItem);
			},

			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				_logger.info('PlayButtonState() state: ' + state);
				var inst = Data,
					i = inst.img,
					imagesLoaded = _imageLoader.imagesLoaded,
					out, over,
					play = _controls.play,
					hover = (_config.props.buttonHover === undefined) ? false : _config.props.buttonHover;
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						play.html('play ');
					}
					else {
						out = _imageLoader.play.src;
						if (hover === true) {
							over = _imageLoader.playOver.src;
						}
					}

				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						play.html('pause ');
					}
					else {
						out = _imageLoader.pause.src;
						if (hover === true) {
							over = _imageLoader.pauseOver.src;
						}
					}

				}
				else { // invalid state
					_logger.error('Invalid button state! : ' + state);	
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
				_logger.info('skip()');
				var inst = _data,
					t = inst.curr_song;
				
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
					_logger.error('Invalid skip direction flag: ' + direction);
					return false;	
				}
				Controller.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (_config.props.useArt === true) {
					if (_config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(_config.props.onBeforeSkip)) {
						_config.props.onBeforeSkip.apply(this,[]);
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
				if (_config.props.useArt === true) {
					if (_config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(_config.props.onBeforeSkip)) {
						_config.props.onBeforeSkip.apply(this,[]);
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
				var art = _html.art;
				art.removeClass(_data.curr_sprite_class);
				art.css('height','');
				art.css('width','');
				art.css('background-image','');
				art.css('background','');	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				_html.bar.css('width', 0);
				_html.loaded.css('width', 0);
			},	
			
			// resets the track time
			resetTrackTime : function() {
				_logger.info('Resetting track time');
				internal.fillTime(0,0,0,0);
			},
			
			// Stops the specified song
			stopMusic : function(track) {
				_logger.info('stopMusic()');
				soundManager.stopAll();
				Controller.resetProgressBar();
				Controller.resetTrackTime();
			},
			
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = _html.player + '-song-' + track,
					sound = soundManager.getSoundById(sound_id),
				 	curr_vol = sound.volume;

				if (flag === 1) {
					_logger.info('Vol up');
					soundManager.setVolume(sound_id, curr_vol + _data.vol_interval);
				}
				else if (flag === 0) {
					_logger.info('Vol down');
					soundManager.setVolume(sound_id, curr_vol - _data.vol_interval);
				}
				else {
					_logger.info('Invalid volume flag!');	
				}
			},
			
			setAlbumArtStyling : function(track){
				var art = _html.art,
					_data_ = _data,
					song = _data_.songs[track],
					songs = _data_.songs,
					config = _config,
					html = Html;
					
				Controller.wipeArtCss();
				if (song.spriteClass !== undefined) {
					art.addClass(song.spriteClass);
					_data_.curr_sprite_class =  song.spriteClass;
				}
				else {				
					art.css('background', ' transparent url(' + songs[track].image.src + ')');
					if (config.props.morphArt === true) {
						if (song.thumbHeight !== undefined) {
							_html.user_art_css.height = song.thumbHeight.toString() + 'px';
						}
						else {
							var height = (config.props.defaultAlbumArtHeight !== undefined) ? config.props.defaultAlbumArtHeight : '100';
							_html.user_art_css.height = height.toString() + 'px';	
						}
						
						if (song.thumbWidth !== undefined) {
							_html.user_art_css.width = song.thumbWidth.toString() + 'px';
						}
						else {
							var width = (config.props.defaultAlbumArtWidth !== undefined) ? config.props.defaultAlbumArtWidth : '100';						
							_html.user_art_css.width = width.toString() + 'px';	
						}
						art.css(_html.user_art_css);
					}
				}				
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track) {
				_logger.info('Will show  for song at index: ' + track);
				var sound_id = _html.player + '-song-' + track,
					art = _html.art,
					config = _config,
					data = Data,
					controller = Controller,
					songs = _data.songs,
					song = songs[track];
				
				if ($.ui) {
					art.hide('slide', 200, function() {
						controller.wipeArtCss();
						controller.setAlbumArtStyling(track);
						$(this).show('slide', function(){
							controller.showSongInfo();
							controller.play('skip',track);
							if (config.props.onAfterSkip !== undefined && $.isFunction(config.props.onAfterSkip)){
								config.props.onAfterSkip.apply(this,[]);
							}
						});
					});	
				} else {
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
				}
			},
			
			// fills in song metadata based on ID3 tags
			// not being used for now, flash ID3 is too buggy
			id3Fill : function(soundobj) {
				var song = _data_.songs[parseInt(soundobj.id.split('-')[1])];
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
			
			fillLoaded : function() {
				_html.loaded.css('width', _html.metadata.progressWrapperWidth);
			},
			
			loaded : function(soundobj) {
				if (soundobj.loaded === true && soundobj.readyState === 3 && soundobj.bytesLoaded === soundobj.bytesTotal) return true;
				else return false;
			},
			
			whileLoading : function(soundobj) {
				// get current position of currently playing song
				var pos = soundobj.position,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
					duration = soundobj.duration;
				
					// width of progress bar
				var	wrapper_width = _html.metadata.progressWrapperWidth,
					loaded = wrapper_width * loaded_ratio;

				_html.loaded.css('width', loaded);				
			},
			
			// updates the UI progress bar
			progress : function(soundobj) {
				// get current position of currently playing song
				var pos = soundobj.position; 
					duration = 0,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					duration = soundobj.durationEstimate;
					Controller.millsToTime(duration, 0);
				}
				else {
					duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration,
					// width of progress bar
					wrapper_width = _html.metadata.progressWrapperWidth,
					//loaded = wrapper_width * loaded_ratio,
					// set width of inner progress bar equal to the width equivelant of the
					// current position
					t = wrapper_width*pos_ratio;
				_html.bar.css('width', t);
			},
			
			// calculates the total duration of a sound in terms of minutes
			// and seconds based on the total duration in milliseconds.
			// flag 0 - says we're calculating the total duration of the song
			// flag 1 - says we're calculating the current potition of the song
			// flag -1 = says we're calculating the arbitrary position of a song (seek preview)
			millsToTime : function(duration, flag) {
					var seconds = Math.floor(duration / 1000),
						minutes = 0;
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
						_logger.error('Invalid flag passed to millsToTime()');	
					}
			},
			
			// displays ist and song title
			showSongInfo : function() {
				var loc_inst = _data,
					song_ = loc_inst.songs[loc_inst.curr_song];
				_html.song_info.html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};

		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// --------------------------------------------------- api stuff
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		
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
				var _data_ = _data,
					t = _data_.curr_song;
				this.currTitle = _data_.songs[t].title;
				this.currArtist = _data_.songs[t].artist;
				this.currAlbum = _data_.songs[t].album;	
				this.currTempo = _data_.songs[t].tempo;
				_logger.info('Current song: [' + this.currArtist + '] [' + this.currTitle + '] [' + this.currTempo + ']'  );	
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
		var API = function() {
			var self = this;
			self.currSong = {
				/*
					Deals with functions available for the current song
				*/
				getCurrTimeAsString : function() {
					var i = internal,
						currMin = (i.currMinutes > 9) ? i.currMinutes : '0' + 
							i.currMinutes.toString(),
						currSec = (i.currSeconds > 9) ? i.currSeconds : '0' + 
							i.currSeconds.toString();	
					return currMin + ':' + currSec;					
				},
				getTotalTimeAsString : function() {
					var i = internal,
						totalMin = (i.totalMinutes > 9) ? i.totalMinutes : '0' + 
							i.totalMinutes.toString(),
						totalSec = (i.totalSeconds > 9) ? i.totalSeconds : '0' + 
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
				}, // end as string
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
			}; // end current song funcs
			
			
			/*
				Deals with play back functionality of the player in general
			*/
			self.playback = {
				setRepeat : function(flag) {
					internal.repeatMode = (flag === true || flag === false) ? flag : false;
					return self;
				},
				
				inRepeat : function() {
					var r = internal.repeat;
					return (r === true || r === false) ? r : false;
				},
				
				volUp : function() {
					Controller.volume(_data_.curr_song, 1);
					return self;
				},
				
				volDown : function(){
					Controller.volume(_data_.curr_song, 0);
					return self;
				},

				playTrack : function(track) {
					var actualTrack = track - 1;
					if (actualTrack <= (_data_.last_song) && actualTrack >= 0) {
						Controller.jumpTo(track - 1);
					} else {
						_logger.apierror("Invalid track number '" + track + "'");
					}
					return self;
				},
				
				stop : function() {
					Controller.stopMusic(null);
				}				
			}; // end playback funcs
		}; // end api

		

		
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
			_logger.info('Initializing SoundManager2');
			window.soundManager = new SoundManager();
			soundManager.url = 'swf';
			soundManager.wmode = 'transparent'
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
						

})(jQuery);