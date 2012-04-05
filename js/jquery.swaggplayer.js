/*
	Swagg Player: Music Player for the web
	--------------------------------------------
	http://swaggplayer.no.de
	http://johnnyray.me

	Copyright (c) 2010, Johnny Austin. All rights reserved.
	Code provided under the MIT License:
	http://www.opensource.org/licenses/mit-license.php

	v0.8.8.0
   
	Change Log
	- refactoring
*/
(function ($) {
	"use strict";
	/*global soundManager: false, setInterval: false, console: false, $: false */

		Function.prototype.method = function(name, func) {
			if (!this[name]) {
				this.prototype[name] = func;
			}
			return this;
		};

		Function.prototype.methods = function(obj) {
			for (var prop in obj) {
				this.method(prop,obj[prop]);
			}	
		};	

		//	BEGIN BROWSER DETECT
		var Browser = {
			isIe : function(){
				return (navigator.userAgent.indexOf('MSIE') > -1) ? true : false;
			},
			isSafari : function(){
				return (navigator.userAgent.indexOf('AppleWebKit') > -1 && navigator.userAgent.indexOf('Chrome') === -1);
			}
		}; // END BROWSER DETECT

		var Init = {
			initializeSoundManager : function() {
				if (!soundManager) {
					soundManager = new SoundManager();
					var sm = soundManager;
					sm.url = 'swf';
					sm.wmode = 'transparent';
					sm.useFastPolling = true;
					sm.useHTML5Audio = true;
					if (Browser.isSafari()) {
						soundManager.useHighPerformance = false;
					}
					else {
						sm.useHighPerformance = true;	
					}
					sm.flashLoadTimeout = 1000;
	    		}
			},

			ieStuff : function() {
				if (!Array.prototype.indexOf) {  
				    Array.prototype.indexOf = function (searchElement, fromIndex ) {  
				        "use strict";  
				        if (this === null) {  
				            throw new TypeError();  
				        }  
				        var t = Object(this);  
				        var len = t.length >>> 0;  
				        if (len === 0) {  
				            return -1;  
				        }  
				        var n = 0;  
				        if (arguments.length > 0) {  
				            n = Number(arguments[1]);  
				            if (n === NaN) {
				                n = 0;  
				            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {  
				                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
				            }  
				        }  
				        if (n >= len) {  
				            return -1;  
				        }  
				        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
				        for (; k < len; k++) {  
				            if (k in t && t[k] === searchElement) {  
				                return k;  
				            }  
				        }  
				        return -1;  
					};
				}
			}
		};

		$.fn.SwaggPlayer = function (options_) {
			var id = {};
			id['id'] = this.attr('id');

			if (id['id']) {
				if (!Browser.isIe()) {
					if (console.time) {
						console.time('SwaggPlayerStart');
					}
				}

				Init.initializeSoundManager();
				Init.ieStuff();
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
			============================================================ configuration	
			Encapsulation for passed in configuration
		*/	
		var Config = function(p) {
			this.PLAYER = p;
			this.props = {};
			this.callbacks = {};
			this.consoleSupport = false;
			if (console) {
				this.consoleSupport = true;
			}
		};
		
		/*
			============================================================ logging utility
			For logging, of course. Using this centralized location for logging to check for 
			support because IE is funny acting with the console object
		*/
		var Logger = function(p, _id) {
			this.PLAYER = p;
			this.log = p._config.consoleSupport;
			this.logging = p._config.props.logging || [];
			this.levelall = this.logging.indexOf('all') > -1;
			this.levelinfo = this.levelall === true ? true : this.logging.indexOf('info') > -1;
			this.levelerror = this.levelall === true ? true : this.logging.indexOf('error') > -1;
			this.levelapierror = this.levelall === true ? true : this.logging.indexOf('apierror') > -1;
			this.levelwarn = this.levelall === true ? true : this.logging.indexOf('warn') > -1;
			this.leveldebug = this.levelall === true ? true : this.logging.indexOf('debug') > -1;
			this.id = _id;
		};
		
		Logger.methods({
			error : function(errMsg){
				if (this.levelerror && this.log) {
					console.error('Swagg Player::' + this.id + '::Error::' + errMsg);	
				}
			},
			info : function(info){
				if (this.levelinfo && this.log) {
					console.log('Swagg Player::' + this.id + '::Info::' + info);
				}
			},
			warn : function(warning) {
				if (this.levelwarn && this.log) {
					console.warn('Swagg Player::' + this.id + '::Warning::' + warning);
				}
			},
			debug : function(warning) {
				if (this.leveldebug && this.log) {
					console.warn('Swagg Player::' + this.id + '::Debug::' + warning);
				}
			},
			apierror : function(errMsg) {
				if (this.levelapierror && thims.log) {
					console.error('Swagg Player::' + this.id + '::API Error::' + errMsg);	
				}
			}
		});

		var Utils = function(){};

		Utils.method('timeString', function(str) {
			var tmp = parseInt(str,10),
				t = tmp > 9 ? str : '0' + str;
			return t !== '60' ? t : '00';
		});

		/*
			Creates soundManager sound objects
		*/
		var SoundFactory = function(p) {
			this.player = p;
			p._logger.debug('SoundFactory Initiated');
		};

		SoundFactory.methods({
			createSound : function(songObj) {
				var	self = this,
					html = self.player._html,
					config = self.player._config,
					songs = self.player._data.songs,
					id = songObj.id;

				if (html.useArt === true && songObj.thumb !== undefined) {
					songObj.configureArt();
					songObj.image = new Image();
					songObj.image.src = songObj.thumb;
				}

				if (!songs[songObj.id]) {
					self.player._data.songs.push(songObj);
				}

				var myid = self.player._html.player + '-song-' + id.toString();
				var sm = soundManager;

				sm.callback = function(params) {
					$.when(params.scope.player[params.first](params.sound)).done(
						function(args) {
							params.scope.player.executeIfExists(params.next, params.sound, args);
						}
					);
				}; 

				var newSound = sm.createSound({
					id: myid,
					url: songObj.url,
					autoLoad: config.props.eagerLoad || false,
					usePolicyFile: false,
					onplay: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onplay',
							sound : this,
							next : 'onPlay'
						});
					},
					onpause: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onpause',
							sound : this,
							next : 'onPause'
						});
					},
					onstop: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onstop',
							sound : this,
							next : 'onStop'
						});
					},
					onfinish: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onfinish',
							sound : this,
							next : 'onFinish'
						});
					},
					onresume: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onresume',
							sound : this,
							next : 'onResume'
						});
					},
					whileplaying: function() {
						var sound = this;
						sm.callback({
							scope : self,
							first : '_whileplaying',
							sound : this,
							next : 'whilePlaying'
						});
					},
					whileloading: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_whileloading',
							sound : this,
							next : 'whileLoading'
						});
					},
					onerror: function(){
						var sound = this;
						sm.callback({
							scope : self,
							first : '_onerror',
							sound : this,
							next : 'onError'
						});
					}
				});		
				newSound.id = myid;
				newSound.repeat = self.player.internal.repeat;
				self.player._data.last_song = songObj.id;
	
				if (html.playList !== undefined && html.playList === true) {
					self.player.appendToPlaylist(newSound);
				}
				return newSound;
			}
		});

		/* Model for songs */
		var Song = function(obj, id) {
			var prop;
			for (prop in obj) {
				this[prop] = obj[prop];
			}
			this.id = id;							
		};

		Song.method('configureArt', function(thumb) {
			this.image = new Image();
			this.image.src = thumb || this.thumb;
		});
	
		/*
			=============================================== swagg player data
			handles the fetching and processing of songs
		*/
		var Data = function(p) {
			p._logger.debug('Data intializing');
			this.PLAYER = p;
			this.last_song = -1;
			this.songs = [];
			this.curr_sprite_class = '';
			this.isIe = Browser.isIe();
			this.curr_song = -1;
			this.vol_interval = 20;
			this.interval_id = -1;
		};

		Data.methods({
			processSongs : function(theData){
				var player = this.PLAYER,
					_songs = new Array(),
					size = theData.length,
					_html = player._html,
					_config_ = player._config;
						

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
				var self = this,
					config = this.PLAYER._config,
					theData = config.props.data;
					
				
				// Check if dataString points to a json file if so, fetch it.
				// if not, assume string is a literal JSON object
				if (typeof theData === 'string') {
					$.ajax({
						type: "GET",
						url: theData,
						dataType: 'json',
						success: function(data){
							self.processSongs(data);
							return null;
						},
						error: function(xhr, ajaxOptions, thrownError){
							var msg = 'There was a problem fetching your songs from the server: ' + thrownError;
							self.PLAYER._logger.error(msg);
							return msg;
						}
					});
					return null;	
				} // end if
				else {
					this.processSongs(theData);
					return null;
				}
			}
		});	
		
		/*
			============================================================ UI elements (divs)
			Manages HTML elements associated with Swagg Player
		*/

		var Html = function(p) {
			this.PLAYER = p;
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
			this.metadata = 
			{
				progressWrapperWidth : 0
			};
		};

		Html.methods({
			initHtml : function(config) {
				this.PLAYER._logger.debug('Html initializing');
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
				this.PLAYER._logger.debug('setting up progress bar');
				if (this.progress_wrapper.length > 0) {
					var wrapper = $('#' + this.player + ' div.swagg-player-progress-wrapper'),
						height = wrapper.css('height'),
						progress = $('<div></div>'),
						loaded = $('<div></div>');

					loaded.addClass("swagg-player-loaded").css('height', height).css('width',0).css('float','left').css('margin-left','0');
					wrapper.append(loaded);
					this.loaded = $('#' + this.player + ' div.swagg-player-loaded');
					
					progress.addClass('swagg-player-bar').css('height', height).css('width',0).css('float','left').css('margin-left','auto');
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
		};

		Controls.methods({
			setup : function(img) {
				var p = this.PLAYER,
					imageLoader = p._imageLoader;

				p._logger.debug('setting up controls');

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
		};

		Events.methods({
			bindControllerEvents : function() {		
				var p = this.PLAYER,
					controls = p._controls,
					imageLoader = p._imageLoader,
					images = imageLoader.imagesLoaded,
					usehover = p._config.props.buttonHover || false,
					ops = ['play', 'back', 'stop', 'skip'],
					i, func, _do;

				p._logger.debug('Binding controller button events');

				for (i = 0; i < ops.length; i++) {
					func = ops[i];
					if (func === 'play') {
						_do = function() {
							p.play(p._data.curr_song);
							return false;
						};
					} else if (func === 'skip') {
						_do = function() {
							p.skip(1);
							return false;
						};
					} else if (func === 'stop') {
						_do = function() {
							p.stopMusic(p._data.curr_song);
							return false;	
						};
					} else if (func === 'back') {
						_do = function() {
							p.skip(0);
							return false;
						};
					}

					this.bindEvents(
						{
							func : func,
							controls : controls,
							images : images,
							usehover : usehover,
							imageLoader : imageLoader
						}, 
						_do);	
				} // end for				
			},

			bindEvents : function(data, task) {
				var func = data.func,
					controls = data.controls,
					images = data.images,
					imageLoader = data.imageLoader,
					usehover = data.usehover;

				controls[func].bind({
					click : task,
					mouseover : function() {
						if (images === true && usehover) {
							var but = func + 'Over';
							$(this).attr('src', imageLoader[but].src);
						}
					},
					mouseout : function() {
						if (images === true && usehover) {
							$(this).attr('src', imageLoader[func].src);
						}
					}
				});
			},

			bindMediaKeyEvents : function() {
				
				var p = this.PLAYER,
					curr_song = p._data.curr_song;

				p._logger.debug('Binding media key events');		
				$(document).keydown(function(e) {
	
					if (!e) { e = window.event; }
				
						switch(e.which) {
						  case 179:
							p.play(curr_song);
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

						default:
							return false;
					}
				});				
			},

			setupSeek : function() {
				// seek to a position in the song
				var p = this.PLAYER,
					html = p._html;

				p._logger.debug('setting up seek events');

				html.loaded.css('cursor', 'pointer').bind({
					click : function(e) {
						var id = html.player + '-song-' + p._data.curr_song,
							progressWrapperWidth = html.metadata.progressWrapperWidth,
							soundobj = soundManager.getSoundById(id),
							x = e.pageX - html.loaded.offset().left,
							loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
							duration = 	p.getDuration(soundobj),
							// obtain the position clicked by the user
							newPosPercent = x / progressWrapperWidth,
							loaded = progressWrapperWidth * loaded_ratio,
							// find the position within the song to which the location clicked corresponds
							seekTo = Math.round(newPosPercent * duration);

						if (seekTo < soundobj.bytesLoaded) {
							soundobj.setPosition(seekTo);
							p.progress(soundobj);
						}
					}
				});
				
				// seek preview data
				html.loaded.bind( 'mouseover hover mousemove', 
					function(e){
						var id = html.player + '-song-' + p._data.curr_song,
							config_= p._config,
							soundobj = soundManager.getSoundById(id),
							x = e.pageX - html.loaded.offset().left,
							me = this,
							duration = p.getDuration(soundobj),
							// obtain the position clicked by the user
							newPosPercent = x / html.metadata.progressWrapperWidth,
							// find the position within the song to which the location clicked corresponds
							seekTo = Math.round(newPosPercent * duration),
							time = p.millsToTime(seekTo, 1);
						
						// fire off onSeekPreview event
						p.executeIfExists('onSeekPreview', this, [e, time]);				
					}
				);	

				html.loaded.bind('mouseout',
					function(e) {
						p.executeIfExists('onSeekHide', this, [e]);
					}
				);
			}
		});

		/*
			============================================================= images for button controls
			Loades images for buttons
		*/
		var ImageLoader = function(p) {
			this.PLAYER = p;
			this.play = null;
			this.playOver = null;
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
		};

		ImageLoader.methods({
			setup : function() {
				this.PLAYER._logger.debug('setting up image loader');
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
					hover = player._config.props.buttonHover || false,
					controls = player._controls;

				player._logger.debug('Loading images for controls');

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
				this.PLAYER._logger.info('Images Loaded.');
			}
		});

		var Controller = function(){
			this._logger = null;
			this._data = null;
			this._html = null;
			this._config = null;
			this._events = null;
			this._controls = null;
			this._imageLoader = null;
			this._swaggPlayerApi = null;
		};

		Controller.methods({
			init : function(config) {
				var me = this;

				me.initComponents(config);

				if (!soundManager.createSongs) {
					soundManager.createSongs = function(callback) {
						me._logger.info('createSongs()');
						var data = me._data,
							songs = data.songs;
						if(data.songs[0] !== undefined) {
							var	config = me._config,
								html = me._html,
								factory = new SoundFactory(me),
								s, tmp;
	
							for (var i = 0, end = songs.length; i < end; i++) {
								s = songs[i];
								tmp = factory.createSound(s);
							}
							callback.apply(this, [me]); 
						} else {
							me._logger.error('No Songs!!');
						}
					};
				}
				
				// init soundManager
				soundManager.onload =  function() {
					soundManager.createSongs(function(controller) {
						var html = controller._html,
							data = controller._data,
							song = data.songs[0],
							config = controller._config;

						html.loading_indication.remove();
						data.curr_song = 0;

						if (html.useArt === true) {
							controller._logger.info('Intializing album art...');
							// initialize first song album 
							controller.setAlbumArtStyling(0);
						}
						
						controller._events.setupSeek();

						if(config.props.autoPlay !== undefined && config.props.autoPlay === true) {
							setTimeout(function(){
									controller.play(data.curr_song);
								},1000);
						}

						me.executeIfExists('onSetupComplete', this, [me._swaggPlayerApi, song]);

						if (!Browser.isIe()) {
							if (console.timeEnd) {
								console.timeEnd('SwaggPlayerStart');
							}
						}

						controller._logger.info("Swagg Player ready!");
					});
				}; // end soundManager onload function	
					
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  me._logger.error('An error has occured with loading Sound Manager! Rebooting.');
				  soundManager.flashLoadTimeout = 0;
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
						var msg = 'Something went wrong with loading Sound Manager. No tunes for you!';
						_logger.error('Something went wrong with loading Sound Manager. No tunes for you!');
						// call user defined onError function
						this.executeIfExists('onErrorComplete', onError, [msg]);
					}
				  },1500);
				};
			}, // end Controller.init

			initComponents : function(config) {
				var self = this;
				// initialize configuration
				this._config = new Config(this);

				this._config.props = $.extend(this._config.props,config);

				// setup logging
				this._logger = new Logger(this, config.id);

				this._logger.info('initializing swagg player components');

				// initialize data (songs)
				this._data = new Data(this);

				// setup html elements
				this._html = new Html(this);
				this._html.initHtml(config);

				$.when(this._data.getSongs()).done(function(err){
					
					if (err) {
						this.executeIfExists('onError', this, []);
					} else {
						// init onSeek events
						self._html.setupProgressBar();
						
						// create invisible element which will hold user accessible data
						self.setupApi();

						// controls, images
						self._controls = new Controls(self);
						self._imageLoader = new ImageLoader(self);
						self._imageLoader.setup();
					

						if (config.buttonsDir !== undefined) {
							self._controls.setup(self._html.controls_div);
						}
						else {
							config.buttonHover = false;	
						}
						if (config.spriteImg !== undefined) {
							self._imageLoader.art = new Image();
							self._ImageLoader.art.src = config.spriteImg;
						}

						// setup controller events
						self._events = new Events(self);
						self._events.bindControllerEvents();
						self._events.bindMediaKeyEvents();

						// check for soundManager support and warn or inform accordingly
						if (!soundManager.supported()) {
							self._logger.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
						}
						else {
							self._logger.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
						}
					} // end else
				});
			},

			_whileplaying : function(sound) {
				this.progress(sound);
				var duration = sound.loaded === true ? sound.duration : sound.durationEstimate,
					curr = this.millsToTime(sound.position),
					total = this.millsToTime(duration),
					args = {
						currTime : curr,
						totalTime : total
					};
				return [args];
			},

			_onplay : function(sound) {
				var data = this._data,
					song = data.songs[data.curr_song],
					arg = {},
					prop;

				for (prop in song) {
					if (prop != 'id' && $.isFunction(song[prop]) === false) {
						arg[prop] = song[prop];
					}
				}
				this.playPauseButtonState(0);

				// if the song has already fully loaded the whileloading callback won't fire
				// so we need to just go ahead and fill the bar
				if (this.loaded(sound) === true) {
					this.fillLoaded();
				}
				return [arg];	
			},

			_onpause : function(sound) {
				this.playPauseButtonState(1); 
				return [];
			},

			_onstop : function(sound) {
				this.playPauseButtonState(1); 
				return [];
			},

			_onfinish : function(sound) {
				if (this.internal.repeatMode === false){
					var id = parseInt(sound.id.split('-')[3],10),
						ret = null,
						last = this._data.songs.length - 1;
					if (id < last) {
						this.skip(1);
					} else {
						this.stopMusic(id);
						ret = [];
					}
				}
				else {
					this.repeat();	
				}	
				return ret;
			},

			_onresume : function(sound) {
				this.playPauseButtonState(0); 
				return [];
			},

			_whileloading : function(sound) {
				var percent = this.whileLoading(sound).toFixed(2) * 100;
				return [Math.round(percent)];
			},

			_onerror : function(sound) {
				var msg = 'An error occured while attempting to play this song. Sorry about that.';
				this._logger.error(msg);
				return [msg];
			},

			executeIfExists : function(func, scope, args) {
				var config = this._config;
				if (config.props[func] && $.isFunction(config.props[func])) {
					config.props[func].apply(scope, args);
				}
			},
		
			// get the duration of a song in milliseconds
			getDuration : function(soundobj) {
				var duration;
				if (!soundobj.loaded === true) {
					duration = soundobj.durationEstimate;
				} else {
					duration = soundobj.duration;
				}
				return duration;
			},
			
			// repeats the currently playing track
			repeat : function(track) {
				var sound_id = _html.player + '-song-' + _data.curr_song,
					target = soundManager.getSoundById(sound_id);

				this._logger.info('repeat()');
				this.resetProgressBar();
				target.setPosition(0);
				target.play();
			},
				
			// Plays a song based on the ID
			play : function(track){
				var	sound_id = this._html.player + '-song-' + track,
					fromBeginning,
					target = soundManager.getSoundById(sound_id);
				
				this._logger.debug('Playing track: ' + sound_id);

				if (target.paused === true) { // if current track is paused, unpause
					this._logger.debug('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						this._logger.info('Pausing current track');
						target.pause();
					}
					else { // track is not playing (it's in a stopped or uninitialized stated, play it
						fromBeginning = true;
						this._logger.info('Playing current track from beginning');
						target.play();
					}
				}
				return fromBeginning;
			},
				
			// creates the API element
			setupApi : function() {
				this._logger.debug('setting up api');
				this._swaggPlayerApi = new API(this);
				this.internal.player = this;				
			},
			
			// Dynamically creates playlist items as songs are loaded
			appendToPlaylist : function(soundobj){
				var self = this,
					tmp = soundobj.id.split('-')[3],
					song = this._data.songs[parseInt(tmp,10)],
					html = this._html,
					id = 'item-' + song.id,
					listItem = $('<li></li>');

				this._logger.debug('appending to playlist: ' + song.title);

				listItem.attr('id',id);
				listItem.addClass('swagg-player-playlist-item');
				listItem.html(song.title + ' - ' + song.artist);
				listItem.css('cursor','pointer');
							
				listItem.data('song', song);
				var l = this._config.props.playListListeners || {};
				var listeners = $.extend({}, l, {
									click: function(){
										self.stopMusic(self._data.curr_song);
										var track = parseInt($(this).data('song').id,10),
											afterEffect = function() {
												self.play(track);
											};			
										self._data.curr_song = track;
										if (html.useArt === true) {
											self.switchArt(track, afterEffect);
										}
										else {
											self.play(track);	
										}
										return false;
									}
								});
				listItem.bind(listeners);
				html.playlist.append(listItem);
			},

			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				var imagesLoaded = this._imageLoader.imagesLoaded,
					out, 
					over,
					play = this._controls.play,
					hover = this._config.props.buttonHover || false;
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						play.html('play ');
					}
					else {
						out = this._imageLoader.play.src;
						if (hover === true) {
							over = this._imageLoader.playOver.src;
						}
					}
				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						play.html('pause ');
					}
					else {
						out = this._imageLoader.pause.src;
						if (hover === true) {
							over = this._imageLoader.pauseOver.src;
						}
					}
				}
				else { // invalid state
					this._logger.error('Invalid button state! : ' + state);		
				}
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
				var data = this._data,
					html = this._html,
					t = data.curr_song;

				this._logger.info('skip()');	
				
				if (direction === 1) { // skip forward
					if (t < data.songs.length){
						if (t == data.songs.length - 1) {
							t = 0;
						} else {
							t = t+1;
						}
					}
				}
				else if (direction === 0) { // skip back
					if (t === 0){
						t = data.songs.length - 1;	
					}
					else{
						t = t - 1;	
					}
				}
				else { // invalid flag
					this._logger.error('Invalid skip direction flag: ' + direction);
				}
				this.stopMusic(t);
				data.curr_song = t;
				// if using album , use  transition
				if (this._html.useArt === true) {
					this.executeIfExists('onBeforeSkip', this, []);
					this.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
					this.play(t);
				} // end else	
			},
			
			jumpTo : function(t) {
				this._logger.debug('jumping to track ' + t);

				this.stopMusic(t);
				this._data.curr_song = t;

				// if using album , use  transition
				if (this._html.useArt === true) {
					this.executeIfExists('onBeforeSkip', this, []);
					this.switchArt(t);
				} // end if
				// if not using album , just go to the next song
				else {
					this.play(t);
				} // end else	
			},
				
			wipeArtCss : function() {
				var art = this._html.art;
				art.removeClass(this._data.curr_sprite_class);
				art.css('height','');
				art.css('width','');
				art.css('background-image','');
				art.css('background','');	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				this._html.bar.css('width', 0);
				this._html.loaded.css('width', 0);
			},
		
				
			// Stops the specified song
			stopMusic : function(track) {
				this._logger.debug('stopping music');
				this.playPauseButtonState(1);
				this.resetProgressBar();
				soundManager.stopAll();
			},
				
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = this._html.player + '-song-' + track,
					sound = soundManager.getSoundById(sound_id),
				 	curr_vol = sound.volume;

				if (flag === 1) {
					this._logger.debug('increasing volume');
					soundManager.setVolume(sound_id, curr_vol + this._data.vol_interval);
				}
				else if (flag === 0) {
					this._logger.debug('decreasing volume');
					soundManager.setVolume(sound_id, curr_vol - this._data.vol_interval);
				}
				else {
					this._logger.error('Invalid volume flag!');	
				}
			},
			
			setAlbumArtStyling : function(track){
				var art = this._html.art,
					data = this._data,
					song = data.songs[track],
					songs = data.songs,
					config = this._config,
					html = this._html;
					
				this.wipeArtCss();

				if (song.spriteClass !== undefined) {
					art.addClass(song.spriteClass);
					data.curr_sprite_class =  song.spriteClass;
				}
				else {				
					art.css('background', ' transparent url(' + songs[track].image.src + ')');
				}				
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track) {
				var self = this,
					sound_id = this._html.player + '-song-' + track,
					art = this._html.art,
					config = this._config,
					data = this._data,
					songs = data.songs,
					song = songs[track];

				self._logger.info('Will show  for song at index: ' + track);
				
				if ($.ui) {
					art.hide('slide', 200, function() {
						self.wipeArtCss();
						self.setAlbumArtStyling(track);
						$(this).show('slide', function(){
							self.play(track);
							self.executeIfExists('onAfterSkip', self, []);
						});
					});	
				} else {
					art.fadeOut('fast', function() {
						self.wipeArtCss();
						self.setAlbumArtStyling(track);
						$(this).fadeIn('fast', function(){
							self.play(track);
							self.executeIfExists('onAfterSkip', self, []);
						});
					});	
				}
			},
				
			fillLoaded : function() {
				this._html.loaded.css('width', this._html.metadata.progressWrapperWidth);
			},
				
			loaded : function(soundobj) {
				if (soundobj.loaded === true && soundobj.readyState === 3 && soundobj.bytesLoaded === soundobj.bytesTotal) {
					return true;
				} else { 
					return false;
				}
			},
				
			whileLoading : function(soundobj) {
				// get current position of currently playing song
				var pos = soundobj.position,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal,
					duration = soundobj.duration;
				
					// width of progress bar
				var	wrapper_width = this._html.metadata.progressWrapperWidth,
					loaded = wrapper_width * loaded_ratio;

				this._html.loaded.css('width', loaded);
				return loaded_ratio;				
			},
			
			// updates the UI progress bar
			progress : function(soundobj) {
				// get current position of currently playing song
				var pos = soundobj.position,
					duration = 0,
					loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					duration = soundobj.durationEstimate;
				}
				else {
					duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration,
					// width of progress bar
					wrapper_width = this._html.metadata.progressWrapperWidth,
					// set width of inner progress bar equal to the width equivelant of the
					// current position
					t = wrapper_width*pos_ratio;
				this._html.bar.css('width', t);
			},
			
			millsToTime : function(duration, flag) {
					var utils = new Utils(),
						seconds = Math.floor(duration / 1000),
						minutes = 0;

					if (seconds > 60) {
						minutes = Math.floor(seconds / 60);
						seconds = Math.round(seconds % 60);		
					}

					if (seconds === 60) {
						minutes += 1;
						seconds = 0;
					}
					
					return {mins: utils.timeString(minutes), secs : utils.timeString(seconds)};
			},
	
			/*
				============================================================ API Stuff
			*/		
			internal : {
				player : null,
				repeatMode:false					
			}
		});

		// external API devs can use to extend Swagg Player. Exposes song data, events etc
		var API = function(controller) {
			var self = this;		
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
				},
				
				addTracks : function(trackData) {
					var player = controller.PLAYER,
						factory = new SoundFactory(controller),
						t, songObj, s, i;
					
					if ($.isArray(trackData)) {
						for (i = 0; i < trackData.length; i++) {
							t = controller._data.last_song;
							songObj = new Song(trackData[i], t+1);
							s = factory.createSound(songObj);
						}
					} else {
						t = controller._data.last_song;
						songObj = new Song(trackData, t+1);
						s = factory.createSound(songObj);
					}
				}				
			}; // end playback funcs
		}; // end api
})(jQuery);