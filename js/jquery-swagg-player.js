/*
	Swagg Player: Music Player for the web
   	--------------------------------------------
   	http://swaggplayer.no.de

   	Copyright (c) 2010, Johnny Austin. All rights reserved.
   	Code provided under the MIT License:
   	http://www.opensource.org/licenses/mit-license.php

	v0.8.6.2
   
	Change Log
	- more refactoring	
*/
(function ($){
	
		/*global soundManager: false, setInterval: false, console: false, $: false */
	
		$.fn.SwaggPlayer = function(options_) {
			var id = {};
			id['id'] = this.attr('id');

			if (id['id']) {
				if (console && console.time) {
					console.time('SwaggPlayerStart');
				}

				Init.initializeSoundManager();
				if (soundManager) {
					var opts = $.extend(options_, id),
						player = new Controller();
					player.init(opts);
				} else {
					$.error('An error occured while initializing soundManager!');
				}
			} else {

				$.error('Swagg Player element missing id attribute!');
			}
			
		};

		/*
			----------------------------------------------------------------------------------------------------------------------------------------------------
			----------------------------------------------------------------------------------------------------------------------------------------------------
			--------------------------------------------------- classes for data model
			----------------------------------------------------------------------------------------------------------------------------------------------------
			----------------------------------------------------------------------------------------------------------------------------------------------------
		*/

		/*
			============================================================ configuration	
			Encapsulation for passed in configuration
		*/	
		var Config = function(p) {
			this.PLAYER = p;
			this.props = {};
			this.consoleSupport = false;
			if (console) {
				this.consoleSupport = true;
			}
		}
		
		/*
			============================================================ logging utility
			For logging, of course. Using this centralized location for logging to check for 
			support because IE is funny acting with the console object
		*/
		var Logger = function(p, _id) {
			this.PLAYER = p;
			this.log = p._config.consoleSupport;
			this.debug = p._config.props.debug;
			this.id = _id;
		}
		
		$.extend(Logger.prototype, {
			error : function(errMsg){
				if (this.debug === true && this.log === true) {
					console.error('Swagg Player::' + this.id + '::Error::' + errMsg);	
				}
			},
			info : function(info){
				if (this.debug === true && this.log === true) {
					console.log('Swagg Player::' + this.id + '::Info::' + info);
				}
			},
			warn : function(warning) {
				if (this.debug === true && this.log === true) {
					console.warn('Swagg Player::' + this.id + '::Warning::' + warning);
				}
			},
			apierror : function(errMsg) {
				if (this.debug === true && this.log === true) {
					console.error('Swagg Player::' + this.id + '::API Error::' + errMsg);	
				}
			}
		});
	
		/*
			=============================================== swagg player data
			handles the fetching and processing of songs
		*/
		var Data = function(p) {
			this.PLAYER = p,
			this.last_song = 0;
			this.songs = {};
			this.curr_sprite_class = '';
			this.isIe = Browser.isIe();;
			this.curr_song = 0;
			this.vol_interval = 20;
			this.interval_id = -1;
		}

		$.extend(Data.prototype, {
			processSongs : function(theData){
				var player = this.PLAYER,
					_songs = new Array(),
					size = theData.length,
					_html = player._html,
					_config_ = player._config;
						
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
					if (_html.useArt === true && theData[i].thumb !== undefined) {
						tmp.configureArt(theData[i].thumb);
						theData[i].image = new Image();
						theData[i].image.src = theData[i].thumb;
					}
					_songs.push(tmp);

				}
				this.songs = _songs;
				this.last_song = this.songs.length - 1;			
			},

			getSongs : function() {				
				var theData = this.PLAYER._config.props.data;
				
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
		});	
		
		/*
			============================================================ UI elements (divs)
			Manages HTML elements associated with Swagg Player
		*/

		var Html = function(p) {
			this.PLAYER = p,
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
			this.artist = null;
			this.title = null;
			this.useArt = false;
			this.playList = false;
			this.user_art_css = 
			{
				height : {height:0, width:0}
			};
			this.metadata = 
			{
				progressWrapperWidth : 0
			}
		}

		$.extend(Html.prototype, {
			initHtml : function(config) {
				this.PLAYER._logger.info("initHtml()");
				
				this.player = config.id;
				this.playlist = $('#' + this.player + ' .swagg-player-list');
				this.art = $('#' + this.player + ' .swagg-player-album-art');
				this.loading_indication = $('#' + this.player + ' img.swagg-player-loading');
				this.progress_wrapper = $('#' + this.player + ' .swagg-player-progress-wrapper');
				this.bar = $('#' + this.player + ' .swagg-player-bar');
				this.loaded = $('#' + this.player + ' .swagg-player-loaded');
				this.song_info = $('#' + this.player + ' .swagg-player-song-info');
				this.controls_div = $('#' + this.player + ' .swagg-player-controls');
				this.artist = $('#' + this.player + ' .swagg-player-artist');
				this.title = $('#' + this.player + ' .swagg-player-title');
				this.user_art_css = {height:0, width:0};
				this.useArt = (this.art.length > 0);
				this.playList = (this.playlist.length > 0);
			},

			setupProgressBar : function() {
				this.PLAYER._logger.info('SetupProgressBar()');
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
		});
		
		/*
			============================================================= player controlls
			Handles control specific stuff
		*/
		var Controls = function(p) {
			this.PLAYER = p;
			this.play = null;
			this.skip = null;
			this.back = null;
			this.stop = null;
		}

		$.extend(Controls.prototype, {
			setup : function(img) {
				var p = this.PLAYER,
					imageLoader = p._imageLoader;
				this.play =	$('#' + p._html.player + ' .swagg-player-play-button');	
				this.skip =	$('#' + p._html.player + ' .swagg-player-skip-button');
				this.back =	$('#' + p._html.player + ' .swagg-player-back-button');
				this.stop =	$('#' + p._html.player + ' .swagg-player-stop-button');
					
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
		});

		/*
			============================================================== events
			Handles Swagg Player events
		*/
		var Events = function(p) {
			this.PLAYER = p;
		}

		$.extend(Events.prototype, {
			bindControllerEvents : function() {		
				var p = this.PLAYER,
					controls = p._controls,
					//inst = Data,
					_images = p._imageLoader.imagesLoaded,
					_config_ = p._config,
					//i = inst.img,
					imageLoader = p._imageLoader,
					usehover = (_config_.props.buttonHover === undefined) ? false : _config_.props.buttonHover;

				p._logger.info('Binding controller button events');
				
				controls.play.bind({
					click: function() {
						 p.play('playlink click', p._data.curr_song);
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
						p.skip(1);
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
						p.stopMusic(p._data.curr_song);
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
						p.skip(0);
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
			},

			bindMediaKeyEvents : function() {
				
				var p = this.PLAYER,
					curr_song = p._data.curr_song;
						
					
				p._logger.info('Binding media key events');		
				$(document).keydown(function(e) {
	
					if (!e) e = window.event;
				
						switch(e.which) {
						  case 179:
							p.play('Media key event switch', curr_song);
							return false;
					
						  case 178:
							p.stopMusic(curr_song);
							return false;
					
						  case 176:
							p.skip(1);
							return false;
					
						  case 177:
							p.skip(0);
							return false;
							
						case 175:
							p.volume(curr_song, 1);
							return false;
					
						case 174:
							p.volume(curr_song, 0);
							return false;
					}
				});				
			},

			setupSeek : function() {
				// seek to a position in the song
				var p = this.PLAYER;
					_html_ = p._html;

				_html_.loaded.css('cursor', 'pointer').bind({
					click : function(e) {
						var id = _html_.player + '-song-' + p._data.curr_song,
							progressWrapperWidth = _html_.metadata.progressWrapperWidth,
							soundobj = soundManager.getSoundById(id),
							x = e.pageX - _html_.loaded.offset().left,
							loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
							duration = 	p.getDuration(soundobj),
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
						var id = _html_.player + '-song-' + p._data.curr_song,
							_config_ = p._config,
							soundobj = soundManager.getSoundById(id),
							x = e.pageX - _html_.loaded.offset().left,
							me = this,
							duration = p.getDuration(soundobj),
							// obtain the position clicked by the user
							newPosPercent = x / _html_.metadata.progressWrapperWidth,
							// find the position within the song to which the location clicked corresponds
							seekTo = Math.round(newPosPercent * duration);

						p.millsToTime(seekTo, -1);
						
						// fire off onSeekPreview event
						if (_config_.props.onSeekPreview !== undefined && $.isFunction(_config_.props.onSeekPreview)) {
							internal.event_ref = e;
							_config_.props.onSeekPreview.apply(this, []);	
						}				
					}
				);	
			}
		});

		/*
			============================================================= images for button controls
			Loades images for buttons
		*/
		var ImageLoader = function(p) {
			this.PLAYER = p,
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

		$.extend(ImageLoader.prototype, {
			setup : function() {
				var config = this.PLAYER._config.props;
				if (config.buttonsDir !== undefined) {
					this.PLAYER._controls.setup(this.PLAYER._html.controls_div);
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

			loadButtonImages : function(imagesDir) {
				
				var player = this.PLAYER,
					hover = (player._config.props.buttonHover === undefined) ? false : player._config.props.buttonHover,
					controls = player._controls;

				player._logger.info('Loading images for controls');

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
		});


		/*
			----------------------------------------------------------------------------------------------------------------------------------------------------
			----------------------------------------------------------------------------------------------------------------------------------------------------
			--------------------------------------------------- controller for the main functionality (play, pause etc) 
			----------------------------------------------------------------------------------------------------------------------------------------------------
			----------------------------------------------------------------------------------------------------------------------------------------------------
		*/
		Controller = function(){
			this._logger = null;
			this._data = null;
			this._html = null;
			this._config = null;
			this._events = null;
			this._controls = null;
			this._imageLoader = null;
		}

		$.extend(Controller.prototype, {
		 
			init : function(config) {
				var me = this;

				me.initComponents(config);

				// configure soundManager, create song objects, and hook event listener actions
				if (!soundManager.createSongs) {
					soundManager.createSongs = function() {
						me._logger.info('createSongs()');
						var _data_ = me._data;
						if(_data_.songs[0] !== undefined) {
							clearInterval(_data_.interval_id);
							var songs_ = _data_.songs,
								localSoundManager = soundManager,
								config = me._config,
								confLoad = true, //config.props.lazyLoad, // disable for now
								_html_ = me._html,
								temp,
								autoload = (confLoad === 'undefined' || confLoad === undefined || confLoad === false) ? true : false;

							me._logger.info("Auto load set to : " + autoload);	
							for (var i = 0, end = songs_.length; i < end; i++) {
								temp = localSoundManager.createSound({	// create sound objects to hook event handlers
									id: _html_.player + '-song-' + i.toString(),	// to button states
									url: songs_[i].url,
									autoLoad: autoload,
									usePolicyFile: false,
									onfinish: function(){
										if (internal.repeatMode === false){
											if (_data_.curr_song !== _data_.last_song) {
												controller.skip(1);
											} else {
												me.playPauseButtonState(1);
												me.stopMusic(_data_.curr_song);
												var obj = temp.setPosition(0);
											}
										}
										else {
											me.repeat();	
										}
									},
									onplay: function(){
										me.millsToTime(this.duration, 0);	
										me.playPauseButtonState(0);
										if(config.props.onPlay !== undefined && $.isFunction(config.props.onPlay)){
											config.props.onPlay.apply(this,[]);
										}
										if (me.loaded(this) === true) {
											me.fillLoaded();
										}
									},
									onpause: function(){
										me.playPauseButtonState(1); 
										if(config.props.onPause !== undefined && $.isFunction(config.props.onPause)){
											config.props.onPause.apply(this,[]);
										}
									},
									onstop: function(){
										me.playPauseButtonState(1); 
										if(config.props.onStop !== undefined && $.isFunction(config.props.onStop)){
											config.props.onStop.apply(this,[]);
										}
									},
									onresume: function(){
										me.playPauseButtonState(0); 
										if(config.props.onResume !== undefined && $.isFunction(config.props.onResume)){
											config.props.onResume.apply(this,[]);
										}
									},
									whileplaying: function(){
										me.progress(this);
										me.millsToTime(this.position, 1);
										if($.isFunction(config.props.whilePlaying)){
											config.props.whilePlaying.apply(this,[]);
										}
									},
									whileloading: function() {
										me.whileLoading(this);
									},
									onerror: function() {
										_logger.error('An error occured while attempting to play this song. Sorry about that.')
										if(config.props.onError !== undefined && $.isFunction(config.props.onError)){
											config.props.onError.apply(this,[]);
										}
									}
								});
								temp.id = me._html.player + '-song-' + i.toString();
								temp.repeat = me.internal.repeat;
								if (_html_.playList !== undefined && _html_.playList === true) {
									me.createElement(temp);
								}
							} // end for
							_html_.loading_indication.remove();
							if (_html_.useArt === true) {
								me._logger.info('Intializing album art...');
								// initialize first song album 
								var songs = _data_.songs,
									index = _data_.curr_song;
								me.setAlbumArtStyling(0);
							}
							me._events.setupSeek();
							me.showSongInfo();
							if(config.props.autoPlay !== undefined && config.props.autoPlay === true) {
								setTimeout(function(){
										me.play('', _data_.curr_song);
									},1000);
							}
							if (config.props.onSetupComplete !== undefined && $.isFunction(config.props.onSetupComplete)) {
								config.props.onSetupComplete.apply(this,[]);
							}
							if (console && console.timeEnd) {
								console.timeEnd('SwaggPlayerStart');
							}
							me._logger.info("Swagg Player ready!");
						} // end if (Data.songs[0] !== undefined) 
					};
				}
				
				// init soundManager
				soundManager.onload =  function() {
					// try to init sound manager every 5 milliseconds in case songs AJAX callback
					// has not completed execution	
					me._data.interval_id = setInterval('soundManager.createSongs()', 5); 
				}; // end soundManager onload function	
					
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  me._logger.error('An error has occured with loading Sound Manager! Rebooting.');
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
			}, // end Controller.init

			initComponents : function(config) {
				var me = this;
				// initialize configuration
				me._config = new Config(me);

				me._config.props = $.extend(me._config.props,config);

				// setup logging
				me._logger = new Logger(me, config.id);

				// initialize data (songs)
				me._data = new Data(me);

				// setup html elements
				me._html = new Html(me);
				me._html.initHtml(config);
				
				// get songs from server via XHR
				me._data.getSongs();
				
				// init onSeek events
				me._html.setupProgressBar();
				
				// create invisible element which will hold user accessible data
				me.setupApi();

				// controls, images
				me._controls = new Controls(me);
				me._imageLoader = new ImageLoader(me);
				me._imageLoader.setup();
			

				if (config.buttonsDir !== undefined) {
					me._controls.setup(me._html.controls_div);
				}
				else {
					config.buttonHover = false;	
				}
				if (config.spriteImg !== undefined) {
					me._imageLoader.art = new Image();
					me._ImageLoader.art.src = config.spriteImg;
				}

				// setup controller events
				me._events = new Events(me);
				me._events.bindControllerEvents();
				me._events.bindMediaKeyEvents();


				// check for soundManager support and warn or inform accordingly
				if (!soundManager.supported()) {
					me._logger.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					me._logger.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
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
				
				var sound_id = _html.player + '-song-' + _data.curr_song,
					target = soundManager.getSoundById(sound_id),
					me = this;
				me._logger.info('repeat()');
				me.resetProgressBar();
				target.setPosition(0);
				target.play();
			},
				
			// Plays a song based on the ID
			play : function(caller, track){
				
				var me = this,
					sound_id = me._html.player + '-song-' + track,
					target = soundManager.getSoundById(sound_id);
				
				me._logger.info('Playing track: ' + sound_id + '. Oh and ' + caller + ' called me!');

				if (target.paused === true) { // if current track is paused, unpause
					me._logger.info('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						me._logger.info('Pausing current track');
						target.pause();
					}
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						me.internal.update();
						me._logger.info('Playing current track from beginning');
						target.play();
					}
				}
				me.showSongInfo();
			},
				
			// creates the API element
			setupApi : function() {
				/*
				EXPERIMENTAL STUFF FOR MULTIPLE INSTANCES FEATURE
				if (!window.swaggPlayerApiRefs) {
					window.swaggPlayerApiRefs = {};
				}
				window.swaggPlayerApiRefs[this._html.player] = new API(this);
				*/
				window.swaggPlayerApi = new API(this);
				this.internal.player = this;				
			},

			/*
			EXPERIMENTAL STUFF FOR MULTIPLE INSTANCES FEATURE

			window.fetchApiForPlayer = function(player) {
				var p = $('#' + player)
				if (p && window.swaggPlayerApiRefs[p.attr('id')]) {
					return window.swaggPlayerApiRefs[p.attr('id')];
				} else {
					return null;
				}
			},
			*/
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				
				var me = this,
					song = me. _data.songs[parseInt(soundobj.id.split('-')[3])],
					_html = me._html,
					id = 'item-' + song.id,
					listItem = $('<li></li>');

				me._logger.info('createElement()');

				listItem.attr('id',id);
				listItem.addClass('swagg-player-playlist-item');
				listItem.html(song.title + ' - ' + song.artist);
				listItem.css('cursor','pointer');
							
				listItem.data('song', song);
				listItem.bind({
					click: function(){
						me.stopMusic(me._data.curr_song);
						var track = parseInt($(this).data('song').id),
							afterEffect = function() {
								me.showSongInfo();
								me.play('switchArt() - by way of createElement',track);
							}			
						me._data.curr_song = track;
						if (me._html.useArt === true) {
							me.switchArt(track, afterEffect);
						}
						else {
							me.showSongInfo();
							me.play('switchArt() - by way of createElement',track);	
						}
						return false;
					}
				});
				me._html.playlist.append(listItem);
			},

			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				
				var me = this,
					imagesLoaded = me._imageLoader.imagesLoaded,
					out, 
					over,
					play = me._controls.play,
					hover = (me._config.props.buttonHover === undefined) ? false : me._config.props.buttonHover;
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						play.html('play ');
					}
					else {
						out = me._imageLoader.play.src;
						if (hover === true) {
							over = me._imageLoader.playOver.src;
						}
					}
				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						play.html('pause ');
					}
					else {
						out = me._imageLoader.pause.src;
						if (hover === true) {
							over = me._imageLoader.pauseOver.src;
						}
					}
				}
				else { // invalid state
					me._logger.error('Invalid button state! : ' + state);	
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
				
				var me = this,
					inst = me._data,
					_html = me._html,
					t = inst.curr_song;

				me._logger.info('skip()');	
				
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
					me._logger.error('Invalid skip direction flag: ' + direction);
					return false;	
				}
				me.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (me._html.useArt === true) {
					if (me._config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(me._config.props.onBeforeSkip)) {
						me._config.props.onBeforeSkip.apply(this,[]);
					}
					me.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
						me.showSongInfo();
						me.play('skip',t);
				} // end else	
			},
			
			jumpTo : function(t) {
				var inst = Data,
					me = this;
				me.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (me._html.useArt === true) {
					if (me._config.props.onBeforeSkip !== 'undfined' && jQuery.isFunction(me._config.props.onBeforeSkip)) {
						me._config.props.onBeforeSkip.apply(this,[]);
					}
					me.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
						me.showSongInfo();
						me.play('skip',t);
				} // end else	
			},
				
			wipeArtCss : function() {
				var me = this,
					art = me._html.art;
				art.removeClass(me._data.curr_sprite_class);
				art.css('height','');
				art.css('width','');
				art.css('background-image','');
				art.css('background','');	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				var me = this;
				me._html.bar.css('width', 0);
				me._html.loaded.css('width', 0);
			},
			
			// resets the track time
			resetTrackTime : function() {
				this._logger.info('Resetting track time');
				this.internal.fillTime(0,0,0,0);
			},
				
			// Stops the specified song
			stopMusic : function(track) {
				
				var me = this;
				me._logger.info('stopMusic()');
				soundManager.stopAll();
				me.resetProgressBar();
				me.resetTrackTime();
			},
				
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var me = this,
					sound_id = me._html.player + '-song-' + track,
					sound = soundManager.getSoundById(sound_id),
				 	curr_vol = sound.volume;

				if (flag === 1) {
					me._logger.info('Vol up');
					soundManager.setVolume(sound_id, curr_vol + me._data.vol_interval);
				}
				else if (flag === 0) {
					me._logger.info('Vol down');
					soundManager.setVolume(sound_id, curr_vol - me._data.vol_interval);
				}
				else {
					me._logger.info('Invalid volume flag!');	
				}
			},
			
			setAlbumArtStyling : function(track){
				var me = this;
					art = me._html.art,
					_data_ = me._data,
					song = _data_.songs[track],
					songs = _data_.songs,
					config = me._config,
					html = me._html;
					
				me.wipeArtCss();
				if (song.spriteClass !== undefined) {
					art.addClass(song.spriteClass);
					_data_.curr_sprite_class =  song.spriteClass;
				}
				else {				
					art.css('background', ' transparent url(' + songs[track].image.src + ')');
					if (config.props.morphArt === true) {
						if (song.thumbHeight !== undefined) {
							me._html.user_art_css.height = song.thumbHeight.toString() + 'px';
						}
						else {
							var height = (config.props.defaultAlbumArtHeight !== undefined) ? config.props.defaultAlbumArtHeight : '100';
							me._html.user_art_css.height = height.toString() + 'px';	
						}
						
						if (song.thumbWidth !== undefined) {
							me._html.user_art_css.width = song.thumbWidth.toString() + 'px';
						}
						else {
							var width = (config.props.defaultAlbumArtWidth !== undefined) ? config.props.defaultAlbumArtWidth : '100';						
							me._html.user_art_css.width = width.toString() + 'px';	
						}
						art.css(me._html.user_art_css);
					}
				}				
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track) {
				
				var me = this,
					sound_id = me._html.player + '-song-' + track,
					art = me._html.art,
					config = me._config,
					data = me._data,
					songs = data.songs,
					song = songs[track];

				me._logger.info('Will show  for song at index: ' + track);
				
				if ($.ui) {
					art.hide('slide', 200, function() {
						me.wipeArtCss();
						me.setAlbumArtStyling(track);
						$(this).show('slide', function(){
							me.showSongInfo();
							me.play('skip',track);
							if (config.props.onAfterSkip !== undefined && $.isFunction(config.props.onAfterSkip)){
								config.props.onAfterSkip.apply(this,[]);
							}
						});
					});	
				} else {
					art.fadeOut('fast', function() {
						me.wipeArtCss();
						me.setAlbumArtStyling(track);
						$(this).fadeIn('fast', function(){
							me.showSongInfo();
							me.play('skip',track);
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
				this._html.loaded.css('width', this._html.metadata.progressWrapperWidth);
			},
				
			loaded : function(soundobj) {
				if (soundobj.loaded === true && soundobj.readyState === 3 && soundobj.bytesLoaded === soundobj.bytesTotal) return true;
				else return false;
			},
				
			whileLoading : function(soundobj) {
				// get current position of currently playing song
				var me = this,
					pos = soundobj.position,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
					duration = soundobj.duration;
				
					// width of progress bar
				var	wrapper_width = me._html.metadata.progressWrapperWidth,
					loaded = wrapper_width * loaded_ratio;

				me._html.loaded.css('width', loaded);				
			},
			
			// updates the UI progress bar
			progress : function(soundobj) {
				// get current position of currently playing song
				var me = this,
					pos = soundobj.position; 
					duration = 0,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					duration = soundobj.durationEstimate;
					me.millsToTime(duration, 0);
				}
				else {
					duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration,
					// width of progress bar
					wrapper_width = me._html.metadata.progressWrapperWidth,
					//loaded = wrapper_width * loaded_ratio,
					// set width of inner progress bar equal to the width equivelant of the
					// current position
					t = wrapper_width*pos_ratio;
				me._html.bar.css('width', t);
			},
			
			// calculates the total duration of a sound in terms of minutes
			// and seconds based on the total duration in milliseconds.
			// flag 0 - says we're calculating the total duration of the song
			// flag 1 - says we're calculating the current potition of the song
			// flag -1 = says we're calculating the arbitrary position of a song (seek preview)
			millsToTime : function(duration, flag) {
					var seconds = Math.floor(duration / 1000),
						me = this,
						minutes = 0;
					if (seconds > 60) {
						minutes = Math.floor(seconds / 60);
						seconds = Math.round(seconds % 60);		
					}
					
					
					// total duration
					if (flag === 0) { 
						me.internal.fillTotalTime(minutes,seconds);
					}
					// current position
					else if (flag === 1) { 
						me.internal.fillCurrentTime(minutes,seconds);
					}
					else if(flag === -1){
						me.internal.fillPreview(minutes,seconds);
					}
					else {
						_logger.error('Invalid flag passed to millsToTime()');	
					}
			},
			
			// displays 1st and song title
			showSongInfo : function() {
				var me = this,
					loc_inst = me._data,
					song_ = loc_inst.songs[loc_inst.curr_song];

				me._html.artist.html(song_.artist);
				me._html.title.html(song_.title);
				//me._html.song_info.html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			},
	

		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// --------------------------------------------------- api stuff
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		// ----------------------------------------------------------------------------------------------------------------------------------------------------
		
			internal : {
				player : null,
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
					var _data_ = this.player._data,
						t = _data_.curr_song;
					this.currTitle = _data_.songs[t].title;
					this.currArtist = _data_.songs[t].artist;
					this.currAlbum = _data_.songs[t].album;	
					this.currTempo = _data_.songs[t].tempo;
					this.player._logger.info('Current song: [' + this.currArtist + '] [' + this.currTitle + '] [' + this.currTempo + ']'  );	
				},	
				
				fillTime : function(tMins, tSecs, cMins, cSecs) {
					this.totalMinutes = tMins;
					this.totalSeconds = tSecs;
					this.currMinutes = cMins;
					this.currSeconds = cSecs;
				},
							
				fillTotalTime : function(tMins, tSecs) {
					this.totalMinutes = tMins;
					this.totalSeconds = tSecs; 	
				},
							
				fillCurrentTime : function(cMins, tSecs) {
					this.currMinutes = cMins;
					this.currSeconds = tSecs;
				},
				fillPreview : function(pMins,pSecs) {
					this.minutes = pMins;
					this.seconds = pSecs;	
				},
				
				setEventRef : function(e) {
					this.event_ref = e;
				}						
			}
		});

		// external API devs can use to extend Swagg Player. Exposes song data, events etc
		var API = function(controller) {
			var self = this;
			self.currSong = {
				/*
					Deals with functions available for the current song
				*/
				getCurrTimeAsString : function() {
					var i = controller.internal,
						currMin = (i.currMinutes > 9) ? i.currMinutes : '0' + 
							i.currMinutes.toString(),
						currSec = (i.currSeconds > 9) ? i.currSeconds : '0' + 
							i.currSeconds.toString();	
					return currMin + ':' + currSec;					
				},
				getTotalTimeAsString : function() {
					var i = controller.internal,
						totalMin = (i.totalMinutes > 9) ? i.totalMinutes : '0' + 
							i.totalMinutes.toString(),
						totalSec = (i.totalSeconds > 9) ? i.totalSeconds : '0' + 
							i.totalSeconds.toString();	
					return totalMin + ':' + totalSec;	
				},	
				getEventRef : function(){
					return controller.internal.event_ref;
				},
				
				previewAsString : function() {
					var i = controller.internal;
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
					return (controller.internal.currTitle !== null) ? controller.internal.currTitle : 'Unknown Title';	
				},
				artist : function() {
					return (controller.internal.currArtist !== null) ? controller.internal.currArtist : 'Unknown Artist';	
				},
				album : function() {
					return (controller.internal.currAlbum !== null) ? controller.internal.currAlbum : 'Unknown Album';	
				},
				tempo : function(){
					return (controller.internal.currTempo !== null) ? controller.internal.currTempo : 'Unknown Tempo'; 	
				}
			}; // end current song funcs
			
			
			/*
				Deals with play back functionality of the player in general
			*/
			self.playback = {
				setRepeat : function(flag) {
					controller.internal.repeatMode = (flag === true || flag === false) ? flag : false;
					return self;
				},
				
				inRepeat : function() {
					var r = internal.repeat;
					return (r === true || r === false) ? r : false;
				},
				
				volUp : function() {
					controller.volume(controller._data.curr_song, 1);
					return self;
				},
				
				volDown : function(){
					controller.volume(controller._data.curr_song, 0);
					return self;
				},

				playTrack : function(track) {
					var actualTrack = track - 1;
					if (actualTrack <= (_data_.last_song) && actualTrack >= 0) {
						controller.jumpTo(track - 1);
					} else {
						_logger.apierror("Invalid track number '" + track + "'");
					}
					return self;
				},
				
				stop : function() {
					controller.stopMusic(null);
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
		var Init = {
			initializeSoundManager : function() {
				//_logger.info('Initializing SoundManager2');
				if (!soundManager) {
					window.soundManager = new SoundManager();
					soundManager.url = 'swf';
					soundManager.wmode = 'transparent'
					soundManager.useFastPolling = true;
					soundManager.useHTML5Audio = true;
					if (Browser.isSafari()) {
						soundManager.useHighPerformance = false;
					}
					else {
						soundManager.useHighPerformance = true;	
					}
					soundManager.flashLoadTimeout = 1000;
		    		soundManager.beginDelayedInit();
	    		}
			}
		}
})(jQuery);