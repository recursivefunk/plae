/*
  Swagg Player: Music Player for the web
  --------------------------------------------
  http://johnnyray.me

  Copyright (c) 2010, Johnny Austin. All rights reserved.
  Code provided under the MIT License:
  http://www.opensource.org/licenses/mit-license.php

  v0.8.9.2

  Change Log
  - More steps away from jQuery
*/

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {

    Function.prototype.func = function(name, func) {
      if (!this[name]) {
        this.prototype[name] = func;
      }
      return this;
    };

    Function.prototype.funcs = function(obj) {
      for (var prop in obj) {
        this.func( prop, obj[ prop ] );
      }
    };

    //  BEGIN BROWSER DETECT
    var Browser = {
      isIe : function(){
        return (navigator.userAgent.indexOf('MSIE') > -1) ? true : false;
      },
      isSafari : function(){
        return (navigator.userAgent.indexOf('AppleWebKit') > -1 && navigator.userAgent.indexOf('Chrome') === -1);
      }
    }; // END BROWSER DETECT

    var Init = {
      ieStuff : function() {
        // snagged this function someplace I forgot where
        if ( !Array.prototype.indexOf ) {
          Array.prototype.indexOf = function (searchElement, fromIndex ) {
            if ( this === null ) {
              throw new TypeError();
            }
            var t = new Object( this );
            var len = t.length >>> 0;
            if ( len === 0 ) {
              return -1;
            }
            var n = 0;
            if ( arguments.length > 0 ) {
              n = Number( arguments[ 1 ] );
              if ( isNaN( n ) ) {
                n = 0;
              } else if ( n !== 0 && n !== Infinity && n !== -Infinity ) {
                n = ( n > 0 || -1 ) * Math.floor( Math.abs( n ) );
              }
            }
            if ( n >= len ) {
              return -1;
            }
            var k = n >= 0 ? n : Math.max( len - Math.abs( n ), 0 );
            for (; k < len; k++) {
              if ( k in t && t[ k ] === searchElement ) {
                return k;
              }
            }
            return -1;
          };
        }
      }
    };

    $.fn.SwaggPlayer = function (opts) {
      opts.id = {};
      opts.id = this.attr( "id" );

      if ( opts.id ) {
        if ( !Browser.isIe( )) {
          if ( console.time ) {
            console.time( "SwaggPlayerStart" );
          }
        }

        Init.ieStuff();

        var player = new Controller();

        player.init( opts );

      } else {
        $.error( "Swagg Player element missing id attribute!" );
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
      if ( console ) {
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
      this.levelall = this.logging.indexOf( 'all' ) > -1;
      this.levelinfo = this.levelall === true ? true : this.logging.indexOf('info') > -1;
      this.levelerror = this.levelall === true ? true : this.logging.indexOf('error') > -1;
      this.levelapierror = this.levelall === true ? true : this.logging.indexOf('apierror') > -1;
      this.levelwarn = this.levelall === true ? true : this.logging.indexOf('warn') > -1;
      this.leveldebug = this.levelall === true ? true : this.logging.indexOf('debug') > -1;
      this.id = _id;
    };

    Logger.funcs({
      error : function(errMsg){
        if ( this.levelerror && this.log ) {
          console.error( 'Swagg Player::' + this.id + '::Error::' + errMsg );
        }
      },
      info : function(info){
        if ( this.levelinfo && this.log ) {
          console.log( 'Swagg Player::' + this.id + '::Info::' + info );
        }
      },
      warn : function(warning) {
        if ( this.levelwarn && this.log ) {
          console.warn( 'Swagg Player::' + this.id + '::Warning::' + warning );
        }
      },
      debug : function(warning) {
        if ( this.leveldebug && this.log ) {
          console.warn( 'Swagg Player::' + this.id + '::Debug::' + warning );
        }
      },
      apierror : function(errMsg) {
        if ( this.levelapierror && thims.log ) {
          console.error( 'Swagg Player::' + this.id + '::API Error::' + errMsg );
        }
      }
    });

    var Utils = function(){};

    Utils.func("timeString", function(str) {
      var tmp = parseInt( str, 10 ),
        t = tmp > 9 ? str : "0" + str;
      return t !== "60" ? t : "00";
    });

    /*
      Creates soundManager sound objects
    */
    var SoundFactory = function(p) {
      this.player = p;
      p._logger.debug( 'SoundFactory Initiated' );
    };

    SoundFactory.funcs({
      createSound : function(songObj) {
        var  self = this;
        var html = this.player._html;
        var config = this.player._config;
        var songs = this.player._data.songs;
        var id = songObj.id;

        if ( !songs[ songObj.id ] ) {
          this.player._data.songs.push( songObj );
        }

        var myid = this.player._html.player + '-song-' + id.toString();
        var sm = soundManager;

        sm.callback = function(scope, sound, first, next ) {

          var onComplete = function(args) {
            scope.player.executeIfExists( next, sound, [ args ] );
          }

          scope.player[ first ]( sound, onComplete );
        }

        var callbacks =
            [ "onPlay", "onPause", "onStop", "onFinish", "onResume", "whilePlaying", "whileLoading", "onError" ];


        var newSound = sm.createSound({

          id: myid,

          url: songObj.url,

          autoLoad: config.props.eagerLoad || false,

          usePolicyFile: false,

          // TODO: there's a better way to do this!
          onplay: function(){
            sm.callback( self, this, "_onplay", "onPlay" );
          },

          onpause: function(){
            sm.callback( self, this, "_onpause", "onPause" );
          },

          onstop: function(){
            sm.callback( self, this, "_onstop", "onStop" );
          },

          onfinish: function(){
            sm.callback( self, this, "_onfinish", "onFinish" );
          },

          onresume: function(){
            sm.callback( self, this, "_onresume", "onResume" );
          },

          whileplaying: function() {
            sm.callback( self, this, "_whileplaying", "whilePlaying" );
          },

          whileloading: function(){
            sm.callback( self, this, "_whileloading", "whileLoading" );
          },

          onerror: function(){
            sm.callback( self, this, "_onerror", "onError" );
          }

        });

        newSound.id = myid;
        newSound.repeat = self.player.internal.repeat;
        self.player._data.last_song = songObj.id;
        return newSound;
      }
    });

    /* Model for songs */
    var Song = function(obj, id) {
      for ( var prop in obj ) {
        this[ prop ] = obj[ prop ];
        if ( prop === "thumb" ) {
          this.image = new Image();
          this.image.onload = function(){ }
          this.image.src = obj[ prop ];
        }
      }
      this.id = id;
    };

    /*
      =============================================== swagg player data
      handles the fetching and processing of songs
    */
    var Data = function(p) {
      p._logger.debug( 'Data intializing' );
      this.PLAYER = p;
      this.last_song = -1;
      this.songs = [];
      this.curr_sprite_class = '';
      this.isIe = Browser.isIe();
      this.curr_song = -1;
      this.vol_interval = 20;
      this.interval_id = -1;
    };

    Data.funcs({
      processSongs : function(theData){
        var player = this.PLAYER;
        var _songs =[];
        var size = theData.length;
        var _html = player._html;
        var _config_ = player._config;


        // preload SONG album  and append an IDs to the songs - make configurable in the future
        // to avoid having to loop through JSON array
        for (var i = 0; i < size; i++) {
          var tmp = new Song( theData[i], i);
          _songs.push(tmp);
        }
        this.songs = _songs;
        this.last_song = this.songs.length - 1;
      },

      getSongs : function() {
        var self = this;
        var config = this.PLAYER._config;
        var theData = config.props.data;

        this.processSongs( theData );
        return;

        // THIS IS ON IT'S WAY OUT!!
        // Check if dataString points to a json file if so, fetch it.
        // if not, assume string is a literal JSON object
//         if (typeof theData === 'string') {
//           $.ajax({
//             type: "GET",
//             url: theData,
//             dataType: 'json',
//             success: function(data){
//               self.processSongs( data );
//               return;
//             },
//             error: function(xhr, ajaxOptions, thrownError){
//               var msg = 'There was a problem fetching your songs from the server: ' + thrownError;
//               self.PLAYER._logger.error(msg);
//               return msg;
//             }
//           });
//           return;
//         } // end if
//         else {
//           this.processSongs( theData );
//           return;
//         }
      }
    });

    /*
      ============================================================ UI elements (divs)
      Manages HTML elements associated with Swagg Player
    */

    var Html = function(p) {
      this.PLAYER = p;
    };

    Html.funcs({
      initHtml : function(config) {
        var div = document.querySelector( "#" + config.id );
        this.PLAYER._logger.debug('Html initializing');
        this.player = config.id;
        this.progress_wrapper =
          div
          .querySelectorAll('.swagg-player-progress-wrapper')[ 0 ];

        this.controls_div = $('#' + this.player + ' .swagg-player-controls');
      },

      setupProgressBar : function() {

        this.PLAYER._logger.debug('setting up progress bar');
        if ( this.progress_wrapper ) {
          var wrapper = this.progress_wrapper;
          var height = wrapper.offsetHeight;
          var bar = document.createElement( "div" );
          var loaded = document.createElement( "div" );

          // indicates how much of the sound has loaded
          loaded.className += "swagg-player-loaded";
          loaded.style.height = height + "px";
          loaded.style.width = 0 + "px";
          loaded.style.float = "left";
          loaded.style[ "margin-left" ] = 0;
          this.loaded = loaded;
          this.loaded.offset = function() {
            return this.getBoundingClientRect();
          }
          wrapper.appendChild( this.loaded );


          // indicates the progress of the currently playing sound
          bar.className += "swagg-player-bar";
          bar.style.height = height + "px";
          bar.style.width = 0 + "px";
          bar.style.float = "left";
          bar.style[ "margin-left" ] = "auto";
          this.bar = bar;
          this.bar.offset = function() {
            return this.getBoundingClientRect();
          }
          this.loaded.appendChild( this.bar );
        }
      }
    });

    /*
      ============================================================= player controlls
      Handles control specific stuff
    */
    var Controls = function(p) {
      this.PLAYER = p;
//       this.play = null;
//       this.skip = null;
//       this.back = null;
//       this.stop = null;
    };

    Controls.funcs({
      setup : function(img) {
        var p = this.PLAYER;
        var mageLoader = p._imageLoader;

        p._logger.debug('setting up controls');

        var div = document.querySelector( "#" + p._html.player );

        this.play =  div.querySelectorAll( ".swagg-player-play-button" )[ 0 ];
        this.skip =  div.querySelectorAll( ".swagg-player-skip-button" )[ 0 ];
        this.back =  div.querySelectorAll( ".swagg-player-back-button" )[ 0 ];
        this.stop =  div.querySelectorAll( ".swagg-player-stop-button" )[ 0 ];
      }
    });

    /*
      ============================================================== events
      Handles Swagg Player events
    */
    var Events = function(p) {
      this.PLAYER = p;
    };

    Events.funcs({
      bindControllerEvents : function() {
        var p = this.PLAYER;
        var controls = p._controls;
        var imageLoader = p._imageLoader;
        var images = imageLoader.imagesLoaded;
        var ops = ['play', 'back', 'stop', 'skip'];
        var i, _do;

        p._logger.debug('Binding controller button events');

        function createOpFunc(op) {
          var tmp = null;
          if (func === 'play') {
            tmp = function() {
              p.play( p._data.curr_song );
              return false;
            };
          } else if (func === 'skip') {
            tmp = function() {
              p.skip( 1 );
              return false;
            };
          } else if (func === 'stop') {
            tmp = function() {
              p.stopMusic();
              return false;
            };
          } else if (func === 'back') {
            tmp = function() {
              p.skip( 0 );
              return false;
            };
          }
          return tmp;
        }

        for (i = 0; i < ops.length; i++) {
          var func = ops[i];
          var task = createOpFunc( ops[i] );

          if ( controls[ func ] ) {
            controls[ func ].addEventListener( "click", task );
          } else {
            p._logger.debug( "Didn't find a " + func + " button" );
          }

        } // end for
      },

      setupSeek : function() {
        // seek to a position in the song
        var p = this.PLAYER;
        var html = p._html;

        p._logger.debug('setting up seek events');

        function onLoadedClick(e) {
          e.preventDefault();
          var id = html.player + '-song-' + p._data.curr_song;
          var progressWrapperWidth = html.progress_wrapper.offsetWidth;
          var soundobj = soundManager.getSoundById( id );
          var x = e.pageX - html.loaded.offset().left;
          var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
          var duration = p.getDuration( soundobj );

          // obtain the position clicked by the user
          var newPosPercent = x / progressWrapperWidth;
          var loaded = progressWrapperWidth * loaded_ratio;

          // find the position within the song to which the location clicked corresponds
          var seekTo = Math.round(newPosPercent * duration);

          if ( seekTo < soundobj.bytesLoaded ) {
            soundobj.setPosition( seekTo );
            p.progress( soundobj );
          }
        }

        function onMouseIn(e) {
          e.preventDefault();
          var id = html.player + '-song-' + p._data.curr_song;
          var config_= p._config;
          var soundobj = soundManager.getSoundById( id );
          var x = e.pageX - html.loaded.offset().left;
          var duration = p.getDuration( soundobj );

          // obtain the position clicked by the user
          var newPosPercent = x / html.progress_wrapper.offsetWidth;

          // find the position within the song to which the location clicked corresponds
          var seekTo = Math.round( newPosPercent * duration );
          var time = p.millsToTime( seekTo, 1 );

          // fire off onSeekPreview event
          p.executeIfExists( "onSeekPreview", this, [ e, time ] );
        }

        function onMouseOut(e) {
          p.executeIfExists( "onSeekHide", this, [ e ] );
        }

        // seek
        html.loaded.addEventListener( "click", onLoadedClick );

        // seek preview
        html.loaded.addEventListener( "mouseover", onMouseIn );
        html.loaded.addEventListener( "mouseover", onMouseIn );
        html.loaded.addEventListener( "mousemove", onMouseIn );

        // stop seek
        html.loaded.addEventListener( "mouseout", onMouseOut );
      }
    });

    /*
      ============================================================= images for button controls
      Loades images for buttons
    */
    var ImageLoader = function(p) {
      this.PLAYER = p;
      this.imagesLoaded = false;
    };

    ImageLoader.funcs({
      setup : function() {
        this.PLAYER._logger.debug('setting up image loader');
        var config = this.PLAYER._config.props;
        if ( config.buttonsDir !== undefined ) {
          this.PLAYER._controls.setup(this.PLAYER._html.controls_div);
          this.loadButtonImages( config.buttonsDir );
        }
      },

      loadButtonImages : function(imagesDir) {
        var player = this.PLAYER;
        var hover = player._config.props.buttonHover || false;
        var controls = player._controls;

        player._logger.debug('Loading images for controls');

        if ( controls.play ) {
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

        if ( controls.skip ) {
          this.skip = new Image();
          this.skip.src = imagesDir + 'skip.png';

          if (hover === true) {
            this.skipOver = new Image();
            this.skipOver.src = imagesDir + 'skip-over.png';
          }
        }

        if ( controls.back ) {
          this.back = new Image();
          this.back.src = imagesDir + 'back.png';

          if (hover === true) {
            this.backOver = new Image();
            this.backOver.src = imagesDir + 'back-over.png';
          }
        }

        if ( controls.stop ) {
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

    var Controller = function(){};

    Controller.funcs({
      init : function(config) {

        config = config;

        var self = this;

        var sm = soundManager;

        var opts = {
          url: "/swf",
          consoleOnly: true,
          flashVersion: 9,
          wmode: "transparent",
          useHTML5Audio: true,
          useHighPerformance: false,
          flashLoadTimeout: 1000,
          debugMode: true
        };


        this.initComponents( config );

        function onSMReady() {
          var html = self._html;
          var data = self._data;
          var song = data.songs[0];
          var config = self._config;

          self.createSongs();

          data.curr_song = 0;

          if( config.props.autoPlay !== undefined && config.props.autoPlay === true ) {
            setTimeout(function(){
              self.play( data.curr_song );
            },1000);
          }

          self.executeIfExists( "onSetupComplete", this, [ self._swaggPlayerApi, song ] );

          if ( !Browser.isIe() ) {
            if ( console.timeEnd ) {
              console.timeEnd( "SwaggPlayerStart" );
            }
          }

          self._logger.info( "Swagg Player ready!" );

        }; // end soundManager onready function

        function onSMError() {
          self._logger.error( "An error has occured with loading Sound Manager! Rebooting." );
          self.executeIfExists( "onErrorComplete", self, [] );
        };

        soundManager.onerror = onSMError;

        soundManager.onload = onSMReady;

        soundManager.ontimeout = onSMError;

        soundManager.setup( opts );
      }, // end Controller.init


      createSongs: function() {
        var self = this;
        this._logger.info('createSongs()');
        var data = self._data;
        var songs = data.songs;

        if( data.songs[0] !== undefined ) {
          var  config = self._config;
          var html = self._html;
          var factory = new SoundFactory( self );
          var s = null, tmp = null

          for (var i = 0, end = songs.length; i < end; i++) {
            s = songs[i];
            tmp = factory.createSound( s );
          }
        } else {
          this._logger.error('No Songs!!');
        }
      },

      initComponents : function(config) {

        var self = this;

        // initialize configuration
        this._config = new Config( this );

        for (var i in config) {
          this._config.props[ i ] = config[ i ];
        }

        // setup logging
        this._logger = new Logger(this, config.id);

        this._logger.info('initializing swagg player components');

        // initialize data (songs)
        this._data = new Data(this);

        // setup html elements
        this._html = new Html( this );

        this._html.initHtml( config );

        this._html.setupProgressBar();


        // controls, images
        this._controls = new Controls(self);
        this._imageLoader = new ImageLoader(self);
        this._imageLoader.setup();


        if (config.buttonsDir !== undefined) {
          this._controls.setup(this._html.controls_div);
        }

        // setup controller events
        this._events = new Events(this);

        // seek events
        this._events.setupSeek();

        // events for player controls
        this._events.bindControllerEvents();

        // api
        this.setupApi();

        $.when(this._data.getSongs()).done(function(err){

          if (err) {
            this.executeIfExists( "onError", this, [] );
          } else {

            // check for soundManager support and warn or inform accordingly
            if ( !soundManager.supported() ) {
              self._logger.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
            }
            else {
              self._logger.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
            }

          } // end else
        });
      },

      _whileplaying : function(sound) {
        this.progress( sound );
        var duration = sound.loaded === true ? sound.duration : sound.durationEstimate;
        var curr = this.millsToTime( sound.position );
        var total = this.millsToTime( duration );
        var time = {
          currentMins: curr.mins,
          currentSecs: curr.secs,
          totalMins: total.mins,
          totalSecs: total.secs
        };
        return [time];
      },

      _onplay : function(sound, callback) {
        var data = this._data;
        var song = data.songs[ data.curr_song ];
        var arg = {};

        for (var prop in song) {
          if ( prop != "id" && typeof( song[ prop ] ) !== "function" ) {
            arg[ prop ] = song[ prop ];
          }
        }

        this.playPauseButtonState(0);

        // if the song has already fully loaded the whileloading callback won't fire
        // so we need to just go ahead and fill the bar
        if (this.loaded(sound) === true) {
          this.fillLoaded();
        }
        if ( callback ) {
          return callback( arg );
        } else {
          return [ arg ];
        }
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
        var ret;
        if (this.internal.repeatMode === false){
          var id = parseInt(sound.id.split('-')[3],10),
            last = this._data.songs.length - 1;
          if (id < last) {
            this.skip(1);
          } else {
            this.stopMusic();
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
        if ( config.props[ func ] && typeof( config.props[ func ] ) === 'function' ) {
          config.props[ func ].apply( scope, args );
        }
      },

      // get the duration of a song in milliseconds
      getDuration : function(soundobj) {
        var duration;
        if (soundobj.loaded !== true) {
          duration = soundobj.durationEstimate;
        } else {
          duration = soundobj.duration;
        }
        return duration;
      },

      // repeats the currently playing track
      repeat : function(track) {
        var sound_id = this._html.player + '-song-' + this._data.curr_song;
        var target = soundManager.getSoundById(sound_id);

        this._logger.info('repeat()');
        this.resetProgressBar();
        target.setPosition(0);
        target.play();
      },

      // Plays a song based on the ID
      play : function(track){
        var  sound_id = this._html.player + '-song-' + track;
        var fromBeginning;
        var target = soundManager.getSoundById(sound_id);

        this._logger.debug('Playing track: ' + sound_id);

        if ( target.paused === true ) { // if current track is paused, unpause
          this._logger.debug('Unpausing song');
          target.resume();
        }
        else { // track is not paused
          if ( target.playState === 1 ) {// if track is already playing, pause it
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

      // toggles the play/pause button to the play state
      playPauseButtonState : function(state){
        var imagesLoaded = this._imageLoader.imagesLoaded;
        var src = this._imageLoader.play.src;
        var image = this._controls.play;

        if (state === 1 ) {
          // play state
          src = this._imageLoader.play.src;
        } else if (state === 0) {
          // pause state
          src = this._imageLoader.pause.src;
        } else {
          // invalid state
          this._logger.error('Invalid button state! : ' + state);
        }
        if ( imagesLoaded === true ) {
          image.setAttribute( "src", src );
        }
      },

      // Skips to the next song. If the currently playing song is the last song in the list
      // it goes back to the first song
      skip : function(direction){
        var data = this._data;
        var html = this._html;
        var t = parseInt( data.curr_song );

        this._logger.info('skip()');

        if (direction === 1) {
          // skip forward
          if ( t < data.songs.length ){
            if ( t === ( data.songs.length - 1 ) ) {
              t = 0;
            } else {
              t += 1;
            }
          }
        } else if (direction === 0) { // skip back
          if (t === 0){
            t = parseInt( data.songs.length - 1 );
          }
          else{
            t -= 1;
          }
        } else { // invalid flag
          this._logger.error('Invalid skip direction flag: ' + direction);
        }

        this.stopMusic();
        data.curr_song = t;
        this.play( t );

      },

      jumpTo : function(t) {
        this._logger.debug('jumping to track ' + t);
        this.stopMusic();
        this._data.curr_song = t;
        this.play(t);
      },

      // Resets the progress bar back to the beginning
      resetProgressBar : function(){
        this._html.bar.style.width = 0;
        this._html.loaded.style.width = 0;
      },

      // Stops the specified song
      stopMusic : function() {

        this._logger.debug( "stopping music" );
        this.playPauseButtonState( 1 );
        this.resetProgressBar();
        soundManager.stopAll();
        //soundManager.stop('swagg-player-song-' + this._data.curr_song.toString());
      },

      // Increases the volume of the specified song
      volume : function(track, flag) {
        var sound_id = this._html.player + '-song-' + track;
        var sound = soundManager.getSoundById(sound_id);
        var curr_vol = sound.volume;

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

      fillLoaded : function() {
        this._html.loaded.style.width = this._html.progress_wrapper.offsetWidth + "px";
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
        var pos = soundobj.position;
        var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
        var duration = soundobj.duration;

        // width of progress bar
        var wrapper_width = this._html.progress_wrapper.offsetWidth;
        var loaded = wrapper_width * loaded_ratio;

        this._html.loaded.style.width = loaded + "px";
        return loaded_ratio;
      },

      // updates the UI progress bar
      progress : function(soundobj) {

        // get current position of currently playing song
        var pos = soundobj.position;
        var duration = 0;
        var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;

        if (soundobj.loaded === false) {
          duration = soundobj.durationEstimate;
        }
        else {
          duration = soundobj.duration;
        }

        // ratio of (current position / total duration of song)
        var pos_ratio = pos/duration;

        // width of progress bar
        var wrapper_width = this._html.progress_wrapper.offsetWidth;
        // set width of inner progress bar equal to the width equivelant of the
        // current position
        var t = wrapper_width * pos_ratio;

        this._html.bar.style.width = t + "px";
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

        return { mins: utils.timeString( minutes ), secs : utils.timeString( seconds ) };
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

      this.player = {
        adjustProgress : function () {
          var html = controller._html;
          var id = html.player + '-song-' + controller._data.curr_song.toString();
          var sound = soundManager.getSoundById( id );
          controller.whileLoading( sound );
        }
      };

      /*
        Deals with play back functionality of the player in general
      */
      self.playback = {
        setRepeat : function(flag) {
          controller.internal.repeatMode = (flag === true || flag === false) ? flag : false;
          return self;
        },

        inRepeat : function() {
          var r = controller.internal.repeat;
          return (r === true || r === false) ? r : false;
        },

        volUp : function() {
          controller.volume( controller._data.curr_song, 1 );
          return self;
        },

        volDown : function(){
          controller.volume( controller._data.curr_song, 0 );
          return self;
        },

        playTrack : function(track) {
          var actualTrack = track - 1;
          if ( actualTrack <= ( controller._data_.last_song) && actualTrack >= 0 ) {
            controller.jumpTo(track - 1);
          } else {
            controller._logger.apierror( "Invalid track number '" + track + "'" );
          }
          return self;
        },

        togglePlay : function () {
          controller.play( controller._data.curr_song );
        },

        stop : function() {
          controller.stopMusic();
        },

        addTracks : function(trackData) {
          var player = controller.PLAYER;
          var factory = new SoundFactory( controller );
          var t, songObj, s, i;

          if ( Object.prototype.toString.call( trackDate ).indexOf( "Array" ) > -1 ) {
            for (i = 0; i < trackData.length; i++) {
              t = controller._data.last_song;
              songObj = new Song( trackData[ i ], t + 1 );
              s = factory.createSound( songObj );
            }
          } else {
            t = controller._data.last_song;
            songObj = new Song( trackData, t + 1 );
            s = factory.createSound( songObj );
          }
          if ( callback ) {
            return callback();
          }
        }
      }; // end playback funcs
    }; // end api
}));//(jQuery);