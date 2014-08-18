(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/* global define:false, soundManager: false */

;(function() {

  'use strict';
  // hi
  require( './soundManager2' );

  var Song =  require( './song' );

  // various utility functions
  var Utils = {

    formId: function( index ) {
      return 'track-' + index;
    },

    shouldResume: function( song ) {
      return song.raw.position && song.raw.position > 0;
    },

    timeString: function( str ) {
      var tmp = parseInt( str, 10 );
      var t = tmp > 9 ? str : '0' + str;
      return t !== '60' ? t : '00';
    },

    millsToTime : function(duration, flag) {
      var seconds = Math.floor(duration / 1000);
      var minutes = 0;

      if (seconds > 60) {
        minutes = Math.floor(seconds / 60);
        seconds = Math.round(seconds % 60);
      }

      if (seconds === 60) {
        minutes += 1;
        seconds = 0;
      }

      return { mins: parseInt( this.timeString( minutes ) ), secs : parseInt( this.timeString( seconds ) ) };
    },

  };

  var SwaggPlayer = function(){

    var self = this;

    // data and such
    var _data = {};

    // external API
    var _api = {};

    // initialize the player with options
    function init( opts ) {
      _data._element = opts.el;
      _data.swfUrl  = opts.swf || '/swf';
      _data.songs = [];
      _data.currentTrack = 0;
      soundManager.setup({
        url: _data.swfUrl,
        onready: function(){
          _load( opts );
        }
      });

      return _api;
    }

    // create the sound manager sound instances
    function _load( opts ) {
      for ( var i = 0; i < opts.songs.length; i++ ) {
        var song = new Song( opts.songs[ i ] );
        song.id = i;
        if ( i === 0 ) {
          _data.firstTrack = song;
        }
        _data.songs.push( song );
        _createNewSong( song, opts );
      }
    }

    // creates a sound manager sound instance and configures
    // all of it's options and registers callbacks
    function _createNewSong( songData, opts ) {
      opts = opts || {};
      var self = _data;
      var meta = {
        artist: songData.artist,
        title: songData.title,
        art: songData.art
      };
      var fastPolling = ( opts.throttlePolling ) ? false : true;

      songData.raw = soundManager.createSound({
        id: Utils.formId( songData.id ),
        url: songData.url,
        // autoLoad: true,
        autoPlay: false,
        useHighPerformance: fastPolling,

        onload: function() {
          console.log('The ' + songData.title + ' loaded!');
        },
        onplay: function() {
          if ( opts.onPlay ) {
            opts.onPlay( meta );
          }
        },
        onresume: function() {
          if ( opts.onResume ) {
            opts.onResume( meta );
          }
        },
        onpause: function() {
          if ( opts.onPause ) {
            opts.onPause( meta );
          }
        },

        onstop: function() {
          if ( opts.onStop ) {
            opts.onStop( meta );
          }
        },

        onfinish: function() {
          if ( opts.onFinish ) {
            opts.onFinish();
          }
        },

        whileloading: function() {
          if ( opts.whileLoading ) {
            var amntLoaded = _determineBytesLoaded( this );
            opts.whileLoading( amntLoaded );
          }
        },

        whileplaying: function() {
          if ( opts.whilePlaying ) {
            var timeProgress    = _determineTimeProgress( this );
            var percentComplete = _determineByteProgress( this );
            opts.whilePlaying( timeProgress, percentComplete );
          }
        },
      });
    } // end create sound

    function _determineBytesLoaded( sound ) {
      // get current position of currently playing song
      console.log( sound.bytesLoaded + '/' + sound.bytesTotal );
      return sound.bytesLoaded / sound.bytesTotal;
    }

    // determine how far along a song is in terms of how many bytes
    // have been played in relation to the total bytes
    function _determineByteProgress( sound ) {
      // get current position of currently playing song
      var pos = sound.position;
      var duration = 0;
      var loadedRatio = sound.bytesLoaded / sound.bytesTotal;

      if ( sound.loaded === false) {
        duration = sound.durationEstimate;
      }
      else {
        duration = sound.duration;
      }

      // ratio of (current position / total duration of song)
      var positionRatio = pos/duration;

      return ( positionRatio.toFixed( 2 ) * 100 ).toFixed( 0 );
    }

    // determine the current song's position in time mm:ss / mm:ss
    function _determineTimeProgress( sound ) {
      var duration = sound.loaded === true ? sound.duration : sound.durationEstimate;
      var curr = Utils.millsToTime( sound.position );
      var total = Utils.millsToTime( duration );
      var time = {
        current: {
          min: curr.mins,
          sec: curr.secs,
        },
        total: {
          min: total.mins,
          sec: total.secs
        }
      };
      return time;
    }

    // stop all playing sounds
    function _stop() {
      soundManager.stopAll();
      return _api;
    }

    // play a song at the given index
    function _play( index ) {
      // if an index is supplied play a specific song
      // otherwise just play the current song
      if ( index ) {
        _data.currentTrack = index;
      } else {
        index = _data.currentTrack;
      }

      var sound = _data.songs[ index ];

      // check if we're in a paused state. if not, play from the beginning.
      // if we are, then resume play
      if ( sound && !Utils.shouldResume( sound ) ) {
        _stop();
        sound.raw.play();
      } else {
        sound.raw.togglePause();
      }
      return _api;
    }

    // pause all songs
    function _pause() {
      // console.log( _data.songs[ _data.currentTrack ].raw.volume );
      soundManager.pauseAll();
      return _api;
    }

    // play the next song
    function _next() {
      _stop();
      _resetSound( _data.currentTrack );
      _data.currentTrack = _data.currentTrack + 1;
      if ( _data.currentTrack > ( _data.songs.length - 1 ) ) {
        _data.currentTrack = 0;
      }
      return _play();
    }

    // play the previous song
    function _prev() {
      _stop();
      _resetSound( _data.currentTrack );
      _data.currentTrack -= 1;
      if ( _data.currentTrack < 0 ) {
        var song = _data.songs[ _data.songs.length - 1 ];
        _data.currentTrack = song.id;
      }
      return _play();
    }

    // to be fired when the player is ready to go
    function _onReady(cb) {
      var firstSong = _data.songs[ 0 ];
      if ( cb ) {
        soundManager.onready( cb.bind( _api, [ _data.firstTrack ] ) );
      }
      return _api;
    }

    function _onError(cb) {
      if ( cb ) {
        soundManager.onerror( cb.bind( _api ) );
      }
      return _api;
    }

    // resets the current position for a song to 0
    function _resetSound( index ) {
      var id = Utils.formId( index );
      soundManager.getSoundById( id ).position = 0;
    }

    function _cursor( index ) {
      index = ( index > 0 && index < ( _data.songs.length - 1 ) ) ? index : 0;
      _data.currentTrack = index;
      var song = _data.songs[ index ];
      return {
        title: song.title,
        art: song.art,
        id: song.id,
        artist: song.artist
      };
    }


    // expose api
    _api.init     = init;
    _api.onReady  = _onReady;
    _api.onError  = _onError;
    _api.stop     = _stop;
    _api.play     = _play;
    _api.pause    = _pause;
    _api.next     = _next;
    _api.prev     = _prev;
    _api.cursor   = _cursor;

    return _api;

  };


  if ( window.module && module.exports ) {
    module.exports = SwaggPlayer;
  } else {
    window.SwaggPlayer = SwaggPlayer;
  }

}() );
},{"./song":2,"./soundManager2":3}],2:[function(require,module,exports){

;(function(){

  'use strict';

  var Song = function( opts ) {
    this.title    = opts.title;
    this.artist   = opts.artist;
    this.url      = opts.url;
    this.art      = opts.art;
    this.id       = opts.id;
  };

  module.exports = Song;

}());
},{}],3:[function(require,module,exports){
/** @license
 *
 * SoundManager 2: JavaScript Sound for the Web
 * ----------------------------------------------
 * http://schillmania.com/projects/soundmanager2/
 *
 * Copyright (c) 2007, Scott Schiller. All rights reserved.
 * Code provided under the BSD License:
 * http://schillmania.com/projects/soundmanager2/license.txt
 *
 * V2.97a.20131201
 */

/*global window, SM2_DEFER, sm2Debugger, console, document, navigator, setTimeout, setInterval, clearInterval, Audio, opera */
/*jslint regexp: true, sloppy: true, white: true, nomen: true, plusplus: true, todo: true */

/**
 * About this file
 * -------------------------------------------------------------------------------------
 * This is the fully-commented source version of the SoundManager 2 API,
 * recommended for use during development and testing.
 *
 * See soundmanager2-nodebug-jsmin.js for an optimized build (~11KB with gzip.)
 * http://schillmania.com/projects/soundmanager2/doc/getstarted/#basic-inclusion
 * Alternately, serve this file with gzip for 75% compression savings (~30KB over HTTP.)
 *
 * You may notice <d> and </d> comments in this source; these are delimiters for
 * debug blocks which are removed in the -nodebug builds, further optimizing code size.
 *
 * Also, as you may note: Whoa, reliable cross-platform/device audio support is hard! ;)
 */

(function(window, _undefined) {

"use strict";

var soundManager = null;

/**
 * The SoundManager constructor.
 *
 * @constructor
 * @param {string} smURL Optional: Path to SWF files
 * @param {string} smID Optional: The ID to use for the SWF container element
 * @this {SoundManager}
 * @return {SoundManager} The new SoundManager instance
 */

function SoundManager(smURL, smID) {

  /**
   * soundManager configuration options list
   * defines top-level configuration properties to be applied to the soundManager instance (eg. soundManager.flashVersion)
   * to set these properties, use the setup() method - eg., soundManager.setup({url: '/swf/', flashVersion: 9})
   */

  this.setupOptions = {

    'url': (smURL || null),             // path (directory) where SoundManager 2 SWFs exist, eg., /path/to/swfs/
    'flashVersion': 8,                  // flash build to use (8 or 9.) Some API features require 9.
    'debugMode': true,                  // enable debugging output (console.log() with HTML fallback)
    'debugFlash': false,                // enable debugging output inside SWF, troubleshoot Flash/browser issues
    'useConsole': true,                 // use console.log() if available (otherwise, writes to #soundmanager-debug element)
    'consoleOnly': true,                // if console is being used, do not create/write to #soundmanager-debug
    'waitForWindowLoad': false,         // force SM2 to wait for window.onload() before trying to call soundManager.onload()
    'bgColor': '#ffffff',               // SWF background color. N/A when wmode = 'transparent'
    'useHighPerformance': false,        // position:fixed flash movie can help increase js/flash speed, minimize lag
    'flashPollingInterval': null,       // msec affecting whileplaying/loading callback frequency. If null, default of 50 msec is used.
    'html5PollingInterval': null,       // msec affecting whileplaying() for HTML5 audio, excluding mobile devices. If null, native HTML5 update events are used.
    'flashLoadTimeout': 1000,           // msec to wait for flash movie to load before failing (0 = infinity)
    'wmode': null,                      // flash rendering mode - null, 'transparent', or 'opaque' (last two allow z-index to work)
    'allowScriptAccess': 'always',      // for scripting the SWF (object/embed property), 'always' or 'sameDomain'
    'useFlashBlock': false,             // *requires flashblock.css, see demos* - allow recovery from flash blockers. Wait indefinitely and apply timeout CSS to SWF, if applicable.
    'useHTML5Audio': true,              // use HTML5 Audio() where API is supported (most Safari, Chrome versions), Firefox (no MP3/MP4.) Ideally, transparent vs. Flash API where possible.
    'html5Test': /^(probably|maybe)$/i, // HTML5 Audio() format support test. Use /^probably$/i; if you want to be more conservative.
    'preferFlash': false,               // overrides useHTML5audio, will use Flash for MP3/MP4/AAC if present. Potential option if HTML5 playback with these formats is quirky.
    'noSWFCache': false,                // if true, appends ?ts={date} to break aggressive SWF caching.
    'idPrefix': 'sound'                 // if an id is not provided to createSound(), this prefix is used for generated IDs - 'sound0', 'sound1' etc.

  };

  this.defaultOptions = {

    /**
     * the default configuration for sound objects made with createSound() and related methods
     * eg., volume, auto-load behaviour and so forth
     */

    'autoLoad': false,        // enable automatic loading (otherwise .load() will be called on demand with .play(), the latter being nicer on bandwidth - if you want to .load yourself, you also can)
    'autoPlay': false,        // enable playing of file as soon as possible (much faster if "stream" is true)
    'from': null,             // position to start playback within a sound (msec), default = beginning
    'loops': 1,               // how many times to repeat the sound (position will wrap around to 0, setPosition() will break out of loop when >0)
    'onid3': null,            // callback function for "ID3 data is added/available"
    'onload': null,           // callback function for "load finished"
    'whileloading': null,     // callback function for "download progress update" (X of Y bytes received)
    'onplay': null,           // callback for "play" start
    'onpause': null,          // callback for "pause"
    'onresume': null,         // callback for "resume" (pause toggle)
    'whileplaying': null,     // callback during play (position update)
    'onposition': null,       // object containing times and function callbacks for positions of interest
    'onstop': null,           // callback for "user stop"
    'onfailure': null,        // callback function for when playing fails
    'onfinish': null,         // callback function for "sound finished playing"
    'multiShot': true,        // let sounds "restart" or layer on top of each other when played multiple times, rather than one-shot/one at a time
    'multiShotEvents': false, // fire multiple sound events (currently onfinish() only) when multiShot is enabled
    'position': null,         // offset (milliseconds) to seek to within loaded sound data.
    'pan': 0,                 // "pan" settings, left-to-right, -100 to 100
    'stream': true,           // allows playing before entire file has loaded (recommended)
    'to': null,               // position to end playback within a sound (msec), default = end
    'type': null,             // MIME-like hint for file pattern / canPlay() tests, eg. audio/mp3
    'usePolicyFile': false,   // enable crossdomain.xml request for audio on remote domains (for ID3/waveform access)
    'volume': 100             // self-explanatory. 0-100, the latter being the max.

  };

  this.flash9Options = {

    /**
     * flash 9-only options,
     * merged into defaultOptions if flash 9 is being used
     */

    'isMovieStar': null,      // "MovieStar" MPEG4 audio mode. Null (default) = auto detect MP4, AAC etc. based on URL. true = force on, ignore URL
    'usePeakData': false,     // enable left/right channel peak (level) data
    'useWaveformData': false, // enable sound spectrum (raw waveform data) - NOTE: May increase CPU load.
    'useEQData': false,       // enable sound EQ (frequency spectrum data) - NOTE: May increase CPU load.
    'onbufferchange': null,   // callback for "isBuffering" property change
    'ondataerror': null       // callback for waveform/eq data access error (flash playing audio in other tabs/domains)

  };

  this.movieStarOptions = {

    /**
     * flash 9.0r115+ MPEG4 audio options,
     * merged into defaultOptions if flash 9+movieStar mode is enabled
     */

    'bufferTime': 3,          // seconds of data to buffer before playback begins (null = flash default of 0.1 seconds - if AAC playback is gappy, try increasing.)
    'serverURL': null,        // rtmp: FMS or FMIS server to connect to, required when requesting media via RTMP or one of its variants
    'onconnect': null,        // rtmp: callback for connection to flash media server
    'duration': null          // rtmp: song duration (msec)

  };

  this.audioFormats = {

    /**
     * determines HTML5 support + flash requirements.
     * if no support (via flash and/or HTML5) for a "required" format, SM2 will fail to start.
     * flash fallback is used for MP3 or MP4 if HTML5 can't play it (or if preferFlash = true)
     */

    'mp3': {
      'type': ['audio/mpeg; codecs="mp3"', 'audio/mpeg', 'audio/mp3', 'audio/MPA', 'audio/mpa-robust'],
      'required': true
    },

    'mp4': {
      'related': ['aac','m4a','m4b'], // additional formats under the MP4 container
      'type': ['audio/mp4; codecs="mp4a.40.2"', 'audio/aac', 'audio/x-m4a', 'audio/MP4A-LATM', 'audio/mpeg4-generic'],
      'required': false
    },

    'ogg': {
      'type': ['audio/ogg; codecs=vorbis'],
      'required': false
    },

    'opus': {
      'type': ['audio/ogg; codecs=opus', 'audio/opus'],
      'required': false
    },

    'wav': {
      'type': ['audio/wav; codecs="1"', 'audio/wav', 'audio/wave', 'audio/x-wav'],
      'required': false
    }

  };

  // HTML attributes (id + class names) for the SWF container

  this.movieID = 'sm2-container';
  this.id = (smID || 'sm2movie');

  this.debugID = 'soundmanager-debug';
  this.debugURLParam = /([#?&])debug=1/i;

  // dynamic attributes

  this.versionNumber = 'V2.97a.20131201';
  this.version = null;
  this.movieURL = null;
  this.altURL = null;
  this.swfLoaded = false;
  this.enabled = false;
  this.oMC = null;
  this.sounds = {};
  this.soundIDs = [];
  this.muted = false;
  this.didFlashBlock = false;
  this.filePattern = null;

  this.filePatterns = {

    'flash8': /\.mp3(\?.*)?$/i,
    'flash9': /\.mp3(\?.*)?$/i

  };

  // support indicators, set at init

  this.features = {

    'buffering': false,
    'peakData': false,
    'waveformData': false,
    'eqData': false,
    'movieStar': false

  };

  // flash sandbox info, used primarily in troubleshooting

  this.sandbox = {

    // <d>
    'type': null,
    'types': {
      'remote': 'remote (domain-based) rules',
      'localWithFile': 'local with file access (no internet access)',
      'localWithNetwork': 'local with network (internet access only, no local access)',
      'localTrusted': 'local, trusted (local+internet access)'
    },
    'description': null,
    'noRemote': null,
    'noLocal': null
    // </d>

  };

  /**
   * format support (html5/flash)
   * stores canPlayType() results based on audioFormats.
   * eg. { mp3: boolean, mp4: boolean }
   * treat as read-only.
   */

  this.html5 = {
    'usingFlash': null // set if/when flash fallback is needed
  };

  // file type support hash
  this.flash = {};

  // determined at init time
  this.html5Only = false;

  // used for special cases (eg. iPad/iPhone/palm OS?)
  this.ignoreFlash = false;

  /**
   * a few private internals (OK, a lot. :D)
   */

  var SMSound,
  sm2 = this, globalHTML5Audio = null, flash = null, sm = 'soundManager', smc = sm + ': ', h5 = 'HTML5::', id, ua = navigator.userAgent, wl = window.location.href.toString(), doc = document, doNothing, setProperties, init, fV, on_queue = [], debugOpen = true, debugTS, didAppend = false, appendSuccess = false, didInit = false, disabled = false, windowLoaded = false, _wDS, wdCount = 0, initComplete, mixin, assign, extraOptions, addOnEvent, processOnEvents, initUserOnload, delayWaitForEI, waitForEI, rebootIntoHTML5, setVersionInfo, handleFocus, strings, initMovie, preInit, domContentLoaded, winOnLoad, didDCLoaded, getDocument, createMovie, catchError, setPolling, initDebug, debugLevels = ['log', 'info', 'warn', 'error'], defaultFlashVersion = 8, disableObject, failSafely, normalizeMovieURL, oRemoved = null, oRemovedHTML = null, str, flashBlockHandler, getSWFCSS, swfCSS, toggleDebug, loopFix, policyFix, complain, idCheck, waitingForEI = false, initPending = false, startTimer, stopTimer, timerExecute, h5TimerCount = 0, h5IntervalTimer = null, parseURL, messages = [],
  canIgnoreFlash, needsFlash = null, featureCheck, html5OK, html5CanPlay, html5Ext, html5Unload, domContentLoadedIE, testHTML5, event, slice = Array.prototype.slice, useGlobalHTML5Audio = false, lastGlobalHTML5URL, hasFlash, detectFlash, badSafariFix, html5_events, showSupport, flushMessages, wrapCallback, idCounter = 0,
  is_iDevice = ua.match(/(ipad|iphone|ipod)/i), isAndroid = ua.match(/android/i), isIE = ua.match(/msie/i), isWebkit = ua.match(/webkit/i), isSafari = (ua.match(/safari/i) && !ua.match(/chrome/i)), isOpera = (ua.match(/opera/i)),
  mobileHTML5 = (ua.match(/(mobile|pre\/|xoom)/i) || is_iDevice || isAndroid),
  isBadSafari = (!wl.match(/usehtml5audio/i) && !wl.match(/sm2\-ignorebadua/i) && isSafari && !ua.match(/silk/i) && ua.match(/OS X 10_6_([3-7])/i)), // Safari 4 and 5 (excluding Kindle Fire, "Silk") occasionally fail to load/play HTML5 audio on Snow Leopard 10.6.3 through 10.6.7 due to bug(s) in QuickTime X and/or other underlying frameworks. :/ Confirmed bug. https://bugs.webkit.org/show_bug.cgi?id=32159
  hasConsole = (window.console !== _undefined && console.log !== _undefined), isFocused = (doc.hasFocus !== _undefined?doc.hasFocus():null), tryInitOnFocus = (isSafari && (doc.hasFocus === _undefined || !doc.hasFocus())), okToDisable = !tryInitOnFocus, flashMIME = /(mp3|mp4|mpa|m4a|m4b)/i, msecScale = 1000,
  emptyURL = 'about:blank', // safe URL to unload, or load nothing from (flash 8 + most HTML5 UAs)
  emptyWAV = 'data:audio/wave;base64,/UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAD//w==', // tiny WAV for HTML5 unloading
  overHTTP = (doc.location?doc.location.protocol.match(/http/i):null),
  http = (!overHTTP ? 'http:/'+'/' : ''),
  // mp3, mp4, aac etc.
  netStreamMimeTypes = /^\s*audio\/(?:x-)?(?:mpeg4|aac|flv|mov|mp4||m4v|m4a|m4b|mp4v|3gp|3g2)\s*(?:$|;)/i,
  // Flash v9.0r115+ "moviestar" formats
  netStreamTypes = ['mpeg4', 'aac', 'flv', 'mov', 'mp4', 'm4v', 'f4v', 'm4a', 'm4b', 'mp4v', '3gp', '3g2'],
  netStreamPattern = new RegExp('\\.(' + netStreamTypes.join('|') + ')(\\?.*)?$', 'i');

  this.mimePattern = /^\s*audio\/(?:x-)?(?:mp(?:eg|3))\s*(?:$|;)/i; // default mp3 set

  // use altURL if not "online"
  this.useAltURL = !overHTTP;

  swfCSS = {

    'swfBox': 'sm2-object-box',
    'swfDefault': 'movieContainer',
    'swfError': 'swf_error', // SWF loaded, but SM2 couldn't start (other error)
    'swfTimedout': 'swf_timedout',
    'swfLoaded': 'swf_loaded',
    'swfUnblocked': 'swf_unblocked', // or loaded OK
    'sm2Debug': 'sm2_debug',
    'highPerf': 'high_performance',
    'flashDebug': 'flash_debug'

  };

  /**
   * basic HTML5 Audio() support test
   * try...catch because of IE 9 "not implemented" nonsense
   * https://github.com/Modernizr/Modernizr/issues/224
   */

  this.hasHTML5 = (function() {
    try {
      // new Audio(null) for stupid Opera 9.64 case, which throws not_enough_arguments exception otherwise.
      return (Audio !== _undefined && (isOpera && opera !== _undefined && opera.version() < 10 ? new Audio(null) : new Audio()).canPlayType !== _undefined);
    } catch(e) {
      return false;
    }
  }());

  /**
   * Public SoundManager API
   * -----------------------
   */

  /**
   * Configures top-level soundManager properties.
   *
   * @param {object} options Option parameters, eg. { flashVersion: 9, url: '/path/to/swfs/' }
   * onready and ontimeout are also accepted parameters. call soundManager.setup() to see the full list.
   */

  this.setup = function(options) {

    var noURL = (!sm2.url);

    // warn if flash options have already been applied

    if (options !== _undefined && didInit && needsFlash && sm2.ok() && (options.flashVersion !== _undefined || options.url !== _undefined || options.html5Test !== _undefined)) {
      complain(str('setupLate'));
    }

    // TODO: defer: true?

    assign(options);

    // special case 1: "Late setup". SM2 loaded normally, but user didn't assign flash URL eg., setup({url:...}) before SM2 init. Treat as delayed init.

    if (options) {

      if (noURL && didDCLoaded && options.url !== _undefined) {
        sm2.beginDelayedInit();
      }

      // special case 2: If lazy-loading SM2 (DOMContentLoaded has already happened) and user calls setup() with url: parameter, try to init ASAP.

      if (!didDCLoaded && options.url !== _undefined && doc.readyState === 'complete') {
        setTimeout(domContentLoaded, 1);
      }

    }

    return sm2;

  };

  this.ok = function() {

    return (needsFlash ? (didInit && !disabled) : (sm2.useHTML5Audio && sm2.hasHTML5));

  };

  this.supported = this.ok; // legacy

  this.getMovie = function(smID) {

    // safety net: some old browsers differ on SWF references, possibly related to ExternalInterface / flash version
    return id(smID) || doc[smID] || window[smID];

  };

  /**
   * Creates a SMSound sound object instance.
   *
   * @param {object} oOptions Sound options (at minimum, id and url parameters are required.)
   * @return {object} SMSound The new SMSound object.
   */

  this.createSound = function(oOptions, _url) {

    var cs, cs_string, options, oSound = null;

    // <d>
    cs = sm + '.createSound(): ';
    cs_string = cs + str(!didInit?'notReady':'notOK');
    // </d>

    if (!didInit || !sm2.ok()) {
      complain(cs_string);
      return false;
    }

    if (_url !== _undefined) {
      // function overloading in JS! :) ..assume simple createSound(id, url) use case
      oOptions = {
        'id': oOptions,
        'url': _url
      };
    }

    // inherit from defaultOptions
    options = mixin(oOptions);

    options.url = parseURL(options.url);

    // generate an id, if needed.
    if (options.id === undefined) {
      options.id = sm2.setupOptions.idPrefix + (idCounter++);
    }

    // <d>
    if (options.id.toString().charAt(0).match(/^[0-9]$/)) {
      sm2._wD(cs + str('badID', options.id), 2);
    }

    sm2._wD(cs + options.id + (options.url ? ' (' + options.url + ')' : ''), 1);
    // </d>

    if (idCheck(options.id, true)) {
      sm2._wD(cs + options.id + ' exists', 1);
      return sm2.sounds[options.id];
    }

    function make() {

      options = loopFix(options);
      sm2.sounds[options.id] = new SMSound(options);
      sm2.soundIDs.push(options.id);
      return sm2.sounds[options.id];

    }

    if (html5OK(options)) {

      oSound = make();
      sm2._wD(options.id + ': Using HTML5');
      oSound._setup_html5(options);

    } else {

      if (sm2.html5Only) {
        sm2._wD(options.id + ': No HTML5 support for this sound, and no Flash. Exiting.');
        return make();
      }

      // TODO: Move HTML5/flash checks into generic URL parsing/handling function.

      if (sm2.html5.usingFlash && options.url && options.url.match(/data\:/i)) {
        // data: URIs not supported by Flash, either.
        sm2._wD(options.id + ': data: URIs not supported via Flash. Exiting.');
        return make();
      }

      if (fV > 8) {
        if (options.isMovieStar === null) {
          // attempt to detect MPEG-4 formats
          options.isMovieStar = !!(options.serverURL || (options.type ? options.type.match(netStreamMimeTypes) : false) || (options.url && options.url.match(netStreamPattern)));
        }
        // <d>
        if (options.isMovieStar) {
          sm2._wD(cs + 'using MovieStar handling');
          if (options.loops > 1) {
            _wDS('noNSLoop');
          }
        }
        // </d>
      }

      options = policyFix(options, cs);
      oSound = make();

      if (fV === 8) {
        flash._createSound(options.id, options.loops||1, options.usePolicyFile);
      } else {
        flash._createSound(options.id, options.url, options.usePeakData, options.useWaveformData, options.useEQData, options.isMovieStar, (options.isMovieStar?options.bufferTime:false), options.loops||1, options.serverURL, options.duration||null, options.autoPlay, true, options.autoLoad, options.usePolicyFile);
        if (!options.serverURL) {
          // We are connected immediately
          oSound.connected = true;
          if (options.onconnect) {
            options.onconnect.apply(oSound);
          }
        }
      }

      if (!options.serverURL && (options.autoLoad || options.autoPlay)) {
        // call load for non-rtmp streams
        oSound.load(options);
      }

    }

    // rtmp will play in onconnect
    if (!options.serverURL && options.autoPlay) {
      oSound.play();
    }

    return oSound;

  };

  /**
   * Destroys a SMSound sound object instance.
   *
   * @param {string} sID The ID of the sound to destroy
   */

  this.destroySound = function(sID, _bFromSound) {

    // explicitly destroy a sound before normal page unload, etc.

    if (!idCheck(sID)) {
      return false;
    }

    var oS = sm2.sounds[sID], i;

    // Disable all callbacks while the sound is being destroyed
    oS._iO = {};

    oS.stop();
    oS.unload();

    for (i = 0; i < sm2.soundIDs.length; i++) {
      if (sm2.soundIDs[i] === sID) {
        sm2.soundIDs.splice(i, 1);
        break;
      }
    }

    if (!_bFromSound) {
      // ignore if being called from SMSound instance
      oS.destruct(true);
    }

    oS = null;
    delete sm2.sounds[sID];

    return true;

  };

  /**
   * Calls the load() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {object} oOptions Optional: Sound options
   */

  this.load = function(sID, oOptions) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].load(oOptions);

  };

  /**
   * Calls the unload() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   */

  this.unload = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].unload();

  };

  /**
   * Calls the onPosition() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {number} nPosition The position to watch for
   * @param {function} oMethod The relevant callback to fire
   * @param {object} oScope Optional: The scope to apply the callback to
   * @return {SMSound} The SMSound object
   */

  this.onPosition = function(sID, nPosition, oMethod, oScope) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].onposition(nPosition, oMethod, oScope);

  };

  // legacy/backwards-compability: lower-case method name
  this.onposition = this.onPosition;

  /**
   * Calls the clearOnPosition() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {number} nPosition The position to watch for
   * @param {function} oMethod Optional: The relevant callback to fire
   * @return {SMSound} The SMSound object
   */

  this.clearOnPosition = function(sID, nPosition, oMethod) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].clearOnPosition(nPosition, oMethod);

  };

  /**
   * Calls the play() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {object} oOptions Optional: Sound options
   * @return {SMSound} The SMSound object
   */

  this.play = function(sID, oOptions) {

    var result = null,
        // legacy function-overloading use case: play('mySound', '/path/to/some.mp3');
        overloaded = (oOptions && !(oOptions instanceof Object));

    if (!didInit || !sm2.ok()) {
      complain(sm + '.play(): ' + str(!didInit?'notReady':'notOK'));
      return false;
    }

    if (!idCheck(sID, overloaded)) {

      if (!overloaded) {
        // no sound found for the given ID. Bail.
        return false;
      }

      if (overloaded) {
        oOptions = {
          url: oOptions
        };
      }

      if (oOptions && oOptions.url) {
        // overloading use case, create+play: .play('someID', {url:'/path/to.mp3'});
        sm2._wD(sm + '.play(): Attempting to create "' + sID + '"', 1);
        oOptions.id = sID;
        result = sm2.createSound(oOptions).play();
      }

    } else if (overloaded) {

      // existing sound object case
      oOptions = {
        url: oOptions
      };

    }

    if (result === null) {
      // default case
      result = sm2.sounds[sID].play(oOptions);
    }

    return result;

  };

  this.start = this.play; // just for convenience

  /**
   * Calls the setPosition() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {number} nMsecOffset Position (milliseconds)
   * @return {SMSound} The SMSound object
   */

  this.setPosition = function(sID, nMsecOffset) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].setPosition(nMsecOffset);

  };

  /**
   * Calls the stop() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.stop = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }

    sm2._wD(sm + '.stop(' + sID + ')', 1);
    return sm2.sounds[sID].stop();

  };

  /**
   * Stops all currently-playing sounds.
   */

  this.stopAll = function() {

    var oSound;
    sm2._wD(sm + '.stopAll()', 1);

    for (oSound in sm2.sounds) {
      if (sm2.sounds.hasOwnProperty(oSound)) {
        // apply only to sound objects
        sm2.sounds[oSound].stop();
      }
    }

  };

  /**
   * Calls the pause() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.pause = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].pause();

  };

  /**
   * Pauses all currently-playing sounds.
   */

  this.pauseAll = function() {

    var i;
    for (i = sm2.soundIDs.length-1; i >= 0; i--) {
      sm2.sounds[sm2.soundIDs[i]].pause();
    }

  };

  /**
   * Calls the resume() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.resume = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].resume();

  };

  /**
   * Resumes all currently-paused sounds.
   */

  this.resumeAll = function() {

    var i;
    for (i = sm2.soundIDs.length-1; i >= 0; i--) {
      sm2.sounds[sm2.soundIDs[i]].resume();
    }

  };

  /**
   * Calls the togglePause() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.togglePause = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].togglePause();

  };

  /**
   * Calls the setPan() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {number} nPan The pan value (-100 to 100)
   * @return {SMSound} The SMSound object
   */

  this.setPan = function(sID, nPan) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].setPan(nPan);

  };

  /**
   * Calls the setVolume() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @param {number} nVol The volume value (0 to 100)
   * @return {SMSound} The SMSound object
   */

  this.setVolume = function(sID, nVol) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].setVolume(nVol);

  };

  /**
   * Calls the mute() method of either a single SMSound object by ID, or all sound objects.
   *
   * @param {string} sID Optional: The ID of the sound (if omitted, all sounds will be used.)
   */

  this.mute = function(sID) {

    var i = 0;

    if (sID instanceof String) {
      sID = null;
    }

    if (!sID) {

      sm2._wD(sm + '.mute(): Muting all sounds');
      for (i = sm2.soundIDs.length-1; i >= 0; i--) {
        sm2.sounds[sm2.soundIDs[i]].mute();
      }
      sm2.muted = true;

    } else {

      if (!idCheck(sID)) {
        return false;
      }
      sm2._wD(sm + '.mute(): Muting "' + sID + '"');
      return sm2.sounds[sID].mute();

    }

    return true;

  };

  /**
   * Mutes all sounds.
   */

  this.muteAll = function() {

    sm2.mute();

  };

  /**
   * Calls the unmute() method of either a single SMSound object by ID, or all sound objects.
   *
   * @param {string} sID Optional: The ID of the sound (if omitted, all sounds will be used.)
   */

  this.unmute = function(sID) {

    var i;

    if (sID instanceof String) {
      sID = null;
    }

    if (!sID) {

      sm2._wD(sm + '.unmute(): Unmuting all sounds');
      for (i = sm2.soundIDs.length-1; i >= 0; i--) {
        sm2.sounds[sm2.soundIDs[i]].unmute();
      }
      sm2.muted = false;

    } else {

      if (!idCheck(sID)) {
        return false;
      }
      sm2._wD(sm + '.unmute(): Unmuting "' + sID + '"');
      return sm2.sounds[sID].unmute();

    }

    return true;

  };

  /**
   * Unmutes all sounds.
   */

  this.unmuteAll = function() {

    sm2.unmute();

  };

  /**
   * Calls the toggleMute() method of a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.toggleMute = function(sID) {

    if (!idCheck(sID)) {
      return false;
    }
    return sm2.sounds[sID].toggleMute();

  };

  /**
   * Retrieves the memory used by the flash plugin.
   *
   * @return {number} The amount of memory in use
   */

  this.getMemoryUse = function() {

    // flash-only
    var ram = 0;

    if (flash && fV !== 8) {
      ram = parseInt(flash._getMemoryUse(), 10);
    }

    return ram;

  };

  /**
   * Undocumented: NOPs soundManager and all SMSound objects.
   */

  this.disable = function(bNoDisable) {

    // destroy all functions
    var i;

    if (bNoDisable === _undefined) {
      bNoDisable = false;
    }

    if (disabled) {
      return false;
    }

    disabled = true;
    _wDS('shutdown', 1);

    for (i = sm2.soundIDs.length-1; i >= 0; i--) {
      disableObject(sm2.sounds[sm2.soundIDs[i]]);
    }

    // fire "complete", despite fail
    initComplete(bNoDisable);
    event.remove(window, 'load', initUserOnload);

    return true;

  };

  /**
   * Determines playability of a MIME type, eg. 'audio/mp3'.
   */

  this.canPlayMIME = function(sMIME) {

    var result;

    if (sm2.hasHTML5) {
      result = html5CanPlay({type:sMIME});
    }

    if (!result && needsFlash) {
      // if flash 9, test netStream (movieStar) types as well.
      result = (sMIME && sm2.ok() ? !!((fV > 8 ? sMIME.match(netStreamMimeTypes) : null) || sMIME.match(sm2.mimePattern)) : null); // TODO: make less "weird" (per JSLint)
    }

    return result;

  };

  /**
   * Determines playability of a URL based on audio support.
   *
   * @param {string} sURL The URL to test
   * @return {boolean} URL playability
   */

  this.canPlayURL = function(sURL) {

    var result;

    if (sm2.hasHTML5) {
      result = html5CanPlay({url: sURL});
    }

    if (!result && needsFlash) {
      result = (sURL && sm2.ok() ? !!(sURL.match(sm2.filePattern)) : null);
    }

    return result;

  };

  /**
   * Determines playability of an HTML DOM &lt;a&gt; object (or similar object literal) based on audio support.
   *
   * @param {object} oLink an HTML DOM &lt;a&gt; object or object literal including href and/or type attributes
   * @return {boolean} URL playability
   */

  this.canPlayLink = function(oLink) {

    if (oLink.type !== _undefined && oLink.type) {
      if (sm2.canPlayMIME(oLink.type)) {
        return true;
      }
    }

    return sm2.canPlayURL(oLink.href);

  };

  /**
   * Retrieves a SMSound object by ID.
   *
   * @param {string} sID The ID of the sound
   * @return {SMSound} The SMSound object
   */

  this.getSoundById = function(sID, _suppressDebug) {

    if (!sID) {
      return null;
    }

    var result = sm2.sounds[sID];

    // <d>
    if (!result && !_suppressDebug) {
      sm2._wD(sm + '.getSoundById(): Sound "' + sID + '" not found.', 2);
    }
    // </d>

    return result;

  };

  /**
   * Queues a callback for execution when SoundManager has successfully initialized.
   *
   * @param {function} oMethod The callback method to fire
   * @param {object} oScope Optional: The scope to apply to the callback
   */

  this.onready = function(oMethod, oScope) {

    var sType = 'onready',
        result = false;

    if (typeof oMethod === 'function') {

      // <d>
      if (didInit) {
        sm2._wD(str('queue', sType));
      }
      // </d>

      if (!oScope) {
        oScope = window;
      }

      addOnEvent(sType, oMethod, oScope);
      processOnEvents();

      result = true;

    } else {

      throw str('needFunction', sType);

    }

    return result;

  };

  /**
   * Queues a callback for execution when SoundManager has failed to initialize.
   *
   * @param {function} oMethod The callback method to fire
   * @param {object} oScope Optional: The scope to apply to the callback
   */

  this.ontimeout = function(oMethod, oScope) {

    var sType = 'ontimeout',
        result = false;

    if (typeof oMethod === 'function') {

      // <d>
      if (didInit) {
        sm2._wD(str('queue', sType));
      }
      // </d>

      if (!oScope) {
        oScope = window;
      }

      addOnEvent(sType, oMethod, oScope);
      processOnEvents({type:sType});

      result = true;

    } else {

      throw str('needFunction', sType);

    }

    return result;

  };

  /**
   * Writes console.log()-style debug output to a console or in-browser element.
   * Applies when debugMode = true
   *
   * @param {string} sText The console message
   * @param {object} nType Optional log level (number), or object. Number case: Log type/style where 0 = 'info', 1 = 'warn', 2 = 'error'. Object case: Object to be dumped.
   */

  this._writeDebug = function(sText, sTypeOrObject) {

    // pseudo-private console.log()-style output
    // <d>

    var sDID = 'soundmanager-debug', o, oItem;

    if (!sm2.debugMode) {
      return false;
    }

    if (hasConsole && sm2.useConsole) {
      if (sTypeOrObject && typeof sTypeOrObject === 'object') {
        // object passed; dump to console.
        console.log(sText, sTypeOrObject);
      } else if (debugLevels[sTypeOrObject] !== _undefined) {
        console[debugLevels[sTypeOrObject]](sText);
      } else {
        console.log(sText);
      }
      if (sm2.consoleOnly) {
        return true;
      }
    }

    o = id(sDID);

    if (!o) {
      return false;
    }

    oItem = doc.createElement('div');

    if (++wdCount % 2 === 0) {
      oItem.className = 'sm2-alt';
    }

    if (sTypeOrObject === _undefined) {
      sTypeOrObject = 0;
    } else {
      sTypeOrObject = parseInt(sTypeOrObject, 10);
    }

    oItem.appendChild(doc.createTextNode(sText));

    if (sTypeOrObject) {
      if (sTypeOrObject >= 2) {
        oItem.style.fontWeight = 'bold';
      }
      if (sTypeOrObject === 3) {
        oItem.style.color = '#ff3333';
      }
    }

    // top-to-bottom
    // o.appendChild(oItem);

    // bottom-to-top
    o.insertBefore(oItem, o.firstChild);

    o = null;
    // </d>

    return true;

  };

  // <d>
  // last-resort debugging option
  if (wl.indexOf('sm2-debug=alert') !== -1) {
    this._writeDebug = function(sText) {
      window.alert(sText);
    };
  }
  // </d>

  // alias
  this._wD = this._writeDebug;

  /**
   * Provides debug / state information on all SMSound objects.
   */

  this._debug = function() {

    // <d>
    var i, j;
    _wDS('currentObj', 1);

    for (i = 0, j = sm2.soundIDs.length; i < j; i++) {
      sm2.sounds[sm2.soundIDs[i]]._debug();
    }
    // </d>

  };

  /**
   * Restarts and re-initializes the SoundManager instance.
   *
   * @param {boolean} resetEvents Optional: When true, removes all registered onready and ontimeout event callbacks.
   * @param {boolean} excludeInit Options: When true, does not call beginDelayedInit() (which would restart SM2).
   * @return {object} soundManager The soundManager instance.
   */

  this.reboot = function(resetEvents, excludeInit) {

    // reset some (or all) state, and re-init unless otherwise specified.

    // <d>
    if (sm2.soundIDs.length) {
      sm2._wD('Destroying ' + sm2.soundIDs.length + ' SMSound object' + (sm2.soundIDs.length !== 1 ? 's' : '') + '...');
    }
    // </d>

    var i, j, k;

    for (i = sm2.soundIDs.length-1; i >= 0; i--) {
      sm2.sounds[sm2.soundIDs[i]].destruct();
    }

    // trash ze flash (remove from the DOM)

    if (flash) {

      try {

        if (isIE) {
          oRemovedHTML = flash.innerHTML;
        }

        oRemoved = flash.parentNode.removeChild(flash);

      } catch(e) {

        // Remove failed? May be due to flash blockers silently removing the SWF object/embed node from the DOM. Warn and continue.

        _wDS('badRemove', 2);

      }

    }

    // actually, force recreate of movie.

    oRemovedHTML = oRemoved = needsFlash = flash = null;

    sm2.enabled = didDCLoaded = didInit = waitingForEI = initPending = didAppend = appendSuccess = disabled = useGlobalHTML5Audio = sm2.swfLoaded = false;

    sm2.soundIDs = [];
    sm2.sounds = {};

    idCounter = 0;

    if (!resetEvents) {
      // reset callbacks for onready, ontimeout etc. so that they will fire again on re-init
      for (i in on_queue) {
        if (on_queue.hasOwnProperty(i)) {
          for (j = 0, k = on_queue[i].length; j < k; j++) {
            on_queue[i][j].fired = false;
          }
        }
      }
    } else {
      // remove all callbacks entirely
      on_queue = [];
    }

    // <d>
    if (!excludeInit) {
      sm2._wD(sm + ': Rebooting...');
    }
    // </d>

    // reset HTML5 and flash canPlay test results

    sm2.html5 = {
      'usingFlash': null
    };

    sm2.flash = {};

    // reset device-specific HTML/flash mode switches

    sm2.html5Only = false;
    sm2.ignoreFlash = false;

    window.setTimeout(function() {

      preInit();

      // by default, re-init

      if (!excludeInit) {
        sm2.beginDelayedInit();
      }

    }, 20);

    return sm2;

  };

  this.reset = function() {

    /**
     * Shuts down and restores the SoundManager instance to its original loaded state, without an explicit reboot. All onready/ontimeout handlers are removed.
     * After this call, SM2 may be re-initialized via soundManager.beginDelayedInit().
     * @return {object} soundManager The soundManager instance.
     */

    _wDS('reset');
    return sm2.reboot(true, true);

  };

  /**
   * Undocumented: Determines the SM2 flash movie's load progress.
   *
   * @return {number or null} Percent loaded, or if invalid/unsupported, null.
   */

  this.getMoviePercent = function() {

    /**
     * Interesting syntax notes...
     * Flash/ExternalInterface (ActiveX/NPAPI) bridge methods are not typeof "function" nor instanceof Function, but are still valid.
     * Additionally, JSLint dislikes ('PercentLoaded' in flash)-style syntax and recommends hasOwnProperty(), which does not work in this case.
     * Furthermore, using (flash && flash.PercentLoaded) causes IE to throw "object doesn't support this property or method".
     * Thus, 'in' syntax must be used.
     */

    return (flash && 'PercentLoaded' in flash ? flash.PercentLoaded() : null); // Yes, JSLint. See nearby comment in source for explanation.

  };

  /**
   * Additional helper for manually invoking SM2's init process after DOM Ready / window.onload().
   */

  this.beginDelayedInit = function() {

    windowLoaded = true;
    domContentLoaded();

    setTimeout(function() {

      if (initPending) {
        return false;
      }

      createMovie();
      initMovie();
      initPending = true;

      return true;

    }, 20);

    delayWaitForEI();

  };

  /**
   * Destroys the SoundManager instance and all SMSound instances.
   */

  this.destruct = function() {

    sm2._wD(sm + '.destruct()');
    sm2.disable(true);

  };

  /**
   * SMSound() (sound object) constructor
   * ------------------------------------
   *
   * @param {object} oOptions Sound options (id and url are required attributes)
   * @return {SMSound} The new SMSound object
   */

  SMSound = function(oOptions) {

    var s = this, resetProperties, add_html5_events, remove_html5_events, stop_html5_timer, start_html5_timer, attachOnPosition, onplay_called = false, onPositionItems = [], onPositionFired = 0, detachOnPosition, applyFromTo, lastURL = null, lastHTML5State, urlOmitted;

    lastHTML5State = {
      // tracks duration + position (time)
      duration: null,
      time: null
    };

    this.id = oOptions.id;

    // legacy
    this.sID = this.id;

    this.url = oOptions.url;
    this.options = mixin(oOptions);

    // per-play-instance-specific options
    this.instanceOptions = this.options;

    // short alias
    this._iO = this.instanceOptions;

    // assign property defaults
    this.pan = this.options.pan;
    this.volume = this.options.volume;

    // whether or not this object is using HTML5
    this.isHTML5 = false;

    // internal HTML5 Audio() object reference
    this._a = null;

    // for flash 8 special-case createSound() without url, followed by load/play with url case
    urlOmitted = (this.url ? false : true);

    /**
     * SMSound() public methods
     * ------------------------
     */

    this.id3 = {};

    /**
     * Writes SMSound object parameters to debug console
     */

    this._debug = function() {

      // <d>
      sm2._wD(s.id + ': Merged options:', s.options);
      // </d>

    };

    /**
     * Begins loading a sound per its *url*.
     *
     * @param {object} oOptions Optional: Sound options
     * @return {SMSound} The SMSound object
     */

    this.load = function(oOptions) {

      var oSound = null, instanceOptions;

      if (oOptions !== _undefined) {
        s._iO = mixin(oOptions, s.options);
      } else {
        oOptions = s.options;
        s._iO = oOptions;
        if (lastURL && lastURL !== s.url) {
          _wDS('manURL');
          s._iO.url = s.url;
          s.url = null;
        }
      }

      if (!s._iO.url) {
        s._iO.url = s.url;
      }

      s._iO.url = parseURL(s._iO.url);

      // ensure we're in sync
      s.instanceOptions = s._iO;

      // local shortcut
      instanceOptions = s._iO;

      sm2._wD(s.id + ': load (' + instanceOptions.url + ')');

      if (!instanceOptions.url && !s.url) {
        sm2._wD(s.id + ': load(): url is unassigned. Exiting.', 2);
        return s;
      }

      // <d>
      if (!s.isHTML5 && fV === 8 && !s.url && !instanceOptions.autoPlay) {
        // flash 8 load() -> play() won't work before onload has fired.
        sm2._wD(s.id + ': Flash 8 load() limitation: Wait for onload() before calling play().', 1);
      }
      // </d>

      if (instanceOptions.url === s.url && s.readyState !== 0 && s.readyState !== 2) {
        _wDS('onURL', 1);
        // if loaded and an onload() exists, fire immediately.
        if (s.readyState === 3 && instanceOptions.onload) {
          // assume success based on truthy duration.
          wrapCallback(s, function() {
            instanceOptions.onload.apply(s, [(!!s.duration)]);
          });
        }
        return s;
      }

      // reset a few state properties

      s.loaded = false;
      s.readyState = 1;
      s.playState = 0;
      s.id3 = {};

      // TODO: If switching from HTML5 -> flash (or vice versa), stop currently-playing audio.

      if (html5OK(instanceOptions)) {

        oSound = s._setup_html5(instanceOptions);

        if (!oSound._called_load) {

          s._html5_canplay = false;

          // TODO: review called_load / html5_canplay logic

          // if url provided directly to load(), assign it here.

          if (s.url !== instanceOptions.url) {

            sm2._wD(_wDS('manURL') + ': ' + instanceOptions.url);

            s._a.src = instanceOptions.url;

            // TODO: review / re-apply all relevant options (volume, loop, onposition etc.)

            // reset position for new URL
            s.setPosition(0);

          }

          // given explicit load call, try to preload.

          // early HTML5 implementation (non-standard)
          s._a.autobuffer = 'auto';

          // standard property, values: none / metadata / auto
          // reference: http://msdn.microsoft.com/en-us/library/ie/ff974759%28v=vs.85%29.aspx
          s._a.preload = 'auto';

          s._a._called_load = true;

        } else {

          sm2._wD(s.id + ': Ignoring request to load again');

        }

      } else {

        if (sm2.html5Only) {
          sm2._wD(s.id + ': No flash support. Exiting.');
          return s;
        }

        if (s._iO.url && s._iO.url.match(/data\:/i)) {
          // data: URIs not supported by Flash, either.
          sm2._wD(s.id + ': data: URIs not supported via Flash. Exiting.');
          return s;
        }

        try {
          s.isHTML5 = false;
          s._iO = policyFix(loopFix(instanceOptions));
          // re-assign local shortcut
          instanceOptions = s._iO;
          if (fV === 8) {
            flash._load(s.id, instanceOptions.url, instanceOptions.stream, instanceOptions.autoPlay, instanceOptions.usePolicyFile);
          } else {
            flash._load(s.id, instanceOptions.url, !!(instanceOptions.stream), !!(instanceOptions.autoPlay), instanceOptions.loops||1, !!(instanceOptions.autoLoad), instanceOptions.usePolicyFile);
          }
        } catch(e) {
          _wDS('smError', 2);
          debugTS('onload', false);
          catchError({type:'SMSOUND_LOAD_JS_EXCEPTION', fatal:true});
        }

      }

      // after all of this, ensure sound url is up to date.
      s.url = instanceOptions.url;

      return s;

    };

    /**
     * Unloads a sound, canceling any open HTTP requests.
     *
     * @return {SMSound} The SMSound object
     */

    this.unload = function() {

      // Flash 8/AS2 can't "close" a stream - fake it by loading an empty URL
      // Flash 9/AS3: Close stream, preventing further load
      // HTML5: Most UAs will use empty URL

      if (s.readyState !== 0) {

        sm2._wD(s.id + ': unload()');

        if (!s.isHTML5) {

          if (fV === 8) {
            flash._unload(s.id, emptyURL);
          } else {
            flash._unload(s.id);
          }

        } else {

          stop_html5_timer();

          if (s._a) {

            s._a.pause();

            // update empty URL, too
            lastURL = html5Unload(s._a);

          }

        }

        // reset load/status flags
        resetProperties();

      }

      return s;

    };

    /**
     * Unloads and destroys a sound.
     */

    this.destruct = function(_bFromSM) {

      sm2._wD(s.id + ': Destruct');

      if (!s.isHTML5) {

        // kill sound within Flash
        // Disable the onfailure handler
        s._iO.onfailure = null;
        flash._destroySound(s.id);

      } else {

        stop_html5_timer();

        if (s._a) {
          s._a.pause();
          html5Unload(s._a);
          if (!useGlobalHTML5Audio) {
            remove_html5_events();
          }
          // break obvious circular reference
          s._a._s = null;
          s._a = null;
        }

      }

      if (!_bFromSM) {
        // ensure deletion from controller
        sm2.destroySound(s.id, true);
      }

    };

    /**
     * Begins playing a sound.
     *
     * @param {object} oOptions Optional: Sound options
     * @return {SMSound} The SMSound object
     */

    this.play = function(oOptions, _updatePlayState) {

      var fN, allowMulti, a, onready,
          audioClone, onended, oncanplay,
          startOK = true,
          exit = null;

      // <d>
      fN = s.id + ': play(): ';
      // </d>

      // default to true
      _updatePlayState = (_updatePlayState === _undefined ? true : _updatePlayState);

      if (!oOptions) {
        oOptions = {};
      }

      // first, use local URL (if specified)
      if (s.url) {
        s._iO.url = s.url;
      }

      // mix in any options defined at createSound()
      s._iO = mixin(s._iO, s.options);

      // mix in any options specific to this method
      s._iO = mixin(oOptions, s._iO);

      s._iO.url = parseURL(s._iO.url);

      s.instanceOptions = s._iO;

      // RTMP-only
      if (!s.isHTML5 && s._iO.serverURL && !s.connected) {
        if (!s.getAutoPlay()) {
          sm2._wD(fN +' Netstream not connected yet - setting autoPlay');
          s.setAutoPlay(true);
        }
        // play will be called in onconnect()
        return s;
      }

      if (html5OK(s._iO)) {
        s._setup_html5(s._iO);
        start_html5_timer();
      }

      if (s.playState === 1 && !s.paused) {
        allowMulti = s._iO.multiShot;
        if (!allowMulti) {
          sm2._wD(fN + 'Already playing (one-shot)', 1);
          if (s.isHTML5) {
            // go back to original position.
            s.setPosition(s._iO.position);
          }
          exit = s;
        } else {
          sm2._wD(fN + 'Already playing (multi-shot)', 1);
        }
      }

      if (exit !== null) {
        return exit;
      }

      // edge case: play() with explicit URL parameter
      if (oOptions.url && oOptions.url !== s.url) {

        // special case for createSound() followed by load() / play() with url; avoid double-load case.
        if (!s.readyState && !s.isHTML5 && fV === 8 && urlOmitted) {

          urlOmitted = false;

        } else {

          // load using merged options
          s.load(s._iO);

        }

      }

      if (!s.loaded) {

        if (s.readyState === 0) {

          sm2._wD(fN + 'Attempting to load');

          // try to get this sound playing ASAP
          if (!s.isHTML5 && !sm2.html5Only) {

            // flash: assign directly because setAutoPlay() increments the instanceCount
            s._iO.autoPlay = true;
            s.load(s._iO);

          } else if (s.isHTML5) {

            // iOS needs this when recycling sounds, loading a new URL on an existing object.
            s.load(s._iO);

          } else {

            sm2._wD(fN + 'Unsupported type. Exiting.');
            exit = s;

          }

          // HTML5 hack - re-set instanceOptions?
          s.instanceOptions = s._iO;

        } else if (s.readyState === 2) {

          sm2._wD(fN + 'Could not load - exiting', 2);
          exit = s;

        } else {

          sm2._wD(fN + 'Loading - attempting to play...');

        }

      } else {

        // "play()"
        sm2._wD(fN.substr(0, fN.lastIndexOf(':')));

      }

      if (exit !== null) {
        return exit;
      }

      if (!s.isHTML5 && fV === 9 && s.position > 0 && s.position === s.duration) {
        // flash 9 needs a position reset if play() is called while at the end of a sound.
        sm2._wD(fN + 'Sound at end, resetting to position:0');
        oOptions.position = 0;
      }

      /**
       * Streams will pause when their buffer is full if they are being loaded.
       * In this case paused is true, but the song hasn't started playing yet.
       * If we just call resume() the onplay() callback will never be called.
       * So only call resume() if the position is > 0.
       * Another reason is because options like volume won't have been applied yet.
       * For normal sounds, just resume.
       */

      if (s.paused && s.position >= 0 && (!s._iO.serverURL || s.position > 0)) {

        // https://gist.github.com/37b17df75cc4d7a90bf6
        sm2._wD(fN + 'Resuming from paused state', 1);
        s.resume();

      } else {

        s._iO = mixin(oOptions, s._iO);

        // apply from/to parameters, if they exist (and not using RTMP)
        if (s._iO.from !== null && s._iO.to !== null && s.instanceCount === 0 && s.playState === 0 && !s._iO.serverURL) {

          onready = function() {
            // sound "canplay" or onload()
            // re-apply from/to to instance options, and start playback
            s._iO = mixin(oOptions, s._iO);
            s.play(s._iO);
          };

          // HTML5 needs to at least have "canplay" fired before seeking.
          if (s.isHTML5 && !s._html5_canplay) {

            // this hasn't been loaded yet. load it first, and then do this again.
            sm2._wD(fN + 'Beginning load for from/to case');

            s.load({
              // note: custom HTML5-only event added for from/to implementation.
              _oncanplay: onready
            });

            exit = false;

          } else if (!s.isHTML5 && !s.loaded && (!s.readyState || s.readyState !== 2)) {

            // to be safe, preload the whole thing in Flash.

            sm2._wD(fN + 'Preloading for from/to case');

            s.load({
              onload: onready
            });

            exit = false;

          }

          if (exit !== null) {
            return exit;
          }

          // otherwise, we're ready to go. re-apply local options, and continue

          s._iO = applyFromTo();

        }

        // sm2._wD(fN + 'Starting to play');

        // increment instance counter, where enabled + supported
        if (!s.instanceCount || s._iO.multiShotEvents || (s.isHTML5 && s._iO.multiShot && !useGlobalHTML5Audio) || (!s.isHTML5 && fV > 8 && !s.getAutoPlay())) {
          s.instanceCount++;
        }

        // if first play and onposition parameters exist, apply them now
        if (s._iO.onposition && s.playState === 0) {
          attachOnPosition(s);
        }

        s.playState = 1;
        s.paused = false;

        s.position = (s._iO.position !== _undefined && !isNaN(s._iO.position) ? s._iO.position : 0);

        if (!s.isHTML5) {
          s._iO = policyFix(loopFix(s._iO));
        }

        if (s._iO.onplay && _updatePlayState) {
          s._iO.onplay.apply(s);
          onplay_called = true;
        }

        s.setVolume(s._iO.volume, true);
        s.setPan(s._iO.pan, true);

        if (!s.isHTML5) {

          startOK = flash._start(s.id, s._iO.loops || 1, (fV === 9 ? s.position : s.position / msecScale), s._iO.multiShot || false);

          if (fV === 9 && !startOK) {
            // edge case: no sound hardware, or 32-channel flash ceiling hit.
            // applies only to Flash 9, non-NetStream/MovieStar sounds.
            // http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/media/Sound.html#play%28%29
            sm2._wD(fN + 'No sound hardware, or 32-sound ceiling hit', 2);
            if (s._iO.onplayerror) {
              s._iO.onplayerror.apply(s);
            }

          }

        } else {

          if (s.instanceCount < 2) {

            // HTML5 single-instance case

            start_html5_timer();

            a = s._setup_html5();

            s.setPosition(s._iO.position);

            a.play();

          } else {

            // HTML5 multi-shot case

            sm2._wD(s.id + ': Cloning Audio() for instance #' + s.instanceCount + '...');

            audioClone = new Audio(s._iO.url);

            onended = function() {
              event.remove(audioClone, 'ended', onended);
              s._onfinish(s);
              // cleanup
              html5Unload(audioClone);
              audioClone = null;
            };

            oncanplay = function() {
              event.remove(audioClone, 'canplay', oncanplay);
              try {
                audioClone.currentTime = s._iO.position/msecScale;
              } catch(err) {
                complain(s.id + ': multiShot play() failed to apply position of ' + (s._iO.position/msecScale));
              }
              audioClone.play();
            };

            event.add(audioClone, 'ended', onended);

            // apply volume to clones, too
            if (s._iO.volume !== undefined) {
              audioClone.volume = Math.max(0, Math.min(1, s._iO.volume/100));
            }

            // playing multiple muted sounds? if you do this, you're weird ;) - but let's cover it.
            if (s.muted) {
              audioClone.muted = true;
            }

            if (s._iO.position) {
              // HTML5 audio can't seek before onplay() event has fired.
              // wait for canplay, then seek to position and start playback.
              event.add(audioClone, 'canplay', oncanplay);
            } else {
              // begin playback at currentTime: 0
              audioClone.play();
            }

          }

        }

      }

      return s;

    };

    // just for convenience
    this.start = this.play;

    /**
     * Stops playing a sound (and optionally, all sounds)
     *
     * @param {boolean} bAll Optional: Whether to stop all sounds
     * @return {SMSound} The SMSound object
     */

    this.stop = function(bAll) {

      var instanceOptions = s._iO,
          originalPosition;

      if (s.playState === 1) {

        sm2._wD(s.id + ': stop()');

        s._onbufferchange(0);
        s._resetOnPosition(0);
        s.paused = false;

        if (!s.isHTML5) {
          s.playState = 0;
        }

        // remove onPosition listeners, if any
        detachOnPosition();

        // and "to" position, if set
        if (instanceOptions.to) {
          s.clearOnPosition(instanceOptions.to);
        }

        if (!s.isHTML5) {

          flash._stop(s.id, bAll);

          // hack for netStream: just unload
          if (instanceOptions.serverURL) {
            s.unload();
          }

        } else {

          if (s._a) {

            originalPosition = s.position;

            // act like Flash, though
            s.setPosition(0);

            // hack: reflect old position for onstop() (also like Flash)
            s.position = originalPosition;

            // html5 has no stop()
            // NOTE: pausing means iOS requires interaction to resume.
            s._a.pause();

            s.playState = 0;

            // and update UI
            s._onTimer();

            stop_html5_timer();

          }

        }

        s.instanceCount = 0;
        s._iO = {};

        if (instanceOptions.onstop) {
          instanceOptions.onstop.apply(s);
        }

      }

      return s;

    };

    /**
     * Undocumented/internal: Sets autoPlay for RTMP.
     *
     * @param {boolean} autoPlay state
     */

    this.setAutoPlay = function(autoPlay) {

      sm2._wD(s.id + ': Autoplay turned ' + (autoPlay ? 'on' : 'off'));
      s._iO.autoPlay = autoPlay;

      if (!s.isHTML5) {
        flash._setAutoPlay(s.id, autoPlay);
        if (autoPlay) {
          // only increment the instanceCount if the sound isn't loaded (TODO: verify RTMP)
          if (!s.instanceCount && s.readyState === 1) {
            s.instanceCount++;
            sm2._wD(s.id + ': Incremented instance count to '+s.instanceCount);
          }
        }
      }

    };

    /**
     * Undocumented/internal: Returns the autoPlay boolean.
     *
     * @return {boolean} The current autoPlay value
     */

    this.getAutoPlay = function() {

      return s._iO.autoPlay;

    };

    /**
     * Sets the position of a sound.
     *
     * @param {number} nMsecOffset Position (milliseconds)
     * @return {SMSound} The SMSound object
     */

    this.setPosition = function(nMsecOffset) {

      if (nMsecOffset === _undefined) {
        nMsecOffset = 0;
      }

      var position, position1K,
          // Use the duration from the instance options, if we don't have a track duration yet.
          // position >= 0 and <= current available (loaded) duration
          offset = (s.isHTML5 ? Math.max(nMsecOffset, 0) : Math.min(s.duration || s._iO.duration, Math.max(nMsecOffset, 0)));

      s.position = offset;
      position1K = s.position/msecScale;
      s._resetOnPosition(s.position);
      s._iO.position = offset;

      if (!s.isHTML5) {

        position = (fV === 9 ? s.position : position1K);

        if (s.readyState && s.readyState !== 2) {
          // if paused or not playing, will not resume (by playing)
          flash._setPosition(s.id, position, (s.paused || !s.playState), s._iO.multiShot);
        }

      } else if (s._a) {

        // Set the position in the canplay handler if the sound is not ready yet
        if (s._html5_canplay) {

          if (s._a.currentTime !== position1K) {

            /**
             * DOM/JS errors/exceptions to watch out for:
             * if seek is beyond (loaded?) position, "DOM exception 11"
             * "INDEX_SIZE_ERR": DOM exception 1
             */
            sm2._wD(s.id + ': setPosition('+position1K+')');

            try {
              s._a.currentTime = position1K;
              if (s.playState === 0 || s.paused) {
                // allow seek without auto-play/resume
                s._a.pause();
              }
            } catch(e) {
              sm2._wD(s.id + ': setPosition(' + position1K + ') failed: ' + e.message, 2);
            }

          }

        } else if (position1K) {

          // warn on non-zero seek attempts
          sm2._wD(s.id + ': setPosition(' + position1K + '): Cannot seek yet, sound not ready', 2);
          return s;

        }

        if (s.paused) {

          // if paused, refresh UI right away
          // force update
          s._onTimer(true);

        }

      }

      return s;

    };

    /**
     * Pauses sound playback.
     *
     * @return {SMSound} The SMSound object
     */

    this.pause = function(_bCallFlash) {

      if (s.paused || (s.playState === 0 && s.readyState !== 1)) {
        return s;
      }

      sm2._wD(s.id + ': pause()');
      s.paused = true;

      if (!s.isHTML5) {
        if (_bCallFlash || _bCallFlash === _undefined) {
          flash._pause(s.id, s._iO.multiShot);
        }
      } else {
        s._setup_html5().pause();
        stop_html5_timer();
      }

      if (s._iO.onpause) {
        s._iO.onpause.apply(s);
      }

      return s;

    };

    /**
     * Resumes sound playback.
     *
     * @return {SMSound} The SMSound object
     */

    /**
     * When auto-loaded streams pause on buffer full they have a playState of 0.
     * We need to make sure that the playState is set to 1 when these streams "resume".
     * When a paused stream is resumed, we need to trigger the onplay() callback if it
     * hasn't been called already. In this case since the sound is being played for the
     * first time, I think it's more appropriate to call onplay() rather than onresume().
     */

    this.resume = function() {

      var instanceOptions = s._iO;

      if (!s.paused) {
        return s;
      }

      sm2._wD(s.id + ': resume()');
      s.paused = false;
      s.playState = 1;

      if (!s.isHTML5) {
        if (instanceOptions.isMovieStar && !instanceOptions.serverURL) {
          // Bizarre Webkit bug (Chrome reported via 8tracks.com dudes): AAC content paused for 30+ seconds(?) will not resume without a reposition.
          s.setPosition(s.position);
        }
        // flash method is toggle-based (pause/resume)
        flash._pause(s.id, instanceOptions.multiShot);
      } else {
        s._setup_html5().play();
        start_html5_timer();
      }

      if (!onplay_called && instanceOptions.onplay) {
        instanceOptions.onplay.apply(s);
        onplay_called = true;
      } else if (instanceOptions.onresume) {
        instanceOptions.onresume.apply(s);
      }

      return s;

    };

    /**
     * Toggles sound playback.
     *
     * @return {SMSound} The SMSound object
     */

    this.togglePause = function() {

      sm2._wD(s.id + ': togglePause()');

      if (s.playState === 0) {
        s.play({
          position: (fV === 9 && !s.isHTML5 ? s.position : s.position / msecScale)
        });
        return s;
      }

      if (s.paused) {
        s.resume();
      } else {
        s.pause();
      }

      return s;

    };

    /**
     * Sets the panning (L-R) effect.
     *
     * @param {number} nPan The pan value (-100 to 100)
     * @return {SMSound} The SMSound object
     */

    this.setPan = function(nPan, bInstanceOnly) {

      if (nPan === _undefined) {
        nPan = 0;
      }

      if (bInstanceOnly === _undefined) {
        bInstanceOnly = false;
      }

      if (!s.isHTML5) {
        flash._setPan(s.id, nPan);
      } // else { no HTML5 pan? }

      s._iO.pan = nPan;

      if (!bInstanceOnly) {
        s.pan = nPan;
        s.options.pan = nPan;
      }

      return s;

    };

    /**
     * Sets the volume.
     *
     * @param {number} nVol The volume value (0 to 100)
     * @return {SMSound} The SMSound object
     */

    this.setVolume = function(nVol, _bInstanceOnly) {

      /**
       * Note: Setting volume has no effect on iOS "special snowflake" devices.
       * Hardware volume control overrides software, and volume
       * will always return 1 per Apple docs. (iOS 4 + 5.)
       * http://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/HTML-canvas-guide/AddingSoundtoCanvasAnimations/AddingSoundtoCanvasAnimations.html
       */

      if (nVol === _undefined) {
        nVol = 100;
      }

      if (_bInstanceOnly === _undefined) {
        _bInstanceOnly = false;
      }

      if (!s.isHTML5) {
        flash._setVolume(s.id, (sm2.muted && !s.muted) || s.muted?0:nVol);
      } else if (s._a) {
        if (sm2.muted && !s.muted) {
          s.muted = true;
          s._a.muted = true;
        }
        // valid range: 0-1
        s._a.volume = Math.max(0, Math.min(1, nVol/100));
      }

      s._iO.volume = nVol;

      if (!_bInstanceOnly) {
        s.volume = nVol;
        s.options.volume = nVol;
      }

      return s;

    };

    /**
     * Mutes the sound.
     *
     * @return {SMSound} The SMSound object
     */

    this.mute = function() {

      s.muted = true;

      if (!s.isHTML5) {
        flash._setVolume(s.id, 0);
      } else if (s._a) {
        s._a.muted = true;
      }

      return s;

    };

    /**
     * Unmutes the sound.
     *
     * @return {SMSound} The SMSound object
     */

    this.unmute = function() {

      s.muted = false;
      var hasIO = (s._iO.volume !== _undefined);

      if (!s.isHTML5) {
        flash._setVolume(s.id, hasIO?s._iO.volume:s.options.volume);
      } else if (s._a) {
        s._a.muted = false;
      }

      return s;

    };

    /**
     * Toggles the muted state of a sound.
     *
     * @return {SMSound} The SMSound object
     */

    this.toggleMute = function() {

      return (s.muted?s.unmute():s.mute());

    };

    /**
     * Registers a callback to be fired when a sound reaches a given position during playback.
     *
     * @param {number} nPosition The position to watch for
     * @param {function} oMethod The relevant callback to fire
     * @param {object} oScope Optional: The scope to apply the callback to
     * @return {SMSound} The SMSound object
     */

    this.onPosition = function(nPosition, oMethod, oScope) {

      // TODO: basic dupe checking?

      onPositionItems.push({
        position: parseInt(nPosition, 10),
        method: oMethod,
        scope: (oScope !== _undefined ? oScope : s),
        fired: false
      });

      return s;

    };

    // legacy/backwards-compability: lower-case method name
    this.onposition = this.onPosition;

    /**
     * Removes registered callback(s) from a sound, by position and/or callback.
     *
     * @param {number} nPosition The position to clear callback(s) for
     * @param {function} oMethod Optional: Identify one callback to be removed when multiple listeners exist for one position
     * @return {SMSound} The SMSound object
     */

    this.clearOnPosition = function(nPosition, oMethod) {

      var i;

      nPosition = parseInt(nPosition, 10);

      if (isNaN(nPosition)) {
        // safety check
        return false;
      }

      for (i=0; i < onPositionItems.length; i++) {

        if (nPosition === onPositionItems[i].position) {
          // remove this item if no method was specified, or, if the method matches
          if (!oMethod || (oMethod === onPositionItems[i].method)) {
            if (onPositionItems[i].fired) {
              // decrement "fired" counter, too
              onPositionFired--;
            }
            onPositionItems.splice(i, 1);
          }
        }

      }

    };

    this._processOnPosition = function() {

      var i, item, j = onPositionItems.length;
		
      if (!j || !s.playState || onPositionFired >= j) {
        return false;
      }

      for (i=j-1; i >= 0; i--) {
        item = onPositionItems[i];
        if (!item.fired && s.position >= item.position) {
          item.fired = true;
          onPositionFired++;
          item.method.apply(item.scope, [item.position]);
		  j = onPositionItems.length; //  reset j -- onPositionItems.length can be changed in the item callback above... occasionally breaking the loop.
        }
      }
	
      return true;

    };

    this._resetOnPosition = function(nPosition) {

      // reset "fired" for items interested in this position
      var i, item, j = onPositionItems.length;

      if (!j) {
        return false;
      }

      for (i=j-1; i >= 0; i--) {
        item = onPositionItems[i];
        if (item.fired && nPosition <= item.position) {
          item.fired = false;
          onPositionFired--;
        }
      }

      return true;

    };

    /**
     * SMSound() private internals
     * --------------------------------
     */

    applyFromTo = function() {

      var instanceOptions = s._iO,
          f = instanceOptions.from,
          t = instanceOptions.to,
          start, end;

      end = function() {

        // end has been reached.
        sm2._wD(s.id + ': "To" time of ' + t + ' reached.');

        // detach listener
        s.clearOnPosition(t, end);

        // stop should clear this, too
        s.stop();

      };

      start = function() {

        sm2._wD(s.id + ': Playing "from" ' + f);

        // add listener for end
        if (t !== null && !isNaN(t)) {
          s.onPosition(t, end);
        }

      };

      if (f !== null && !isNaN(f)) {

        // apply to instance options, guaranteeing correct start position.
        instanceOptions.position = f;

        // multiShot timing can't be tracked, so prevent that.
        instanceOptions.multiShot = false;

        start();

      }

      // return updated instanceOptions including starting position
      return instanceOptions;

    };

    attachOnPosition = function() {

      var item,
          op = s._iO.onposition;

      // attach onposition things, if any, now.

      if (op) {

        for (item in op) {
          if (op.hasOwnProperty(item)) {
            s.onPosition(parseInt(item, 10), op[item]);
          }
        }

      }

    };

    detachOnPosition = function() {

      var item,
          op = s._iO.onposition;

      // detach any onposition()-style listeners.

      if (op) {

        for (item in op) {
          if (op.hasOwnProperty(item)) {
            s.clearOnPosition(parseInt(item, 10));
          }
        }

      }

    };

    start_html5_timer = function() {

      if (s.isHTML5) {
        startTimer(s);
      }

    };

    stop_html5_timer = function() {

      if (s.isHTML5) {
        stopTimer(s);
      }

    };

    resetProperties = function(retainPosition) {

      if (!retainPosition) {
        onPositionItems = [];
        onPositionFired = 0;
      }

      onplay_called = false;

      s._hasTimer = null;
      s._a = null;
      s._html5_canplay = false;
      s.bytesLoaded = null;
      s.bytesTotal = null;
      s.duration = (s._iO && s._iO.duration ? s._iO.duration : null);
      s.durationEstimate = null;
      s.buffered = [];

      // legacy: 1D array
      s.eqData = [];

      s.eqData.left = [];
      s.eqData.right = [];

      s.failures = 0;
      s.isBuffering = false;
      s.instanceOptions = {};
      s.instanceCount = 0;
      s.loaded = false;
      s.metadata = {};

      // 0 = uninitialised, 1 = loading, 2 = failed/error, 3 = loaded/success
      s.readyState = 0;

      s.muted = false;
      s.paused = false;

      s.peakData = {
        left: 0,
        right: 0
      };

      s.waveformData = {
        left: [],
        right: []
      };

      s.playState = 0;
      s.position = null;

      s.id3 = {};

    };

    resetProperties();

    /**
     * Pseudo-private SMSound internals
     * --------------------------------
     */

    this._onTimer = function(bForce) {

      /**
       * HTML5-only _whileplaying() etc.
       * called from both HTML5 native events, and polling/interval-based timers
       * mimics flash and fires only when time/duration change, so as to be polling-friendly
       */

      var duration, isNew = false, time, x = {};

      if (s._hasTimer || bForce) {

        // TODO: May not need to track readyState (1 = loading)

        if (s._a && (bForce || ((s.playState > 0 || s.readyState === 1) && !s.paused))) {

          duration = s._get_html5_duration();

          if (duration !== lastHTML5State.duration) {

            lastHTML5State.duration = duration;
            s.duration = duration;
            isNew = true;

          }

          // TODO: investigate why this goes wack if not set/re-set each time.
          s.durationEstimate = s.duration;

          time = (s._a.currentTime * msecScale || 0);

          if (time !== lastHTML5State.time) {

            lastHTML5State.time = time;
            isNew = true;

          }

          if (isNew || bForce) {

            s._whileplaying(time,x,x,x,x);

          }

        }/* else {

          // sm2._wD('_onTimer: Warn for "'+s.id+'": '+(!s._a?'Could not find element. ':'')+(s.playState === 0?'playState bad, 0?':'playState = '+s.playState+', OK'));

          return false;

        }*/

        return isNew;

      }

    };

    this._get_html5_duration = function() {

      var instanceOptions = s._iO,
          // if audio object exists, use its duration - else, instance option duration (if provided - it's a hack, really, and should be retired) OR null
          d = (s._a && s._a.duration ? s._a.duration*msecScale : (instanceOptions && instanceOptions.duration ? instanceOptions.duration : null)),
          result = (d && !isNaN(d) && d !== Infinity ? d : null);

      return result;

    };

    this._apply_loop = function(a, nLoops) {

      /**
       * boolean instead of "loop", for webkit? - spec says string. http://www.w3.org/TR/html-markup/audio.html#audio.attrs.loop
       * note that loop is either off or infinite under HTML5, unlike Flash which allows arbitrary loop counts to be specified.
       */

      // <d>
      if (!a.loop && nLoops > 1) {
        sm2._wD('Note: Native HTML5 looping is infinite.', 1);
      }
      // </d>

      a.loop = (nLoops > 1 ? 'loop' : '');

    };

    this._setup_html5 = function(oOptions) {

      var instanceOptions = mixin(s._iO, oOptions),
          a = useGlobalHTML5Audio ? globalHTML5Audio : s._a,
          dURL = decodeURI(instanceOptions.url),
          sameURL;

      /**
       * "First things first, I, Poppa..." (reset the previous state of the old sound, if playing)
       * Fixes case with devices that can only play one sound at a time
       * Otherwise, other sounds in mid-play will be terminated without warning and in a stuck state
       */

      if (useGlobalHTML5Audio) {

        if (dURL === decodeURI(lastGlobalHTML5URL)) {
          // global HTML5 audio: re-use of URL
          sameURL = true;
        }

      } else if (dURL === decodeURI(lastURL)) {

        // options URL is the same as the "last" URL, and we used (loaded) it
        sameURL = true;

      }

      if (a) {

        if (a._s) {

          if (useGlobalHTML5Audio) {

            if (a._s && a._s.playState && !sameURL) {

              // global HTML5 audio case, and loading a new URL. stop the currently-playing one.
              a._s.stop();

            }

          } else if (!useGlobalHTML5Audio && dURL === decodeURI(lastURL)) {

            // non-global HTML5 reuse case: same url, ignore request
            s._apply_loop(a, instanceOptions.loops);

            return a;

          }

        }

        if (!sameURL) {

          // don't retain onPosition() stuff with new URLs.

          if (lastURL) {
            resetProperties(false);
          }

          // assign new HTML5 URL

          a.src = instanceOptions.url;

          s.url = instanceOptions.url;

          lastURL = instanceOptions.url;

          lastGlobalHTML5URL = instanceOptions.url;

          a._called_load = false;

        }

      } else {

        if (instanceOptions.autoLoad || instanceOptions.autoPlay) {

          s._a = new Audio(instanceOptions.url);
          s._a.load();

        } else {

          // null for stupid Opera 9.64 case
          s._a = (isOpera && opera.version() < 10 ? new Audio(null) : new Audio());

        }

        // assign local reference
        a = s._a;

        a._called_load = false;

        if (useGlobalHTML5Audio) {

          globalHTML5Audio = a;

        }

      }

      s.isHTML5 = true;

      // store a ref on the track
      s._a = a;

      // store a ref on the audio
      a._s = s;

      add_html5_events();

      s._apply_loop(a, instanceOptions.loops);

      if (instanceOptions.autoLoad || instanceOptions.autoPlay) {

        s.load();

      } else {

        // early HTML5 implementation (non-standard)
        a.autobuffer = false;

        // standard ('none' is also an option.)
        a.preload = 'auto';

      }

      return a;

    };

    add_html5_events = function() {

      if (s._a._added_events) {
        return false;
      }

      var f;

      function add(oEvt, oFn, bCapture) {
        return s._a ? s._a.addEventListener(oEvt, oFn, bCapture||false) : null;
      }

      s._a._added_events = true;

      for (f in html5_events) {
        if (html5_events.hasOwnProperty(f)) {
          add(f, html5_events[f]);
        }
      }

      return true;

    };

    remove_html5_events = function() {

      // Remove event listeners

      var f;

      function remove(oEvt, oFn, bCapture) {
        return (s._a ? s._a.removeEventListener(oEvt, oFn, bCapture||false) : null);
      }

      sm2._wD(s.id + ': Removing event listeners');
      s._a._added_events = false;

      for (f in html5_events) {
        if (html5_events.hasOwnProperty(f)) {
          remove(f, html5_events[f]);
        }
      }

    };

    /**
     * Pseudo-private event internals
     * ------------------------------
     */

    this._onload = function(nSuccess) {

      var fN,
          // check for duration to prevent false positives from flash 8 when loading from cache.
          loadOK = !!nSuccess || (!s.isHTML5 && fV === 8 && s.duration);

      // <d>
      fN = s.id + ': ';
      sm2._wD(fN + (loadOK ? 'onload()' : 'Failed to load / invalid sound?' + (!s.duration ? ' Zero-length duration reported.' : ' -') + ' (' + s.url + ')'), (loadOK ? 1 : 2));
      if (!loadOK && !s.isHTML5) {
        if (sm2.sandbox.noRemote === true) {
          sm2._wD(fN + str('noNet'), 1);
        }
        if (sm2.sandbox.noLocal === true) {
          sm2._wD(fN + str('noLocal'), 1);
        }
      }
      // </d>

      s.loaded = loadOK;
      s.readyState = loadOK?3:2;
      s._onbufferchange(0);

      if (s._iO.onload) {
        wrapCallback(s, function() {
          s._iO.onload.apply(s, [loadOK]);
        });
      }

      return true;

    };

    this._onbufferchange = function(nIsBuffering) {

      if (s.playState === 0) {
        // ignore if not playing
        return false;
      }

      if ((nIsBuffering && s.isBuffering) || (!nIsBuffering && !s.isBuffering)) {
        return false;
      }

      s.isBuffering = (nIsBuffering === 1);
      if (s._iO.onbufferchange) {
        sm2._wD(s.id + ': Buffer state change: ' + nIsBuffering);
        s._iO.onbufferchange.apply(s);
      }

      return true;

    };

    /**
     * Playback may have stopped due to buffering, or related reason.
     * This state can be encountered on iOS < 6 when auto-play is blocked.
     */

    this._onsuspend = function() {

      if (s._iO.onsuspend) {
        sm2._wD(s.id + ': Playback suspended');
        s._iO.onsuspend.apply(s);
      }

      return true;

    };

    /**
     * flash 9/movieStar + RTMP-only method, should fire only once at most
     * at this point we just recreate failed sounds rather than trying to reconnect
     */

    this._onfailure = function(msg, level, code) {

      s.failures++;
      sm2._wD(s.id + ': Failures = ' + s.failures);

      if (s._iO.onfailure && s.failures === 1) {
        s._iO.onfailure(s, msg, level, code);
      } else {
        sm2._wD(s.id + ': Ignoring failure');
      }

    };

    this._onfinish = function() {

      // store local copy before it gets trashed...
      var io_onfinish = s._iO.onfinish;

      s._onbufferchange(0);
      s._resetOnPosition(0);

      // reset some state items
      if (s.instanceCount) {

        s.instanceCount--;

        if (!s.instanceCount) {

          // remove onPosition listeners, if any
          detachOnPosition();

          // reset instance options
          s.playState = 0;
          s.paused = false;
          s.instanceCount = 0;
          s.instanceOptions = {};
          s._iO = {};
          stop_html5_timer();

          // reset position, too
          if (s.isHTML5) {
            s.position = 0;
          }

        }

        if (!s.instanceCount || s._iO.multiShotEvents) {
          // fire onfinish for last, or every instance
          if (io_onfinish) {
            sm2._wD(s.id + ': onfinish()');
            wrapCallback(s, function() {
              io_onfinish.apply(s);
            });
          }
        }

      }

    };

    this._whileloading = function(nBytesLoaded, nBytesTotal, nDuration, nBufferLength) {

      var instanceOptions = s._iO;

      s.bytesLoaded = nBytesLoaded;
      s.bytesTotal = nBytesTotal;
      s.duration = Math.floor(nDuration);
      s.bufferLength = nBufferLength;

      if (!s.isHTML5 && !instanceOptions.isMovieStar) {

        if (instanceOptions.duration) {
          // use duration from options, if specified and larger. nobody should be specifying duration in options, actually, and it should be retired.
          s.durationEstimate = (s.duration > instanceOptions.duration) ? s.duration : instanceOptions.duration;
        } else {
          s.durationEstimate = parseInt((s.bytesTotal / s.bytesLoaded) * s.duration, 10);
        }

      } else {

        s.durationEstimate = s.duration;

      }

      // for flash, reflect sequential-load-style buffering
      if (!s.isHTML5) {
        s.buffered = [{
          'start': 0,
          'end': s.duration
        }];
      }

      // allow whileloading to fire even if "load" fired under HTML5, due to HTTP range/partials
      if ((s.readyState !== 3 || s.isHTML5) && instanceOptions.whileloading) {
        instanceOptions.whileloading.apply(s);
      }

    };

    this._whileplaying = function(nPosition, oPeakData, oWaveformDataLeft, oWaveformDataRight, oEQData) {

      var instanceOptions = s._iO,
          eqLeft;

      if (isNaN(nPosition) || nPosition === null) {
        // flash safety net
        return false;
      }

      // Safari HTML5 play() may return small -ve values when starting from position: 0, eg. -50.120396875. Unexpected/invalid per W3, I think. Normalize to 0.
      s.position = Math.max(0, nPosition);

      s._processOnPosition();

      if (!s.isHTML5 && fV > 8) {

        if (instanceOptions.usePeakData && oPeakData !== _undefined && oPeakData) {
          s.peakData = {
            left: oPeakData.leftPeak,
            right: oPeakData.rightPeak
          };
        }

        if (instanceOptions.useWaveformData && oWaveformDataLeft !== _undefined && oWaveformDataLeft) {
          s.waveformData = {
            left: oWaveformDataLeft.split(','),
            right: oWaveformDataRight.split(',')
          };
        }

        if (instanceOptions.useEQData) {
          if (oEQData !== _undefined && oEQData && oEQData.leftEQ) {
            eqLeft = oEQData.leftEQ.split(',');
            s.eqData = eqLeft;
            s.eqData.left = eqLeft;
            if (oEQData.rightEQ !== _undefined && oEQData.rightEQ) {
              s.eqData.right = oEQData.rightEQ.split(',');
            }
          }
        }

      }

      if (s.playState === 1) {

        // special case/hack: ensure buffering is false if loading from cache (and not yet started)
        if (!s.isHTML5 && fV === 8 && !s.position && s.isBuffering) {
          s._onbufferchange(0);
        }

        if (instanceOptions.whileplaying) {
          // flash may call after actual finish
          instanceOptions.whileplaying.apply(s);
        }

      }

      return true;

    };

    this._oncaptiondata = function(oData) {

      /**
       * internal: flash 9 + NetStream (MovieStar/RTMP-only) feature
       *
       * @param {object} oData
       */

      sm2._wD(s.id + ': Caption data received.');

      s.captiondata = oData;

      if (s._iO.oncaptiondata) {
        s._iO.oncaptiondata.apply(s, [oData]);
      }

    };

    this._onmetadata = function(oMDProps, oMDData) {

      /**
       * internal: flash 9 + NetStream (MovieStar/RTMP-only) feature
       * RTMP may include song title, MovieStar content may include encoding info
       *
       * @param {array} oMDProps (names)
       * @param {array} oMDData (values)
       */

      sm2._wD(s.id + ': Metadata received.');

      var oData = {}, i, j;

      for (i = 0, j = oMDProps.length; i < j; i++) {
        oData[oMDProps[i]] = oMDData[i];
      }
      s.metadata = oData;

      if (s._iO.onmetadata) {
        s._iO.onmetadata.apply(s);
      }

    };

    this._onid3 = function(oID3Props, oID3Data) {

      /**
       * internal: flash 8 + flash 9 ID3 feature
       * may include artist, song title etc.
       *
       * @param {array} oID3Props (names)
       * @param {array} oID3Data (values)
       */

      sm2._wD(s.id + ': ID3 data received.');

      var oData = [], i, j;

      for (i = 0, j = oID3Props.length; i < j; i++) {
        oData[oID3Props[i]] = oID3Data[i];
      }
      s.id3 = mixin(s.id3, oData);

      if (s._iO.onid3) {
        s._iO.onid3.apply(s);
      }

    };

    // flash/RTMP-only

    this._onconnect = function(bSuccess) {

      bSuccess = (bSuccess === 1);
      sm2._wD(s.id + ': ' + (bSuccess ? 'Connected.' : 'Failed to connect? - ' + s.url), (bSuccess ? 1 : 2));
      s.connected = bSuccess;

      if (bSuccess) {

        s.failures = 0;

        if (idCheck(s.id)) {
          if (s.getAutoPlay()) {
            // only update the play state if auto playing
            s.play(_undefined, s.getAutoPlay());
          } else if (s._iO.autoLoad) {
            s.load();
          }
        }

        if (s._iO.onconnect) {
          s._iO.onconnect.apply(s, [bSuccess]);
        }

      }

    };

    this._ondataerror = function(sError) {

      // flash 9 wave/eq data handler
      // hack: called at start, and end from flash at/after onfinish()
      if (s.playState > 0) {
        sm2._wD(s.id + ': Data error: ' + sError);
        if (s._iO.ondataerror) {
          s._iO.ondataerror.apply(s);
        }
      }

    };

    // <d>
    this._debug();
    // </d>

  }; // SMSound()

  /**
   * Private SoundManager internals
   * ------------------------------
   */

  getDocument = function() {

    return (doc.body || doc.getElementsByTagName('div')[0]);

  };

  id = function(sID) {

    return doc.getElementById(sID);

  };

  mixin = function(oMain, oAdd) {

    // non-destructive merge
    var o1 = (oMain || {}), o2, o;

    // if unspecified, o2 is the default options object
    o2 = (oAdd === _undefined ? sm2.defaultOptions : oAdd);

    for (o in o2) {

      if (o2.hasOwnProperty(o) && o1[o] === _undefined) {

        if (typeof o2[o] !== 'object' || o2[o] === null) {

          // assign directly
          o1[o] = o2[o];

        } else {

          // recurse through o2
          o1[o] = mixin(o1[o], o2[o]);

        }

      }

    }

    return o1;

  };

  wrapCallback = function(oSound, callback) {

    /**
     * 03/03/2013: Fix for Flash Player 11.6.602.171 + Flash 8 (flashVersion = 8) SWF issue
     * setTimeout() fix for certain SMSound callbacks like onload() and onfinish(), where subsequent calls like play() and load() fail when Flash Player 11.6.602.171 is installed, and using soundManager with flashVersion = 8 (which is the default).
     * Not sure of exact cause. Suspect race condition and/or invalid (NaN-style) position argument trickling down to the next JS -> Flash _start() call, in the play() case.
     * Fix: setTimeout() to yield, plus safer null / NaN checking on position argument provided to Flash.
     * https://getsatisfaction.com/schillmania/topics/recent_chrome_update_seems_to_have_broken_my_sm2_audio_player
     */
    if (!oSound.isHTML5 && fV === 8) {
      window.setTimeout(callback, 0);
    } else {
      callback();
    }

  };

  // additional soundManager properties that soundManager.setup() will accept

  extraOptions = {
    'onready': 1,
    'ontimeout': 1,
    'defaultOptions': 1,
    'flash9Options': 1,
    'movieStarOptions': 1
  };

  assign = function(o, oParent) {

    /**
     * recursive assignment of properties, soundManager.setup() helper
     * allows property assignment based on whitelist
     */

    var i,
        result = true,
        hasParent = (oParent !== _undefined),
        setupOptions = sm2.setupOptions,
        bonusOptions = extraOptions;

    // <d>

    // if soundManager.setup() called, show accepted parameters.

    if (o === _undefined) {

      result = [];

      for (i in setupOptions) {

        if (setupOptions.hasOwnProperty(i)) {
          result.push(i);
        }

      }

      for (i in bonusOptions) {

        if (bonusOptions.hasOwnProperty(i)) {

          if (typeof sm2[i] === 'object') {

            result.push(i+': {...}');

          } else if (sm2[i] instanceof Function) {

            result.push(i+': function() {...}');

          } else {

            result.push(i);

          }

        }

      }

      sm2._wD(str('setup', result.join(', ')));

      return false;

    }

    // </d>

    for (i in o) {

      if (o.hasOwnProperty(i)) {

        // if not an {object} we want to recurse through...

        if (typeof o[i] !== 'object' || o[i] === null || o[i] instanceof Array || o[i] instanceof RegExp) {

          // check "allowed" options

          if (hasParent && bonusOptions[oParent] !== _undefined) {

            // valid recursive / nested object option, eg., { defaultOptions: { volume: 50 } }
            sm2[oParent][i] = o[i];

          } else if (setupOptions[i] !== _undefined) {

            // special case: assign to setupOptions object, which soundManager property references
            sm2.setupOptions[i] = o[i];

            // assign directly to soundManager, too
            sm2[i] = o[i];

          } else if (bonusOptions[i] === _undefined) {

            // invalid or disallowed parameter. complain.
            complain(str((sm2[i] === _undefined ? 'setupUndef' : 'setupError'), i), 2);

            result = false;

          } else {

            /**
             * valid extraOptions (bonusOptions) parameter.
             * is it a method, like onready/ontimeout? call it.
             * multiple parameters should be in an array, eg. soundManager.setup({onready: [myHandler, myScope]});
             */

            if (sm2[i] instanceof Function) {

              sm2[i].apply(sm2, (o[i] instanceof Array? o[i] : [o[i]]));

            } else {

              // good old-fashioned direct assignment
              sm2[i] = o[i];

            }

          }

        } else {

          // recursion case, eg., { defaultOptions: { ... } }

          if (bonusOptions[i] === _undefined) {

            // invalid or disallowed parameter. complain.
            complain(str((sm2[i] === _undefined ? 'setupUndef' : 'setupError'), i), 2);

            result = false;

          } else {

            // recurse through object
            return assign(o[i], i);

          }

        }

      }

    }

    return result;

  };

  function preferFlashCheck(kind) {

    // whether flash should play a given type
    return (sm2.preferFlash && hasFlash && !sm2.ignoreFlash && (sm2.flash[kind] !== _undefined && sm2.flash[kind]));

  }

  /**
   * Internal DOM2-level event helpers
   * ---------------------------------
   */

  event = (function() {

    // normalize event methods
    var old = (window.attachEvent),
    evt = {
      add: (old?'attachEvent':'addEventListener'),
      remove: (old?'detachEvent':'removeEventListener')
    };

    // normalize "on" event prefix, optional capture argument
    function getArgs(oArgs) {

      var args = slice.call(oArgs),
          len = args.length;

      if (old) {
        // prefix
        args[1] = 'on' + args[1];
        if (len > 3) {
          // no capture
          args.pop();
        }
      } else if (len === 3) {
        args.push(false);
      }

      return args;

    }

    function apply(args, sType) {

      // normalize and call the event method, with the proper arguments
      var element = args.shift(),
          method = [evt[sType]];

      if (old) {
        // old IE can't do apply().
        element[method](args[0], args[1]);
      } else {
        element[method].apply(element, args);
      }

    }

    function add() {

      apply(getArgs(arguments), 'add');

    }

    function remove() {

      apply(getArgs(arguments), 'remove');

    }

    return {
      'add': add,
      'remove': remove
    };

  }());

  /**
   * Internal HTML5 event handling
   * -----------------------------
   */

  function html5_event(oFn) {

    // wrap html5 event handlers so we don't call them on destroyed and/or unloaded sounds

    return function(e) {

      var s = this._s,
          result;

      if (!s || !s._a) {
        // <d>
        if (s && s.id) {
          sm2._wD(s.id + ': Ignoring ' + e.type);
        } else {
          sm2._wD(h5 + 'Ignoring ' + e.type);
        }
        // </d>
        result = null;
      } else {
        result = oFn.call(this, e);
      }

      return result;

    };

  }

  html5_events = {

    // HTML5 event-name-to-handler map

    abort: html5_event(function() {

      sm2._wD(this._s.id + ': abort');

    }),

    // enough has loaded to play

    canplay: html5_event(function() {

      var s = this._s,
          position1K;

      if (s._html5_canplay) {
        // this event has already fired. ignore.
        return true;
      }

      s._html5_canplay = true;
      sm2._wD(s.id + ': canplay');
      s._onbufferchange(0);

      // position according to instance options
      position1K = (s._iO.position !== _undefined && !isNaN(s._iO.position)?s._iO.position/msecScale:null);

      // set the position if position was set before the sound loaded
      if (s.position && this.currentTime !== position1K) {
        sm2._wD(s.id + ': canplay: Setting position to ' + position1K);
        try {
          this.currentTime = position1K;
        } catch(ee) {
          sm2._wD(s.id + ': canplay: Setting position of ' + position1K + ' failed: ' + ee.message, 2);
        }
      }

      // hack for HTML5 from/to case
      if (s._iO._oncanplay) {
        s._iO._oncanplay();
      }

    }),

    canplaythrough: html5_event(function() {

      var s = this._s;

      if (!s.loaded) {
        s._onbufferchange(0);
        s._whileloading(s.bytesLoaded, s.bytesTotal, s._get_html5_duration());
        s._onload(true);
      }

    }),

    // TODO: Reserved for potential use
    /*
    emptied: html5_event(function() {

      sm2._wD(this._s.id + ': emptied');

    }),
    */

    ended: html5_event(function() {

      var s = this._s;

      sm2._wD(s.id + ': ended');

      s._onfinish();

    }),

    error: html5_event(function() {

      sm2._wD(this._s.id + ': HTML5 error, code ' + this.error.code);
      /**
       * HTML5 error codes, per W3C
       * Error 1: Client aborted download at user's request.
       * Error 2: Network error after load started.
       * Error 3: Decoding issue.
       * Error 4: Media (audio file) not supported.
       * Reference: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#error-codes
       */
      // call load with error state?
      this._s._onload(false);

    }),

    loadeddata: html5_event(function() {

      var s = this._s;

      sm2._wD(s.id + ': loadeddata');

      // safari seems to nicely report progress events, eventually totalling 100%
      if (!s._loaded && !isSafari) {
        s.duration = s._get_html5_duration();
      }

    }),

    loadedmetadata: html5_event(function() {

      sm2._wD(this._s.id + ': loadedmetadata');

    }),

    loadstart: html5_event(function() {

      sm2._wD(this._s.id + ': loadstart');
      // assume buffering at first
      this._s._onbufferchange(1);

    }),

    play: html5_event(function() {

      // sm2._wD(this._s.id + ': play()');
      // once play starts, no buffering
      this._s._onbufferchange(0);

    }),

    playing: html5_event(function() {

      sm2._wD(this._s.id + ': playing');
      // once play starts, no buffering
      this._s._onbufferchange(0);

    }),

    progress: html5_event(function(e) {

      // note: can fire repeatedly after "loaded" event, due to use of HTTP range/partials

      var s = this._s,
          i, j, progStr, buffered = 0,
          isProgress = (e.type === 'progress'),
          ranges = e.target.buffered,
          // firefox 3.6 implements e.loaded/total (bytes)
          loaded = (e.loaded||0),
          total = (e.total||1);

      // reset the "buffered" (loaded byte ranges) array
      s.buffered = [];

      if (ranges && ranges.length) {

        // if loaded is 0, try TimeRanges implementation as % of load
        // https://developer.mozilla.org/en/DOM/TimeRanges

        // re-build "buffered" array
        // HTML5 returns seconds. SM2 API uses msec for setPosition() etc., whether Flash or HTML5.
        for (i=0, j=ranges.length; i<j; i++) {
          s.buffered.push({
            'start': ranges.start(i) * msecScale,
            'end': ranges.end(i) * msecScale
          });
        }

        // use the last value locally
        buffered = (ranges.end(0) - ranges.start(0)) * msecScale;

        // linear case, buffer sum; does not account for seeking and HTTP partials / byte ranges
        loaded = Math.min(1, buffered/(e.target.duration*msecScale));

        // <d>
        if (isProgress && ranges.length > 1) {
          progStr = [];
          j = ranges.length;
          for (i=0; i<j; i++) {
            progStr.push(e.target.buffered.start(i)*msecScale +'-'+ e.target.buffered.end(i)*msecScale);
          }
          sm2._wD(this._s.id + ': progress, timeRanges: ' + progStr.join(', '));
        }

        if (isProgress && !isNaN(loaded)) {
          sm2._wD(this._s.id + ': progress, ' + Math.floor(loaded*100) + '% loaded');
        }
        // </d>

      }

      if (!isNaN(loaded)) {

        // if progress, likely not buffering
        s._onbufferchange(0);
        // TODO: prevent calls with duplicate values.
        s._whileloading(loaded, total, s._get_html5_duration());
        if (loaded && total && loaded === total) {
          // in case "onload" doesn't fire (eg. gecko 1.9.2)
          html5_events.canplaythrough.call(this, e);
        }

      }

    }),

    ratechange: html5_event(function() {

      sm2._wD(this._s.id + ': ratechange');

    }),

    suspend: html5_event(function(e) {

      // download paused/stopped, may have finished (eg. onload)
      var s = this._s;

      sm2._wD(this._s.id + ': suspend');
      html5_events.progress.call(this, e);
      s._onsuspend();

    }),

    stalled: html5_event(function() {

      sm2._wD(this._s.id + ': stalled');

    }),

    timeupdate: html5_event(function() {

      this._s._onTimer();

    }),

    waiting: html5_event(function() {

      var s = this._s;

      // see also: seeking
      sm2._wD(this._s.id + ': waiting');

      // playback faster than download rate, etc.
      s._onbufferchange(1);

    })

  };

  html5OK = function(iO) {

    // playability test based on URL or MIME type

    var result;

    if (!iO || (!iO.type && !iO.url && !iO.serverURL)) {

      // nothing to check
      result = false;

    } else if (iO.serverURL || (iO.type && preferFlashCheck(iO.type))) {

      // RTMP, or preferring flash
      result = false;

    } else {

      // Use type, if specified. Pass data: URIs to HTML5. If HTML5-only mode, no other options, so just give 'er
      result = ((iO.type ? html5CanPlay({type:iO.type}) : html5CanPlay({url:iO.url}) || sm2.html5Only || iO.url.match(/data\:/i)));

    }

    return result;

  };

  html5Unload = function(oAudio) {

    /**
     * Internal method: Unload media, and cancel any current/pending network requests.
     * Firefox can load an empty URL, which allegedly destroys the decoder and stops the download.
     * https://developer.mozilla.org/En/Using_audio_and_video_in_Firefox#Stopping_the_download_of_media
     * However, Firefox has been seen loading a relative URL from '' and thus requesting the hosting page on unload.
     * Other UA behaviour is unclear, so everyone else gets an about:blank-style URL.
     */

    var url;

    if (oAudio) {

      // Firefox and Chrome accept short WAVe data: URIs. Chome dislikes audio/wav, but accepts audio/wav for data: MIME.
      // Desktop Safari complains / fails on data: URI, so it gets about:blank.
      url = (isSafari ? emptyURL : (sm2.html5.canPlayType('audio/wav') ? emptyWAV : emptyURL));

      oAudio.src = url;

      // reset some state, too
      if (oAudio._called_unload !== undefined) {
        oAudio._called_load = false;
      }

    }

    if (useGlobalHTML5Audio) {

      // ensure URL state is trashed, also
      lastGlobalHTML5URL = null;

    }

    return url;

  };

  html5CanPlay = function(o) {

    /**
     * Try to find MIME, test and return truthiness
     * o = {
     *  url: '/path/to/an.mp3',
     *  type: 'audio/mp3'
     * }
     */

    if (!sm2.useHTML5Audio || !sm2.hasHTML5) {
      return false;
    }

    var url = (o.url || null),
        mime = (o.type || null),
        aF = sm2.audioFormats,
        result,
        offset,
        fileExt,
        item;

    // account for known cases like audio/mp3

    if (mime && sm2.html5[mime] !== _undefined) {
      return (sm2.html5[mime] && !preferFlashCheck(mime));
    }

    if (!html5Ext) {
      html5Ext = [];
      for (item in aF) {
        if (aF.hasOwnProperty(item)) {
          html5Ext.push(item);
          if (aF[item].related) {
            html5Ext = html5Ext.concat(aF[item].related);
          }
        }
      }
      html5Ext = new RegExp('\\.('+html5Ext.join('|')+')(\\?.*)?$','i');
    }

    // TODO: Strip URL queries, etc.
    fileExt = (url ? url.toLowerCase().match(html5Ext) : null);

    if (!fileExt || !fileExt.length) {
      if (!mime) {
        result = false;
      } else {
        // audio/mp3 -> mp3, result should be known
        offset = mime.indexOf(';');
        // strip "audio/X; codecs..."
        fileExt = (offset !== -1?mime.substr(0,offset):mime).substr(6);
      }
    } else {
      // match the raw extension name - "mp3", for example
      fileExt = fileExt[1];
    }

    if (fileExt && sm2.html5[fileExt] !== _undefined) {
      // result known
      result = (sm2.html5[fileExt] && !preferFlashCheck(fileExt));
    } else {
      mime = 'audio/'+fileExt;
      result = sm2.html5.canPlayType({type:mime});
      sm2.html5[fileExt] = result;
      // sm2._wD('canPlayType, found result: ' + result);
      result = (result && sm2.html5[mime] && !preferFlashCheck(mime));
    }

    return result;

  };

  testHTML5 = function() {

    /**
     * Internal: Iterates over audioFormats, determining support eg. audio/mp3, audio/mpeg and so on
     * assigns results to html5[] and flash[].
     */

    if (!sm2.useHTML5Audio || !sm2.hasHTML5) {
      // without HTML5, we need Flash.
      sm2.html5.usingFlash = true;
      needsFlash = true;
      return false;
    }

    // double-whammy: Opera 9.64 throws WRONG_ARGUMENTS_ERR if no parameter passed to Audio(), and Webkit + iOS happily tries to load "null" as a URL. :/
    var a = (Audio !== _undefined ? (isOpera && opera.version() < 10 ? new Audio(null) : new Audio()) : null),
        item, lookup, support = {}, aF, i;

    function cp(m) {

      var canPlay, j,
          result = false,
          isOK = false;

      if (!a || typeof a.canPlayType !== 'function') {
        return result;
      }

      if (m instanceof Array) {
        // iterate through all mime types, return any successes
        for (i=0, j=m.length; i<j; i++) {
          if (sm2.html5[m[i]] || a.canPlayType(m[i]).match(sm2.html5Test)) {
            isOK = true;
            sm2.html5[m[i]] = true;
            // note flash support, too
            sm2.flash[m[i]] = !!(m[i].match(flashMIME));
          }
        }
        result = isOK;
      } else {
        canPlay = (a && typeof a.canPlayType === 'function' ? a.canPlayType(m) : false);
        result = !!(canPlay && (canPlay.match(sm2.html5Test)));
      }

      return result;

    }

    // test all registered formats + codecs

    aF = sm2.audioFormats;

    for (item in aF) {

      if (aF.hasOwnProperty(item)) {

        lookup = 'audio/' + item;

        support[item] = cp(aF[item].type);

        // write back generic type too, eg. audio/mp3
        support[lookup] = support[item];

        // assign flash
        if (item.match(flashMIME)) {

          sm2.flash[item] = true;
          sm2.flash[lookup] = true;

        } else {

          sm2.flash[item] = false;
          sm2.flash[lookup] = false;

        }

        // assign result to related formats, too

        if (aF[item] && aF[item].related) {

          for (i=aF[item].related.length-1; i >= 0; i--) {

            // eg. audio/m4a
            support['audio/'+aF[item].related[i]] = support[item];
            sm2.html5[aF[item].related[i]] = support[item];
            sm2.flash[aF[item].related[i]] = support[item];

          }

        }

      }

    }

    support.canPlayType = (a?cp:null);
    sm2.html5 = mixin(sm2.html5, support);

    sm2.html5.usingFlash = featureCheck();
    needsFlash = sm2.html5.usingFlash;

    return true;

  };

  strings = {

    // <d>
    notReady: 'Unavailable - wait until onready() has fired.',
    notOK: 'Audio support is not available.',
    domError: sm + 'exception caught while appending SWF to DOM.',
    spcWmode: 'Removing wmode, preventing known SWF loading issue(s)',
    swf404: smc + 'Verify that %s is a valid path.',
    tryDebug: 'Try ' + sm + '.debugFlash = true for more security details (output goes to SWF.)',
    checkSWF: 'See SWF output for more debug info.',
    localFail: smc + 'Non-HTTP page (' + doc.location.protocol + ' URL?) Review Flash player security settings for this special case:\nhttp://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html\nMay need to add/allow path, eg. c:/sm2/ or /users/me/sm2/',
    waitFocus: smc + 'Special case: Waiting for SWF to load with window focus...',
    waitForever: smc + 'Waiting indefinitely for Flash (will recover if unblocked)...',
    waitSWF: smc + 'Waiting for 100% SWF load...',
    needFunction: smc + 'Function object expected for %s',
    badID: 'Sound ID "%s" should be a string, starting with a non-numeric character',
    currentObj: smc + '_debug(): Current sound objects',
    waitOnload: smc + 'Waiting for window.onload()',
    docLoaded: smc + 'Document already loaded',
    onload: smc + 'initComplete(): calling soundManager.onload()',
    onloadOK: sm + '.onload() complete',
    didInit: smc + 'init(): Already called?',
    secNote: 'Flash security note: Network/internet URLs will not load due to security restrictions. Access can be configured via Flash Player Global Security Settings Page: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html',
    badRemove: smc + 'Failed to remove Flash node.',
    shutdown: sm + '.disable(): Shutting down',
    queue: smc + 'Queueing %s handler',
    smError: 'SMSound.load(): Exception: JS-Flash communication failed, or JS error.',
    fbTimeout: 'No flash response, applying .'+swfCSS.swfTimedout+' CSS...',
    fbLoaded: 'Flash loaded',
    fbHandler: smc + 'flashBlockHandler()',
    manURL: 'SMSound.load(): Using manually-assigned URL',
    onURL: sm + '.load(): current URL already assigned.',
    badFV: sm + '.flashVersion must be 8 or 9. "%s" is invalid. Reverting to %s.',
    as2loop: 'Note: Setting stream:false so looping can work (flash 8 limitation)',
    noNSLoop: 'Note: Looping not implemented for MovieStar formats',
    needfl9: 'Note: Switching to flash 9, required for MP4 formats.',
    mfTimeout: 'Setting flashLoadTimeout = 0 (infinite) for off-screen, mobile flash case',
    needFlash: smc + 'Fatal error: Flash is needed to play some required formats, but is not available.',
    gotFocus: smc + 'Got window focus.',
    policy: 'Enabling usePolicyFile for data access',
    setup: sm + '.setup(): allowed parameters: %s',
    setupError: sm + '.setup(): "%s" cannot be assigned with this method.',
    setupUndef: sm + '.setup(): Could not find option "%s"',
    setupLate: sm + '.setup(): url, flashVersion and html5Test property changes will not take effect until reboot().',
    noURL: smc + 'Flash URL required. Call soundManager.setup({url:...}) to get started.',
    sm2Loaded: 'SoundManager 2: Ready.',
    reset: sm + '.reset(): Removing event callbacks',
    mobileUA: 'Mobile UA detected, preferring HTML5 by default.',
    globalHTML5: 'Using singleton HTML5 Audio() pattern for this device.'
    // </d>

  };

  str = function() {

    // internal string replace helper.
    // arguments: o [,items to replace]
    // <d>

    var args,
        i, j, o,
        sstr;

    // real array, please
    args = slice.call(arguments);

    // first argument
    o = args.shift();

    sstr = (strings && strings[o] ? strings[o] : '');

    if (sstr && args && args.length) {
      for (i = 0, j = args.length; i < j; i++) {
        sstr = sstr.replace('%s', args[i]);
      }
    }

    return sstr;
    // </d>

  };

  loopFix = function(sOpt) {

    // flash 8 requires stream = false for looping to work
    if (fV === 8 && sOpt.loops > 1 && sOpt.stream) {
      _wDS('as2loop');
      sOpt.stream = false;
    }

    return sOpt;

  };

  policyFix = function(sOpt, sPre) {

    if (sOpt && !sOpt.usePolicyFile && (sOpt.onid3 || sOpt.usePeakData || sOpt.useWaveformData || sOpt.useEQData)) {
      sm2._wD((sPre || '') + str('policy'));
      sOpt.usePolicyFile = true;
    }

    return sOpt;

  };

  complain = function(sMsg) {

    // <d>
    if (hasConsole && console.warn !== _undefined) {
      console.warn(sMsg);
    } else {
      sm2._wD(sMsg);
    }
    // </d>

  };

  doNothing = function() {

    return false;

  };

  disableObject = function(o) {

    var oProp;

    for (oProp in o) {
      if (o.hasOwnProperty(oProp) && typeof o[oProp] === 'function') {
        o[oProp] = doNothing;
      }
    }

    oProp = null;

  };

  failSafely = function(bNoDisable) {

    // general failure exception handler

    if (bNoDisable === _undefined) {
      bNoDisable = false;
    }

    if (disabled || bNoDisable) {
      sm2.disable(bNoDisable);
    }

  };

  normalizeMovieURL = function(smURL) {

    var urlParams = null, url;

    if (smURL) {
      if (smURL.match(/\.swf(\?.*)?$/i)) {
        urlParams = smURL.substr(smURL.toLowerCase().lastIndexOf('.swf?') + 4);
        if (urlParams) {
          // assume user knows what they're doing
          return smURL;
        }
      } else if (smURL.lastIndexOf('/') !== smURL.length - 1) {
        // append trailing slash, if needed
        smURL += '/';
      }
    }

    url = (smURL && smURL.lastIndexOf('/') !== - 1 ? smURL.substr(0, smURL.lastIndexOf('/') + 1) : './') + sm2.movieURL;

    if (sm2.noSWFCache) {
      url += ('?ts=' + new Date().getTime());
    }

    return url;

  };

  setVersionInfo = function() {

    // short-hand for internal use

    fV = parseInt(sm2.flashVersion, 10);

    if (fV !== 8 && fV !== 9) {
      sm2._wD(str('badFV', fV, defaultFlashVersion));
      sm2.flashVersion = fV = defaultFlashVersion;
    }

    // debug flash movie, if applicable

    var isDebug = (sm2.debugMode || sm2.debugFlash?'_debug.swf':'.swf');

    if (sm2.useHTML5Audio && !sm2.html5Only && sm2.audioFormats.mp4.required && fV < 9) {
      sm2._wD(str('needfl9'));
      sm2.flashVersion = fV = 9;
    }

    sm2.version = sm2.versionNumber + (sm2.html5Only?' (HTML5-only mode)':(fV === 9?' (AS3/Flash 9)':' (AS2/Flash 8)'));

    // set up default options
    if (fV > 8) {
      // +flash 9 base options
      sm2.defaultOptions = mixin(sm2.defaultOptions, sm2.flash9Options);
      sm2.features.buffering = true;
      // +moviestar support
      sm2.defaultOptions = mixin(sm2.defaultOptions, sm2.movieStarOptions);
      sm2.filePatterns.flash9 = new RegExp('\\.(mp3|' + netStreamTypes.join('|') + ')(\\?.*)?$', 'i');
      sm2.features.movieStar = true;
    } else {
      sm2.features.movieStar = false;
    }

    // regExp for flash canPlay(), etc.
    sm2.filePattern = sm2.filePatterns[(fV !== 8?'flash9':'flash8')];

    // if applicable, use _debug versions of SWFs
    sm2.movieURL = (fV === 8?'soundmanager2.swf':'soundmanager2_flash9.swf').replace('.swf', isDebug);

    sm2.features.peakData = sm2.features.waveformData = sm2.features.eqData = (fV > 8);

  };

  setPolling = function(bPolling, bHighPerformance) {

    if (!flash) {
      return false;
    }

    flash._setPolling(bPolling, bHighPerformance);

  };

  initDebug = function() {

    // starts debug mode, creating output <div> for UAs without console object

    // allow force of debug mode via URL
    // <d>
    if (sm2.debugURLParam.test(wl)) {
      sm2.debugMode = true;
    }

    if (id(sm2.debugID)) {
      return false;
    }

    var oD, oDebug, oTarget, oToggle, tmp;

    if (sm2.debugMode && !id(sm2.debugID) && (!hasConsole || !sm2.useConsole || !sm2.consoleOnly)) {

      oD = doc.createElement('div');
      oD.id = sm2.debugID + '-toggle';

      oToggle = {
        'position': 'fixed',
        'bottom': '0px',
        'right': '0px',
        'width': '1.2em',
        'height': '1.2em',
        'lineHeight': '1.2em',
        'margin': '2px',
        'textAlign': 'center',
        'border': '1px solid #999',
        'cursor': 'pointer',
        'background': '#fff',
        'color': '#333',
        'zIndex': 10001
      };

      oD.appendChild(doc.createTextNode('-'));
      oD.onclick = toggleDebug;
      oD.title = 'Toggle SM2 debug console';

      if (ua.match(/msie 6/i)) {
        oD.style.position = 'absolute';
        oD.style.cursor = 'hand';
      }

      for (tmp in oToggle) {
        if (oToggle.hasOwnProperty(tmp)) {
          oD.style[tmp] = oToggle[tmp];
        }
      }

      oDebug = doc.createElement('div');
      oDebug.id = sm2.debugID;
      oDebug.style.display = (sm2.debugMode?'block':'none');

      if (sm2.debugMode && !id(oD.id)) {
        try {
          oTarget = getDocument();
          oTarget.appendChild(oD);
        } catch(e2) {
          throw new Error(str('domError')+' \n'+e2.toString());
        }
        oTarget.appendChild(oDebug);
      }

    }

    oTarget = null;
    // </d>

  };

  idCheck = this.getSoundById;

  // <d>
  _wDS = function(o, errorLevel) {

    return (!o ? '' : sm2._wD(str(o), errorLevel));

  };

  toggleDebug = function() {

    var o = id(sm2.debugID),
    oT = id(sm2.debugID + '-toggle');

    if (!o) {
      return false;
    }

    if (debugOpen) {
      // minimize
      oT.innerHTML = '+';
      o.style.display = 'none';
    } else {
      oT.innerHTML = '-';
      o.style.display = 'block';
    }

    debugOpen = !debugOpen;

  };

  debugTS = function(sEventType, bSuccess, sMessage) {

    // troubleshooter debug hooks

    if (window.sm2Debugger !== _undefined) {
      try {
        sm2Debugger.handleEvent(sEventType, bSuccess, sMessage);
      } catch(e) {
        // oh well
        return false;
      }
    }

    return true;

  };
  // </d>

  getSWFCSS = function() {

    var css = [];

    if (sm2.debugMode) {
      css.push(swfCSS.sm2Debug);
    }

    if (sm2.debugFlash) {
      css.push(swfCSS.flashDebug);
    }

    if (sm2.useHighPerformance) {
      css.push(swfCSS.highPerf);
    }

    return css.join(' ');

  };

  flashBlockHandler = function() {

    // *possible* flash block situation.

    var name = str('fbHandler'),
        p = sm2.getMoviePercent(),
        css = swfCSS,
        error = {type:'FLASHBLOCK'};

    if (sm2.html5Only) {
      // no flash, or unused
      return false;
    }

    if (!sm2.ok()) {

      if (needsFlash) {
        // make the movie more visible, so user can fix
        sm2.oMC.className = getSWFCSS() + ' ' + css.swfDefault + ' ' + (p === null?css.swfTimedout:css.swfError);
        sm2._wD(name + ': ' + str('fbTimeout') + (p ? ' (' + str('fbLoaded') + ')' : ''));
      }

      sm2.didFlashBlock = true;

      // fire onready(), complain lightly
      processOnEvents({type:'ontimeout', ignoreInit:true, error:error});
      catchError(error);

    } else {

      // SM2 loaded OK (or recovered)

      // <d>
      if (sm2.didFlashBlock) {
        sm2._wD(name + ': Unblocked');
      }
      // </d>

      if (sm2.oMC) {
        sm2.oMC.className = [getSWFCSS(), css.swfDefault, css.swfLoaded + (sm2.didFlashBlock?' '+css.swfUnblocked:'')].join(' ');
      }

    }

  };

  addOnEvent = function(sType, oMethod, oScope) {

    if (on_queue[sType] === _undefined) {
      on_queue[sType] = [];
    }

    on_queue[sType].push({
      'method': oMethod,
      'scope': (oScope || null),
      'fired': false
    });

  };

  processOnEvents = function(oOptions) {

    // if unspecified, assume OK/error

    if (!oOptions) {
      oOptions = {
        type: (sm2.ok() ? 'onready' : 'ontimeout')
      };
    }

    if (!didInit && oOptions && !oOptions.ignoreInit) {
      // not ready yet.
      return false;
    }

    if (oOptions.type === 'ontimeout' && (sm2.ok() || (disabled && !oOptions.ignoreInit))) {
      // invalid case
      return false;
    }

    var status = {
          success: (oOptions && oOptions.ignoreInit?sm2.ok():!disabled)
        },

        // queue specified by type, or none
        srcQueue = (oOptions && oOptions.type?on_queue[oOptions.type]||[]:[]),

        queue = [], i, j,
        args = [status],
        canRetry = (needsFlash && !sm2.ok());

    if (oOptions.error) {
      args[0].error = oOptions.error;
    }

    for (i = 0, j = srcQueue.length; i < j; i++) {
      if (srcQueue[i].fired !== true) {
        queue.push(srcQueue[i]);
      }
    }

    if (queue.length) {
      // sm2._wD(sm + ': Firing ' + queue.length + ' ' + oOptions.type + '() item' + (queue.length === 1 ? '' : 's'));
      for (i = 0, j = queue.length; i < j; i++) {
        if (queue[i].scope) {
          queue[i].method.apply(queue[i].scope, args);
        } else {
          queue[i].method.apply(this, args);
        }
        if (!canRetry) {
          // useFlashBlock and SWF timeout case doesn't count here.
          queue[i].fired = true;
        }
      }
    }

    return true;

  };

  initUserOnload = function() {

    window.setTimeout(function() {

      if (sm2.useFlashBlock) {
        flashBlockHandler();
      }

      processOnEvents();

      // call user-defined "onload", scoped to window

      if (typeof sm2.onload === 'function') {
        _wDS('onload', 1);
        sm2.onload.apply(window);
        _wDS('onloadOK', 1);
      }

      if (sm2.waitForWindowLoad) {
        event.add(window, 'load', initUserOnload);
      }

    },1);

  };

  detectFlash = function() {

    // hat tip: Flash Detect library (BSD, (C) 2007) by Carl "DocYes" S. Yestrau - http://featureblend.com/javascript-flash-detection-library.html / http://featureblend.com/license.txt

    if (hasFlash !== _undefined) {
      // this work has already been done.
      return hasFlash;
    }

    var hasPlugin = false, n = navigator, nP = n.plugins, obj, type, types, AX = window.ActiveXObject;

    if (nP && nP.length) {
      type = 'application/x-shockwave-flash';
      types = n.mimeTypes;
      if (types && types[type] && types[type].enabledPlugin && types[type].enabledPlugin.description) {
        hasPlugin = true;
      }
    } else if (AX !== _undefined && !ua.match(/MSAppHost/i)) {
      // Windows 8 Store Apps (MSAppHost) are weird (compatibility?) and won't complain here, but will barf if Flash/ActiveX object is appended to the DOM.
      try {
        obj = new AX('ShockwaveFlash.ShockwaveFlash');
      } catch(e) {
        // oh well
        obj = null;
      }
      hasPlugin = (!!obj);
      // cleanup, because it is ActiveX after all
      obj = null;
    }

    hasFlash = hasPlugin;

    return hasPlugin;

  };

  featureCheck = function() {

    var flashNeeded,
        item,
        formats = sm2.audioFormats,
        // iPhone <= 3.1 has broken HTML5 audio(), but firmware 3.2 (original iPad) + iOS4 works.
        isSpecial = (is_iDevice && !!(ua.match(/os (1|2|3_0|3_1)/i)));

    if (isSpecial) {

      // has Audio(), but is broken; let it load links directly.
      sm2.hasHTML5 = false;

      // ignore flash case, however
      sm2.html5Only = true;

      // hide the SWF, if present
      if (sm2.oMC) {
        sm2.oMC.style.display = 'none';
      }

    } else {

      if (sm2.useHTML5Audio) {

        if (!sm2.html5 || !sm2.html5.canPlayType) {
          sm2._wD('SoundManager: No HTML5 Audio() support detected.');
          sm2.hasHTML5 = false;
        }

        // <d>
        if (isBadSafari) {
          sm2._wD(smc + 'Note: Buggy HTML5 Audio in Safari on this OS X release, see https://bugs.webkit.org/show_bug.cgi?id=32159 - ' + (!hasFlash ?' would use flash fallback for MP3/MP4, but none detected.' : 'will use flash fallback for MP3/MP4, if available'), 1);
        }
        // </d>

      }

    }

    if (sm2.useHTML5Audio && sm2.hasHTML5) {

      // sort out whether flash is optional, required or can be ignored.

      // innocent until proven guilty.
      canIgnoreFlash = true;

      for (item in formats) {
        if (formats.hasOwnProperty(item)) {
          if (formats[item].required) {
            if (!sm2.html5.canPlayType(formats[item].type)) {
              // 100% HTML5 mode is not possible.
              canIgnoreFlash = false;
              flashNeeded = true;
            } else if (sm2.preferFlash && (sm2.flash[item] || sm2.flash[formats[item].type])) {
              // flash may be required, or preferred for this format.
              flashNeeded = true;
            }
          }
        }
      }

    }

    // sanity check...
    if (sm2.ignoreFlash) {
      flashNeeded = false;
      canIgnoreFlash = true;
    }

    sm2.html5Only = (sm2.hasHTML5 && sm2.useHTML5Audio && !flashNeeded);

    return (!sm2.html5Only);

  };

  parseURL = function(url) {

    /**
     * Internal: Finds and returns the first playable URL (or failing that, the first URL.)
     * @param {string or array} url A single URL string, OR, an array of URL strings or {url:'/path/to/resource', type:'audio/mp3'} objects.
     */

    var i, j, urlResult = 0, result;

    if (url instanceof Array) {

      // find the first good one
      for (i=0, j=url.length; i<j; i++) {

        if (url[i] instanceof Object) {
          // MIME check
          if (sm2.canPlayMIME(url[i].type)) {
            urlResult = i;
            break;
          }

        } else if (sm2.canPlayURL(url[i])) {
          // URL string check
          urlResult = i;
          break;
        }

      }

      // normalize to string
      if (url[urlResult].url) {
        url[urlResult] = url[urlResult].url;
      }

      result = url[urlResult];

    } else {

      // single URL case
      result = url;

    }

    return result;

  };


  startTimer = function(oSound) {

    /**
     * attach a timer to this sound, and start an interval if needed
     */

    if (!oSound._hasTimer) {

      oSound._hasTimer = true;

      if (!mobileHTML5 && sm2.html5PollingInterval) {

        if (h5IntervalTimer === null && h5TimerCount === 0) {

          h5IntervalTimer = setInterval(timerExecute, sm2.html5PollingInterval);

        }

        h5TimerCount++;

      }

    }

  };

  stopTimer = function(oSound) {

    /**
     * detach a timer
     */

    if (oSound._hasTimer) {

      oSound._hasTimer = false;

      if (!mobileHTML5 && sm2.html5PollingInterval) {

        // interval will stop itself at next execution.

        h5TimerCount--;

      }

    }

  };

  timerExecute = function() {

    /**
     * manual polling for HTML5 progress events, ie., whileplaying() (can achieve greater precision than conservative default HTML5 interval)
     */

    var i;

    if (h5IntervalTimer !== null && !h5TimerCount) {

      // no active timers, stop polling interval.

      clearInterval(h5IntervalTimer);

      h5IntervalTimer = null;

      return false;

    }

    // check all HTML5 sounds with timers

    for (i = sm2.soundIDs.length-1; i >= 0; i--) {

      if (sm2.sounds[sm2.soundIDs[i]].isHTML5 && sm2.sounds[sm2.soundIDs[i]]._hasTimer) {

        sm2.sounds[sm2.soundIDs[i]]._onTimer();

      }

    }

  };

  catchError = function(options) {

    options = (options !== _undefined ? options : {});

    if (typeof sm2.onerror === 'function') {
      sm2.onerror.apply(window, [{type:(options.type !== _undefined ? options.type : null)}]);
    }

    if (options.fatal !== _undefined && options.fatal) {
      sm2.disable();
    }

  };

  badSafariFix = function() {

    // special case: "bad" Safari (OS X 10.3 - 10.7) must fall back to flash for MP3/MP4
    if (!isBadSafari || !detectFlash()) {
      // doesn't apply
      return false;
    }

    var aF = sm2.audioFormats, i, item;

    for (item in aF) {
      if (aF.hasOwnProperty(item)) {
        if (item === 'mp3' || item === 'mp4') {
          sm2._wD(sm + ': Using flash fallback for ' + item + ' format');
          sm2.html5[item] = false;
          // assign result to related formats, too
          if (aF[item] && aF[item].related) {
            for (i = aF[item].related.length-1; i >= 0; i--) {
              sm2.html5[aF[item].related[i]] = false;
            }
          }
        }
      }
    }

  };

  /**
   * Pseudo-private flash/ExternalInterface methods
   * ----------------------------------------------
   */

  this._setSandboxType = function(sandboxType) {

    // <d>
    var sb = sm2.sandbox;

    sb.type = sandboxType;
    sb.description = sb.types[(sb.types[sandboxType] !== _undefined?sandboxType:'unknown')];

    if (sb.type === 'localWithFile') {

      sb.noRemote = true;
      sb.noLocal = false;
      _wDS('secNote', 2);

    } else if (sb.type === 'localWithNetwork') {

      sb.noRemote = false;
      sb.noLocal = true;

    } else if (sb.type === 'localTrusted') {

      sb.noRemote = false;
      sb.noLocal = false;

    }
    // </d>

  };

  this._externalInterfaceOK = function(swfVersion) {

    // flash callback confirming flash loaded, EI working etc.
    // swfVersion: SWF build string

    if (sm2.swfLoaded) {
      return false;
    }

    var e;

    debugTS('swf', true);
    debugTS('flashtojs', true);
    sm2.swfLoaded = true;
    tryInitOnFocus = false;

    if (isBadSafari) {
      badSafariFix();
    }

    // complain if JS + SWF build/version strings don't match, excluding +DEV builds
    // <d>
    if (!swfVersion || swfVersion.replace(/\+dev/i,'') !== sm2.versionNumber.replace(/\+dev/i, '')) {

      e = sm + ': Fatal: JavaScript file build "' + sm2.versionNumber + '" does not match Flash SWF build "' + swfVersion + '" at ' + sm2.url + '. Ensure both are up-to-date.';

      // escape flash -> JS stack so this error fires in window.
      setTimeout(function versionMismatch() {
        throw new Error(e);
      }, 0);

      // exit, init will fail with timeout
      return false;

    }
    // </d>

    // IE needs a larger timeout
    setTimeout(init, isIE ? 100 : 1);

  };

  /**
   * Private initialization helpers
   * ------------------------------
   */

  createMovie = function(smID, smURL) {

    if (didAppend && appendSuccess) {
      // ignore if already succeeded
      return false;
    }

    function initMsg() {

      // <d>

      var options = [],
          title,
          msg = [],
          delimiter = ' + ';

      title = 'SoundManager ' + sm2.version + (!sm2.html5Only && sm2.useHTML5Audio ? (sm2.hasHTML5 ? ' + HTML5 audio' : ', no HTML5 audio support') : '');

      if (!sm2.html5Only) {

        if (sm2.preferFlash) {
          options.push('preferFlash');
        }

        if (sm2.useHighPerformance) {
          options.push('useHighPerformance');
        }

        if (sm2.flashPollingInterval) {
          options.push('flashPollingInterval (' + sm2.flashPollingInterval + 'ms)');
        }

        if (sm2.html5PollingInterval) {
          options.push('html5PollingInterval (' + sm2.html5PollingInterval + 'ms)');
        }

        if (sm2.wmode) {
          options.push('wmode (' + sm2.wmode + ')');
        }

        if (sm2.debugFlash) {
          options.push('debugFlash');
        }

        if (sm2.useFlashBlock) {
          options.push('flashBlock');
        }

      } else {

        if (sm2.html5PollingInterval) {
          options.push('html5PollingInterval (' + sm2.html5PollingInterval + 'ms)');
        }

      }

      if (options.length) {
        msg = msg.concat([options.join(delimiter)]);
      }

      sm2._wD(title + (msg.length ? delimiter + msg.join(', ') : ''), 1);

      showSupport();

      // </d>

    }

    if (sm2.html5Only) {

      // 100% HTML5 mode
      setVersionInfo();

      initMsg();
      sm2.oMC = id(sm2.movieID);
      init();

      // prevent multiple init attempts
      didAppend = true;

      appendSuccess = true;

      return false;

    }

    // flash path
    var remoteURL = (smURL || sm2.url),
    localURL = (sm2.altURL || remoteURL),
    swfTitle = 'JS/Flash audio component (SoundManager 2)',
    oTarget = getDocument(),
    extraClass = getSWFCSS(),
    isRTL = null,
    html = doc.getElementsByTagName('html')[0],
    oEmbed, oMovie, tmp, movieHTML, oEl, s, x, sClass;

    isRTL = (html && html.dir && html.dir.match(/rtl/i));
    smID = (smID === _undefined?sm2.id:smID);

    function param(name, value) {
      return '<param name="'+name+'" value="'+value+'" />';
    }

    // safety check for legacy (change to Flash 9 URL)
    setVersionInfo();
    sm2.url = normalizeMovieURL(overHTTP?remoteURL:localURL);
    smURL = sm2.url;

    sm2.wmode = (!sm2.wmode && sm2.useHighPerformance ? 'transparent' : sm2.wmode);

    if (sm2.wmode !== null && (ua.match(/msie 8/i) || (!isIE && !sm2.useHighPerformance)) && navigator.platform.match(/win32|win64/i)) {
      /**
       * extra-special case: movie doesn't load until scrolled into view when using wmode = anything but 'window' here
       * does not apply when using high performance (position:fixed means on-screen), OR infinite flash load timeout
       * wmode breaks IE 8 on Vista + Win7 too in some cases, as of January 2011 (?)
       */
       messages.push(strings.spcWmode);
      sm2.wmode = null;
    }

    oEmbed = {
      'name': smID,
      'id': smID,
      'src': smURL,
      'quality': 'high',
      'allowScriptAccess': sm2.allowScriptAccess,
      'bgcolor': sm2.bgColor,
      'pluginspage': http+'www.macromedia.com/go/getflashplayer',
      'title': swfTitle,
      'type': 'application/x-shockwave-flash',
      'wmode': sm2.wmode,
      // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
      'hasPriority': 'true'
    };

    if (sm2.debugFlash) {
      oEmbed.FlashVars = 'debug=1';
    }

    if (!sm2.wmode) {
      // don't write empty attribute
      delete oEmbed.wmode;
    }

    if (isIE) {

      // IE is "special".
      oMovie = doc.createElement('div');
      movieHTML = [
        '<object id="' + smID + '" data="' + smURL + '" type="' + oEmbed.type + '" title="' + oEmbed.title +'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="' + http+'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">',
        param('movie', smURL),
        param('AllowScriptAccess', sm2.allowScriptAccess),
        param('quality', oEmbed.quality),
        (sm2.wmode? param('wmode', sm2.wmode): ''),
        param('bgcolor', sm2.bgColor),
        param('hasPriority', 'true'),
        (sm2.debugFlash ? param('FlashVars', oEmbed.FlashVars) : ''),
        '</object>'
      ].join('');

    } else {

      oMovie = doc.createElement('embed');
      for (tmp in oEmbed) {
        if (oEmbed.hasOwnProperty(tmp)) {
          oMovie.setAttribute(tmp, oEmbed[tmp]);
        }
      }

    }

    initDebug();
    extraClass = getSWFCSS();
    oTarget = getDocument();

    if (oTarget) {

      sm2.oMC = (id(sm2.movieID) || doc.createElement('div'));

      if (!sm2.oMC.id) {

        sm2.oMC.id = sm2.movieID;
        sm2.oMC.className = swfCSS.swfDefault + ' ' + extraClass;
        s = null;
        oEl = null;

        if (!sm2.useFlashBlock) {
          if (sm2.useHighPerformance) {
            // on-screen at all times
            s = {
              'position': 'fixed',
              'width': '8px',
              'height': '8px',
              // >= 6px for flash to run fast, >= 8px to start up under Firefox/win32 in some cases. odd? yes.
              'bottom': '0px',
              'left': '0px',
              'overflow': 'hidden'
            };
          } else {
            // hide off-screen, lower priority
            s = {
              'position': 'absolute',
              'width': '6px',
              'height': '6px',
              'top': '-9999px',
              'left': '-9999px'
            };
            if (isRTL) {
              s.left = Math.abs(parseInt(s.left,10))+'px';
            }
          }
        }

        if (isWebkit) {
          // soundcloud-reported render/crash fix, safari 5
          sm2.oMC.style.zIndex = 10000;
        }

        if (!sm2.debugFlash) {
          for (x in s) {
            if (s.hasOwnProperty(x)) {
              sm2.oMC.style[x] = s[x];
            }
          }
        }

        try {
          if (!isIE) {
            sm2.oMC.appendChild(oMovie);
          }
          oTarget.appendChild(sm2.oMC);
          if (isIE) {
            oEl = sm2.oMC.appendChild(doc.createElement('div'));
            oEl.className = swfCSS.swfBox;
            oEl.innerHTML = movieHTML;
          }
          appendSuccess = true;
        } catch(e) {
          throw new Error(str('domError')+' \n'+e.toString());
        }

      } else {

        // SM2 container is already in the document (eg. flashblock use case)
        sClass = sm2.oMC.className;
        sm2.oMC.className = (sClass?sClass+' ':swfCSS.swfDefault) + (extraClass?' '+extraClass:'');
        sm2.oMC.appendChild(oMovie);
        if (isIE) {
          oEl = sm2.oMC.appendChild(doc.createElement('div'));
          oEl.className = swfCSS.swfBox;
          oEl.innerHTML = movieHTML;
        }
        appendSuccess = true;

      }

    }

    didAppend = true;
    initMsg();
    // sm2._wD(sm + ': Trying to load ' + smURL + (!overHTTP && sm2.altURL ? ' (alternate URL)' : ''), 1);

    return true;

  };

  initMovie = function() {

    if (sm2.html5Only) {
      createMovie();
      return false;
    }

    // attempt to get, or create, movie (may already exist)
    if (flash) {
      return false;
    }

    if (!sm2.url) {

      /**
       * Something isn't right - we've reached init, but the soundManager url property has not been set.
       * User has not called setup({url: ...}), or has not set soundManager.url (legacy use case) directly before init time.
       * Notify and exit. If user calls setup() with a url: property, init will be restarted as in the deferred loading case.
       */

       _wDS('noURL');
       return false;

    }

    // inline markup case
    flash = sm2.getMovie(sm2.id);

    if (!flash) {
      if (!oRemoved) {
        // try to create
        createMovie(sm2.id, sm2.url);
      } else {
        // try to re-append removed movie after reboot()
        if (!isIE) {
          sm2.oMC.appendChild(oRemoved);
        } else {
          sm2.oMC.innerHTML = oRemovedHTML;
        }
        oRemoved = null;
        didAppend = true;
      }
      flash = sm2.getMovie(sm2.id);
    }

    if (typeof sm2.oninitmovie === 'function') {
      setTimeout(sm2.oninitmovie, 1);
    }

    // <d>
    flushMessages();
    // </d>

    return true;

  };

  delayWaitForEI = function() {

    setTimeout(waitForEI, 1000);

  };

  rebootIntoHTML5 = function() {

    // special case: try for a reboot with preferFlash: false, if 100% HTML5 mode is possible and useFlashBlock is not enabled.

    window.setTimeout(function() {

      complain(smc + 'useFlashBlock is false, 100% HTML5 mode is possible. Rebooting with preferFlash: false...');

      sm2.setup({
        preferFlash: false
      }).reboot();

      // if for some reason you want to detect this case, use an ontimeout() callback and look for html5Only and didFlashBlock == true.
      sm2.didFlashBlock = true;

      sm2.beginDelayedInit();

    }, 1);

  };

  waitForEI = function() {

    var p,
        loadIncomplete = false;

    if (!sm2.url) {
      // No SWF url to load (noURL case) - exit for now. Will be retried when url is set.
      return false;
    }

    if (waitingForEI) {
      return false;
    }

    waitingForEI = true;
    event.remove(window, 'load', delayWaitForEI);

    if (hasFlash && tryInitOnFocus && !isFocused) {
      // Safari won't load flash in background tabs, only when focused.
      _wDS('waitFocus');
      return false;
    }

    if (!didInit) {
      p = sm2.getMoviePercent();
      if (p > 0 && p < 100) {
        loadIncomplete = true;
      }
    }

    setTimeout(function() {

      p = sm2.getMoviePercent();

      if (loadIncomplete) {
        // special case: if movie *partially* loaded, retry until it's 100% before assuming failure.
        waitingForEI = false;
        sm2._wD(str('waitSWF'));
        window.setTimeout(delayWaitForEI, 1);
        return false;
      }

      // <d>
      if (!didInit) {

        sm2._wD(sm + ': No Flash response within expected time. Likely causes: ' + (p === 0 ? 'SWF load failed, ':'') + 'Flash blocked or JS-Flash security error.' + (sm2.debugFlash?' ' + str('checkSWF'):''), 2);

        if (!overHTTP && p) {

          _wDS('localFail', 2);

          if (!sm2.debugFlash) {
            _wDS('tryDebug', 2);
          }

        }

        if (p === 0) {

          // if 0 (not null), probably a 404.
          sm2._wD(str('swf404', sm2.url), 1);

        }

        debugTS('flashtojs', false, ': Timed out' + overHTTP?' (Check flash security or flash blockers)':' (No plugin/missing SWF?)');

      }
      // </d>

      // give up / time-out, depending

      if (!didInit && okToDisable) {

        if (p === null) {

          // SWF failed to report load progress. Possibly blocked.

          if (sm2.useFlashBlock || sm2.flashLoadTimeout === 0) {

            if (sm2.useFlashBlock) {

              flashBlockHandler();

            }

            _wDS('waitForever');

          } else {

            // no custom flash block handling, but SWF has timed out. Will recover if user unblocks / allows SWF load.

            if (!sm2.useFlashBlock && canIgnoreFlash) {

              rebootIntoHTML5();

            } else {

              _wDS('waitForever');

              // fire any regular registered ontimeout() listeners.
              processOnEvents({type:'ontimeout', ignoreInit: true, error: {type: 'INIT_FLASHBLOCK'}});

            }

          }

        } else {

          // SWF loaded? Shouldn't be a blocking issue, then.

          if (sm2.flashLoadTimeout === 0) {

            _wDS('waitForever');

          } else {

            if (!sm2.useFlashBlock && canIgnoreFlash) {

              rebootIntoHTML5();

            } else {

              failSafely(true);

            }

          }

        }

      }

    }, sm2.flashLoadTimeout);

  };

  handleFocus = function() {

    function cleanup() {
      event.remove(window, 'focus', handleFocus);
    }

    if (isFocused || !tryInitOnFocus) {
      // already focused, or not special Safari background tab case
      cleanup();
      return true;
    }

    okToDisable = true;
    isFocused = true;
    _wDS('gotFocus');

    // allow init to restart
    waitingForEI = false;

    // kick off ExternalInterface timeout, now that the SWF has started
    delayWaitForEI();

    cleanup();
    return true;

  };

  flushMessages = function() {

    // <d>

    // SM2 pre-init debug messages
    if (messages.length) {
      sm2._wD('SoundManager 2: ' + messages.join(' '), 1);
      messages = [];
    }

    // </d>

  };

  showSupport = function() {

    // <d>

    flushMessages();

    var item, tests = [];

    if (sm2.useHTML5Audio && sm2.hasHTML5) {
      for (item in sm2.audioFormats) {
        if (sm2.audioFormats.hasOwnProperty(item)) {
          tests.push(item + ' = ' + sm2.html5[item] + (!sm2.html5[item] && needsFlash && sm2.flash[item] ? ' (using flash)' : (sm2.preferFlash && sm2.flash[item] && needsFlash ? ' (preferring flash)': (!sm2.html5[item] ? ' (' + (sm2.audioFormats[item].required ? 'required, ':'') + 'and no flash support)' : ''))));
        }
      }
      sm2._wD('SoundManager 2 HTML5 support: ' + tests.join(', '), 1);
    }

    // </d>

  };

  initComplete = function(bNoDisable) {

    if (didInit) {
      return false;
    }

    if (sm2.html5Only) {
      // all good.
      _wDS('sm2Loaded');
      didInit = true;
      initUserOnload();
      debugTS('onload', true);
      return true;
    }

    var wasTimeout = (sm2.useFlashBlock && sm2.flashLoadTimeout && !sm2.getMoviePercent()),
        result = true,
        error;

    if (!wasTimeout) {
      didInit = true;
    }

    error = {type: (!hasFlash && needsFlash ? 'NO_FLASH' : 'INIT_TIMEOUT')};

    sm2._wD('SoundManager 2 ' + (disabled ? 'failed to load' : 'loaded') + ' (' + (disabled ? 'Flash security/load error' : 'OK') + ')', disabled ? 2: 1);

    if (disabled || bNoDisable) {
      if (sm2.useFlashBlock && sm2.oMC) {
        sm2.oMC.className = getSWFCSS() + ' ' + (sm2.getMoviePercent() === null?swfCSS.swfTimedout:swfCSS.swfError);
      }
      processOnEvents({type:'ontimeout', error:error, ignoreInit: true});
      debugTS('onload', false);
      catchError(error);
      result = false;
    } else {
      debugTS('onload', true);
    }

    if (!disabled) {
      if (sm2.waitForWindowLoad && !windowLoaded) {
        _wDS('waitOnload');
        event.add(window, 'load', initUserOnload);
      } else {
        // <d>
        if (sm2.waitForWindowLoad && windowLoaded) {
          _wDS('docLoaded');
        }
        // </d>
        initUserOnload();
      }
    }

    return result;

  };

  /**
   * apply top-level setupOptions object as local properties, eg., this.setupOptions.flashVersion -> this.flashVersion (soundManager.flashVersion)
   * this maintains backward compatibility, and allows properties to be defined separately for use by soundManager.setup().
   */

  setProperties = function() {

    var i,
        o = sm2.setupOptions;

    for (i in o) {

      if (o.hasOwnProperty(i)) {

        // assign local property if not already defined

        if (sm2[i] === _undefined) {

          sm2[i] = o[i];

        } else if (sm2[i] !== o[i]) {

          // legacy support: write manually-assigned property (eg., soundManager.url) back to setupOptions to keep things in sync
          sm2.setupOptions[i] = sm2[i];

        }

      }

    }

  };


  init = function() {

    // called after onload()

    if (didInit) {
      _wDS('didInit');
      return false;
    }

    function cleanup() {
      event.remove(window, 'load', sm2.beginDelayedInit);
    }

    if (sm2.html5Only) {
      if (!didInit) {
        // we don't need no steenking flash!
        cleanup();
        sm2.enabled = true;
        initComplete();
      }
      return true;
    }

    // flash path
    initMovie();

    try {

      // attempt to talk to Flash
      flash._externalInterfaceTest(false);

      // apply user-specified polling interval, OR, if "high performance" set, faster vs. default polling
      // (determines frequency of whileloading/whileplaying callbacks, effectively driving UI framerates)
      setPolling(true, (sm2.flashPollingInterval || (sm2.useHighPerformance ? 10 : 50)));

      if (!sm2.debugMode) {
        // stop the SWF from making debug output calls to JS
        flash._disableDebug();
      }

      sm2.enabled = true;
      debugTS('jstoflash', true);

      if (!sm2.html5Only) {
        // prevent browser from showing cached page state (or rather, restoring "suspended" page state) via back button, because flash may be dead
        // http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
        event.add(window, 'unload', doNothing);
      }

    } catch(e) {

      sm2._wD('js/flash exception: ' + e.toString());
      debugTS('jstoflash', false);
      catchError({type:'JS_TO_FLASH_EXCEPTION', fatal:true});
      // don't disable, for reboot()
      failSafely(true);
      initComplete();

      return false;

    }

    initComplete();

    // disconnect events
    cleanup();

    return true;

  };

  domContentLoaded = function() {

    if (didDCLoaded) {
      return false;
    }

    didDCLoaded = true;

    // assign top-level soundManager properties eg. soundManager.url
    setProperties();

    initDebug();

    /**
     * Temporary feature: allow force of HTML5 via URL params: sm2-usehtml5audio=0 or 1
     * Ditto for sm2-preferFlash, too.
     */
    // <d>
    (function(){

      var a = 'sm2-usehtml5audio=',
          a2 = 'sm2-preferflash=',
          b = null,
          b2 = null,
          l = wl.toLowerCase();

      if (l.indexOf(a) !== -1) {
        b = (l.charAt(l.indexOf(a)+a.length) === '1');
        if (hasConsole) {
          console.log((b?'Enabling ':'Disabling ')+'useHTML5Audio via URL parameter');
        }
        sm2.setup({
          'useHTML5Audio': b
        });
      }

      if (l.indexOf(a2) !== -1) {
        b2 = (l.charAt(l.indexOf(a2)+a2.length) === '1');
        if (hasConsole) {
          console.log((b2?'Enabling ':'Disabling ')+'preferFlash via URL parameter');
        }
        sm2.setup({
          'preferFlash': b2
        });
      }

    }());
    // </d>

    if (!hasFlash && sm2.hasHTML5) {
      sm2._wD('SoundManager 2: No Flash detected' + (!sm2.useHTML5Audio ? ', enabling HTML5.' : '. Trying HTML5-only mode.'), 1);
      sm2.setup({
        'useHTML5Audio': true,
        // make sure we aren't preferring flash, either
        // TODO: preferFlash should not matter if flash is not installed. Currently, stuff breaks without the below tweak.
        'preferFlash': false
      });
    }

    testHTML5();

    if (!hasFlash && needsFlash) {
      messages.push(strings.needFlash);
      // TODO: Fatal here vs. timeout approach, etc.
      // hack: fail sooner.
      sm2.setup({
        'flashLoadTimeout': 1
      });
    }

    if (doc.removeEventListener) {
      doc.removeEventListener('DOMContentLoaded', domContentLoaded, false);
    }

    initMovie();

    return true;

  };

  domContentLoadedIE = function() {

    if (doc.readyState === 'complete') {
      domContentLoaded();
      doc.detachEvent('onreadystatechange', domContentLoadedIE);
    }

    return true;

  };

  winOnLoad = function() {

    // catch edge case of initComplete() firing after window.load()
    windowLoaded = true;
    event.remove(window, 'load', winOnLoad);

  };

  /**
   * miscellaneous run-time, pre-init stuff
   */

  preInit = function() {

    if (mobileHTML5) {

      // prefer HTML5 for mobile + tablet-like devices, probably more reliable vs. flash at this point.

      // <d>
      if (!sm2.setupOptions.useHTML5Audio || sm2.setupOptions.preferFlash) {
        // notify that defaults are being changed.
        messages.push(strings.mobileUA);
      }
      // </d>

      sm2.setupOptions.useHTML5Audio = true;
      sm2.setupOptions.preferFlash = false;

      if (is_iDevice || (isAndroid && !ua.match(/android\s2\.3/i))) {
        // iOS and Android devices tend to work better with a single audio instance, specifically for chained playback of sounds in sequence.
        // common use case: exiting sound onfinish() -> createSound() -> play()
        // <d>
        messages.push(strings.globalHTML5);
        // </d>
        if (is_iDevice) {
          sm2.ignoreFlash = true;
        }
        useGlobalHTML5Audio = true;
      }

    }

  };

  preInit();

  // sniff up-front
  detectFlash();

  // focus and window load, init (primarily flash-driven)
  event.add(window, 'focus', handleFocus);
  event.add(window, 'load', delayWaitForEI);
  event.add(window, 'load', winOnLoad);

  if (doc.addEventListener) {

    doc.addEventListener('DOMContentLoaded', domContentLoaded, false);

  } else if (doc.attachEvent) {

    doc.attachEvent('onreadystatechange', domContentLoadedIE);

  } else {

    // no add/attachevent support - safe to assume no JS -> Flash either
    debugTS('onload', false);
    catchError({type:'NO_DOM2_EVENTS', fatal:true});

  }

} // SoundManager()

// SM2_DEFER details: http://www.schillmania.com/projects/soundmanager2/doc/getstarted/#lazy-loading

if (window.SM2_DEFER === undefined || !SM2_DEFER) {
  soundManager = new SoundManager();
}

/**
 * SoundManager public interfaces
 * ------------------------------
 */

window.SoundManager = SoundManager; // constructor
window.soundManager = soundManager; // public API, flash callbacks etc.

}(window));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb2hubnkvcHJvai9zd2FnZ3BsYXllci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL2Zha2VfYWRmM2JlZjQuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL3NvbmcuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL3NvdW5kTWFuYWdlcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKiBnbG9iYWwgZGVmaW5lOmZhbHNlLCBzb3VuZE1hbmFnZXI6IGZhbHNlICovXG5cbjsoZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuICAvLyBoaVxuICByZXF1aXJlKCAnLi9zb3VuZE1hbmFnZXIyJyApO1xuXG4gIHZhciBTb25nID0gIHJlcXVpcmUoICcuL3NvbmcnICk7XG5cbiAgLy8gdmFyaW91cyB1dGlsaXR5IGZ1bmN0aW9uc1xuICB2YXIgVXRpbHMgPSB7XG5cbiAgICBmb3JtSWQ6IGZ1bmN0aW9uKCBpbmRleCApIHtcbiAgICAgIHJldHVybiAndHJhY2stJyArIGluZGV4O1xuICAgIH0sXG5cbiAgICBzaG91bGRSZXN1bWU6IGZ1bmN0aW9uKCBzb25nICkge1xuICAgICAgcmV0dXJuIHNvbmcucmF3LnBvc2l0aW9uICYmIHNvbmcucmF3LnBvc2l0aW9uID4gMDtcbiAgICB9LFxuXG4gICAgdGltZVN0cmluZzogZnVuY3Rpb24oIHN0ciApIHtcbiAgICAgIHZhciB0bXAgPSBwYXJzZUludCggc3RyLCAxMCApO1xuICAgICAgdmFyIHQgPSB0bXAgPiA5ID8gc3RyIDogJzAnICsgc3RyO1xuICAgICAgcmV0dXJuIHQgIT09ICc2MCcgPyB0IDogJzAwJztcbiAgICB9LFxuXG4gICAgbWlsbHNUb1RpbWUgOiBmdW5jdGlvbihkdXJhdGlvbiwgZmxhZykge1xuICAgICAgdmFyIHNlY29uZHMgPSBNYXRoLmZsb29yKGR1cmF0aW9uIC8gMTAwMCk7XG4gICAgICB2YXIgbWludXRlcyA9IDA7XG5cbiAgICAgIGlmIChzZWNvbmRzID4gNjApIHtcbiAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICAgICAgc2Vjb25kcyA9IE1hdGgucm91bmQoc2Vjb25kcyAlIDYwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlY29uZHMgPT09IDYwKSB7XG4gICAgICAgIG1pbnV0ZXMgKz0gMTtcbiAgICAgICAgc2Vjb25kcyA9IDA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IG1pbnM6IHBhcnNlSW50KCB0aGlzLnRpbWVTdHJpbmcoIG1pbnV0ZXMgKSApLCBzZWNzIDogcGFyc2VJbnQoIHRoaXMudGltZVN0cmluZyggc2Vjb25kcyApICkgfTtcbiAgICB9LFxuXG4gIH07XG5cbiAgdmFyIFN3YWdnUGxheWVyID0gZnVuY3Rpb24oKXtcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIGRhdGEgYW5kIHN1Y2hcbiAgICB2YXIgX2RhdGEgPSB7fTtcblxuICAgIC8vIGV4dGVybmFsIEFQSVxuICAgIHZhciBfYXBpID0ge307XG5cbiAgICAvLyBpbml0aWFsaXplIHRoZSBwbGF5ZXIgd2l0aCBvcHRpb25zXG4gICAgZnVuY3Rpb24gaW5pdCggb3B0cyApIHtcbiAgICAgIF9kYXRhLl9lbGVtZW50ID0gb3B0cy5lbDtcbiAgICAgIF9kYXRhLnN3ZlVybCAgPSBvcHRzLnN3ZiB8fCAnL3N3Zic7XG4gICAgICBfZGF0YS5zb25ncyA9IFtdO1xuICAgICAgX2RhdGEuY3VycmVudFRyYWNrID0gMDtcbiAgICAgIHNvdW5kTWFuYWdlci5zZXR1cCh7XG4gICAgICAgIHVybDogX2RhdGEuc3dmVXJsLFxuICAgICAgICBvbnJlYWR5OiBmdW5jdGlvbigpe1xuICAgICAgICAgIF9sb2FkKCBvcHRzICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gX2FwaTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgdGhlIHNvdW5kIG1hbmFnZXIgc291bmQgaW5zdGFuY2VzXG4gICAgZnVuY3Rpb24gX2xvYWQoIG9wdHMgKSB7XG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBvcHRzLnNvbmdzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICB2YXIgc29uZyA9IG5ldyBTb25nKCBvcHRzLnNvbmdzWyBpIF0gKTtcbiAgICAgICAgc29uZy5pZCA9IGk7XG4gICAgICAgIGlmICggaSA9PT0gMCApIHtcbiAgICAgICAgICBfZGF0YS5maXJzdFRyYWNrID0gc29uZztcbiAgICAgICAgfVxuICAgICAgICBfZGF0YS5zb25ncy5wdXNoKCBzb25nICk7XG4gICAgICAgIF9jcmVhdGVOZXdTb25nKCBzb25nLCBvcHRzICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlcyBhIHNvdW5kIG1hbmFnZXIgc291bmQgaW5zdGFuY2UgYW5kIGNvbmZpZ3VyZXNcbiAgICAvLyBhbGwgb2YgaXQncyBvcHRpb25zIGFuZCByZWdpc3RlcnMgY2FsbGJhY2tzXG4gICAgZnVuY3Rpb24gX2NyZWF0ZU5ld1NvbmcoIHNvbmdEYXRhLCBvcHRzICkge1xuICAgICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgICB2YXIgc2VsZiA9IF9kYXRhO1xuICAgICAgdmFyIG1ldGEgPSB7XG4gICAgICAgIGFydGlzdDogc29uZ0RhdGEuYXJ0aXN0LFxuICAgICAgICB0aXRsZTogc29uZ0RhdGEudGl0bGUsXG4gICAgICAgIGFydDogc29uZ0RhdGEuYXJ0XG4gICAgICB9O1xuICAgICAgdmFyIGZhc3RQb2xsaW5nID0gKCBvcHRzLnRocm90dGxlUG9sbGluZyApID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgICBzb25nRGF0YS5yYXcgPSBzb3VuZE1hbmFnZXIuY3JlYXRlU291bmQoe1xuICAgICAgICBpZDogVXRpbHMuZm9ybUlkKCBzb25nRGF0YS5pZCApLFxuICAgICAgICB1cmw6IHNvbmdEYXRhLnVybCxcbiAgICAgICAgLy8gYXV0b0xvYWQ6IHRydWUsXG4gICAgICAgIGF1dG9QbGF5OiBmYWxzZSxcbiAgICAgICAgdXNlSGlnaFBlcmZvcm1hbmNlOiBmYXN0UG9sbGluZyxcblxuICAgICAgICBvbmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdUaGUgJyArIHNvbmdEYXRhLnRpdGxlICsgJyBsb2FkZWQhJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9ucGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCBvcHRzLm9uUGxheSApIHtcbiAgICAgICAgICAgIG9wdHMub25QbGF5KCBtZXRhICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbnJlc3VtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCBvcHRzLm9uUmVzdW1lICkge1xuICAgICAgICAgICAgb3B0cy5vblJlc3VtZSggbWV0YSApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25wYXVzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCBvcHRzLm9uUGF1c2UgKSB7XG4gICAgICAgICAgICBvcHRzLm9uUGF1c2UoIG1ldGEgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25zdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoIG9wdHMub25TdG9wICkge1xuICAgICAgICAgICAgb3B0cy5vblN0b3AoIG1ldGEgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25maW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vbkZpbmlzaCApIHtcbiAgICAgICAgICAgIG9wdHMub25GaW5pc2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2hpbGVsb2FkaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoIG9wdHMud2hpbGVMb2FkaW5nICkge1xuICAgICAgICAgICAgdmFyIGFtbnRMb2FkZWQgPSBfZGV0ZXJtaW5lQnl0ZXNMb2FkZWQoIHRoaXMgKTtcbiAgICAgICAgICAgIG9wdHMud2hpbGVMb2FkaW5nKCBhbW50TG9hZGVkICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHdoaWxlcGxheWluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCBvcHRzLndoaWxlUGxheWluZyApIHtcbiAgICAgICAgICAgIHZhciB0aW1lUHJvZ3Jlc3MgICAgPSBfZGV0ZXJtaW5lVGltZVByb2dyZXNzKCB0aGlzICk7XG4gICAgICAgICAgICB2YXIgcGVyY2VudENvbXBsZXRlID0gX2RldGVybWluZUJ5dGVQcm9ncmVzcyggdGhpcyApO1xuICAgICAgICAgICAgb3B0cy53aGlsZVBsYXlpbmcoIHRpbWVQcm9ncmVzcywgcGVyY2VudENvbXBsZXRlICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSAvLyBlbmQgY3JlYXRlIHNvdW5kXG5cbiAgICBmdW5jdGlvbiBfZGV0ZXJtaW5lQnl0ZXNMb2FkZWQoIHNvdW5kICkge1xuICAgICAgLy8gZ2V0IGN1cnJlbnQgcG9zaXRpb24gb2YgY3VycmVudGx5IHBsYXlpbmcgc29uZ1xuICAgICAgY29uc29sZS5sb2coIHNvdW5kLmJ5dGVzTG9hZGVkICsgJy8nICsgc291bmQuYnl0ZXNUb3RhbCApO1xuICAgICAgcmV0dXJuIHNvdW5kLmJ5dGVzTG9hZGVkIC8gc291bmQuYnl0ZXNUb3RhbDtcbiAgICB9XG5cbiAgICAvLyBkZXRlcm1pbmUgaG93IGZhciBhbG9uZyBhIHNvbmcgaXMgaW4gdGVybXMgb2YgaG93IG1hbnkgYnl0ZXNcbiAgICAvLyBoYXZlIGJlZW4gcGxheWVkIGluIHJlbGF0aW9uIHRvIHRoZSB0b3RhbCBieXRlc1xuICAgIGZ1bmN0aW9uIF9kZXRlcm1pbmVCeXRlUHJvZ3Jlc3MoIHNvdW5kICkge1xuICAgICAgLy8gZ2V0IGN1cnJlbnQgcG9zaXRpb24gb2YgY3VycmVudGx5IHBsYXlpbmcgc29uZ1xuICAgICAgdmFyIHBvcyA9IHNvdW5kLnBvc2l0aW9uO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICAgIHZhciBsb2FkZWRSYXRpbyA9IHNvdW5kLmJ5dGVzTG9hZGVkIC8gc291bmQuYnl0ZXNUb3RhbDtcblxuICAgICAgaWYgKCBzb3VuZC5sb2FkZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGR1cmF0aW9uID0gc291bmQuZHVyYXRpb25Fc3RpbWF0ZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBkdXJhdGlvbiA9IHNvdW5kLmR1cmF0aW9uO1xuICAgICAgfVxuXG4gICAgICAvLyByYXRpbyBvZiAoY3VycmVudCBwb3NpdGlvbiAvIHRvdGFsIGR1cmF0aW9uIG9mIHNvbmcpXG4gICAgICB2YXIgcG9zaXRpb25SYXRpbyA9IHBvcy9kdXJhdGlvbjtcblxuICAgICAgcmV0dXJuICggcG9zaXRpb25SYXRpby50b0ZpeGVkKCAyICkgKiAxMDAgKS50b0ZpeGVkKCAwICk7XG4gICAgfVxuXG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBjdXJyZW50IHNvbmcncyBwb3NpdGlvbiBpbiB0aW1lIG1tOnNzIC8gbW06c3NcbiAgICBmdW5jdGlvbiBfZGV0ZXJtaW5lVGltZVByb2dyZXNzKCBzb3VuZCApIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IHNvdW5kLmxvYWRlZCA9PT0gdHJ1ZSA/IHNvdW5kLmR1cmF0aW9uIDogc291bmQuZHVyYXRpb25Fc3RpbWF0ZTtcbiAgICAgIHZhciBjdXJyID0gVXRpbHMubWlsbHNUb1RpbWUoIHNvdW5kLnBvc2l0aW9uICk7XG4gICAgICB2YXIgdG90YWwgPSBVdGlscy5taWxsc1RvVGltZSggZHVyYXRpb24gKTtcbiAgICAgIHZhciB0aW1lID0ge1xuICAgICAgICBjdXJyZW50OiB7XG4gICAgICAgICAgbWluOiBjdXJyLm1pbnMsXG4gICAgICAgICAgc2VjOiBjdXJyLnNlY3MsXG4gICAgICAgIH0sXG4gICAgICAgIHRvdGFsOiB7XG4gICAgICAgICAgbWluOiB0b3RhbC5taW5zLFxuICAgICAgICAgIHNlYzogdG90YWwuc2Vjc1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgLy8gc3RvcCBhbGwgcGxheWluZyBzb3VuZHNcbiAgICBmdW5jdGlvbiBfc3RvcCgpIHtcbiAgICAgIHNvdW5kTWFuYWdlci5zdG9wQWxsKCk7XG4gICAgICByZXR1cm4gX2FwaTtcbiAgICB9XG5cbiAgICAvLyBwbGF5IGEgc29uZyBhdCB0aGUgZ2l2ZW4gaW5kZXhcbiAgICBmdW5jdGlvbiBfcGxheSggaW5kZXggKSB7XG4gICAgICAvLyBpZiBhbiBpbmRleCBpcyBzdXBwbGllZCBwbGF5IGEgc3BlY2lmaWMgc29uZ1xuICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgcGxheSB0aGUgY3VycmVudCBzb25nXG4gICAgICBpZiAoIGluZGV4ICkge1xuICAgICAgICBfZGF0YS5jdXJyZW50VHJhY2sgPSBpbmRleDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4ID0gX2RhdGEuY3VycmVudFRyYWNrO1xuICAgICAgfVxuXG4gICAgICB2YXIgc291bmQgPSBfZGF0YS5zb25nc1sgaW5kZXggXTtcblxuICAgICAgLy8gY2hlY2sgaWYgd2UncmUgaW4gYSBwYXVzZWQgc3RhdGUuIGlmIG5vdCwgcGxheSBmcm9tIHRoZSBiZWdpbm5pbmcuXG4gICAgICAvLyBpZiB3ZSBhcmUsIHRoZW4gcmVzdW1lIHBsYXlcbiAgICAgIGlmICggc291bmQgJiYgIVV0aWxzLnNob3VsZFJlc3VtZSggc291bmQgKSApIHtcbiAgICAgICAgX3N0b3AoKTtcbiAgICAgICAgc291bmQucmF3LnBsYXkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kLnJhdy50b2dnbGVQYXVzZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9hcGk7XG4gICAgfVxuXG4gICAgLy8gcGF1c2UgYWxsIHNvbmdzXG4gICAgZnVuY3Rpb24gX3BhdXNlKCkge1xuICAgICAgLy8gY29uc29sZS5sb2coIF9kYXRhLnNvbmdzWyBfZGF0YS5jdXJyZW50VHJhY2sgXS5yYXcudm9sdW1lICk7XG4gICAgICBzb3VuZE1hbmFnZXIucGF1c2VBbGwoKTtcbiAgICAgIHJldHVybiBfYXBpO1xuICAgIH1cblxuICAgIC8vIHBsYXkgdGhlIG5leHQgc29uZ1xuICAgIGZ1bmN0aW9uIF9uZXh0KCkge1xuICAgICAgX3N0b3AoKTtcbiAgICAgIF9yZXNldFNvdW5kKCBfZGF0YS5jdXJyZW50VHJhY2sgKTtcbiAgICAgIF9kYXRhLmN1cnJlbnRUcmFjayA9IF9kYXRhLmN1cnJlbnRUcmFjayArIDE7XG4gICAgICBpZiAoIF9kYXRhLmN1cnJlbnRUcmFjayA+ICggX2RhdGEuc29uZ3MubGVuZ3RoIC0gMSApICkge1xuICAgICAgICBfZGF0YS5jdXJyZW50VHJhY2sgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gcGxheSB0aGUgcHJldmlvdXMgc29uZ1xuICAgIGZ1bmN0aW9uIF9wcmV2KCkge1xuICAgICAgX3N0b3AoKTtcbiAgICAgIF9yZXNldFNvdW5kKCBfZGF0YS5jdXJyZW50VHJhY2sgKTtcbiAgICAgIF9kYXRhLmN1cnJlbnRUcmFjayAtPSAxO1xuICAgICAgaWYgKCBfZGF0YS5jdXJyZW50VHJhY2sgPCAwICkge1xuICAgICAgICB2YXIgc29uZyA9IF9kYXRhLnNvbmdzWyBfZGF0YS5zb25ncy5sZW5ndGggLSAxIF07XG4gICAgICAgIF9kYXRhLmN1cnJlbnRUcmFjayA9IHNvbmcuaWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3BsYXkoKTtcbiAgICB9XG5cbiAgICAvLyB0byBiZSBmaXJlZCB3aGVuIHRoZSBwbGF5ZXIgaXMgcmVhZHkgdG8gZ29cbiAgICBmdW5jdGlvbiBfb25SZWFkeShjYikge1xuICAgICAgdmFyIGZpcnN0U29uZyA9IF9kYXRhLnNvbmdzWyAwIF07XG4gICAgICBpZiAoIGNiICkge1xuICAgICAgICBzb3VuZE1hbmFnZXIub25yZWFkeSggY2IuYmluZCggX2FwaSwgWyBfZGF0YS5maXJzdFRyYWNrIF0gKSApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9hcGk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX29uRXJyb3IoY2IpIHtcbiAgICAgIGlmICggY2IgKSB7XG4gICAgICAgIHNvdW5kTWFuYWdlci5vbmVycm9yKCBjYi5iaW5kKCBfYXBpICkgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfYXBpO1xuICAgIH1cblxuICAgIC8vIHJlc2V0cyB0aGUgY3VycmVudCBwb3NpdGlvbiBmb3IgYSBzb25nIHRvIDBcbiAgICBmdW5jdGlvbiBfcmVzZXRTb3VuZCggaW5kZXggKSB7XG4gICAgICB2YXIgaWQgPSBVdGlscy5mb3JtSWQoIGluZGV4ICk7XG4gICAgICBzb3VuZE1hbmFnZXIuZ2V0U291bmRCeUlkKCBpZCApLnBvc2l0aW9uID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfY3Vyc29yKCBpbmRleCApIHtcbiAgICAgIGluZGV4ID0gKCBpbmRleCA+IDAgJiYgaW5kZXggPCAoIF9kYXRhLnNvbmdzLmxlbmd0aCAtIDEgKSApID8gaW5kZXggOiAwO1xuICAgICAgX2RhdGEuY3VycmVudFRyYWNrID0gaW5kZXg7XG4gICAgICB2YXIgc29uZyA9IF9kYXRhLnNvbmdzWyBpbmRleCBdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHNvbmcudGl0bGUsXG4gICAgICAgIGFydDogc29uZy5hcnQsXG4gICAgICAgIGlkOiBzb25nLmlkLFxuICAgICAgICBhcnRpc3Q6IHNvbmcuYXJ0aXN0XG4gICAgICB9O1xuICAgIH1cblxuXG4gICAgLy8gZXhwb3NlIGFwaVxuICAgIF9hcGkuaW5pdCAgICAgPSBpbml0O1xuICAgIF9hcGkub25SZWFkeSAgPSBfb25SZWFkeTtcbiAgICBfYXBpLm9uRXJyb3IgID0gX29uRXJyb3I7XG4gICAgX2FwaS5zdG9wICAgICA9IF9zdG9wO1xuICAgIF9hcGkucGxheSAgICAgPSBfcGxheTtcbiAgICBfYXBpLnBhdXNlICAgID0gX3BhdXNlO1xuICAgIF9hcGkubmV4dCAgICAgPSBfbmV4dDtcbiAgICBfYXBpLnByZXYgICAgID0gX3ByZXY7XG4gICAgX2FwaS5jdXJzb3IgICA9IF9jdXJzb3I7XG5cbiAgICByZXR1cm4gX2FwaTtcblxuICB9O1xuXG5cbiAgaWYgKCB3aW5kb3cubW9kdWxlICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU3dhZ2dQbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93LlN3YWdnUGxheWVyID0gU3dhZ2dQbGF5ZXI7XG4gIH1cblxufSgpICk7IiwiXG47KGZ1bmN0aW9uKCl7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBTb25nID0gZnVuY3Rpb24oIG9wdHMgKSB7XG4gICAgdGhpcy50aXRsZSAgICA9IG9wdHMudGl0bGU7XG4gICAgdGhpcy5hcnRpc3QgICA9IG9wdHMuYXJ0aXN0O1xuICAgIHRoaXMudXJsICAgICAgPSBvcHRzLnVybDtcbiAgICB0aGlzLmFydCAgICAgID0gb3B0cy5hcnQ7XG4gICAgdGhpcy5pZCAgICAgICA9IG9wdHMuaWQ7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBTb25nO1xuXG59KCkpOyIsIi8qKiBAbGljZW5zZVxyXG4gKlxyXG4gKiBTb3VuZE1hbmFnZXIgMjogSmF2YVNjcmlwdCBTb3VuZCBmb3IgdGhlIFdlYlxyXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqIGh0dHA6Ly9zY2hpbGxtYW5pYS5jb20vcHJvamVjdHMvc291bmRtYW5hZ2VyMi9cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDA3LCBTY290dCBTY2hpbGxlci4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogQ29kZSBwcm92aWRlZCB1bmRlciB0aGUgQlNEIExpY2Vuc2U6XHJcbiAqIGh0dHA6Ly9zY2hpbGxtYW5pYS5jb20vcHJvamVjdHMvc291bmRtYW5hZ2VyMi9saWNlbnNlLnR4dFxyXG4gKlxyXG4gKiBWMi45N2EuMjAxMzEyMDFcclxuICovXHJcblxyXG4vKmdsb2JhbCB3aW5kb3csIFNNMl9ERUZFUiwgc20yRGVidWdnZXIsIGNvbnNvbGUsIGRvY3VtZW50LCBuYXZpZ2F0b3IsIHNldFRpbWVvdXQsIHNldEludGVydmFsLCBjbGVhckludGVydmFsLCBBdWRpbywgb3BlcmEgKi9cclxuLypqc2xpbnQgcmVnZXhwOiB0cnVlLCBzbG9wcHk6IHRydWUsIHdoaXRlOiB0cnVlLCBub21lbjogdHJ1ZSwgcGx1c3BsdXM6IHRydWUsIHRvZG86IHRydWUgKi9cclxuXHJcbi8qKlxyXG4gKiBBYm91dCB0aGlzIGZpbGVcclxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiBUaGlzIGlzIHRoZSBmdWxseS1jb21tZW50ZWQgc291cmNlIHZlcnNpb24gb2YgdGhlIFNvdW5kTWFuYWdlciAyIEFQSSxcclxuICogcmVjb21tZW5kZWQgZm9yIHVzZSBkdXJpbmcgZGV2ZWxvcG1lbnQgYW5kIHRlc3RpbmcuXHJcbiAqXHJcbiAqIFNlZSBzb3VuZG1hbmFnZXIyLW5vZGVidWctanNtaW4uanMgZm9yIGFuIG9wdGltaXplZCBidWlsZCAofjExS0Igd2l0aCBnemlwLilcclxuICogaHR0cDovL3NjaGlsbG1hbmlhLmNvbS9wcm9qZWN0cy9zb3VuZG1hbmFnZXIyL2RvYy9nZXRzdGFydGVkLyNiYXNpYy1pbmNsdXNpb25cclxuICogQWx0ZXJuYXRlbHksIHNlcnZlIHRoaXMgZmlsZSB3aXRoIGd6aXAgZm9yIDc1JSBjb21wcmVzc2lvbiBzYXZpbmdzICh+MzBLQiBvdmVyIEhUVFAuKVxyXG4gKlxyXG4gKiBZb3UgbWF5IG5vdGljZSA8ZD4gYW5kIDwvZD4gY29tbWVudHMgaW4gdGhpcyBzb3VyY2U7IHRoZXNlIGFyZSBkZWxpbWl0ZXJzIGZvclxyXG4gKiBkZWJ1ZyBibG9ja3Mgd2hpY2ggYXJlIHJlbW92ZWQgaW4gdGhlIC1ub2RlYnVnIGJ1aWxkcywgZnVydGhlciBvcHRpbWl6aW5nIGNvZGUgc2l6ZS5cclxuICpcclxuICogQWxzbywgYXMgeW91IG1heSBub3RlOiBXaG9hLCByZWxpYWJsZSBjcm9zcy1wbGF0Zm9ybS9kZXZpY2UgYXVkaW8gc3VwcG9ydCBpcyBoYXJkISA7KVxyXG4gKi9cclxuXHJcbihmdW5jdGlvbih3aW5kb3csIF91bmRlZmluZWQpIHtcclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxudmFyIHNvdW5kTWFuYWdlciA9IG51bGw7XHJcblxyXG4vKipcclxuICogVGhlIFNvdW5kTWFuYWdlciBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzbVVSTCBPcHRpb25hbDogUGF0aCB0byBTV0YgZmlsZXNcclxuICogQHBhcmFtIHtzdHJpbmd9IHNtSUQgT3B0aW9uYWw6IFRoZSBJRCB0byB1c2UgZm9yIHRoZSBTV0YgY29udGFpbmVyIGVsZW1lbnRcclxuICogQHRoaXMge1NvdW5kTWFuYWdlcn1cclxuICogQHJldHVybiB7U291bmRNYW5hZ2VyfSBUaGUgbmV3IFNvdW5kTWFuYWdlciBpbnN0YW5jZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIFNvdW5kTWFuYWdlcihzbVVSTCwgc21JRCkge1xyXG5cclxuICAvKipcclxuICAgKiBzb3VuZE1hbmFnZXIgY29uZmlndXJhdGlvbiBvcHRpb25zIGxpc3RcclxuICAgKiBkZWZpbmVzIHRvcC1sZXZlbCBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgc291bmRNYW5hZ2VyIGluc3RhbmNlIChlZy4gc291bmRNYW5hZ2VyLmZsYXNoVmVyc2lvbilcclxuICAgKiB0byBzZXQgdGhlc2UgcHJvcGVydGllcywgdXNlIHRoZSBzZXR1cCgpIG1ldGhvZCAtIGVnLiwgc291bmRNYW5hZ2VyLnNldHVwKHt1cmw6ICcvc3dmLycsIGZsYXNoVmVyc2lvbjogOX0pXHJcbiAgICovXHJcblxyXG4gIHRoaXMuc2V0dXBPcHRpb25zID0ge1xyXG5cclxuICAgICd1cmwnOiAoc21VUkwgfHwgbnVsbCksICAgICAgICAgICAgIC8vIHBhdGggKGRpcmVjdG9yeSkgd2hlcmUgU291bmRNYW5hZ2VyIDIgU1dGcyBleGlzdCwgZWcuLCAvcGF0aC90by9zd2ZzL1xyXG4gICAgJ2ZsYXNoVmVyc2lvbic6IDgsICAgICAgICAgICAgICAgICAgLy8gZmxhc2ggYnVpbGQgdG8gdXNlICg4IG9yIDkuKSBTb21lIEFQSSBmZWF0dXJlcyByZXF1aXJlIDkuXHJcbiAgICAnZGVidWdNb2RlJzogdHJ1ZSwgICAgICAgICAgICAgICAgICAvLyBlbmFibGUgZGVidWdnaW5nIG91dHB1dCAoY29uc29sZS5sb2coKSB3aXRoIEhUTUwgZmFsbGJhY2spXHJcbiAgICAnZGVidWdGbGFzaCc6IGZhbHNlLCAgICAgICAgICAgICAgICAvLyBlbmFibGUgZGVidWdnaW5nIG91dHB1dCBpbnNpZGUgU1dGLCB0cm91Ymxlc2hvb3QgRmxhc2gvYnJvd3NlciBpc3N1ZXNcclxuICAgICd1c2VDb25zb2xlJzogdHJ1ZSwgICAgICAgICAgICAgICAgIC8vIHVzZSBjb25zb2xlLmxvZygpIGlmIGF2YWlsYWJsZSAob3RoZXJ3aXNlLCB3cml0ZXMgdG8gI3NvdW5kbWFuYWdlci1kZWJ1ZyBlbGVtZW50KVxyXG4gICAgJ2NvbnNvbGVPbmx5JzogdHJ1ZSwgICAgICAgICAgICAgICAgLy8gaWYgY29uc29sZSBpcyBiZWluZyB1c2VkLCBkbyBub3QgY3JlYXRlL3dyaXRlIHRvICNzb3VuZG1hbmFnZXItZGVidWdcclxuICAgICd3YWl0Rm9yV2luZG93TG9hZCc6IGZhbHNlLCAgICAgICAgIC8vIGZvcmNlIFNNMiB0byB3YWl0IGZvciB3aW5kb3cub25sb2FkKCkgYmVmb3JlIHRyeWluZyB0byBjYWxsIHNvdW5kTWFuYWdlci5vbmxvYWQoKVxyXG4gICAgJ2JnQ29sb3InOiAnI2ZmZmZmZicsICAgICAgICAgICAgICAgLy8gU1dGIGJhY2tncm91bmQgY29sb3IuIE4vQSB3aGVuIHdtb2RlID0gJ3RyYW5zcGFyZW50J1xyXG4gICAgJ3VzZUhpZ2hQZXJmb3JtYW5jZSc6IGZhbHNlLCAgICAgICAgLy8gcG9zaXRpb246Zml4ZWQgZmxhc2ggbW92aWUgY2FuIGhlbHAgaW5jcmVhc2UganMvZmxhc2ggc3BlZWQsIG1pbmltaXplIGxhZ1xyXG4gICAgJ2ZsYXNoUG9sbGluZ0ludGVydmFsJzogbnVsbCwgICAgICAgLy8gbXNlYyBhZmZlY3Rpbmcgd2hpbGVwbGF5aW5nL2xvYWRpbmcgY2FsbGJhY2sgZnJlcXVlbmN5LiBJZiBudWxsLCBkZWZhdWx0IG9mIDUwIG1zZWMgaXMgdXNlZC5cclxuICAgICdodG1sNVBvbGxpbmdJbnRlcnZhbCc6IG51bGwsICAgICAgIC8vIG1zZWMgYWZmZWN0aW5nIHdoaWxlcGxheWluZygpIGZvciBIVE1MNSBhdWRpbywgZXhjbHVkaW5nIG1vYmlsZSBkZXZpY2VzLiBJZiBudWxsLCBuYXRpdmUgSFRNTDUgdXBkYXRlIGV2ZW50cyBhcmUgdXNlZC5cclxuICAgICdmbGFzaExvYWRUaW1lb3V0JzogMTAwMCwgICAgICAgICAgIC8vIG1zZWMgdG8gd2FpdCBmb3IgZmxhc2ggbW92aWUgdG8gbG9hZCBiZWZvcmUgZmFpbGluZyAoMCA9IGluZmluaXR5KVxyXG4gICAgJ3dtb2RlJzogbnVsbCwgICAgICAgICAgICAgICAgICAgICAgLy8gZmxhc2ggcmVuZGVyaW5nIG1vZGUgLSBudWxsLCAndHJhbnNwYXJlbnQnLCBvciAnb3BhcXVlJyAobGFzdCB0d28gYWxsb3cgei1pbmRleCB0byB3b3JrKVxyXG4gICAgJ2FsbG93U2NyaXB0QWNjZXNzJzogJ2Fsd2F5cycsICAgICAgLy8gZm9yIHNjcmlwdGluZyB0aGUgU1dGIChvYmplY3QvZW1iZWQgcHJvcGVydHkpLCAnYWx3YXlzJyBvciAnc2FtZURvbWFpbidcclxuICAgICd1c2VGbGFzaEJsb2NrJzogZmFsc2UsICAgICAgICAgICAgIC8vICpyZXF1aXJlcyBmbGFzaGJsb2NrLmNzcywgc2VlIGRlbW9zKiAtIGFsbG93IHJlY292ZXJ5IGZyb20gZmxhc2ggYmxvY2tlcnMuIFdhaXQgaW5kZWZpbml0ZWx5IGFuZCBhcHBseSB0aW1lb3V0IENTUyB0byBTV0YsIGlmIGFwcGxpY2FibGUuXHJcbiAgICAndXNlSFRNTDVBdWRpbyc6IHRydWUsICAgICAgICAgICAgICAvLyB1c2UgSFRNTDUgQXVkaW8oKSB3aGVyZSBBUEkgaXMgc3VwcG9ydGVkIChtb3N0IFNhZmFyaSwgQ2hyb21lIHZlcnNpb25zKSwgRmlyZWZveCAobm8gTVAzL01QNC4pIElkZWFsbHksIHRyYW5zcGFyZW50IHZzLiBGbGFzaCBBUEkgd2hlcmUgcG9zc2libGUuXHJcbiAgICAnaHRtbDVUZXN0JzogL14ocHJvYmFibHl8bWF5YmUpJC9pLCAvLyBIVE1MNSBBdWRpbygpIGZvcm1hdCBzdXBwb3J0IHRlc3QuIFVzZSAvXnByb2JhYmx5JC9pOyBpZiB5b3Ugd2FudCB0byBiZSBtb3JlIGNvbnNlcnZhdGl2ZS5cclxuICAgICdwcmVmZXJGbGFzaCc6IGZhbHNlLCAgICAgICAgICAgICAgIC8vIG92ZXJyaWRlcyB1c2VIVE1MNWF1ZGlvLCB3aWxsIHVzZSBGbGFzaCBmb3IgTVAzL01QNC9BQUMgaWYgcHJlc2VudC4gUG90ZW50aWFsIG9wdGlvbiBpZiBIVE1MNSBwbGF5YmFjayB3aXRoIHRoZXNlIGZvcm1hdHMgaXMgcXVpcmt5LlxyXG4gICAgJ25vU1dGQ2FjaGUnOiBmYWxzZSwgICAgICAgICAgICAgICAgLy8gaWYgdHJ1ZSwgYXBwZW5kcyA/dHM9e2RhdGV9IHRvIGJyZWFrIGFnZ3Jlc3NpdmUgU1dGIGNhY2hpbmcuXHJcbiAgICAnaWRQcmVmaXgnOiAnc291bmQnICAgICAgICAgICAgICAgICAvLyBpZiBhbiBpZCBpcyBub3QgcHJvdmlkZWQgdG8gY3JlYXRlU291bmQoKSwgdGhpcyBwcmVmaXggaXMgdXNlZCBmb3IgZ2VuZXJhdGVkIElEcyAtICdzb3VuZDAnLCAnc291bmQxJyBldGMuXHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMuZGVmYXVsdE9wdGlvbnMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciBzb3VuZCBvYmplY3RzIG1hZGUgd2l0aCBjcmVhdGVTb3VuZCgpIGFuZCByZWxhdGVkIG1ldGhvZHNcclxuICAgICAqIGVnLiwgdm9sdW1lLCBhdXRvLWxvYWQgYmVoYXZpb3VyIGFuZCBzbyBmb3J0aFxyXG4gICAgICovXHJcblxyXG4gICAgJ2F1dG9Mb2FkJzogZmFsc2UsICAgICAgICAvLyBlbmFibGUgYXV0b21hdGljIGxvYWRpbmcgKG90aGVyd2lzZSAubG9hZCgpIHdpbGwgYmUgY2FsbGVkIG9uIGRlbWFuZCB3aXRoIC5wbGF5KCksIHRoZSBsYXR0ZXIgYmVpbmcgbmljZXIgb24gYmFuZHdpZHRoIC0gaWYgeW91IHdhbnQgdG8gLmxvYWQgeW91cnNlbGYsIHlvdSBhbHNvIGNhbilcclxuICAgICdhdXRvUGxheSc6IGZhbHNlLCAgICAgICAgLy8gZW5hYmxlIHBsYXlpbmcgb2YgZmlsZSBhcyBzb29uIGFzIHBvc3NpYmxlIChtdWNoIGZhc3RlciBpZiBcInN0cmVhbVwiIGlzIHRydWUpXHJcbiAgICAnZnJvbSc6IG51bGwsICAgICAgICAgICAgIC8vIHBvc2l0aW9uIHRvIHN0YXJ0IHBsYXliYWNrIHdpdGhpbiBhIHNvdW5kIChtc2VjKSwgZGVmYXVsdCA9IGJlZ2lubmluZ1xyXG4gICAgJ2xvb3BzJzogMSwgICAgICAgICAgICAgICAvLyBob3cgbWFueSB0aW1lcyB0byByZXBlYXQgdGhlIHNvdW5kIChwb3NpdGlvbiB3aWxsIHdyYXAgYXJvdW5kIHRvIDAsIHNldFBvc2l0aW9uKCkgd2lsbCBicmVhayBvdXQgb2YgbG9vcCB3aGVuID4wKVxyXG4gICAgJ29uaWQzJzogbnVsbCwgICAgICAgICAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBmb3IgXCJJRDMgZGF0YSBpcyBhZGRlZC9hdmFpbGFibGVcIlxyXG4gICAgJ29ubG9hZCc6IG51bGwsICAgICAgICAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBmb3IgXCJsb2FkIGZpbmlzaGVkXCJcclxuICAgICd3aGlsZWxvYWRpbmcnOiBudWxsLCAgICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gZm9yIFwiZG93bmxvYWQgcHJvZ3Jlc3MgdXBkYXRlXCIgKFggb2YgWSBieXRlcyByZWNlaXZlZClcclxuICAgICdvbnBsYXknOiBudWxsLCAgICAgICAgICAgLy8gY2FsbGJhY2sgZm9yIFwicGxheVwiIHN0YXJ0XHJcbiAgICAnb25wYXVzZSc6IG51bGwsICAgICAgICAgIC8vIGNhbGxiYWNrIGZvciBcInBhdXNlXCJcclxuICAgICdvbnJlc3VtZSc6IG51bGwsICAgICAgICAgLy8gY2FsbGJhY2sgZm9yIFwicmVzdW1lXCIgKHBhdXNlIHRvZ2dsZSlcclxuICAgICd3aGlsZXBsYXlpbmcnOiBudWxsLCAgICAgLy8gY2FsbGJhY2sgZHVyaW5nIHBsYXkgKHBvc2l0aW9uIHVwZGF0ZSlcclxuICAgICdvbnBvc2l0aW9uJzogbnVsbCwgICAgICAgLy8gb2JqZWN0IGNvbnRhaW5pbmcgdGltZXMgYW5kIGZ1bmN0aW9uIGNhbGxiYWNrcyBmb3IgcG9zaXRpb25zIG9mIGludGVyZXN0XHJcbiAgICAnb25zdG9wJzogbnVsbCwgICAgICAgICAgIC8vIGNhbGxiYWNrIGZvciBcInVzZXIgc3RvcFwiXHJcbiAgICAnb25mYWlsdXJlJzogbnVsbCwgICAgICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciB3aGVuIHBsYXlpbmcgZmFpbHNcclxuICAgICdvbmZpbmlzaCc6IG51bGwsICAgICAgICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gZm9yIFwic291bmQgZmluaXNoZWQgcGxheWluZ1wiXHJcbiAgICAnbXVsdGlTaG90JzogdHJ1ZSwgICAgICAgIC8vIGxldCBzb3VuZHMgXCJyZXN0YXJ0XCIgb3IgbGF5ZXIgb24gdG9wIG9mIGVhY2ggb3RoZXIgd2hlbiBwbGF5ZWQgbXVsdGlwbGUgdGltZXMsIHJhdGhlciB0aGFuIG9uZS1zaG90L29uZSBhdCBhIHRpbWVcclxuICAgICdtdWx0aVNob3RFdmVudHMnOiBmYWxzZSwgLy8gZmlyZSBtdWx0aXBsZSBzb3VuZCBldmVudHMgKGN1cnJlbnRseSBvbmZpbmlzaCgpIG9ubHkpIHdoZW4gbXVsdGlTaG90IGlzIGVuYWJsZWRcclxuICAgICdwb3NpdGlvbic6IG51bGwsICAgICAgICAgLy8gb2Zmc2V0IChtaWxsaXNlY29uZHMpIHRvIHNlZWsgdG8gd2l0aGluIGxvYWRlZCBzb3VuZCBkYXRhLlxyXG4gICAgJ3Bhbic6IDAsICAgICAgICAgICAgICAgICAvLyBcInBhblwiIHNldHRpbmdzLCBsZWZ0LXRvLXJpZ2h0LCAtMTAwIHRvIDEwMFxyXG4gICAgJ3N0cmVhbSc6IHRydWUsICAgICAgICAgICAvLyBhbGxvd3MgcGxheWluZyBiZWZvcmUgZW50aXJlIGZpbGUgaGFzIGxvYWRlZCAocmVjb21tZW5kZWQpXHJcbiAgICAndG8nOiBudWxsLCAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uIHRvIGVuZCBwbGF5YmFjayB3aXRoaW4gYSBzb3VuZCAobXNlYyksIGRlZmF1bHQgPSBlbmRcclxuICAgICd0eXBlJzogbnVsbCwgICAgICAgICAgICAgLy8gTUlNRS1saWtlIGhpbnQgZm9yIGZpbGUgcGF0dGVybiAvIGNhblBsYXkoKSB0ZXN0cywgZWcuIGF1ZGlvL21wM1xyXG4gICAgJ3VzZVBvbGljeUZpbGUnOiBmYWxzZSwgICAvLyBlbmFibGUgY3Jvc3Nkb21haW4ueG1sIHJlcXVlc3QgZm9yIGF1ZGlvIG9uIHJlbW90ZSBkb21haW5zIChmb3IgSUQzL3dhdmVmb3JtIGFjY2VzcylcclxuICAgICd2b2x1bWUnOiAxMDAgICAgICAgICAgICAgLy8gc2VsZi1leHBsYW5hdG9yeS4gMC0xMDAsIHRoZSBsYXR0ZXIgYmVpbmcgdGhlIG1heC5cclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5mbGFzaDlPcHRpb25zID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmxhc2ggOS1vbmx5IG9wdGlvbnMsXHJcbiAgICAgKiBtZXJnZWQgaW50byBkZWZhdWx0T3B0aW9ucyBpZiBmbGFzaCA5IGlzIGJlaW5nIHVzZWRcclxuICAgICAqL1xyXG5cclxuICAgICdpc01vdmllU3Rhcic6IG51bGwsICAgICAgLy8gXCJNb3ZpZVN0YXJcIiBNUEVHNCBhdWRpbyBtb2RlLiBOdWxsIChkZWZhdWx0KSA9IGF1dG8gZGV0ZWN0IE1QNCwgQUFDIGV0Yy4gYmFzZWQgb24gVVJMLiB0cnVlID0gZm9yY2Ugb24sIGlnbm9yZSBVUkxcclxuICAgICd1c2VQZWFrRGF0YSc6IGZhbHNlLCAgICAgLy8gZW5hYmxlIGxlZnQvcmlnaHQgY2hhbm5lbCBwZWFrIChsZXZlbCkgZGF0YVxyXG4gICAgJ3VzZVdhdmVmb3JtRGF0YSc6IGZhbHNlLCAvLyBlbmFibGUgc291bmQgc3BlY3RydW0gKHJhdyB3YXZlZm9ybSBkYXRhKSAtIE5PVEU6IE1heSBpbmNyZWFzZSBDUFUgbG9hZC5cclxuICAgICd1c2VFUURhdGEnOiBmYWxzZSwgICAgICAgLy8gZW5hYmxlIHNvdW5kIEVRIChmcmVxdWVuY3kgc3BlY3RydW0gZGF0YSkgLSBOT1RFOiBNYXkgaW5jcmVhc2UgQ1BVIGxvYWQuXHJcbiAgICAnb25idWZmZXJjaGFuZ2UnOiBudWxsLCAgIC8vIGNhbGxiYWNrIGZvciBcImlzQnVmZmVyaW5nXCIgcHJvcGVydHkgY2hhbmdlXHJcbiAgICAnb25kYXRhZXJyb3InOiBudWxsICAgICAgIC8vIGNhbGxiYWNrIGZvciB3YXZlZm9ybS9lcSBkYXRhIGFjY2VzcyBlcnJvciAoZmxhc2ggcGxheWluZyBhdWRpbyBpbiBvdGhlciB0YWJzL2RvbWFpbnMpXHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMubW92aWVTdGFyT3B0aW9ucyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIGZsYXNoIDkuMHIxMTUrIE1QRUc0IGF1ZGlvIG9wdGlvbnMsXHJcbiAgICAgKiBtZXJnZWQgaW50byBkZWZhdWx0T3B0aW9ucyBpZiBmbGFzaCA5K21vdmllU3RhciBtb2RlIGlzIGVuYWJsZWRcclxuICAgICAqL1xyXG5cclxuICAgICdidWZmZXJUaW1lJzogMywgICAgICAgICAgLy8gc2Vjb25kcyBvZiBkYXRhIHRvIGJ1ZmZlciBiZWZvcmUgcGxheWJhY2sgYmVnaW5zIChudWxsID0gZmxhc2ggZGVmYXVsdCBvZiAwLjEgc2Vjb25kcyAtIGlmIEFBQyBwbGF5YmFjayBpcyBnYXBweSwgdHJ5IGluY3JlYXNpbmcuKVxyXG4gICAgJ3NlcnZlclVSTCc6IG51bGwsICAgICAgICAvLyBydG1wOiBGTVMgb3IgRk1JUyBzZXJ2ZXIgdG8gY29ubmVjdCB0bywgcmVxdWlyZWQgd2hlbiByZXF1ZXN0aW5nIG1lZGlhIHZpYSBSVE1QIG9yIG9uZSBvZiBpdHMgdmFyaWFudHNcclxuICAgICdvbmNvbm5lY3QnOiBudWxsLCAgICAgICAgLy8gcnRtcDogY2FsbGJhY2sgZm9yIGNvbm5lY3Rpb24gdG8gZmxhc2ggbWVkaWEgc2VydmVyXHJcbiAgICAnZHVyYXRpb24nOiBudWxsICAgICAgICAgIC8vIHJ0bXA6IHNvbmcgZHVyYXRpb24gKG1zZWMpXHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMuYXVkaW9Gb3JtYXRzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogZGV0ZXJtaW5lcyBIVE1MNSBzdXBwb3J0ICsgZmxhc2ggcmVxdWlyZW1lbnRzLlxyXG4gICAgICogaWYgbm8gc3VwcG9ydCAodmlhIGZsYXNoIGFuZC9vciBIVE1MNSkgZm9yIGEgXCJyZXF1aXJlZFwiIGZvcm1hdCwgU00yIHdpbGwgZmFpbCB0byBzdGFydC5cclxuICAgICAqIGZsYXNoIGZhbGxiYWNrIGlzIHVzZWQgZm9yIE1QMyBvciBNUDQgaWYgSFRNTDUgY2FuJ3QgcGxheSBpdCAob3IgaWYgcHJlZmVyRmxhc2ggPSB0cnVlKVxyXG4gICAgICovXHJcblxyXG4gICAgJ21wMyc6IHtcclxuICAgICAgJ3R5cGUnOiBbJ2F1ZGlvL21wZWc7IGNvZGVjcz1cIm1wM1wiJywgJ2F1ZGlvL21wZWcnLCAnYXVkaW8vbXAzJywgJ2F1ZGlvL01QQScsICdhdWRpby9tcGEtcm9idXN0J10sXHJcbiAgICAgICdyZXF1aXJlZCc6IHRydWVcclxuICAgIH0sXHJcblxyXG4gICAgJ21wNCc6IHtcclxuICAgICAgJ3JlbGF0ZWQnOiBbJ2FhYycsJ200YScsJ200YiddLCAvLyBhZGRpdGlvbmFsIGZvcm1hdHMgdW5kZXIgdGhlIE1QNCBjb250YWluZXJcclxuICAgICAgJ3R5cGUnOiBbJ2F1ZGlvL21wNDsgY29kZWNzPVwibXA0YS40MC4yXCInLCAnYXVkaW8vYWFjJywgJ2F1ZGlvL3gtbTRhJywgJ2F1ZGlvL01QNEEtTEFUTScsICdhdWRpby9tcGVnNC1nZW5lcmljJ10sXHJcbiAgICAgICdyZXF1aXJlZCc6IGZhbHNlXHJcbiAgICB9LFxyXG5cclxuICAgICdvZ2cnOiB7XHJcbiAgICAgICd0eXBlJzogWydhdWRpby9vZ2c7IGNvZGVjcz12b3JiaXMnXSxcclxuICAgICAgJ3JlcXVpcmVkJzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgJ29wdXMnOiB7XHJcbiAgICAgICd0eXBlJzogWydhdWRpby9vZ2c7IGNvZGVjcz1vcHVzJywgJ2F1ZGlvL29wdXMnXSxcclxuICAgICAgJ3JlcXVpcmVkJzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgJ3dhdic6IHtcclxuICAgICAgJ3R5cGUnOiBbJ2F1ZGlvL3dhdjsgY29kZWNzPVwiMVwiJywgJ2F1ZGlvL3dhdicsICdhdWRpby93YXZlJywgJ2F1ZGlvL3gtd2F2J10sXHJcbiAgICAgICdyZXF1aXJlZCc6IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8vIEhUTUwgYXR0cmlidXRlcyAoaWQgKyBjbGFzcyBuYW1lcykgZm9yIHRoZSBTV0YgY29udGFpbmVyXHJcblxyXG4gIHRoaXMubW92aWVJRCA9ICdzbTItY29udGFpbmVyJztcclxuICB0aGlzLmlkID0gKHNtSUQgfHwgJ3NtMm1vdmllJyk7XHJcblxyXG4gIHRoaXMuZGVidWdJRCA9ICdzb3VuZG1hbmFnZXItZGVidWcnO1xyXG4gIHRoaXMuZGVidWdVUkxQYXJhbSA9IC8oWyM/Jl0pZGVidWc9MS9pO1xyXG5cclxuICAvLyBkeW5hbWljIGF0dHJpYnV0ZXNcclxuXHJcbiAgdGhpcy52ZXJzaW9uTnVtYmVyID0gJ1YyLjk3YS4yMDEzMTIwMSc7XHJcbiAgdGhpcy52ZXJzaW9uID0gbnVsbDtcclxuICB0aGlzLm1vdmllVVJMID0gbnVsbDtcclxuICB0aGlzLmFsdFVSTCA9IG51bGw7XHJcbiAgdGhpcy5zd2ZMb2FkZWQgPSBmYWxzZTtcclxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcclxuICB0aGlzLm9NQyA9IG51bGw7XHJcbiAgdGhpcy5zb3VuZHMgPSB7fTtcclxuICB0aGlzLnNvdW5kSURzID0gW107XHJcbiAgdGhpcy5tdXRlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZGlkRmxhc2hCbG9jayA9IGZhbHNlO1xyXG4gIHRoaXMuZmlsZVBhdHRlcm4gPSBudWxsO1xyXG5cclxuICB0aGlzLmZpbGVQYXR0ZXJucyA9IHtcclxuXHJcbiAgICAnZmxhc2g4JzogL1xcLm1wMyhcXD8uKik/JC9pLFxyXG4gICAgJ2ZsYXNoOSc6IC9cXC5tcDMoXFw/LiopPyQvaVxyXG5cclxuICB9O1xyXG5cclxuICAvLyBzdXBwb3J0IGluZGljYXRvcnMsIHNldCBhdCBpbml0XHJcblxyXG4gIHRoaXMuZmVhdHVyZXMgPSB7XHJcblxyXG4gICAgJ2J1ZmZlcmluZyc6IGZhbHNlLFxyXG4gICAgJ3BlYWtEYXRhJzogZmFsc2UsXHJcbiAgICAnd2F2ZWZvcm1EYXRhJzogZmFsc2UsXHJcbiAgICAnZXFEYXRhJzogZmFsc2UsXHJcbiAgICAnbW92aWVTdGFyJzogZmFsc2VcclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gZmxhc2ggc2FuZGJveCBpbmZvLCB1c2VkIHByaW1hcmlseSBpbiB0cm91Ymxlc2hvb3RpbmdcclxuXHJcbiAgdGhpcy5zYW5kYm94ID0ge1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgJ3R5cGUnOiBudWxsLFxyXG4gICAgJ3R5cGVzJzoge1xyXG4gICAgICAncmVtb3RlJzogJ3JlbW90ZSAoZG9tYWluLWJhc2VkKSBydWxlcycsXHJcbiAgICAgICdsb2NhbFdpdGhGaWxlJzogJ2xvY2FsIHdpdGggZmlsZSBhY2Nlc3MgKG5vIGludGVybmV0IGFjY2VzcyknLFxyXG4gICAgICAnbG9jYWxXaXRoTmV0d29yayc6ICdsb2NhbCB3aXRoIG5ldHdvcmsgKGludGVybmV0IGFjY2VzcyBvbmx5LCBubyBsb2NhbCBhY2Nlc3MpJyxcclxuICAgICAgJ2xvY2FsVHJ1c3RlZCc6ICdsb2NhbCwgdHJ1c3RlZCAobG9jYWwraW50ZXJuZXQgYWNjZXNzKSdcclxuICAgIH0sXHJcbiAgICAnZGVzY3JpcHRpb24nOiBudWxsLFxyXG4gICAgJ25vUmVtb3RlJzogbnVsbCxcclxuICAgICdub0xvY2FsJzogbnVsbFxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBmb3JtYXQgc3VwcG9ydCAoaHRtbDUvZmxhc2gpXHJcbiAgICogc3RvcmVzIGNhblBsYXlUeXBlKCkgcmVzdWx0cyBiYXNlZCBvbiBhdWRpb0Zvcm1hdHMuXHJcbiAgICogZWcuIHsgbXAzOiBib29sZWFuLCBtcDQ6IGJvb2xlYW4gfVxyXG4gICAqIHRyZWF0IGFzIHJlYWQtb25seS5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5odG1sNSA9IHtcclxuICAgICd1c2luZ0ZsYXNoJzogbnVsbCAvLyBzZXQgaWYvd2hlbiBmbGFzaCBmYWxsYmFjayBpcyBuZWVkZWRcclxuICB9O1xyXG5cclxuICAvLyBmaWxlIHR5cGUgc3VwcG9ydCBoYXNoXHJcbiAgdGhpcy5mbGFzaCA9IHt9O1xyXG5cclxuICAvLyBkZXRlcm1pbmVkIGF0IGluaXQgdGltZVxyXG4gIHRoaXMuaHRtbDVPbmx5ID0gZmFsc2U7XHJcblxyXG4gIC8vIHVzZWQgZm9yIHNwZWNpYWwgY2FzZXMgKGVnLiBpUGFkL2lQaG9uZS9wYWxtIE9TPylcclxuICB0aGlzLmlnbm9yZUZsYXNoID0gZmFsc2U7XHJcblxyXG4gIC8qKlxyXG4gICAqIGEgZmV3IHByaXZhdGUgaW50ZXJuYWxzIChPSywgYSBsb3QuIDpEKVxyXG4gICAqL1xyXG5cclxuICB2YXIgU01Tb3VuZCxcclxuICBzbTIgPSB0aGlzLCBnbG9iYWxIVE1MNUF1ZGlvID0gbnVsbCwgZmxhc2ggPSBudWxsLCBzbSA9ICdzb3VuZE1hbmFnZXInLCBzbWMgPSBzbSArICc6ICcsIGg1ID0gJ0hUTUw1OjonLCBpZCwgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LCB3bCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnRvU3RyaW5nKCksIGRvYyA9IGRvY3VtZW50LCBkb05vdGhpbmcsIHNldFByb3BlcnRpZXMsIGluaXQsIGZWLCBvbl9xdWV1ZSA9IFtdLCBkZWJ1Z09wZW4gPSB0cnVlLCBkZWJ1Z1RTLCBkaWRBcHBlbmQgPSBmYWxzZSwgYXBwZW5kU3VjY2VzcyA9IGZhbHNlLCBkaWRJbml0ID0gZmFsc2UsIGRpc2FibGVkID0gZmFsc2UsIHdpbmRvd0xvYWRlZCA9IGZhbHNlLCBfd0RTLCB3ZENvdW50ID0gMCwgaW5pdENvbXBsZXRlLCBtaXhpbiwgYXNzaWduLCBleHRyYU9wdGlvbnMsIGFkZE9uRXZlbnQsIHByb2Nlc3NPbkV2ZW50cywgaW5pdFVzZXJPbmxvYWQsIGRlbGF5V2FpdEZvckVJLCB3YWl0Rm9yRUksIHJlYm9vdEludG9IVE1MNSwgc2V0VmVyc2lvbkluZm8sIGhhbmRsZUZvY3VzLCBzdHJpbmdzLCBpbml0TW92aWUsIHByZUluaXQsIGRvbUNvbnRlbnRMb2FkZWQsIHdpbk9uTG9hZCwgZGlkRENMb2FkZWQsIGdldERvY3VtZW50LCBjcmVhdGVNb3ZpZSwgY2F0Y2hFcnJvciwgc2V0UG9sbGluZywgaW5pdERlYnVnLCBkZWJ1Z0xldmVscyA9IFsnbG9nJywgJ2luZm8nLCAnd2FybicsICdlcnJvciddLCBkZWZhdWx0Rmxhc2hWZXJzaW9uID0gOCwgZGlzYWJsZU9iamVjdCwgZmFpbFNhZmVseSwgbm9ybWFsaXplTW92aWVVUkwsIG9SZW1vdmVkID0gbnVsbCwgb1JlbW92ZWRIVE1MID0gbnVsbCwgc3RyLCBmbGFzaEJsb2NrSGFuZGxlciwgZ2V0U1dGQ1NTLCBzd2ZDU1MsIHRvZ2dsZURlYnVnLCBsb29wRml4LCBwb2xpY3lGaXgsIGNvbXBsYWluLCBpZENoZWNrLCB3YWl0aW5nRm9yRUkgPSBmYWxzZSwgaW5pdFBlbmRpbmcgPSBmYWxzZSwgc3RhcnRUaW1lciwgc3RvcFRpbWVyLCB0aW1lckV4ZWN1dGUsIGg1VGltZXJDb3VudCA9IDAsIGg1SW50ZXJ2YWxUaW1lciA9IG51bGwsIHBhcnNlVVJMLCBtZXNzYWdlcyA9IFtdLFxyXG4gIGNhbklnbm9yZUZsYXNoLCBuZWVkc0ZsYXNoID0gbnVsbCwgZmVhdHVyZUNoZWNrLCBodG1sNU9LLCBodG1sNUNhblBsYXksIGh0bWw1RXh0LCBodG1sNVVubG9hZCwgZG9tQ29udGVudExvYWRlZElFLCB0ZXN0SFRNTDUsIGV2ZW50LCBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSwgdXNlR2xvYmFsSFRNTDVBdWRpbyA9IGZhbHNlLCBsYXN0R2xvYmFsSFRNTDVVUkwsIGhhc0ZsYXNoLCBkZXRlY3RGbGFzaCwgYmFkU2FmYXJpRml4LCBodG1sNV9ldmVudHMsIHNob3dTdXBwb3J0LCBmbHVzaE1lc3NhZ2VzLCB3cmFwQ2FsbGJhY2ssIGlkQ291bnRlciA9IDAsXHJcbiAgaXNfaURldmljZSA9IHVhLm1hdGNoKC8oaXBhZHxpcGhvbmV8aXBvZCkvaSksIGlzQW5kcm9pZCA9IHVhLm1hdGNoKC9hbmRyb2lkL2kpLCBpc0lFID0gdWEubWF0Y2goL21zaWUvaSksIGlzV2Via2l0ID0gdWEubWF0Y2goL3dlYmtpdC9pKSwgaXNTYWZhcmkgPSAodWEubWF0Y2goL3NhZmFyaS9pKSAmJiAhdWEubWF0Y2goL2Nocm9tZS9pKSksIGlzT3BlcmEgPSAodWEubWF0Y2goL29wZXJhL2kpKSxcclxuICBtb2JpbGVIVE1MNSA9ICh1YS5tYXRjaCgvKG1vYmlsZXxwcmVcXC98eG9vbSkvaSkgfHwgaXNfaURldmljZSB8fCBpc0FuZHJvaWQpLFxyXG4gIGlzQmFkU2FmYXJpID0gKCF3bC5tYXRjaCgvdXNlaHRtbDVhdWRpby9pKSAmJiAhd2wubWF0Y2goL3NtMlxcLWlnbm9yZWJhZHVhL2kpICYmIGlzU2FmYXJpICYmICF1YS5tYXRjaCgvc2lsay9pKSAmJiB1YS5tYXRjaCgvT1MgWCAxMF82XyhbMy03XSkvaSkpLCAvLyBTYWZhcmkgNCBhbmQgNSAoZXhjbHVkaW5nIEtpbmRsZSBGaXJlLCBcIlNpbGtcIikgb2NjYXNpb25hbGx5IGZhaWwgdG8gbG9hZC9wbGF5IEhUTUw1IGF1ZGlvIG9uIFNub3cgTGVvcGFyZCAxMC42LjMgdGhyb3VnaCAxMC42LjcgZHVlIHRvIGJ1ZyhzKSBpbiBRdWlja1RpbWUgWCBhbmQvb3Igb3RoZXIgdW5kZXJseWluZyBmcmFtZXdvcmtzLiA6LyBDb25maXJtZWQgYnVnLiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MzIxNTlcclxuICBoYXNDb25zb2xlID0gKHdpbmRvdy5jb25zb2xlICE9PSBfdW5kZWZpbmVkICYmIGNvbnNvbGUubG9nICE9PSBfdW5kZWZpbmVkKSwgaXNGb2N1c2VkID0gKGRvYy5oYXNGb2N1cyAhPT0gX3VuZGVmaW5lZD9kb2MuaGFzRm9jdXMoKTpudWxsKSwgdHJ5SW5pdE9uRm9jdXMgPSAoaXNTYWZhcmkgJiYgKGRvYy5oYXNGb2N1cyA9PT0gX3VuZGVmaW5lZCB8fCAhZG9jLmhhc0ZvY3VzKCkpKSwgb2tUb0Rpc2FibGUgPSAhdHJ5SW5pdE9uRm9jdXMsIGZsYXNoTUlNRSA9IC8obXAzfG1wNHxtcGF8bTRhfG00YikvaSwgbXNlY1NjYWxlID0gMTAwMCxcclxuICBlbXB0eVVSTCA9ICdhYm91dDpibGFuaycsIC8vIHNhZmUgVVJMIHRvIHVubG9hZCwgb3IgbG9hZCBub3RoaW5nIGZyb20gKGZsYXNoIDggKyBtb3N0IEhUTUw1IFVBcylcclxuICBlbXB0eVdBViA9ICdkYXRhOmF1ZGlvL3dhdmU7YmFzZTY0LC9Va2xHUmlZQUFBQlhRVlpGWm0xMElCQUFBQUFCQUFFQVJLd0FBSWhZQVFBQ0FCQUFaR0YwWVFJQUFBRC8vdz09JywgLy8gdGlueSBXQVYgZm9yIEhUTUw1IHVubG9hZGluZ1xyXG4gIG92ZXJIVFRQID0gKGRvYy5sb2NhdGlvbj9kb2MubG9jYXRpb24ucHJvdG9jb2wubWF0Y2goL2h0dHAvaSk6bnVsbCksXHJcbiAgaHR0cCA9ICghb3ZlckhUVFAgPyAnaHR0cDovJysnLycgOiAnJyksXHJcbiAgLy8gbXAzLCBtcDQsIGFhYyBldGMuXHJcbiAgbmV0U3RyZWFtTWltZVR5cGVzID0gL15cXHMqYXVkaW9cXC8oPzp4LSk/KD86bXBlZzR8YWFjfGZsdnxtb3Z8bXA0fHxtNHZ8bTRhfG00YnxtcDR2fDNncHwzZzIpXFxzKig/OiR8OykvaSxcclxuICAvLyBGbGFzaCB2OS4wcjExNSsgXCJtb3ZpZXN0YXJcIiBmb3JtYXRzXHJcbiAgbmV0U3RyZWFtVHlwZXMgPSBbJ21wZWc0JywgJ2FhYycsICdmbHYnLCAnbW92JywgJ21wNCcsICdtNHYnLCAnZjR2JywgJ200YScsICdtNGInLCAnbXA0dicsICczZ3AnLCAnM2cyJ10sXHJcbiAgbmV0U3RyZWFtUGF0dGVybiA9IG5ldyBSZWdFeHAoJ1xcXFwuKCcgKyBuZXRTdHJlYW1UeXBlcy5qb2luKCd8JykgKyAnKShcXFxcPy4qKT8kJywgJ2knKTtcclxuXHJcbiAgdGhpcy5taW1lUGF0dGVybiA9IC9eXFxzKmF1ZGlvXFwvKD86eC0pPyg/Om1wKD86ZWd8MykpXFxzKig/OiR8OykvaTsgLy8gZGVmYXVsdCBtcDMgc2V0XHJcblxyXG4gIC8vIHVzZSBhbHRVUkwgaWYgbm90IFwib25saW5lXCJcclxuICB0aGlzLnVzZUFsdFVSTCA9ICFvdmVySFRUUDtcclxuXHJcbiAgc3dmQ1NTID0ge1xyXG5cclxuICAgICdzd2ZCb3gnOiAnc20yLW9iamVjdC1ib3gnLFxyXG4gICAgJ3N3ZkRlZmF1bHQnOiAnbW92aWVDb250YWluZXInLFxyXG4gICAgJ3N3ZkVycm9yJzogJ3N3Zl9lcnJvcicsIC8vIFNXRiBsb2FkZWQsIGJ1dCBTTTIgY291bGRuJ3Qgc3RhcnQgKG90aGVyIGVycm9yKVxyXG4gICAgJ3N3ZlRpbWVkb3V0JzogJ3N3Zl90aW1lZG91dCcsXHJcbiAgICAnc3dmTG9hZGVkJzogJ3N3Zl9sb2FkZWQnLFxyXG4gICAgJ3N3ZlVuYmxvY2tlZCc6ICdzd2ZfdW5ibG9ja2VkJywgLy8gb3IgbG9hZGVkIE9LXHJcbiAgICAnc20yRGVidWcnOiAnc20yX2RlYnVnJyxcclxuICAgICdoaWdoUGVyZic6ICdoaWdoX3BlcmZvcm1hbmNlJyxcclxuICAgICdmbGFzaERlYnVnJzogJ2ZsYXNoX2RlYnVnJ1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBiYXNpYyBIVE1MNSBBdWRpbygpIHN1cHBvcnQgdGVzdFxyXG4gICAqIHRyeS4uLmNhdGNoIGJlY2F1c2Ugb2YgSUUgOSBcIm5vdCBpbXBsZW1lbnRlZFwiIG5vbnNlbnNlXHJcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzIyNFxyXG4gICAqL1xyXG5cclxuICB0aGlzLmhhc0hUTUw1ID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gbmV3IEF1ZGlvKG51bGwpIGZvciBzdHVwaWQgT3BlcmEgOS42NCBjYXNlLCB3aGljaCB0aHJvd3Mgbm90X2Vub3VnaF9hcmd1bWVudHMgZXhjZXB0aW9uIG90aGVyd2lzZS5cclxuICAgICAgcmV0dXJuIChBdWRpbyAhPT0gX3VuZGVmaW5lZCAmJiAoaXNPcGVyYSAmJiBvcGVyYSAhPT0gX3VuZGVmaW5lZCAmJiBvcGVyYS52ZXJzaW9uKCkgPCAxMCA/IG5ldyBBdWRpbyhudWxsKSA6IG5ldyBBdWRpbygpKS5jYW5QbGF5VHlwZSAhPT0gX3VuZGVmaW5lZCk7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0oKSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1YmxpYyBTb3VuZE1hbmFnZXIgQVBJXHJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKi9cclxuXHJcbiAgLyoqXHJcbiAgICogQ29uZmlndXJlcyB0b3AtbGV2ZWwgc291bmRNYW5hZ2VyIHByb3BlcnRpZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBPcHRpb24gcGFyYW1ldGVycywgZWcuIHsgZmxhc2hWZXJzaW9uOiA5LCB1cmw6ICcvcGF0aC90by9zd2ZzLycgfVxyXG4gICAqIG9ucmVhZHkgYW5kIG9udGltZW91dCBhcmUgYWxzbyBhY2NlcHRlZCBwYXJhbWV0ZXJzLiBjYWxsIHNvdW5kTWFuYWdlci5zZXR1cCgpIHRvIHNlZSB0aGUgZnVsbCBsaXN0LlxyXG4gICAqL1xyXG5cclxuICB0aGlzLnNldHVwID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuICAgIHZhciBub1VSTCA9ICghc20yLnVybCk7XHJcblxyXG4gICAgLy8gd2FybiBpZiBmbGFzaCBvcHRpb25zIGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWRcclxuXHJcbiAgICBpZiAob3B0aW9ucyAhPT0gX3VuZGVmaW5lZCAmJiBkaWRJbml0ICYmIG5lZWRzRmxhc2ggJiYgc20yLm9rKCkgJiYgKG9wdGlvbnMuZmxhc2hWZXJzaW9uICE9PSBfdW5kZWZpbmVkIHx8IG9wdGlvbnMudXJsICE9PSBfdW5kZWZpbmVkIHx8IG9wdGlvbnMuaHRtbDVUZXN0ICE9PSBfdW5kZWZpbmVkKSkge1xyXG4gICAgICBjb21wbGFpbihzdHIoJ3NldHVwTGF0ZScpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBkZWZlcjogdHJ1ZT9cclxuXHJcbiAgICBhc3NpZ24ob3B0aW9ucyk7XHJcblxyXG4gICAgLy8gc3BlY2lhbCBjYXNlIDE6IFwiTGF0ZSBzZXR1cFwiLiBTTTIgbG9hZGVkIG5vcm1hbGx5LCBidXQgdXNlciBkaWRuJ3QgYXNzaWduIGZsYXNoIFVSTCBlZy4sIHNldHVwKHt1cmw6Li4ufSkgYmVmb3JlIFNNMiBpbml0LiBUcmVhdCBhcyBkZWxheWVkIGluaXQuXHJcblxyXG4gICAgaWYgKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgIGlmIChub1VSTCAmJiBkaWREQ0xvYWRlZCAmJiBvcHRpb25zLnVybCAhPT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIHNtMi5iZWdpbkRlbGF5ZWRJbml0KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSAyOiBJZiBsYXp5LWxvYWRpbmcgU00yIChET01Db250ZW50TG9hZGVkIGhhcyBhbHJlYWR5IGhhcHBlbmVkKSBhbmQgdXNlciBjYWxscyBzZXR1cCgpIHdpdGggdXJsOiBwYXJhbWV0ZXIsIHRyeSB0byBpbml0IEFTQVAuXHJcblxyXG4gICAgICBpZiAoIWRpZERDTG9hZGVkICYmIG9wdGlvbnMudXJsICE9PSBfdW5kZWZpbmVkICYmIGRvYy5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChkb21Db250ZW50TG9hZGVkLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc20yO1xyXG5cclxuICB9O1xyXG5cclxuICB0aGlzLm9rID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgcmV0dXJuIChuZWVkc0ZsYXNoID8gKGRpZEluaXQgJiYgIWRpc2FibGVkKSA6IChzbTIudXNlSFRNTDVBdWRpbyAmJiBzbTIuaGFzSFRNTDUpKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zdXBwb3J0ZWQgPSB0aGlzLm9rOyAvLyBsZWdhY3lcclxuXHJcbiAgdGhpcy5nZXRNb3ZpZSA9IGZ1bmN0aW9uKHNtSUQpIHtcclxuXHJcbiAgICAvLyBzYWZldHkgbmV0OiBzb21lIG9sZCBicm93c2VycyBkaWZmZXIgb24gU1dGIHJlZmVyZW5jZXMsIHBvc3NpYmx5IHJlbGF0ZWQgdG8gRXh0ZXJuYWxJbnRlcmZhY2UgLyBmbGFzaCB2ZXJzaW9uXHJcbiAgICByZXR1cm4gaWQoc21JRCkgfHwgZG9jW3NtSURdIHx8IHdpbmRvd1tzbUlEXTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIFNNU291bmQgc291bmQgb2JqZWN0IGluc3RhbmNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9PcHRpb25zIFNvdW5kIG9wdGlvbnMgKGF0IG1pbmltdW0sIGlkIGFuZCB1cmwgcGFyYW1ldGVycyBhcmUgcmVxdWlyZWQuKVxyXG4gICAqIEByZXR1cm4ge29iamVjdH0gU01Tb3VuZCBUaGUgbmV3IFNNU291bmQgb2JqZWN0LlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmNyZWF0ZVNvdW5kID0gZnVuY3Rpb24ob09wdGlvbnMsIF91cmwpIHtcclxuXHJcbiAgICB2YXIgY3MsIGNzX3N0cmluZywgb3B0aW9ucywgb1NvdW5kID0gbnVsbDtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIGNzID0gc20gKyAnLmNyZWF0ZVNvdW5kKCk6ICc7XHJcbiAgICBjc19zdHJpbmcgPSBjcyArIHN0cighZGlkSW5pdD8nbm90UmVhZHknOidub3RPSycpO1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICAgIGlmICghZGlkSW5pdCB8fCAhc20yLm9rKCkpIHtcclxuICAgICAgY29tcGxhaW4oY3Nfc3RyaW5nKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChfdXJsICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIGZ1bmN0aW9uIG92ZXJsb2FkaW5nIGluIEpTISA6KSAuLmFzc3VtZSBzaW1wbGUgY3JlYXRlU291bmQoaWQsIHVybCkgdXNlIGNhc2VcclxuICAgICAgb09wdGlvbnMgPSB7XHJcbiAgICAgICAgJ2lkJzogb09wdGlvbnMsXHJcbiAgICAgICAgJ3VybCc6IF91cmxcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbmhlcml0IGZyb20gZGVmYXVsdE9wdGlvbnNcclxuICAgIG9wdGlvbnMgPSBtaXhpbihvT3B0aW9ucyk7XHJcblxyXG4gICAgb3B0aW9ucy51cmwgPSBwYXJzZVVSTChvcHRpb25zLnVybCk7XHJcblxyXG4gICAgLy8gZ2VuZXJhdGUgYW4gaWQsIGlmIG5lZWRlZC5cclxuICAgIGlmIChvcHRpb25zLmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgb3B0aW9ucy5pZCA9IHNtMi5zZXR1cE9wdGlvbnMuaWRQcmVmaXggKyAoaWRDb3VudGVyKyspO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKG9wdGlvbnMuaWQudG9TdHJpbmcoKS5jaGFyQXQoMCkubWF0Y2goL15bMC05XSQvKSkge1xyXG4gICAgICBzbTIuX3dEKGNzICsgc3RyKCdiYWRJRCcsIG9wdGlvbnMuaWQpLCAyKTtcclxuICAgIH1cclxuXHJcbiAgICBzbTIuX3dEKGNzICsgb3B0aW9ucy5pZCArIChvcHRpb25zLnVybCA/ICcgKCcgKyBvcHRpb25zLnVybCArICcpJyA6ICcnKSwgMSk7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgaWYgKGlkQ2hlY2sob3B0aW9ucy5pZCwgdHJ1ZSkpIHtcclxuICAgICAgc20yLl93RChjcyArIG9wdGlvbnMuaWQgKyAnIGV4aXN0cycsIDEpO1xyXG4gICAgICByZXR1cm4gc20yLnNvdW5kc1tvcHRpb25zLmlkXTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYWtlKCkge1xyXG5cclxuICAgICAgb3B0aW9ucyA9IGxvb3BGaXgob3B0aW9ucyk7XHJcbiAgICAgIHNtMi5zb3VuZHNbb3B0aW9ucy5pZF0gPSBuZXcgU01Tb3VuZChvcHRpb25zKTtcclxuICAgICAgc20yLnNvdW5kSURzLnB1c2gob3B0aW9ucy5pZCk7XHJcbiAgICAgIHJldHVybiBzbTIuc291bmRzW29wdGlvbnMuaWRdO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAoaHRtbDVPSyhvcHRpb25zKSkge1xyXG5cclxuICAgICAgb1NvdW5kID0gbWFrZSgpO1xyXG4gICAgICBzbTIuX3dEKG9wdGlvbnMuaWQgKyAnOiBVc2luZyBIVE1MNScpO1xyXG4gICAgICBvU291bmQuX3NldHVwX2h0bWw1KG9wdGlvbnMpO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoc20yLmh0bWw1T25seSkge1xyXG4gICAgICAgIHNtMi5fd0Qob3B0aW9ucy5pZCArICc6IE5vIEhUTUw1IHN1cHBvcnQgZm9yIHRoaXMgc291bmQsIGFuZCBubyBGbGFzaC4gRXhpdGluZy4nKTtcclxuICAgICAgICByZXR1cm4gbWFrZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUT0RPOiBNb3ZlIEhUTUw1L2ZsYXNoIGNoZWNrcyBpbnRvIGdlbmVyaWMgVVJMIHBhcnNpbmcvaGFuZGxpbmcgZnVuY3Rpb24uXHJcblxyXG4gICAgICBpZiAoc20yLmh0bWw1LnVzaW5nRmxhc2ggJiYgb3B0aW9ucy51cmwgJiYgb3B0aW9ucy51cmwubWF0Y2goL2RhdGFcXDovaSkpIHtcclxuICAgICAgICAvLyBkYXRhOiBVUklzIG5vdCBzdXBwb3J0ZWQgYnkgRmxhc2gsIGVpdGhlci5cclxuICAgICAgICBzbTIuX3dEKG9wdGlvbnMuaWQgKyAnOiBkYXRhOiBVUklzIG5vdCBzdXBwb3J0ZWQgdmlhIEZsYXNoLiBFeGl0aW5nLicpO1xyXG4gICAgICAgIHJldHVybiBtYWtlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChmViA+IDgpIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5pc01vdmllU3RhciA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgLy8gYXR0ZW1wdCB0byBkZXRlY3QgTVBFRy00IGZvcm1hdHNcclxuICAgICAgICAgIG9wdGlvbnMuaXNNb3ZpZVN0YXIgPSAhIShvcHRpb25zLnNlcnZlclVSTCB8fCAob3B0aW9ucy50eXBlID8gb3B0aW9ucy50eXBlLm1hdGNoKG5ldFN0cmVhbU1pbWVUeXBlcykgOiBmYWxzZSkgfHwgKG9wdGlvbnMudXJsICYmIG9wdGlvbnMudXJsLm1hdGNoKG5ldFN0cmVhbVBhdHRlcm4pKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDxkPlxyXG4gICAgICAgIGlmIChvcHRpb25zLmlzTW92aWVTdGFyKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGNzICsgJ3VzaW5nIE1vdmllU3RhciBoYW5kbGluZycpO1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMubG9vcHMgPiAxKSB7XHJcbiAgICAgICAgICAgIF93RFMoJ25vTlNMb29wJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDwvZD5cclxuICAgICAgfVxyXG5cclxuICAgICAgb3B0aW9ucyA9IHBvbGljeUZpeChvcHRpb25zLCBjcyk7XHJcbiAgICAgIG9Tb3VuZCA9IG1ha2UoKTtcclxuXHJcbiAgICAgIGlmIChmViA9PT0gOCkge1xyXG4gICAgICAgIGZsYXNoLl9jcmVhdGVTb3VuZChvcHRpb25zLmlkLCBvcHRpb25zLmxvb3BzfHwxLCBvcHRpb25zLnVzZVBvbGljeUZpbGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGZsYXNoLl9jcmVhdGVTb3VuZChvcHRpb25zLmlkLCBvcHRpb25zLnVybCwgb3B0aW9ucy51c2VQZWFrRGF0YSwgb3B0aW9ucy51c2VXYXZlZm9ybURhdGEsIG9wdGlvbnMudXNlRVFEYXRhLCBvcHRpb25zLmlzTW92aWVTdGFyLCAob3B0aW9ucy5pc01vdmllU3Rhcj9vcHRpb25zLmJ1ZmZlclRpbWU6ZmFsc2UpLCBvcHRpb25zLmxvb3BzfHwxLCBvcHRpb25zLnNlcnZlclVSTCwgb3B0aW9ucy5kdXJhdGlvbnx8bnVsbCwgb3B0aW9ucy5hdXRvUGxheSwgdHJ1ZSwgb3B0aW9ucy5hdXRvTG9hZCwgb3B0aW9ucy51c2VQb2xpY3lGaWxlKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMuc2VydmVyVVJMKSB7XHJcbiAgICAgICAgICAvLyBXZSBhcmUgY29ubmVjdGVkIGltbWVkaWF0ZWx5XHJcbiAgICAgICAgICBvU291bmQuY29ubmVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgIGlmIChvcHRpb25zLm9uY29ubmVjdCkge1xyXG4gICAgICAgICAgICBvcHRpb25zLm9uY29ubmVjdC5hcHBseShvU291bmQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFvcHRpb25zLnNlcnZlclVSTCAmJiAob3B0aW9ucy5hdXRvTG9hZCB8fCBvcHRpb25zLmF1dG9QbGF5KSkge1xyXG4gICAgICAgIC8vIGNhbGwgbG9hZCBmb3Igbm9uLXJ0bXAgc3RyZWFtc1xyXG4gICAgICAgIG9Tb3VuZC5sb2FkKG9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJ0bXAgd2lsbCBwbGF5IGluIG9uY29ubmVjdFxyXG4gICAgaWYgKCFvcHRpb25zLnNlcnZlclVSTCAmJiBvcHRpb25zLmF1dG9QbGF5KSB7XHJcbiAgICAgIG9Tb3VuZC5wbGF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9Tb3VuZDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYSBTTVNvdW5kIHNvdW5kIG9iamVjdCBpbnN0YW5jZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZCB0byBkZXN0cm95XHJcbiAgICovXHJcblxyXG4gIHRoaXMuZGVzdHJveVNvdW5kID0gZnVuY3Rpb24oc0lELCBfYkZyb21Tb3VuZCkge1xyXG5cclxuICAgIC8vIGV4cGxpY2l0bHkgZGVzdHJveSBhIHNvdW5kIGJlZm9yZSBub3JtYWwgcGFnZSB1bmxvYWQsIGV0Yy5cclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG9TID0gc20yLnNvdW5kc1tzSURdLCBpO1xyXG5cclxuICAgIC8vIERpc2FibGUgYWxsIGNhbGxiYWNrcyB3aGlsZSB0aGUgc291bmQgaXMgYmVpbmcgZGVzdHJveWVkXHJcbiAgICBvUy5faU8gPSB7fTtcclxuXHJcbiAgICBvUy5zdG9wKCk7XHJcbiAgICBvUy51bmxvYWQoKTtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgc20yLnNvdW5kSURzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChzbTIuc291bmRJRHNbaV0gPT09IHNJRCkge1xyXG4gICAgICAgIHNtMi5zb3VuZElEcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoIV9iRnJvbVNvdW5kKSB7XHJcbiAgICAgIC8vIGlnbm9yZSBpZiBiZWluZyBjYWxsZWQgZnJvbSBTTVNvdW5kIGluc3RhbmNlXHJcbiAgICAgIG9TLmRlc3RydWN0KHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9TID0gbnVsbDtcclxuICAgIGRlbGV0ZSBzbTIuc291bmRzW3NJRF07XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBsb2FkKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgT3B0aW9uYWw6IFNvdW5kIG9wdGlvbnNcclxuICAgKi9cclxuXHJcbiAgdGhpcy5sb2FkID0gZnVuY3Rpb24oc0lELCBvT3B0aW9ucykge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0ubG9hZChvT3B0aW9ucyk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSB1bmxvYWQoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnVubG9hZCA9IGZ1bmN0aW9uKHNJRCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0udW5sb2FkKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBvblBvc2l0aW9uKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge251bWJlcn0gblBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byB3YXRjaCBmb3JcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvTWV0aG9kIFRoZSByZWxldmFudCBjYWxsYmFjayB0byBmaXJlXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9TY29wZSBPcHRpb25hbDogVGhlIHNjb3BlIHRvIGFwcGx5IHRoZSBjYWxsYmFjayB0b1xyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLm9uUG9zaXRpb24gPSBmdW5jdGlvbihzSUQsIG5Qb3NpdGlvbiwgb01ldGhvZCwgb1Njb3BlKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5vbnBvc2l0aW9uKG5Qb3NpdGlvbiwgb01ldGhvZCwgb1Njb3BlKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gbGVnYWN5L2JhY2t3YXJkcy1jb21wYWJpbGl0eTogbG93ZXItY2FzZSBtZXRob2QgbmFtZVxyXG4gIHRoaXMub25wb3NpdGlvbiA9IHRoaXMub25Qb3NpdGlvbjtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIGNsZWFyT25Qb3NpdGlvbigpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG5Qb3NpdGlvbiBUaGUgcG9zaXRpb24gdG8gd2F0Y2ggZm9yXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gb01ldGhvZCBPcHRpb25hbDogVGhlIHJlbGV2YW50IGNhbGxiYWNrIHRvIGZpcmVcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5jbGVhck9uUG9zaXRpb24gPSBmdW5jdGlvbihzSUQsIG5Qb3NpdGlvbiwgb01ldGhvZCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0uY2xlYXJPblBvc2l0aW9uKG5Qb3NpdGlvbiwgb01ldGhvZCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBwbGF5KCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgT3B0aW9uYWw6IFNvdW5kIG9wdGlvbnNcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5wbGF5ID0gZnVuY3Rpb24oc0lELCBvT3B0aW9ucykge1xyXG5cclxuICAgIHZhciByZXN1bHQgPSBudWxsLFxyXG4gICAgICAgIC8vIGxlZ2FjeSBmdW5jdGlvbi1vdmVybG9hZGluZyB1c2UgY2FzZTogcGxheSgnbXlTb3VuZCcsICcvcGF0aC90by9zb21lLm1wMycpO1xyXG4gICAgICAgIG92ZXJsb2FkZWQgPSAob09wdGlvbnMgJiYgIShvT3B0aW9ucyBpbnN0YW5jZW9mIE9iamVjdCkpO1xyXG5cclxuICAgIGlmICghZGlkSW5pdCB8fCAhc20yLm9rKCkpIHtcclxuICAgICAgY29tcGxhaW4oc20gKyAnLnBsYXkoKTogJyArIHN0cighZGlkSW5pdD8nbm90UmVhZHknOidub3RPSycpKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQsIG92ZXJsb2FkZWQpKSB7XHJcblxyXG4gICAgICBpZiAoIW92ZXJsb2FkZWQpIHtcclxuICAgICAgICAvLyBubyBzb3VuZCBmb3VuZCBmb3IgdGhlIGdpdmVuIElELiBCYWlsLlxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG92ZXJsb2FkZWQpIHtcclxuICAgICAgICBvT3B0aW9ucyA9IHtcclxuICAgICAgICAgIHVybDogb09wdGlvbnNcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob09wdGlvbnMgJiYgb09wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgLy8gb3ZlcmxvYWRpbmcgdXNlIGNhc2UsIGNyZWF0ZStwbGF5OiAucGxheSgnc29tZUlEJywge3VybDonL3BhdGgvdG8ubXAzJ30pO1xyXG4gICAgICAgIHNtMi5fd0Qoc20gKyAnLnBsYXkoKTogQXR0ZW1wdGluZyB0byBjcmVhdGUgXCInICsgc0lEICsgJ1wiJywgMSk7XHJcbiAgICAgICAgb09wdGlvbnMuaWQgPSBzSUQ7XHJcbiAgICAgICAgcmVzdWx0ID0gc20yLmNyZWF0ZVNvdW5kKG9PcHRpb25zKS5wbGF5KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2UgaWYgKG92ZXJsb2FkZWQpIHtcclxuXHJcbiAgICAgIC8vIGV4aXN0aW5nIHNvdW5kIG9iamVjdCBjYXNlXHJcbiAgICAgIG9PcHRpb25zID0ge1xyXG4gICAgICAgIHVybDogb09wdGlvbnNcclxuICAgICAgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xyXG4gICAgICAvLyBkZWZhdWx0IGNhc2VcclxuICAgICAgcmVzdWx0ID0gc20yLnNvdW5kc1tzSURdLnBsYXkob09wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMuc3RhcnQgPSB0aGlzLnBsYXk7IC8vIGp1c3QgZm9yIGNvbnZlbmllbmNlXHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBzZXRQb3NpdGlvbigpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG5Nc2VjT2Zmc2V0IFBvc2l0aW9uIChtaWxsaXNlY29uZHMpXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbihzSUQsIG5Nc2VjT2Zmc2V0KSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5zZXRQb3NpdGlvbihuTXNlY09mZnNldCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBzdG9wKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5zdG9wID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHNtMi5fd0Qoc20gKyAnLnN0b3AoJyArIHNJRCArICcpJywgMSk7XHJcbiAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLnN0b3AoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogU3RvcHMgYWxsIGN1cnJlbnRseS1wbGF5aW5nIHNvdW5kcy5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5zdG9wQWxsID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIG9Tb3VuZDtcclxuICAgIHNtMi5fd0Qoc20gKyAnLnN0b3BBbGwoKScsIDEpO1xyXG5cclxuICAgIGZvciAob1NvdW5kIGluIHNtMi5zb3VuZHMpIHtcclxuICAgICAgaWYgKHNtMi5zb3VuZHMuaGFzT3duUHJvcGVydHkob1NvdW5kKSkge1xyXG4gICAgICAgIC8vIGFwcGx5IG9ubHkgdG8gc291bmQgb2JqZWN0c1xyXG4gICAgICAgIHNtMi5zb3VuZHNbb1NvdW5kXS5zdG9wKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHBhdXNlKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKHNJRCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0ucGF1c2UoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUGF1c2VzIGFsbCBjdXJyZW50bHktcGxheWluZyBzb3VuZHMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMucGF1c2VBbGwgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgaTtcclxuICAgIGZvciAoaSA9IHNtMi5zb3VuZElEcy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLnBhdXNlKCk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSByZXN1bWUoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKHNJRCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0ucmVzdW1lKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlc3VtZXMgYWxsIGN1cnJlbnRseS1wYXVzZWQgc291bmRzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLnJlc3VtZUFsbCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBpO1xyXG4gICAgZm9yIChpID0gc20yLnNvdW5kSURzLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0ucmVzdW1lKCk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSB0b2dnbGVQYXVzZSgpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMudG9nZ2xlUGF1c2UgPSBmdW5jdGlvbihzSUQpIHtcclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLnRvZ2dsZVBhdXNlKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBzZXRQYW4oKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuUGFuIFRoZSBwYW4gdmFsdWUgKC0xMDAgdG8gMTAwKVxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnNldFBhbiA9IGZ1bmN0aW9uKHNJRCwgblBhbikge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0uc2V0UGFuKG5QYW4pO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgc2V0Vm9sdW1lKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge251bWJlcn0gblZvbCBUaGUgdm9sdW1lIHZhbHVlICgwIHRvIDEwMClcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5zZXRWb2x1bWUgPSBmdW5jdGlvbihzSUQsIG5Wb2wpIHtcclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLnNldFZvbHVtZShuVm9sKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIG11dGUoKSBtZXRob2Qgb2YgZWl0aGVyIGEgc2luZ2xlIFNNU291bmQgb2JqZWN0IGJ5IElELCBvciBhbGwgc291bmQgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgT3B0aW9uYWw6IFRoZSBJRCBvZiB0aGUgc291bmQgKGlmIG9taXR0ZWQsIGFsbCBzb3VuZHMgd2lsbCBiZSB1c2VkLilcclxuICAgKi9cclxuXHJcbiAgdGhpcy5tdXRlID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgdmFyIGkgPSAwO1xyXG5cclxuICAgIGlmIChzSUQgaW5zdGFuY2VvZiBTdHJpbmcpIHtcclxuICAgICAgc0lEID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNJRCkge1xyXG5cclxuICAgICAgc20yLl93RChzbSArICcubXV0ZSgpOiBNdXRpbmcgYWxsIHNvdW5kcycpO1xyXG4gICAgICBmb3IgKGkgPSBzbTIuc291bmRJRHMubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLm11dGUoKTtcclxuICAgICAgfVxyXG4gICAgICBzbTIubXV0ZWQgPSB0cnVlO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBzbTIuX3dEKHNtICsgJy5tdXRlKCk6IE11dGluZyBcIicgKyBzSUQgKyAnXCInKTtcclxuICAgICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5tdXRlKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBNdXRlcyBhbGwgc291bmRzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLm11dGVBbGwgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBzbTIubXV0ZSgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgdW5tdXRlKCkgbWV0aG9kIG9mIGVpdGhlciBhIHNpbmdsZSBTTVNvdW5kIG9iamVjdCBieSBJRCwgb3IgYWxsIHNvdW5kIG9iamVjdHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIE9wdGlvbmFsOiBUaGUgSUQgb2YgdGhlIHNvdW5kIChpZiBvbWl0dGVkLCBhbGwgc291bmRzIHdpbGwgYmUgdXNlZC4pXHJcbiAgICovXHJcblxyXG4gIHRoaXMudW5tdXRlID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgaWYgKHNJRCBpbnN0YW5jZW9mIFN0cmluZykge1xyXG4gICAgICBzSUQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc0lEKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHNtICsgJy51bm11dGUoKTogVW5tdXRpbmcgYWxsIHNvdW5kcycpO1xyXG4gICAgICBmb3IgKGkgPSBzbTIuc291bmRJRHMubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLnVubXV0ZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHNtMi5tdXRlZCA9IGZhbHNlO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICBzbTIuX3dEKHNtICsgJy51bm11dGUoKTogVW5tdXRpbmcgXCInICsgc0lEICsgJ1wiJyk7XHJcbiAgICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0udW5tdXRlKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBVbm11dGVzIGFsbCBzb3VuZHMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMudW5tdXRlQWxsID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgc20yLnVubXV0ZSgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgdG9nZ2xlTXV0ZSgpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMudG9nZ2xlTXV0ZSA9IGZ1bmN0aW9uKHNJRCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0udG9nZ2xlTXV0ZSgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgdGhlIG1lbW9yeSB1c2VkIGJ5IHRoZSBmbGFzaCBwbHVnaW4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBhbW91bnQgb2YgbWVtb3J5IGluIHVzZVxyXG4gICAqL1xyXG5cclxuICB0aGlzLmdldE1lbW9yeVVzZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIGZsYXNoLW9ubHlcclxuICAgIHZhciByYW0gPSAwO1xyXG5cclxuICAgIGlmIChmbGFzaCAmJiBmViAhPT0gOCkge1xyXG4gICAgICByYW0gPSBwYXJzZUludChmbGFzaC5fZ2V0TWVtb3J5VXNlKCksIDEwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmFtO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBVbmRvY3VtZW50ZWQ6IE5PUHMgc291bmRNYW5hZ2VyIGFuZCBhbGwgU01Tb3VuZCBvYmplY3RzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmRpc2FibGUgPSBmdW5jdGlvbihiTm9EaXNhYmxlKSB7XHJcblxyXG4gICAgLy8gZGVzdHJveSBhbGwgZnVuY3Rpb25zXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBpZiAoYk5vRGlzYWJsZSA9PT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICBiTm9EaXNhYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRpc2FibGVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNhYmxlZCA9IHRydWU7XHJcbiAgICBfd0RTKCdzaHV0ZG93bicsIDEpO1xyXG5cclxuICAgIGZvciAoaSA9IHNtMi5zb3VuZElEcy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgZGlzYWJsZU9iamVjdChzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZpcmUgXCJjb21wbGV0ZVwiLCBkZXNwaXRlIGZhaWxcclxuICAgIGluaXRDb21wbGV0ZShiTm9EaXNhYmxlKTtcclxuICAgIGV2ZW50LnJlbW92ZSh3aW5kb3csICdsb2FkJywgaW5pdFVzZXJPbmxvYWQpO1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHBsYXlhYmlsaXR5IG9mIGEgTUlNRSB0eXBlLCBlZy4gJ2F1ZGlvL21wMycuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuY2FuUGxheU1JTUUgPSBmdW5jdGlvbihzTUlNRSkge1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcblxyXG4gICAgaWYgKHNtMi5oYXNIVE1MNSkge1xyXG4gICAgICByZXN1bHQgPSBodG1sNUNhblBsYXkoe3R5cGU6c01JTUV9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXJlc3VsdCAmJiBuZWVkc0ZsYXNoKSB7XHJcbiAgICAgIC8vIGlmIGZsYXNoIDksIHRlc3QgbmV0U3RyZWFtIChtb3ZpZVN0YXIpIHR5cGVzIGFzIHdlbGwuXHJcbiAgICAgIHJlc3VsdCA9IChzTUlNRSAmJiBzbTIub2soKSA/ICEhKChmViA+IDggPyBzTUlNRS5tYXRjaChuZXRTdHJlYW1NaW1lVHlwZXMpIDogbnVsbCkgfHwgc01JTUUubWF0Y2goc20yLm1pbWVQYXR0ZXJuKSkgOiBudWxsKTsgLy8gVE9ETzogbWFrZSBsZXNzIFwid2VpcmRcIiAocGVyIEpTTGludClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHBsYXlhYmlsaXR5IG9mIGEgVVJMIGJhc2VkIG9uIGF1ZGlvIHN1cHBvcnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc1VSTCBUaGUgVVJMIHRvIHRlc3RcclxuICAgKiBAcmV0dXJuIHtib29sZWFufSBVUkwgcGxheWFiaWxpdHlcclxuICAgKi9cclxuXHJcbiAgdGhpcy5jYW5QbGF5VVJMID0gZnVuY3Rpb24oc1VSTCkge1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcblxyXG4gICAgaWYgKHNtMi5oYXNIVE1MNSkge1xyXG4gICAgICByZXN1bHQgPSBodG1sNUNhblBsYXkoe3VybDogc1VSTH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzdWx0ICYmIG5lZWRzRmxhc2gpIHtcclxuICAgICAgcmVzdWx0ID0gKHNVUkwgJiYgc20yLm9rKCkgPyAhIShzVVJMLm1hdGNoKHNtMi5maWxlUGF0dGVybikpIDogbnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyBwbGF5YWJpbGl0eSBvZiBhbiBIVE1MIERPTSAmbHQ7YSZndDsgb2JqZWN0IChvciBzaW1pbGFyIG9iamVjdCBsaXRlcmFsKSBiYXNlZCBvbiBhdWRpbyBzdXBwb3J0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9MaW5rIGFuIEhUTUwgRE9NICZsdDthJmd0OyBvYmplY3Qgb3Igb2JqZWN0IGxpdGVyYWwgaW5jbHVkaW5nIGhyZWYgYW5kL29yIHR5cGUgYXR0cmlidXRlc1xyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFVSTCBwbGF5YWJpbGl0eVxyXG4gICAqL1xyXG5cclxuICB0aGlzLmNhblBsYXlMaW5rID0gZnVuY3Rpb24ob0xpbmspIHtcclxuXHJcbiAgICBpZiAob0xpbmsudHlwZSAhPT0gX3VuZGVmaW5lZCAmJiBvTGluay50eXBlKSB7XHJcbiAgICAgIGlmIChzbTIuY2FuUGxheU1JTUUob0xpbmsudHlwZSkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzbTIuY2FuUGxheVVSTChvTGluay5ocmVmKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5nZXRTb3VuZEJ5SWQgPSBmdW5jdGlvbihzSUQsIF9zdXBwcmVzc0RlYnVnKSB7XHJcblxyXG4gICAgaWYgKCFzSUQpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IHNtMi5zb3VuZHNbc0lEXTtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIGlmICghcmVzdWx0ICYmICFfc3VwcHJlc3NEZWJ1Zykge1xyXG4gICAgICBzbTIuX3dEKHNtICsgJy5nZXRTb3VuZEJ5SWQoKTogU291bmQgXCInICsgc0lEICsgJ1wiIG5vdCBmb3VuZC4nLCAyKTtcclxuICAgIH1cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBRdWV1ZXMgYSBjYWxsYmFjayBmb3IgZXhlY3V0aW9uIHdoZW4gU291bmRNYW5hZ2VyIGhhcyBzdWNjZXNzZnVsbHkgaW5pdGlhbGl6ZWQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvTWV0aG9kIFRoZSBjYWxsYmFjayBtZXRob2QgdG8gZmlyZVxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvU2NvcGUgT3B0aW9uYWw6IFRoZSBzY29wZSB0byBhcHBseSB0byB0aGUgY2FsbGJhY2tcclxuICAgKi9cclxuXHJcbiAgdGhpcy5vbnJlYWR5ID0gZnVuY3Rpb24ob01ldGhvZCwgb1Njb3BlKSB7XHJcblxyXG4gICAgdmFyIHNUeXBlID0gJ29ucmVhZHknLFxyXG4gICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICh0eXBlb2Ygb01ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuICAgICAgLy8gPGQ+XHJcbiAgICAgIGlmIChkaWRJbml0KSB7XHJcbiAgICAgICAgc20yLl93RChzdHIoJ3F1ZXVlJywgc1R5cGUpKTtcclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICBpZiAoIW9TY29wZSkge1xyXG4gICAgICAgIG9TY29wZSA9IHdpbmRvdztcclxuICAgICAgfVxyXG5cclxuICAgICAgYWRkT25FdmVudChzVHlwZSwgb01ldGhvZCwgb1Njb3BlKTtcclxuICAgICAgcHJvY2Vzc09uRXZlbnRzKCk7XHJcblxyXG4gICAgICByZXN1bHQgPSB0cnVlO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICB0aHJvdyBzdHIoJ25lZWRGdW5jdGlvbicsIHNUeXBlKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUXVldWVzIGEgY2FsbGJhY2sgZm9yIGV4ZWN1dGlvbiB3aGVuIFNvdW5kTWFuYWdlciBoYXMgZmFpbGVkIHRvIGluaXRpYWxpemUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvTWV0aG9kIFRoZSBjYWxsYmFjayBtZXRob2QgdG8gZmlyZVxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvU2NvcGUgT3B0aW9uYWw6IFRoZSBzY29wZSB0byBhcHBseSB0byB0aGUgY2FsbGJhY2tcclxuICAgKi9cclxuXHJcbiAgdGhpcy5vbnRpbWVvdXQgPSBmdW5jdGlvbihvTWV0aG9kLCBvU2NvcGUpIHtcclxuXHJcbiAgICB2YXIgc1R5cGUgPSAnb250aW1lb3V0JyxcclxuICAgICAgICByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAodHlwZW9mIG9NZXRob2QgPT09ICdmdW5jdGlvbicpIHtcclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBpZiAoZGlkSW5pdCkge1xyXG4gICAgICAgIHNtMi5fd0Qoc3RyKCdxdWV1ZScsIHNUeXBlKSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgaWYgKCFvU2NvcGUpIHtcclxuICAgICAgICBvU2NvcGUgPSB3aW5kb3c7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFkZE9uRXZlbnQoc1R5cGUsIG9NZXRob2QsIG9TY29wZSk7XHJcbiAgICAgIHByb2Nlc3NPbkV2ZW50cyh7dHlwZTpzVHlwZX0pO1xyXG5cclxuICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgdGhyb3cgc3RyKCduZWVkRnVuY3Rpb24nLCBzVHlwZSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFdyaXRlcyBjb25zb2xlLmxvZygpLXN0eWxlIGRlYnVnIG91dHB1dCB0byBhIGNvbnNvbGUgb3IgaW4tYnJvd3NlciBlbGVtZW50LlxyXG4gICAqIEFwcGxpZXMgd2hlbiBkZWJ1Z01vZGUgPSB0cnVlXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc1RleHQgVGhlIGNvbnNvbGUgbWVzc2FnZVxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBuVHlwZSBPcHRpb25hbCBsb2cgbGV2ZWwgKG51bWJlciksIG9yIG9iamVjdC4gTnVtYmVyIGNhc2U6IExvZyB0eXBlL3N0eWxlIHdoZXJlIDAgPSAnaW5mbycsIDEgPSAnd2FybicsIDIgPSAnZXJyb3InLiBPYmplY3QgY2FzZTogT2JqZWN0IHRvIGJlIGR1bXBlZC5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5fd3JpdGVEZWJ1ZyA9IGZ1bmN0aW9uKHNUZXh0LCBzVHlwZU9yT2JqZWN0KSB7XHJcblxyXG4gICAgLy8gcHNldWRvLXByaXZhdGUgY29uc29sZS5sb2coKS1zdHlsZSBvdXRwdXRcclxuICAgIC8vIDxkPlxyXG5cclxuICAgIHZhciBzRElEID0gJ3NvdW5kbWFuYWdlci1kZWJ1ZycsIG8sIG9JdGVtO1xyXG5cclxuICAgIGlmICghc20yLmRlYnVnTW9kZSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhc0NvbnNvbGUgJiYgc20yLnVzZUNvbnNvbGUpIHtcclxuICAgICAgaWYgKHNUeXBlT3JPYmplY3QgJiYgdHlwZW9mIHNUeXBlT3JPYmplY3QgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgLy8gb2JqZWN0IHBhc3NlZDsgZHVtcCB0byBjb25zb2xlLlxyXG4gICAgICAgIGNvbnNvbGUubG9nKHNUZXh0LCBzVHlwZU9yT2JqZWN0KTtcclxuICAgICAgfSBlbHNlIGlmIChkZWJ1Z0xldmVsc1tzVHlwZU9yT2JqZWN0XSAhPT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbnNvbGVbZGVidWdMZXZlbHNbc1R5cGVPck9iamVjdF1dKHNUZXh0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhzVGV4dCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNtMi5jb25zb2xlT25seSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbyA9IGlkKHNESUQpO1xyXG5cclxuICAgIGlmICghbykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgb0l0ZW0gPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG4gICAgaWYgKCsrd2RDb3VudCAlIDIgPT09IDApIHtcclxuICAgICAgb0l0ZW0uY2xhc3NOYW1lID0gJ3NtMi1hbHQnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzVHlwZU9yT2JqZWN0ID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIHNUeXBlT3JPYmplY3QgPSAwO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc1R5cGVPck9iamVjdCA9IHBhcnNlSW50KHNUeXBlT3JPYmplY3QsIDEwKTtcclxuICAgIH1cclxuXHJcbiAgICBvSXRlbS5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUoc1RleHQpKTtcclxuXHJcbiAgICBpZiAoc1R5cGVPck9iamVjdCkge1xyXG4gICAgICBpZiAoc1R5cGVPck9iamVjdCA+PSAyKSB7XHJcbiAgICAgICAgb0l0ZW0uc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJztcclxuICAgICAgfVxyXG4gICAgICBpZiAoc1R5cGVPck9iamVjdCA9PT0gMykge1xyXG4gICAgICAgIG9JdGVtLnN0eWxlLmNvbG9yID0gJyNmZjMzMzMnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdG9wLXRvLWJvdHRvbVxyXG4gICAgLy8gby5hcHBlbmRDaGlsZChvSXRlbSk7XHJcblxyXG4gICAgLy8gYm90dG9tLXRvLXRvcFxyXG4gICAgby5pbnNlcnRCZWZvcmUob0l0ZW0sIG8uZmlyc3RDaGlsZCk7XHJcblxyXG4gICAgbyA9IG51bGw7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIC8vIDxkPlxyXG4gIC8vIGxhc3QtcmVzb3J0IGRlYnVnZ2luZyBvcHRpb25cclxuICBpZiAod2wuaW5kZXhPZignc20yLWRlYnVnPWFsZXJ0JykgIT09IC0xKSB7XHJcbiAgICB0aGlzLl93cml0ZURlYnVnID0gZnVuY3Rpb24oc1RleHQpIHtcclxuICAgICAgd2luZG93LmFsZXJ0KHNUZXh0KTtcclxuICAgIH07XHJcbiAgfVxyXG4gIC8vIDwvZD5cclxuXHJcbiAgLy8gYWxpYXNcclxuICB0aGlzLl93RCA9IHRoaXMuX3dyaXRlRGVidWc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFByb3ZpZGVzIGRlYnVnIC8gc3RhdGUgaW5mb3JtYXRpb24gb24gYWxsIFNNU291bmQgb2JqZWN0cy5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5fZGVidWcgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIHZhciBpLCBqO1xyXG4gICAgX3dEUygnY3VycmVudE9iaicsIDEpO1xyXG5cclxuICAgIGZvciAoaSA9IDAsIGogPSBzbTIuc291bmRJRHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XHJcbiAgICAgIHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXS5fZGVidWcoKTtcclxuICAgIH1cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGFydHMgYW5kIHJlLWluaXRpYWxpemVzIHRoZSBTb3VuZE1hbmFnZXIgaW5zdGFuY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlc2V0RXZlbnRzIE9wdGlvbmFsOiBXaGVuIHRydWUsIHJlbW92ZXMgYWxsIHJlZ2lzdGVyZWQgb25yZWFkeSBhbmQgb250aW1lb3V0IGV2ZW50IGNhbGxiYWNrcy5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGV4Y2x1ZGVJbml0IE9wdGlvbnM6IFdoZW4gdHJ1ZSwgZG9lcyBub3QgY2FsbCBiZWdpbkRlbGF5ZWRJbml0KCkgKHdoaWNoIHdvdWxkIHJlc3RhcnQgU00yKS5cclxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHNvdW5kTWFuYWdlciBUaGUgc291bmRNYW5hZ2VyIGluc3RhbmNlLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLnJlYm9vdCA9IGZ1bmN0aW9uKHJlc2V0RXZlbnRzLCBleGNsdWRlSW5pdCkge1xyXG5cclxuICAgIC8vIHJlc2V0IHNvbWUgKG9yIGFsbCkgc3RhdGUsIGFuZCByZS1pbml0IHVubGVzcyBvdGhlcndpc2Ugc3BlY2lmaWVkLlxyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKHNtMi5zb3VuZElEcy5sZW5ndGgpIHtcclxuICAgICAgc20yLl93RCgnRGVzdHJveWluZyAnICsgc20yLnNvdW5kSURzLmxlbmd0aCArICcgU01Tb3VuZCBvYmplY3QnICsgKHNtMi5zb3VuZElEcy5sZW5ndGggIT09IDEgPyAncycgOiAnJykgKyAnLi4uJyk7XHJcbiAgICB9XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgdmFyIGksIGosIGs7XHJcblxyXG4gICAgZm9yIChpID0gc20yLnNvdW5kSURzLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0uZGVzdHJ1Y3QoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0cmFzaCB6ZSBmbGFzaCAocmVtb3ZlIGZyb20gdGhlIERPTSlcclxuXHJcbiAgICBpZiAoZmxhc2gpIHtcclxuXHJcbiAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgIGlmIChpc0lFKSB7XHJcbiAgICAgICAgICBvUmVtb3ZlZEhUTUwgPSBmbGFzaC5pbm5lckhUTUw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvUmVtb3ZlZCA9IGZsYXNoLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmxhc2gpO1xyXG5cclxuICAgICAgfSBjYXRjaChlKSB7XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBmYWlsZWQ/IE1heSBiZSBkdWUgdG8gZmxhc2ggYmxvY2tlcnMgc2lsZW50bHkgcmVtb3ZpbmcgdGhlIFNXRiBvYmplY3QvZW1iZWQgbm9kZSBmcm9tIHRoZSBET00uIFdhcm4gYW5kIGNvbnRpbnVlLlxyXG5cclxuICAgICAgICBfd0RTKCdiYWRSZW1vdmUnLCAyKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWN0dWFsbHksIGZvcmNlIHJlY3JlYXRlIG9mIG1vdmllLlxyXG5cclxuICAgIG9SZW1vdmVkSFRNTCA9IG9SZW1vdmVkID0gbmVlZHNGbGFzaCA9IGZsYXNoID0gbnVsbDtcclxuXHJcbiAgICBzbTIuZW5hYmxlZCA9IGRpZERDTG9hZGVkID0gZGlkSW5pdCA9IHdhaXRpbmdGb3JFSSA9IGluaXRQZW5kaW5nID0gZGlkQXBwZW5kID0gYXBwZW5kU3VjY2VzcyA9IGRpc2FibGVkID0gdXNlR2xvYmFsSFRNTDVBdWRpbyA9IHNtMi5zd2ZMb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgICBzbTIuc291bmRJRHMgPSBbXTtcclxuICAgIHNtMi5zb3VuZHMgPSB7fTtcclxuXHJcbiAgICBpZENvdW50ZXIgPSAwO1xyXG5cclxuICAgIGlmICghcmVzZXRFdmVudHMpIHtcclxuICAgICAgLy8gcmVzZXQgY2FsbGJhY2tzIGZvciBvbnJlYWR5LCBvbnRpbWVvdXQgZXRjLiBzbyB0aGF0IHRoZXkgd2lsbCBmaXJlIGFnYWluIG9uIHJlLWluaXRcclxuICAgICAgZm9yIChpIGluIG9uX3F1ZXVlKSB7XHJcbiAgICAgICAgaWYgKG9uX3F1ZXVlLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgICAgICBmb3IgKGogPSAwLCBrID0gb25fcXVldWVbaV0ubGVuZ3RoOyBqIDwgazsgaisrKSB7XHJcbiAgICAgICAgICAgIG9uX3F1ZXVlW2ldW2pdLmZpcmVkID0gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyByZW1vdmUgYWxsIGNhbGxiYWNrcyBlbnRpcmVseVxyXG4gICAgICBvbl9xdWV1ZSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKCFleGNsdWRlSW5pdCkge1xyXG4gICAgICBzbTIuX3dEKHNtICsgJzogUmVib290aW5nLi4uJyk7XHJcbiAgICB9XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgLy8gcmVzZXQgSFRNTDUgYW5kIGZsYXNoIGNhblBsYXkgdGVzdCByZXN1bHRzXHJcblxyXG4gICAgc20yLmh0bWw1ID0ge1xyXG4gICAgICAndXNpbmdGbGFzaCc6IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgc20yLmZsYXNoID0ge307XHJcblxyXG4gICAgLy8gcmVzZXQgZGV2aWNlLXNwZWNpZmljIEhUTUwvZmxhc2ggbW9kZSBzd2l0Y2hlc1xyXG5cclxuICAgIHNtMi5odG1sNU9ubHkgPSBmYWxzZTtcclxuICAgIHNtMi5pZ25vcmVGbGFzaCA9IGZhbHNlO1xyXG5cclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgcHJlSW5pdCgpO1xyXG5cclxuICAgICAgLy8gYnkgZGVmYXVsdCwgcmUtaW5pdFxyXG5cclxuICAgICAgaWYgKCFleGNsdWRlSW5pdCkge1xyXG4gICAgICAgIHNtMi5iZWdpbkRlbGF5ZWRJbml0KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCAyMCk7XHJcblxyXG4gICAgcmV0dXJuIHNtMjtcclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2h1dHMgZG93biBhbmQgcmVzdG9yZXMgdGhlIFNvdW5kTWFuYWdlciBpbnN0YW5jZSB0byBpdHMgb3JpZ2luYWwgbG9hZGVkIHN0YXRlLCB3aXRob3V0IGFuIGV4cGxpY2l0IHJlYm9vdC4gQWxsIG9ucmVhZHkvb250aW1lb3V0IGhhbmRsZXJzIGFyZSByZW1vdmVkLlxyXG4gICAgICogQWZ0ZXIgdGhpcyBjYWxsLCBTTTIgbWF5IGJlIHJlLWluaXRpYWxpemVkIHZpYSBzb3VuZE1hbmFnZXIuYmVnaW5EZWxheWVkSW5pdCgpLlxyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBzb3VuZE1hbmFnZXIgVGhlIHNvdW5kTWFuYWdlciBpbnN0YW5jZS5cclxuICAgICAqL1xyXG5cclxuICAgIF93RFMoJ3Jlc2V0Jyk7XHJcbiAgICByZXR1cm4gc20yLnJlYm9vdCh0cnVlLCB0cnVlKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogVW5kb2N1bWVudGVkOiBEZXRlcm1pbmVzIHRoZSBTTTIgZmxhc2ggbW92aWUncyBsb2FkIHByb2dyZXNzLlxyXG4gICAqXHJcbiAgICogQHJldHVybiB7bnVtYmVyIG9yIG51bGx9IFBlcmNlbnQgbG9hZGVkLCBvciBpZiBpbnZhbGlkL3Vuc3VwcG9ydGVkLCBudWxsLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmdldE1vdmllUGVyY2VudCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50ZXJlc3Rpbmcgc3ludGF4IG5vdGVzLi4uXHJcbiAgICAgKiBGbGFzaC9FeHRlcm5hbEludGVyZmFjZSAoQWN0aXZlWC9OUEFQSSkgYnJpZGdlIG1ldGhvZHMgYXJlIG5vdCB0eXBlb2YgXCJmdW5jdGlvblwiIG5vciBpbnN0YW5jZW9mIEZ1bmN0aW9uLCBidXQgYXJlIHN0aWxsIHZhbGlkLlxyXG4gICAgICogQWRkaXRpb25hbGx5LCBKU0xpbnQgZGlzbGlrZXMgKCdQZXJjZW50TG9hZGVkJyBpbiBmbGFzaCktc3R5bGUgc3ludGF4IGFuZCByZWNvbW1lbmRzIGhhc093blByb3BlcnR5KCksIHdoaWNoIGRvZXMgbm90IHdvcmsgaW4gdGhpcyBjYXNlLlxyXG4gICAgICogRnVydGhlcm1vcmUsIHVzaW5nIChmbGFzaCAmJiBmbGFzaC5QZXJjZW50TG9hZGVkKSBjYXVzZXMgSUUgdG8gdGhyb3cgXCJvYmplY3QgZG9lc24ndCBzdXBwb3J0IHRoaXMgcHJvcGVydHkgb3IgbWV0aG9kXCIuXHJcbiAgICAgKiBUaHVzLCAnaW4nIHN5bnRheCBtdXN0IGJlIHVzZWQuXHJcbiAgICAgKi9cclxuXHJcbiAgICByZXR1cm4gKGZsYXNoICYmICdQZXJjZW50TG9hZGVkJyBpbiBmbGFzaCA/IGZsYXNoLlBlcmNlbnRMb2FkZWQoKSA6IG51bGwpOyAvLyBZZXMsIEpTTGludC4gU2VlIG5lYXJieSBjb21tZW50IGluIHNvdXJjZSBmb3IgZXhwbGFuYXRpb24uXHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZGl0aW9uYWwgaGVscGVyIGZvciBtYW51YWxseSBpbnZva2luZyBTTTIncyBpbml0IHByb2Nlc3MgYWZ0ZXIgRE9NIFJlYWR5IC8gd2luZG93Lm9ubG9hZCgpLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmJlZ2luRGVsYXllZEluaXQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB3aW5kb3dMb2FkZWQgPSB0cnVlO1xyXG4gICAgZG9tQ29udGVudExvYWRlZCgpO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAoaW5pdFBlbmRpbmcpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNyZWF0ZU1vdmllKCk7XHJcbiAgICAgIGluaXRNb3ZpZSgpO1xyXG4gICAgICBpbml0UGVuZGluZyA9IHRydWU7XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9LCAyMCk7XHJcblxyXG4gICAgZGVsYXlXYWl0Rm9yRUkoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIFNvdW5kTWFuYWdlciBpbnN0YW5jZSBhbmQgYWxsIFNNU291bmQgaW5zdGFuY2VzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmRlc3RydWN0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgc20yLl93RChzbSArICcuZGVzdHJ1Y3QoKScpO1xyXG4gICAgc20yLmRpc2FibGUodHJ1ZSk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFNNU291bmQoKSAoc291bmQgb2JqZWN0KSBjb25zdHJ1Y3RvclxyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9PcHRpb25zIFNvdW5kIG9wdGlvbnMgKGlkIGFuZCB1cmwgYXJlIHJlcXVpcmVkIGF0dHJpYnV0ZXMpXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIG5ldyBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICBTTVNvdW5kID0gZnVuY3Rpb24ob09wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgcyA9IHRoaXMsIHJlc2V0UHJvcGVydGllcywgYWRkX2h0bWw1X2V2ZW50cywgcmVtb3ZlX2h0bWw1X2V2ZW50cywgc3RvcF9odG1sNV90aW1lciwgc3RhcnRfaHRtbDVfdGltZXIsIGF0dGFjaE9uUG9zaXRpb24sIG9ucGxheV9jYWxsZWQgPSBmYWxzZSwgb25Qb3NpdGlvbkl0ZW1zID0gW10sIG9uUG9zaXRpb25GaXJlZCA9IDAsIGRldGFjaE9uUG9zaXRpb24sIGFwcGx5RnJvbVRvLCBsYXN0VVJMID0gbnVsbCwgbGFzdEhUTUw1U3RhdGUsIHVybE9taXR0ZWQ7XHJcblxyXG4gICAgbGFzdEhUTUw1U3RhdGUgPSB7XHJcbiAgICAgIC8vIHRyYWNrcyBkdXJhdGlvbiArIHBvc2l0aW9uICh0aW1lKVxyXG4gICAgICBkdXJhdGlvbjogbnVsbCxcclxuICAgICAgdGltZTogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlkID0gb09wdGlvbnMuaWQ7XHJcblxyXG4gICAgLy8gbGVnYWN5XHJcbiAgICB0aGlzLnNJRCA9IHRoaXMuaWQ7XHJcblxyXG4gICAgdGhpcy51cmwgPSBvT3B0aW9ucy51cmw7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSBtaXhpbihvT3B0aW9ucyk7XHJcblxyXG4gICAgLy8gcGVyLXBsYXktaW5zdGFuY2Utc3BlY2lmaWMgb3B0aW9uc1xyXG4gICAgdGhpcy5pbnN0YW5jZU9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XHJcblxyXG4gICAgLy8gc2hvcnQgYWxpYXNcclxuICAgIHRoaXMuX2lPID0gdGhpcy5pbnN0YW5jZU9wdGlvbnM7XHJcblxyXG4gICAgLy8gYXNzaWduIHByb3BlcnR5IGRlZmF1bHRzXHJcbiAgICB0aGlzLnBhbiA9IHRoaXMub3B0aW9ucy5wYW47XHJcbiAgICB0aGlzLnZvbHVtZSA9IHRoaXMub3B0aW9ucy52b2x1bWU7XHJcblxyXG4gICAgLy8gd2hldGhlciBvciBub3QgdGhpcyBvYmplY3QgaXMgdXNpbmcgSFRNTDVcclxuICAgIHRoaXMuaXNIVE1MNSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIGludGVybmFsIEhUTUw1IEF1ZGlvKCkgb2JqZWN0IHJlZmVyZW5jZVxyXG4gICAgdGhpcy5fYSA9IG51bGw7XHJcblxyXG4gICAgLy8gZm9yIGZsYXNoIDggc3BlY2lhbC1jYXNlIGNyZWF0ZVNvdW5kKCkgd2l0aG91dCB1cmwsIGZvbGxvd2VkIGJ5IGxvYWQvcGxheSB3aXRoIHVybCBjYXNlXHJcbiAgICB1cmxPbWl0dGVkID0gKHRoaXMudXJsID8gZmFsc2UgOiB0cnVlKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNNU291bmQoKSBwdWJsaWMgbWV0aG9kc1xyXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLmlkMyA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV3JpdGVzIFNNU291bmQgb2JqZWN0IHBhcmFtZXRlcnMgdG8gZGVidWcgY29uc29sZVxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5fZGVidWcgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBNZXJnZWQgb3B0aW9uczonLCBzLm9wdGlvbnMpO1xyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJlZ2lucyBsb2FkaW5nIGEgc291bmQgcGVyIGl0cyAqdXJsKi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgT3B0aW9uYWw6IFNvdW5kIG9wdGlvbnNcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5sb2FkID0gZnVuY3Rpb24ob09wdGlvbnMpIHtcclxuXHJcbiAgICAgIHZhciBvU291bmQgPSBudWxsLCBpbnN0YW5jZU9wdGlvbnM7XHJcblxyXG4gICAgICBpZiAob09wdGlvbnMgIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICBzLl9pTyA9IG1peGluKG9PcHRpb25zLCBzLm9wdGlvbnMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG9PcHRpb25zID0gcy5vcHRpb25zO1xyXG4gICAgICAgIHMuX2lPID0gb09wdGlvbnM7XHJcbiAgICAgICAgaWYgKGxhc3RVUkwgJiYgbGFzdFVSTCAhPT0gcy51cmwpIHtcclxuICAgICAgICAgIF93RFMoJ21hblVSTCcpO1xyXG4gICAgICAgICAgcy5faU8udXJsID0gcy51cmw7XHJcbiAgICAgICAgICBzLnVybCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXMuX2lPLnVybCkge1xyXG4gICAgICAgIHMuX2lPLnVybCA9IHMudXJsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzLl9pTy51cmwgPSBwYXJzZVVSTChzLl9pTy51cmwpO1xyXG5cclxuICAgICAgLy8gZW5zdXJlIHdlJ3JlIGluIHN5bmNcclxuICAgICAgcy5pbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuXHJcbiAgICAgIC8vIGxvY2FsIHNob3J0Y3V0XHJcbiAgICAgIGluc3RhbmNlT3B0aW9ucyA9IHMuX2lPO1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogbG9hZCAoJyArIGluc3RhbmNlT3B0aW9ucy51cmwgKyAnKScpO1xyXG5cclxuICAgICAgaWYgKCFpbnN0YW5jZU9wdGlvbnMudXJsICYmICFzLnVybCkge1xyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IGxvYWQoKTogdXJsIGlzIHVuYXNzaWduZWQuIEV4aXRpbmcuJywgMik7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSAmJiBmViA9PT0gOCAmJiAhcy51cmwgJiYgIWluc3RhbmNlT3B0aW9ucy5hdXRvUGxheSkge1xyXG4gICAgICAgIC8vIGZsYXNoIDggbG9hZCgpIC0+IHBsYXkoKSB3b24ndCB3b3JrIGJlZm9yZSBvbmxvYWQgaGFzIGZpcmVkLlxyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IEZsYXNoIDggbG9hZCgpIGxpbWl0YXRpb246IFdhaXQgZm9yIG9ubG9hZCgpIGJlZm9yZSBjYWxsaW5nIHBsYXkoKS4nLCAxKTtcclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnVybCA9PT0gcy51cmwgJiYgcy5yZWFkeVN0YXRlICE9PSAwICYmIHMucmVhZHlTdGF0ZSAhPT0gMikge1xyXG4gICAgICAgIF93RFMoJ29uVVJMJywgMSk7XHJcbiAgICAgICAgLy8gaWYgbG9hZGVkIGFuZCBhbiBvbmxvYWQoKSBleGlzdHMsIGZpcmUgaW1tZWRpYXRlbHkuXHJcbiAgICAgICAgaWYgKHMucmVhZHlTdGF0ZSA9PT0gMyAmJiBpbnN0YW5jZU9wdGlvbnMub25sb2FkKSB7XHJcbiAgICAgICAgICAvLyBhc3N1bWUgc3VjY2VzcyBiYXNlZCBvbiB0cnV0aHkgZHVyYXRpb24uXHJcbiAgICAgICAgICB3cmFwQ2FsbGJhY2socywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGluc3RhbmNlT3B0aW9ucy5vbmxvYWQuYXBwbHkocywgWyghIXMuZHVyYXRpb24pXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJlc2V0IGEgZmV3IHN0YXRlIHByb3BlcnRpZXNcclxuXHJcbiAgICAgIHMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAgIHMucmVhZHlTdGF0ZSA9IDE7XHJcbiAgICAgIHMucGxheVN0YXRlID0gMDtcclxuICAgICAgcy5pZDMgPSB7fTtcclxuXHJcbiAgICAgIC8vIFRPRE86IElmIHN3aXRjaGluZyBmcm9tIEhUTUw1IC0+IGZsYXNoIChvciB2aWNlIHZlcnNhKSwgc3RvcCBjdXJyZW50bHktcGxheWluZyBhdWRpby5cclxuXHJcbiAgICAgIGlmIChodG1sNU9LKGluc3RhbmNlT3B0aW9ucykpIHtcclxuXHJcbiAgICAgICAgb1NvdW5kID0gcy5fc2V0dXBfaHRtbDUoaW5zdGFuY2VPcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKCFvU291bmQuX2NhbGxlZF9sb2FkKSB7XHJcblxyXG4gICAgICAgICAgcy5faHRtbDVfY2FucGxheSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIC8vIFRPRE86IHJldmlldyBjYWxsZWRfbG9hZCAvIGh0bWw1X2NhbnBsYXkgbG9naWNcclxuXHJcbiAgICAgICAgICAvLyBpZiB1cmwgcHJvdmlkZWQgZGlyZWN0bHkgdG8gbG9hZCgpLCBhc3NpZ24gaXQgaGVyZS5cclxuXHJcbiAgICAgICAgICBpZiAocy51cmwgIT09IGluc3RhbmNlT3B0aW9ucy51cmwpIHtcclxuXHJcbiAgICAgICAgICAgIHNtMi5fd0QoX3dEUygnbWFuVVJMJykgKyAnOiAnICsgaW5zdGFuY2VPcHRpb25zLnVybCk7XHJcblxyXG4gICAgICAgICAgICBzLl9hLnNyYyA9IGluc3RhbmNlT3B0aW9ucy51cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiByZXZpZXcgLyByZS1hcHBseSBhbGwgcmVsZXZhbnQgb3B0aW9ucyAodm9sdW1lLCBsb29wLCBvbnBvc2l0aW9uIGV0Yy4pXHJcblxyXG4gICAgICAgICAgICAvLyByZXNldCBwb3NpdGlvbiBmb3IgbmV3IFVSTFxyXG4gICAgICAgICAgICBzLnNldFBvc2l0aW9uKDApO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBnaXZlbiBleHBsaWNpdCBsb2FkIGNhbGwsIHRyeSB0byBwcmVsb2FkLlxyXG5cclxuICAgICAgICAgIC8vIGVhcmx5IEhUTUw1IGltcGxlbWVudGF0aW9uIChub24tc3RhbmRhcmQpXHJcbiAgICAgICAgICBzLl9hLmF1dG9idWZmZXIgPSAnYXV0byc7XHJcblxyXG4gICAgICAgICAgLy8gc3RhbmRhcmQgcHJvcGVydHksIHZhbHVlczogbm9uZSAvIG1ldGFkYXRhIC8gYXV0b1xyXG4gICAgICAgICAgLy8gcmVmZXJlbmNlOiBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZmY5NzQ3NTklMjh2PXZzLjg1JTI5LmFzcHhcclxuICAgICAgICAgIHMuX2EucHJlbG9hZCA9ICdhdXRvJztcclxuXHJcbiAgICAgICAgICBzLl9hLl9jYWxsZWRfbG9hZCA9IHRydWU7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc20yLl93RChzLmlkICsgJzogSWdub3JpbmcgcmVxdWVzdCB0byBsb2FkIGFnYWluJyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBObyBmbGFzaCBzdXBwb3J0LiBFeGl0aW5nLicpO1xyXG4gICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocy5faU8udXJsICYmIHMuX2lPLnVybC5tYXRjaCgvZGF0YVxcOi9pKSkge1xyXG4gICAgICAgICAgLy8gZGF0YTogVVJJcyBub3Qgc3VwcG9ydGVkIGJ5IEZsYXNoLCBlaXRoZXIuXHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBkYXRhOiBVUklzIG5vdCBzdXBwb3J0ZWQgdmlhIEZsYXNoLiBFeGl0aW5nLicpO1xyXG4gICAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgcy5pc0hUTUw1ID0gZmFsc2U7XHJcbiAgICAgICAgICBzLl9pTyA9IHBvbGljeUZpeChsb29wRml4KGluc3RhbmNlT3B0aW9ucykpO1xyXG4gICAgICAgICAgLy8gcmUtYXNzaWduIGxvY2FsIHNob3J0Y3V0XHJcbiAgICAgICAgICBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuICAgICAgICAgIGlmIChmViA9PT0gOCkge1xyXG4gICAgICAgICAgICBmbGFzaC5fbG9hZChzLmlkLCBpbnN0YW5jZU9wdGlvbnMudXJsLCBpbnN0YW5jZU9wdGlvbnMuc3RyZWFtLCBpbnN0YW5jZU9wdGlvbnMuYXV0b1BsYXksIGluc3RhbmNlT3B0aW9ucy51c2VQb2xpY3lGaWxlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZsYXNoLl9sb2FkKHMuaWQsIGluc3RhbmNlT3B0aW9ucy51cmwsICEhKGluc3RhbmNlT3B0aW9ucy5zdHJlYW0pLCAhIShpbnN0YW5jZU9wdGlvbnMuYXV0b1BsYXkpLCBpbnN0YW5jZU9wdGlvbnMubG9vcHN8fDEsICEhKGluc3RhbmNlT3B0aW9ucy5hdXRvTG9hZCksIGluc3RhbmNlT3B0aW9ucy51c2VQb2xpY3lGaWxlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgIF93RFMoJ3NtRXJyb3InLCAyKTtcclxuICAgICAgICAgIGRlYnVnVFMoJ29ubG9hZCcsIGZhbHNlKTtcclxuICAgICAgICAgIGNhdGNoRXJyb3Ioe3R5cGU6J1NNU09VTkRfTE9BRF9KU19FWENFUFRJT04nLCBmYXRhbDp0cnVlfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYWZ0ZXIgYWxsIG9mIHRoaXMsIGVuc3VyZSBzb3VuZCB1cmwgaXMgdXAgdG8gZGF0ZS5cclxuICAgICAgcy51cmwgPSBpbnN0YW5jZU9wdGlvbnMudXJsO1xyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVubG9hZHMgYSBzb3VuZCwgY2FuY2VsaW5nIGFueSBvcGVuIEhUVFAgcmVxdWVzdHMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnVubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgLy8gRmxhc2ggOC9BUzIgY2FuJ3QgXCJjbG9zZVwiIGEgc3RyZWFtIC0gZmFrZSBpdCBieSBsb2FkaW5nIGFuIGVtcHR5IFVSTFxyXG4gICAgICAvLyBGbGFzaCA5L0FTMzogQ2xvc2Ugc3RyZWFtLCBwcmV2ZW50aW5nIGZ1cnRoZXIgbG9hZFxyXG4gICAgICAvLyBIVE1MNTogTW9zdCBVQXMgd2lsbCB1c2UgZW1wdHkgVVJMXHJcblxyXG4gICAgICBpZiAocy5yZWFkeVN0YXRlICE9PSAwKSB7XHJcblxyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IHVubG9hZCgpJyk7XHJcblxyXG4gICAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcblxyXG4gICAgICAgICAgaWYgKGZWID09PSA4KSB7XHJcbiAgICAgICAgICAgIGZsYXNoLl91bmxvYWQocy5pZCwgZW1wdHlVUkwpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmxhc2guX3VubG9hZChzLmlkKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBzdG9wX2h0bWw1X3RpbWVyKCk7XHJcblxyXG4gICAgICAgICAgaWYgKHMuX2EpIHtcclxuXHJcbiAgICAgICAgICAgIHMuX2EucGF1c2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBlbXB0eSBVUkwsIHRvb1xyXG4gICAgICAgICAgICBsYXN0VVJMID0gaHRtbDVVbmxvYWQocy5fYSk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlc2V0IGxvYWQvc3RhdHVzIGZsYWdzXHJcbiAgICAgICAgcmVzZXRQcm9wZXJ0aWVzKCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5sb2FkcyBhbmQgZGVzdHJveXMgYSBzb3VuZC5cclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuZGVzdHJ1Y3QgPSBmdW5jdGlvbihfYkZyb21TTSkge1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogRGVzdHJ1Y3QnKTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcblxyXG4gICAgICAgIC8vIGtpbGwgc291bmQgd2l0aGluIEZsYXNoXHJcbiAgICAgICAgLy8gRGlzYWJsZSB0aGUgb25mYWlsdXJlIGhhbmRsZXJcclxuICAgICAgICBzLl9pTy5vbmZhaWx1cmUgPSBudWxsO1xyXG4gICAgICAgIGZsYXNoLl9kZXN0cm95U291bmQocy5pZCk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICBzdG9wX2h0bWw1X3RpbWVyKCk7XHJcblxyXG4gICAgICAgIGlmIChzLl9hKSB7XHJcbiAgICAgICAgICBzLl9hLnBhdXNlKCk7XHJcbiAgICAgICAgICBodG1sNVVubG9hZChzLl9hKTtcclxuICAgICAgICAgIGlmICghdXNlR2xvYmFsSFRNTDVBdWRpbykge1xyXG4gICAgICAgICAgICByZW1vdmVfaHRtbDVfZXZlbnRzKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBicmVhayBvYnZpb3VzIGNpcmN1bGFyIHJlZmVyZW5jZVxyXG4gICAgICAgICAgcy5fYS5fcyA9IG51bGw7XHJcbiAgICAgICAgICBzLl9hID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIV9iRnJvbVNNKSB7XHJcbiAgICAgICAgLy8gZW5zdXJlIGRlbGV0aW9uIGZyb20gY29udHJvbGxlclxyXG4gICAgICAgIHNtMi5kZXN0cm95U291bmQocy5pZCwgdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmVnaW5zIHBsYXlpbmcgYSBzb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgT3B0aW9uYWw6IFNvdW5kIG9wdGlvbnNcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5wbGF5ID0gZnVuY3Rpb24ob09wdGlvbnMsIF91cGRhdGVQbGF5U3RhdGUpIHtcclxuXHJcbiAgICAgIHZhciBmTiwgYWxsb3dNdWx0aSwgYSwgb25yZWFkeSxcclxuICAgICAgICAgIGF1ZGlvQ2xvbmUsIG9uZW5kZWQsIG9uY2FucGxheSxcclxuICAgICAgICAgIHN0YXJ0T0sgPSB0cnVlLFxyXG4gICAgICAgICAgZXhpdCA9IG51bGw7XHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgZk4gPSBzLmlkICsgJzogcGxheSgpOiAnO1xyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICAvLyBkZWZhdWx0IHRvIHRydWVcclxuICAgICAgX3VwZGF0ZVBsYXlTdGF0ZSA9IChfdXBkYXRlUGxheVN0YXRlID09PSBfdW5kZWZpbmVkID8gdHJ1ZSA6IF91cGRhdGVQbGF5U3RhdGUpO1xyXG5cclxuICAgICAgaWYgKCFvT3B0aW9ucykge1xyXG4gICAgICAgIG9PcHRpb25zID0ge307XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGZpcnN0LCB1c2UgbG9jYWwgVVJMIChpZiBzcGVjaWZpZWQpXHJcbiAgICAgIGlmIChzLnVybCkge1xyXG4gICAgICAgIHMuX2lPLnVybCA9IHMudXJsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBtaXggaW4gYW55IG9wdGlvbnMgZGVmaW5lZCBhdCBjcmVhdGVTb3VuZCgpXHJcbiAgICAgIHMuX2lPID0gbWl4aW4ocy5faU8sIHMub3B0aW9ucyk7XHJcblxyXG4gICAgICAvLyBtaXggaW4gYW55IG9wdGlvbnMgc3BlY2lmaWMgdG8gdGhpcyBtZXRob2RcclxuICAgICAgcy5faU8gPSBtaXhpbihvT3B0aW9ucywgcy5faU8pO1xyXG5cclxuICAgICAgcy5faU8udXJsID0gcGFyc2VVUkwocy5faU8udXJsKTtcclxuXHJcbiAgICAgIHMuaW5zdGFuY2VPcHRpb25zID0gcy5faU87XHJcblxyXG4gICAgICAvLyBSVE1QLW9ubHlcclxuICAgICAgaWYgKCFzLmlzSFRNTDUgJiYgcy5faU8uc2VydmVyVVJMICYmICFzLmNvbm5lY3RlZCkge1xyXG4gICAgICAgIGlmICghcy5nZXRBdXRvUGxheSgpKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsnIE5ldHN0cmVhbSBub3QgY29ubmVjdGVkIHlldCAtIHNldHRpbmcgYXV0b1BsYXknKTtcclxuICAgICAgICAgIHMuc2V0QXV0b1BsYXkodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBsYXkgd2lsbCBiZSBjYWxsZWQgaW4gb25jb25uZWN0KClcclxuICAgICAgICByZXR1cm4gcztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGh0bWw1T0socy5faU8pKSB7XHJcbiAgICAgICAgcy5fc2V0dXBfaHRtbDUocy5faU8pO1xyXG4gICAgICAgIHN0YXJ0X2h0bWw1X3RpbWVyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzLnBsYXlTdGF0ZSA9PT0gMSAmJiAhcy5wYXVzZWQpIHtcclxuICAgICAgICBhbGxvd011bHRpID0gcy5faU8ubXVsdGlTaG90O1xyXG4gICAgICAgIGlmICghYWxsb3dNdWx0aSkge1xyXG4gICAgICAgICAgc20yLl93RChmTiArICdBbHJlYWR5IHBsYXlpbmcgKG9uZS1zaG90KScsIDEpO1xyXG4gICAgICAgICAgaWYgKHMuaXNIVE1MNSkge1xyXG4gICAgICAgICAgICAvLyBnbyBiYWNrIHRvIG9yaWdpbmFsIHBvc2l0aW9uLlxyXG4gICAgICAgICAgICBzLnNldFBvc2l0aW9uKHMuX2lPLnBvc2l0aW9uKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGV4aXQgPSBzO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgJ0FscmVhZHkgcGxheWluZyAobXVsdGktc2hvdCknLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChleGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4aXQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGVkZ2UgY2FzZTogcGxheSgpIHdpdGggZXhwbGljaXQgVVJMIHBhcmFtZXRlclxyXG4gICAgICBpZiAob09wdGlvbnMudXJsICYmIG9PcHRpb25zLnVybCAhPT0gcy51cmwpIHtcclxuXHJcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBjcmVhdGVTb3VuZCgpIGZvbGxvd2VkIGJ5IGxvYWQoKSAvIHBsYXkoKSB3aXRoIHVybDsgYXZvaWQgZG91YmxlLWxvYWQgY2FzZS5cclxuICAgICAgICBpZiAoIXMucmVhZHlTdGF0ZSAmJiAhcy5pc0hUTUw1ICYmIGZWID09PSA4ICYmIHVybE9taXR0ZWQpIHtcclxuXHJcbiAgICAgICAgICB1cmxPbWl0dGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gbG9hZCB1c2luZyBtZXJnZWQgb3B0aW9uc1xyXG4gICAgICAgICAgcy5sb2FkKHMuX2lPKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFzLmxvYWRlZCkge1xyXG5cclxuICAgICAgICBpZiAocy5yZWFkeVN0YXRlID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgc20yLl93RChmTiArICdBdHRlbXB0aW5nIHRvIGxvYWQnKTtcclxuXHJcbiAgICAgICAgICAvLyB0cnkgdG8gZ2V0IHRoaXMgc291bmQgcGxheWluZyBBU0FQXHJcbiAgICAgICAgICBpZiAoIXMuaXNIVE1MNSAmJiAhc20yLmh0bWw1T25seSkge1xyXG5cclxuICAgICAgICAgICAgLy8gZmxhc2g6IGFzc2lnbiBkaXJlY3RseSBiZWNhdXNlIHNldEF1dG9QbGF5KCkgaW5jcmVtZW50cyB0aGUgaW5zdGFuY2VDb3VudFxyXG4gICAgICAgICAgICBzLl9pTy5hdXRvUGxheSA9IHRydWU7XHJcbiAgICAgICAgICAgIHMubG9hZChzLl9pTyk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIGlmIChzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGlPUyBuZWVkcyB0aGlzIHdoZW4gcmVjeWNsaW5nIHNvdW5kcywgbG9hZGluZyBhIG5ldyBVUkwgb24gYW4gZXhpc3Rpbmcgb2JqZWN0LlxyXG4gICAgICAgICAgICBzLmxvYWQocy5faU8pO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBzbTIuX3dEKGZOICsgJ1Vuc3VwcG9ydGVkIHR5cGUuIEV4aXRpbmcuJyk7XHJcbiAgICAgICAgICAgIGV4aXQgPSBzO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBIVE1MNSBoYWNrIC0gcmUtc2V0IGluc3RhbmNlT3B0aW9ucz9cclxuICAgICAgICAgIHMuaW5zdGFuY2VPcHRpb25zID0gcy5faU87XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAocy5yZWFkeVN0YXRlID09PSAyKSB7XHJcblxyXG4gICAgICAgICAgc20yLl93RChmTiArICdDb3VsZCBub3QgbG9hZCAtIGV4aXRpbmcnLCAyKTtcclxuICAgICAgICAgIGV4aXQgPSBzO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHNtMi5fd0QoZk4gKyAnTG9hZGluZyAtIGF0dGVtcHRpbmcgdG8gcGxheS4uLicpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBcInBsYXkoKVwiXHJcbiAgICAgICAgc20yLl93RChmTi5zdWJzdHIoMCwgZk4ubGFzdEluZGV4T2YoJzonKSkpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGV4aXQgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gZXhpdDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUgJiYgZlYgPT09IDkgJiYgcy5wb3NpdGlvbiA+IDAgJiYgcy5wb3NpdGlvbiA9PT0gcy5kdXJhdGlvbikge1xyXG4gICAgICAgIC8vIGZsYXNoIDkgbmVlZHMgYSBwb3NpdGlvbiByZXNldCBpZiBwbGF5KCkgaXMgY2FsbGVkIHdoaWxlIGF0IHRoZSBlbmQgb2YgYSBzb3VuZC5cclxuICAgICAgICBzbTIuX3dEKGZOICsgJ1NvdW5kIGF0IGVuZCwgcmVzZXR0aW5nIHRvIHBvc2l0aW9uOjAnKTtcclxuICAgICAgICBvT3B0aW9ucy5wb3NpdGlvbiA9IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTdHJlYW1zIHdpbGwgcGF1c2Ugd2hlbiB0aGVpciBidWZmZXIgaXMgZnVsbCBpZiB0aGV5IGFyZSBiZWluZyBsb2FkZWQuXHJcbiAgICAgICAqIEluIHRoaXMgY2FzZSBwYXVzZWQgaXMgdHJ1ZSwgYnV0IHRoZSBzb25nIGhhc24ndCBzdGFydGVkIHBsYXlpbmcgeWV0LlxyXG4gICAgICAgKiBJZiB3ZSBqdXN0IGNhbGwgcmVzdW1lKCkgdGhlIG9ucGxheSgpIGNhbGxiYWNrIHdpbGwgbmV2ZXIgYmUgY2FsbGVkLlxyXG4gICAgICAgKiBTbyBvbmx5IGNhbGwgcmVzdW1lKCkgaWYgdGhlIHBvc2l0aW9uIGlzID4gMC5cclxuICAgICAgICogQW5vdGhlciByZWFzb24gaXMgYmVjYXVzZSBvcHRpb25zIGxpa2Ugdm9sdW1lIHdvbid0IGhhdmUgYmVlbiBhcHBsaWVkIHlldC5cclxuICAgICAgICogRm9yIG5vcm1hbCBzb3VuZHMsIGp1c3QgcmVzdW1lLlxyXG4gICAgICAgKi9cclxuXHJcbiAgICAgIGlmIChzLnBhdXNlZCAmJiBzLnBvc2l0aW9uID49IDAgJiYgKCFzLl9pTy5zZXJ2ZXJVUkwgfHwgcy5wb3NpdGlvbiA+IDApKSB7XHJcblxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzM3YjE3ZGY3NWNjNGQ3YTkwYmY2XHJcbiAgICAgICAgc20yLl93RChmTiArICdSZXN1bWluZyBmcm9tIHBhdXNlZCBzdGF0ZScsIDEpO1xyXG4gICAgICAgIHMucmVzdW1lKCk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICBzLl9pTyA9IG1peGluKG9PcHRpb25zLCBzLl9pTyk7XHJcblxyXG4gICAgICAgIC8vIGFwcGx5IGZyb20vdG8gcGFyYW1ldGVycywgaWYgdGhleSBleGlzdCAoYW5kIG5vdCB1c2luZyBSVE1QKVxyXG4gICAgICAgIGlmIChzLl9pTy5mcm9tICE9PSBudWxsICYmIHMuX2lPLnRvICE9PSBudWxsICYmIHMuaW5zdGFuY2VDb3VudCA9PT0gMCAmJiBzLnBsYXlTdGF0ZSA9PT0gMCAmJiAhcy5faU8uc2VydmVyVVJMKSB7XHJcblxyXG4gICAgICAgICAgb25yZWFkeSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBzb3VuZCBcImNhbnBsYXlcIiBvciBvbmxvYWQoKVxyXG4gICAgICAgICAgICAvLyByZS1hcHBseSBmcm9tL3RvIHRvIGluc3RhbmNlIG9wdGlvbnMsIGFuZCBzdGFydCBwbGF5YmFja1xyXG4gICAgICAgICAgICBzLl9pTyA9IG1peGluKG9PcHRpb25zLCBzLl9pTyk7XHJcbiAgICAgICAgICAgIHMucGxheShzLl9pTyk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIC8vIEhUTUw1IG5lZWRzIHRvIGF0IGxlYXN0IGhhdmUgXCJjYW5wbGF5XCIgZmlyZWQgYmVmb3JlIHNlZWtpbmcuXHJcbiAgICAgICAgICBpZiAocy5pc0hUTUw1ICYmICFzLl9odG1sNV9jYW5wbGF5KSB7XHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzIGhhc24ndCBiZWVuIGxvYWRlZCB5ZXQuIGxvYWQgaXQgZmlyc3QsIGFuZCB0aGVuIGRvIHRoaXMgYWdhaW4uXHJcbiAgICAgICAgICAgIHNtMi5fd0QoZk4gKyAnQmVnaW5uaW5nIGxvYWQgZm9yIGZyb20vdG8gY2FzZScpO1xyXG5cclxuICAgICAgICAgICAgcy5sb2FkKHtcclxuICAgICAgICAgICAgICAvLyBub3RlOiBjdXN0b20gSFRNTDUtb25seSBldmVudCBhZGRlZCBmb3IgZnJvbS90byBpbXBsZW1lbnRhdGlvbi5cclxuICAgICAgICAgICAgICBfb25jYW5wbGF5OiBvbnJlYWR5XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZXhpdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoIXMuaXNIVE1MNSAmJiAhcy5sb2FkZWQgJiYgKCFzLnJlYWR5U3RhdGUgfHwgcy5yZWFkeVN0YXRlICE9PSAyKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gdG8gYmUgc2FmZSwgcHJlbG9hZCB0aGUgd2hvbGUgdGhpbmcgaW4gRmxhc2guXHJcblxyXG4gICAgICAgICAgICBzbTIuX3dEKGZOICsgJ1ByZWxvYWRpbmcgZm9yIGZyb20vdG8gY2FzZScpO1xyXG5cclxuICAgICAgICAgICAgcy5sb2FkKHtcclxuICAgICAgICAgICAgICBvbmxvYWQ6IG9ucmVhZHlcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBleGl0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChleGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBleGl0O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIG90aGVyd2lzZSwgd2UncmUgcmVhZHkgdG8gZ28uIHJlLWFwcGx5IGxvY2FsIG9wdGlvbnMsIGFuZCBjb250aW51ZVxyXG5cclxuICAgICAgICAgIHMuX2lPID0gYXBwbHlGcm9tVG8oKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzbTIuX3dEKGZOICsgJ1N0YXJ0aW5nIHRvIHBsYXknKTtcclxuXHJcbiAgICAgICAgLy8gaW5jcmVtZW50IGluc3RhbmNlIGNvdW50ZXIsIHdoZXJlIGVuYWJsZWQgKyBzdXBwb3J0ZWRcclxuICAgICAgICBpZiAoIXMuaW5zdGFuY2VDb3VudCB8fCBzLl9pTy5tdWx0aVNob3RFdmVudHMgfHwgKHMuaXNIVE1MNSAmJiBzLl9pTy5tdWx0aVNob3QgJiYgIXVzZUdsb2JhbEhUTUw1QXVkaW8pIHx8ICghcy5pc0hUTUw1ICYmIGZWID4gOCAmJiAhcy5nZXRBdXRvUGxheSgpKSkge1xyXG4gICAgICAgICAgcy5pbnN0YW5jZUNvdW50Kys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiBmaXJzdCBwbGF5IGFuZCBvbnBvc2l0aW9uIHBhcmFtZXRlcnMgZXhpc3QsIGFwcGx5IHRoZW0gbm93XHJcbiAgICAgICAgaWYgKHMuX2lPLm9ucG9zaXRpb24gJiYgcy5wbGF5U3RhdGUgPT09IDApIHtcclxuICAgICAgICAgIGF0dGFjaE9uUG9zaXRpb24ocyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzLnBsYXlTdGF0ZSA9IDE7XHJcbiAgICAgICAgcy5wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcy5wb3NpdGlvbiA9IChzLl9pTy5wb3NpdGlvbiAhPT0gX3VuZGVmaW5lZCAmJiAhaXNOYU4ocy5faU8ucG9zaXRpb24pID8gcy5faU8ucG9zaXRpb24gOiAwKTtcclxuXHJcbiAgICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICAgIHMuX2lPID0gcG9saWN5Rml4KGxvb3BGaXgocy5faU8pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzLl9pTy5vbnBsYXkgJiYgX3VwZGF0ZVBsYXlTdGF0ZSkge1xyXG4gICAgICAgICAgcy5faU8ub25wbGF5LmFwcGx5KHMpO1xyXG4gICAgICAgICAgb25wbGF5X2NhbGxlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzLnNldFZvbHVtZShzLl9pTy52b2x1bWUsIHRydWUpO1xyXG4gICAgICAgIHMuc2V0UGFuKHMuX2lPLnBhbiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcblxyXG4gICAgICAgICAgc3RhcnRPSyA9IGZsYXNoLl9zdGFydChzLmlkLCBzLl9pTy5sb29wcyB8fCAxLCAoZlYgPT09IDkgPyBzLnBvc2l0aW9uIDogcy5wb3NpdGlvbiAvIG1zZWNTY2FsZSksIHMuX2lPLm11bHRpU2hvdCB8fCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgaWYgKGZWID09PSA5ICYmICFzdGFydE9LKSB7XHJcbiAgICAgICAgICAgIC8vIGVkZ2UgY2FzZTogbm8gc291bmQgaGFyZHdhcmUsIG9yIDMyLWNoYW5uZWwgZmxhc2ggY2VpbGluZyBoaXQuXHJcbiAgICAgICAgICAgIC8vIGFwcGxpZXMgb25seSB0byBGbGFzaCA5LCBub24tTmV0U3RyZWFtL01vdmllU3RhciBzb3VuZHMuXHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9oZWxwLmFkb2JlLmNvbS9lbl9VUy9GbGFzaFBsYXRmb3JtL3JlZmVyZW5jZS9hY3Rpb25zY3JpcHQvMy9mbGFzaC9tZWRpYS9Tb3VuZC5odG1sI3BsYXklMjglMjlcclxuICAgICAgICAgICAgc20yLl93RChmTiArICdObyBzb3VuZCBoYXJkd2FyZSwgb3IgMzItc291bmQgY2VpbGluZyBoaXQnLCAyKTtcclxuICAgICAgICAgICAgaWYgKHMuX2lPLm9ucGxheWVycm9yKSB7XHJcbiAgICAgICAgICAgICAgcy5faU8ub25wbGF5ZXJyb3IuYXBwbHkocyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgaWYgKHMuaW5zdGFuY2VDb3VudCA8IDIpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEhUTUw1IHNpbmdsZS1pbnN0YW5jZSBjYXNlXHJcblxyXG4gICAgICAgICAgICBzdGFydF9odG1sNV90aW1lcigpO1xyXG5cclxuICAgICAgICAgICAgYSA9IHMuX3NldHVwX2h0bWw1KCk7XHJcblxyXG4gICAgICAgICAgICBzLnNldFBvc2l0aW9uKHMuX2lPLnBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGEucGxheSgpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBIVE1MNSBtdWx0aS1zaG90IGNhc2VcclxuXHJcbiAgICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IENsb25pbmcgQXVkaW8oKSBmb3IgaW5zdGFuY2UgIycgKyBzLmluc3RhbmNlQ291bnQgKyAnLi4uJyk7XHJcblxyXG4gICAgICAgICAgICBhdWRpb0Nsb25lID0gbmV3IEF1ZGlvKHMuX2lPLnVybCk7XHJcblxyXG4gICAgICAgICAgICBvbmVuZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgZXZlbnQucmVtb3ZlKGF1ZGlvQ2xvbmUsICdlbmRlZCcsIG9uZW5kZWQpO1xyXG4gICAgICAgICAgICAgIHMuX29uZmluaXNoKHMpO1xyXG4gICAgICAgICAgICAgIC8vIGNsZWFudXBcclxuICAgICAgICAgICAgICBodG1sNVVubG9hZChhdWRpb0Nsb25lKTtcclxuICAgICAgICAgICAgICBhdWRpb0Nsb25lID0gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIG9uY2FucGxheSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGV2ZW50LnJlbW92ZShhdWRpb0Nsb25lLCAnY2FucGxheScsIG9uY2FucGxheSk7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF1ZGlvQ2xvbmUuY3VycmVudFRpbWUgPSBzLl9pTy5wb3NpdGlvbi9tc2VjU2NhbGU7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBsYWluKHMuaWQgKyAnOiBtdWx0aVNob3QgcGxheSgpIGZhaWxlZCB0byBhcHBseSBwb3NpdGlvbiBvZiAnICsgKHMuX2lPLnBvc2l0aW9uL21zZWNTY2FsZSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBhdWRpb0Nsb25lLnBsYXkoKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50LmFkZChhdWRpb0Nsb25lLCAnZW5kZWQnLCBvbmVuZGVkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFwcGx5IHZvbHVtZSB0byBjbG9uZXMsIHRvb1xyXG4gICAgICAgICAgICBpZiAocy5faU8udm9sdW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBhdWRpb0Nsb25lLnZvbHVtZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHMuX2lPLnZvbHVtZS8xMDApKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gcGxheWluZyBtdWx0aXBsZSBtdXRlZCBzb3VuZHM/IGlmIHlvdSBkbyB0aGlzLCB5b3UncmUgd2VpcmQgOykgLSBidXQgbGV0J3MgY292ZXIgaXQuXHJcbiAgICAgICAgICAgIGlmIChzLm11dGVkKSB7XHJcbiAgICAgICAgICAgICAgYXVkaW9DbG9uZS5tdXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzLl9pTy5wb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgIC8vIEhUTUw1IGF1ZGlvIGNhbid0IHNlZWsgYmVmb3JlIG9ucGxheSgpIGV2ZW50IGhhcyBmaXJlZC5cclxuICAgICAgICAgICAgICAvLyB3YWl0IGZvciBjYW5wbGF5LCB0aGVuIHNlZWsgdG8gcG9zaXRpb24gYW5kIHN0YXJ0IHBsYXliYWNrLlxyXG4gICAgICAgICAgICAgIGV2ZW50LmFkZChhdWRpb0Nsb25lLCAnY2FucGxheScsIG9uY2FucGxheSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gYmVnaW4gcGxheWJhY2sgYXQgY3VycmVudFRpbWU6IDBcclxuICAgICAgICAgICAgICBhdWRpb0Nsb25lLnBsYXkoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBqdXN0IGZvciBjb252ZW5pZW5jZVxyXG4gICAgdGhpcy5zdGFydCA9IHRoaXMucGxheTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFN0b3BzIHBsYXlpbmcgYSBzb3VuZCAoYW5kIG9wdGlvbmFsbHksIGFsbCBzb3VuZHMpXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBiQWxsIE9wdGlvbmFsOiBXaGV0aGVyIHRvIHN0b3AgYWxsIHNvdW5kc1xyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnN0b3AgPSBmdW5jdGlvbihiQWxsKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gcy5faU8sXHJcbiAgICAgICAgICBvcmlnaW5hbFBvc2l0aW9uO1xyXG5cclxuICAgICAgaWYgKHMucGxheVN0YXRlID09PSAxKSB7XHJcblxyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IHN0b3AoKScpO1xyXG5cclxuICAgICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuICAgICAgICBzLl9yZXNldE9uUG9zaXRpb24oMCk7XHJcbiAgICAgICAgcy5wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICAgIHMucGxheVN0YXRlID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSBvblBvc2l0aW9uIGxpc3RlbmVycywgaWYgYW55XHJcbiAgICAgICAgZGV0YWNoT25Qb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAvLyBhbmQgXCJ0b1wiIHBvc2l0aW9uLCBpZiBzZXRcclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnRvKSB7XHJcbiAgICAgICAgICBzLmNsZWFyT25Qb3NpdGlvbihpbnN0YW5jZU9wdGlvbnMudG8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgICBmbGFzaC5fc3RvcChzLmlkLCBiQWxsKTtcclxuXHJcbiAgICAgICAgICAvLyBoYWNrIGZvciBuZXRTdHJlYW06IGp1c3QgdW5sb2FkXHJcbiAgICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnNlcnZlclVSTCkge1xyXG4gICAgICAgICAgICBzLnVubG9hZCgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIGlmIChzLl9hKSB7XHJcblxyXG4gICAgICAgICAgICBvcmlnaW5hbFBvc2l0aW9uID0gcy5wb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgIC8vIGFjdCBsaWtlIEZsYXNoLCB0aG91Z2hcclxuICAgICAgICAgICAgcy5zZXRQb3NpdGlvbigwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGhhY2s6IHJlZmxlY3Qgb2xkIHBvc2l0aW9uIGZvciBvbnN0b3AoKSAoYWxzbyBsaWtlIEZsYXNoKVxyXG4gICAgICAgICAgICBzLnBvc2l0aW9uID0gb3JpZ2luYWxQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgIC8vIGh0bWw1IGhhcyBubyBzdG9wKClcclxuICAgICAgICAgICAgLy8gTk9URTogcGF1c2luZyBtZWFucyBpT1MgcmVxdWlyZXMgaW50ZXJhY3Rpb24gdG8gcmVzdW1lLlxyXG4gICAgICAgICAgICBzLl9hLnBhdXNlKCk7XHJcblxyXG4gICAgICAgICAgICBzLnBsYXlTdGF0ZSA9IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBhbmQgdXBkYXRlIFVJXHJcbiAgICAgICAgICAgIHMuX29uVGltZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHN0b3BfaHRtbDVfdGltZXIoKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcy5pbnN0YW5jZUNvdW50ID0gMDtcclxuICAgICAgICBzLl9pTyA9IHt9O1xyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLm9uc3RvcCkge1xyXG4gICAgICAgICAgaW5zdGFuY2VPcHRpb25zLm9uc3RvcC5hcHBseShzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5kb2N1bWVudGVkL2ludGVybmFsOiBTZXRzIGF1dG9QbGF5IGZvciBSVE1QLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b1BsYXkgc3RhdGVcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuc2V0QXV0b1BsYXkgPSBmdW5jdGlvbihhdXRvUGxheSkge1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogQXV0b3BsYXkgdHVybmVkICcgKyAoYXV0b1BsYXkgPyAnb24nIDogJ29mZicpKTtcclxuICAgICAgcy5faU8uYXV0b1BsYXkgPSBhdXRvUGxheTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgZmxhc2guX3NldEF1dG9QbGF5KHMuaWQsIGF1dG9QbGF5KTtcclxuICAgICAgICBpZiAoYXV0b1BsYXkpIHtcclxuICAgICAgICAgIC8vIG9ubHkgaW5jcmVtZW50IHRoZSBpbnN0YW5jZUNvdW50IGlmIHRoZSBzb3VuZCBpc24ndCBsb2FkZWQgKFRPRE86IHZlcmlmeSBSVE1QKVxyXG4gICAgICAgICAgaWYgKCFzLmluc3RhbmNlQ291bnQgJiYgcy5yZWFkeVN0YXRlID09PSAxKSB7XHJcbiAgICAgICAgICAgIHMuaW5zdGFuY2VDb3VudCsrO1xyXG4gICAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBJbmNyZW1lbnRlZCBpbnN0YW5jZSBjb3VudCB0byAnK3MuaW5zdGFuY2VDb3VudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuZG9jdW1lbnRlZC9pbnRlcm5hbDogUmV0dXJucyB0aGUgYXV0b1BsYXkgYm9vbGVhbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUaGUgY3VycmVudCBhdXRvUGxheSB2YWx1ZVxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5nZXRBdXRvUGxheSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgcmV0dXJuIHMuX2lPLmF1dG9QbGF5O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiBhIHNvdW5kLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuTXNlY09mZnNldCBQb3NpdGlvbiAobWlsbGlzZWNvbmRzKVxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnNldFBvc2l0aW9uID0gZnVuY3Rpb24obk1zZWNPZmZzZXQpIHtcclxuXHJcbiAgICAgIGlmIChuTXNlY09mZnNldCA9PT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIG5Nc2VjT2Zmc2V0ID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBvc2l0aW9uLCBwb3NpdGlvbjFLLFxyXG4gICAgICAgICAgLy8gVXNlIHRoZSBkdXJhdGlvbiBmcm9tIHRoZSBpbnN0YW5jZSBvcHRpb25zLCBpZiB3ZSBkb24ndCBoYXZlIGEgdHJhY2sgZHVyYXRpb24geWV0LlxyXG4gICAgICAgICAgLy8gcG9zaXRpb24gPj0gMCBhbmQgPD0gY3VycmVudCBhdmFpbGFibGUgKGxvYWRlZCkgZHVyYXRpb25cclxuICAgICAgICAgIG9mZnNldCA9IChzLmlzSFRNTDUgPyBNYXRoLm1heChuTXNlY09mZnNldCwgMCkgOiBNYXRoLm1pbihzLmR1cmF0aW9uIHx8IHMuX2lPLmR1cmF0aW9uLCBNYXRoLm1heChuTXNlY09mZnNldCwgMCkpKTtcclxuXHJcbiAgICAgIHMucG9zaXRpb24gPSBvZmZzZXQ7XHJcbiAgICAgIHBvc2l0aW9uMUsgPSBzLnBvc2l0aW9uL21zZWNTY2FsZTtcclxuICAgICAgcy5fcmVzZXRPblBvc2l0aW9uKHMucG9zaXRpb24pO1xyXG4gICAgICBzLl9pTy5wb3NpdGlvbiA9IG9mZnNldDtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcblxyXG4gICAgICAgIHBvc2l0aW9uID0gKGZWID09PSA5ID8gcy5wb3NpdGlvbiA6IHBvc2l0aW9uMUspO1xyXG5cclxuICAgICAgICBpZiAocy5yZWFkeVN0YXRlICYmIHMucmVhZHlTdGF0ZSAhPT0gMikge1xyXG4gICAgICAgICAgLy8gaWYgcGF1c2VkIG9yIG5vdCBwbGF5aW5nLCB3aWxsIG5vdCByZXN1bWUgKGJ5IHBsYXlpbmcpXHJcbiAgICAgICAgICBmbGFzaC5fc2V0UG9zaXRpb24ocy5pZCwgcG9zaXRpb24sIChzLnBhdXNlZCB8fCAhcy5wbGF5U3RhdGUpLCBzLl9pTy5tdWx0aVNob3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSBpZiAocy5fYSkge1xyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHBvc2l0aW9uIGluIHRoZSBjYW5wbGF5IGhhbmRsZXIgaWYgdGhlIHNvdW5kIGlzIG5vdCByZWFkeSB5ZXRcclxuICAgICAgICBpZiAocy5faHRtbDVfY2FucGxheSkge1xyXG5cclxuICAgICAgICAgIGlmIChzLl9hLmN1cnJlbnRUaW1lICE9PSBwb3NpdGlvbjFLKSB7XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogRE9NL0pTIGVycm9ycy9leGNlcHRpb25zIHRvIHdhdGNoIG91dCBmb3I6XHJcbiAgICAgICAgICAgICAqIGlmIHNlZWsgaXMgYmV5b25kIChsb2FkZWQ/KSBwb3NpdGlvbiwgXCJET00gZXhjZXB0aW9uIDExXCJcclxuICAgICAgICAgICAgICogXCJJTkRFWF9TSVpFX0VSUlwiOiBET00gZXhjZXB0aW9uIDFcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IHNldFBvc2l0aW9uKCcrcG9zaXRpb24xSysnKScpO1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBzLl9hLmN1cnJlbnRUaW1lID0gcG9zaXRpb24xSztcclxuICAgICAgICAgICAgICBpZiAocy5wbGF5U3RhdGUgPT09IDAgfHwgcy5wYXVzZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGFsbG93IHNlZWsgd2l0aG91dCBhdXRvLXBsYXkvcmVzdW1lXHJcbiAgICAgICAgICAgICAgICBzLl9hLnBhdXNlKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBzZXRQb3NpdGlvbignICsgcG9zaXRpb24xSyArICcpIGZhaWxlZDogJyArIGUubWVzc2FnZSwgMik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAocG9zaXRpb24xSykge1xyXG5cclxuICAgICAgICAgIC8vIHdhcm4gb24gbm9uLXplcm8gc2VlayBhdHRlbXB0c1xyXG4gICAgICAgICAgc20yLl93RChzLmlkICsgJzogc2V0UG9zaXRpb24oJyArIHBvc2l0aW9uMUsgKyAnKTogQ2Fubm90IHNlZWsgeWV0LCBzb3VuZCBub3QgcmVhZHknLCAyKTtcclxuICAgICAgICAgIHJldHVybiBzO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzLnBhdXNlZCkge1xyXG5cclxuICAgICAgICAgIC8vIGlmIHBhdXNlZCwgcmVmcmVzaCBVSSByaWdodCBhd2F5XHJcbiAgICAgICAgICAvLyBmb3JjZSB1cGRhdGVcclxuICAgICAgICAgIHMuX29uVGltZXIodHJ1ZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXVzZXMgc291bmQgcGxheWJhY2suXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oX2JDYWxsRmxhc2gpIHtcclxuXHJcbiAgICAgIGlmIChzLnBhdXNlZCB8fCAocy5wbGF5U3RhdGUgPT09IDAgJiYgcy5yZWFkeVN0YXRlICE9PSAxKSkge1xyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBwYXVzZSgpJyk7XHJcbiAgICAgIHMucGF1c2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgaWYgKF9iQ2FsbEZsYXNoIHx8IF9iQ2FsbEZsYXNoID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBmbGFzaC5fcGF1c2Uocy5pZCwgcy5faU8ubXVsdGlTaG90KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcy5fc2V0dXBfaHRtbDUoKS5wYXVzZSgpO1xyXG4gICAgICAgIHN0b3BfaHRtbDVfdGltZXIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHMuX2lPLm9ucGF1c2UpIHtcclxuICAgICAgICBzLl9pTy5vbnBhdXNlLmFwcGx5KHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzdW1lcyBzb3VuZCBwbGF5YmFjay5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBhdXRvLWxvYWRlZCBzdHJlYW1zIHBhdXNlIG9uIGJ1ZmZlciBmdWxsIHRoZXkgaGF2ZSBhIHBsYXlTdGF0ZSBvZiAwLlxyXG4gICAgICogV2UgbmVlZCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgcGxheVN0YXRlIGlzIHNldCB0byAxIHdoZW4gdGhlc2Ugc3RyZWFtcyBcInJlc3VtZVwiLlxyXG4gICAgICogV2hlbiBhIHBhdXNlZCBzdHJlYW0gaXMgcmVzdW1lZCwgd2UgbmVlZCB0byB0cmlnZ2VyIHRoZSBvbnBsYXkoKSBjYWxsYmFjayBpZiBpdFxyXG4gICAgICogaGFzbid0IGJlZW4gY2FsbGVkIGFscmVhZHkuIEluIHRoaXMgY2FzZSBzaW5jZSB0aGUgc291bmQgaXMgYmVpbmcgcGxheWVkIGZvciB0aGVcclxuICAgICAqIGZpcnN0IHRpbWUsIEkgdGhpbmsgaXQncyBtb3JlIGFwcHJvcHJpYXRlIHRvIGNhbGwgb25wbGF5KCkgcmF0aGVyIHRoYW4gb25yZXN1bWUoKS5cclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gcy5faU87XHJcblxyXG4gICAgICBpZiAoIXMucGF1c2VkKSB7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IHJlc3VtZSgpJyk7XHJcbiAgICAgIHMucGF1c2VkID0gZmFsc2U7XHJcbiAgICAgIHMucGxheVN0YXRlID0gMTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgaWYgKGluc3RhbmNlT3B0aW9ucy5pc01vdmllU3RhciAmJiAhaW5zdGFuY2VPcHRpb25zLnNlcnZlclVSTCkge1xyXG4gICAgICAgICAgLy8gQml6YXJyZSBXZWJraXQgYnVnIChDaHJvbWUgcmVwb3J0ZWQgdmlhIDh0cmFja3MuY29tIGR1ZGVzKTogQUFDIGNvbnRlbnQgcGF1c2VkIGZvciAzMCsgc2Vjb25kcyg/KSB3aWxsIG5vdCByZXN1bWUgd2l0aG91dCBhIHJlcG9zaXRpb24uXHJcbiAgICAgICAgICBzLnNldFBvc2l0aW9uKHMucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBmbGFzaCBtZXRob2QgaXMgdG9nZ2xlLWJhc2VkIChwYXVzZS9yZXN1bWUpXHJcbiAgICAgICAgZmxhc2guX3BhdXNlKHMuaWQsIGluc3RhbmNlT3B0aW9ucy5tdWx0aVNob3QpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHMuX3NldHVwX2h0bWw1KCkucGxheSgpO1xyXG4gICAgICAgIHN0YXJ0X2h0bWw1X3RpbWVyKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghb25wbGF5X2NhbGxlZCAmJiBpbnN0YW5jZU9wdGlvbnMub25wbGF5KSB7XHJcbiAgICAgICAgaW5zdGFuY2VPcHRpb25zLm9ucGxheS5hcHBseShzKTtcclxuICAgICAgICBvbnBsYXlfY2FsbGVkID0gdHJ1ZTtcclxuICAgICAgfSBlbHNlIGlmIChpbnN0YW5jZU9wdGlvbnMub25yZXN1bWUpIHtcclxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMub25yZXN1bWUuYXBwbHkocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHNvdW5kIHBsYXliYWNrLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy50b2dnbGVQYXVzZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogdG9nZ2xlUGF1c2UoKScpO1xyXG5cclxuICAgICAgaWYgKHMucGxheVN0YXRlID09PSAwKSB7XHJcbiAgICAgICAgcy5wbGF5KHtcclxuICAgICAgICAgIHBvc2l0aW9uOiAoZlYgPT09IDkgJiYgIXMuaXNIVE1MNSA/IHMucG9zaXRpb24gOiBzLnBvc2l0aW9uIC8gbXNlY1NjYWxlKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocy5wYXVzZWQpIHtcclxuICAgICAgICBzLnJlc3VtZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHMucGF1c2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHBhbm5pbmcgKEwtUikgZWZmZWN0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuUGFuIFRoZSBwYW4gdmFsdWUgKC0xMDAgdG8gMTAwKVxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnNldFBhbiA9IGZ1bmN0aW9uKG5QYW4sIGJJbnN0YW5jZU9ubHkpIHtcclxuXHJcbiAgICAgIGlmIChuUGFuID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgblBhbiA9IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChiSW5zdGFuY2VPbmx5ID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYkluc3RhbmNlT25seSA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG4gICAgICAgIGZsYXNoLl9zZXRQYW4ocy5pZCwgblBhbik7XHJcbiAgICAgIH0gLy8gZWxzZSB7IG5vIEhUTUw1IHBhbj8gfVxyXG5cclxuICAgICAgcy5faU8ucGFuID0gblBhbjtcclxuXHJcbiAgICAgIGlmICghYkluc3RhbmNlT25seSkge1xyXG4gICAgICAgIHMucGFuID0gblBhbjtcclxuICAgICAgICBzLm9wdGlvbnMucGFuID0gblBhbjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZvbHVtZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gblZvbCBUaGUgdm9sdW1lIHZhbHVlICgwIHRvIDEwMClcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5zZXRWb2x1bWUgPSBmdW5jdGlvbihuVm9sLCBfYkluc3RhbmNlT25seSkge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIE5vdGU6IFNldHRpbmcgdm9sdW1lIGhhcyBubyBlZmZlY3Qgb24gaU9TIFwic3BlY2lhbCBzbm93Zmxha2VcIiBkZXZpY2VzLlxyXG4gICAgICAgKiBIYXJkd2FyZSB2b2x1bWUgY29udHJvbCBvdmVycmlkZXMgc29mdHdhcmUsIGFuZCB2b2x1bWVcclxuICAgICAgICogd2lsbCBhbHdheXMgcmV0dXJuIDEgcGVyIEFwcGxlIGRvY3MuIChpT1MgNCArIDUuKVxyXG4gICAgICAgKiBodHRwOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9saWJyYXJ5L3NhZmFyaS9kb2N1bWVudGF0aW9uL0F1ZGlvVmlkZW8vQ29uY2VwdHVhbC9IVE1MLWNhbnZhcy1ndWlkZS9BZGRpbmdTb3VuZHRvQ2FudmFzQW5pbWF0aW9ucy9BZGRpbmdTb3VuZHRvQ2FudmFzQW5pbWF0aW9ucy5odG1sXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgaWYgKG5Wb2wgPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICBuVm9sID0gMTAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoX2JJbnN0YW5jZU9ubHkgPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICBfYkluc3RhbmNlT25seSA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG4gICAgICAgIGZsYXNoLl9zZXRWb2x1bWUocy5pZCwgKHNtMi5tdXRlZCAmJiAhcy5tdXRlZCkgfHwgcy5tdXRlZD8wOm5Wb2wpO1xyXG4gICAgICB9IGVsc2UgaWYgKHMuX2EpIHtcclxuICAgICAgICBpZiAoc20yLm11dGVkICYmICFzLm11dGVkKSB7XHJcbiAgICAgICAgICBzLm11dGVkID0gdHJ1ZTtcclxuICAgICAgICAgIHMuX2EubXV0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB2YWxpZCByYW5nZTogMC0xXHJcbiAgICAgICAgcy5fYS52b2x1bWUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBuVm9sLzEwMCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzLl9pTy52b2x1bWUgPSBuVm9sO1xyXG5cclxuICAgICAgaWYgKCFfYkluc3RhbmNlT25seSkge1xyXG4gICAgICAgIHMudm9sdW1lID0gblZvbDtcclxuICAgICAgICBzLm9wdGlvbnMudm9sdW1lID0gblZvbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE11dGVzIHRoZSBzb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMubXV0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgcy5tdXRlZCA9IHRydWU7XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG4gICAgICAgIGZsYXNoLl9zZXRWb2x1bWUocy5pZCwgMCk7XHJcbiAgICAgIH0gZWxzZSBpZiAocy5fYSkge1xyXG4gICAgICAgIHMuX2EubXV0ZWQgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5tdXRlcyB0aGUgc291bmQuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnVubXV0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgcy5tdXRlZCA9IGZhbHNlO1xyXG4gICAgICB2YXIgaGFzSU8gPSAocy5faU8udm9sdW1lICE9PSBfdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgZmxhc2guX3NldFZvbHVtZShzLmlkLCBoYXNJTz9zLl9pTy52b2x1bWU6cy5vcHRpb25zLnZvbHVtZSk7XHJcbiAgICAgIH0gZWxzZSBpZiAocy5fYSkge1xyXG4gICAgICAgIHMuX2EubXV0ZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgdGhlIG11dGVkIHN0YXRlIG9mIGEgc291bmQuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnRvZ2dsZU11dGUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHJldHVybiAocy5tdXRlZD9zLnVubXV0ZSgpOnMubXV0ZSgpKTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgZmlyZWQgd2hlbiBhIHNvdW5kIHJlYWNoZXMgYSBnaXZlbiBwb3NpdGlvbiBkdXJpbmcgcGxheWJhY2suXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5Qb3NpdGlvbiBUaGUgcG9zaXRpb24gdG8gd2F0Y2ggZm9yXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvTWV0aG9kIFRoZSByZWxldmFudCBjYWxsYmFjayB0byBmaXJlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb1Njb3BlIE9wdGlvbmFsOiBUaGUgc2NvcGUgdG8gYXBwbHkgdGhlIGNhbGxiYWNrIHRvXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMub25Qb3NpdGlvbiA9IGZ1bmN0aW9uKG5Qb3NpdGlvbiwgb01ldGhvZCwgb1Njb3BlKSB7XHJcblxyXG4gICAgICAvLyBUT0RPOiBiYXNpYyBkdXBlIGNoZWNraW5nP1xyXG5cclxuICAgICAgb25Qb3NpdGlvbkl0ZW1zLnB1c2goe1xyXG4gICAgICAgIHBvc2l0aW9uOiBwYXJzZUludChuUG9zaXRpb24sIDEwKSxcclxuICAgICAgICBtZXRob2Q6IG9NZXRob2QsXHJcbiAgICAgICAgc2NvcGU6IChvU2NvcGUgIT09IF91bmRlZmluZWQgPyBvU2NvcGUgOiBzKSxcclxuICAgICAgICBmaXJlZDogZmFsc2VcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGxlZ2FjeS9iYWNrd2FyZHMtY29tcGFiaWxpdHk6IGxvd2VyLWNhc2UgbWV0aG9kIG5hbWVcclxuICAgIHRoaXMub25wb3NpdGlvbiA9IHRoaXMub25Qb3NpdGlvbjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgcmVnaXN0ZXJlZCBjYWxsYmFjayhzKSBmcm9tIGEgc291bmQsIGJ5IHBvc2l0aW9uIGFuZC9vciBjYWxsYmFjay5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gblBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byBjbGVhciBjYWxsYmFjayhzKSBmb3JcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9NZXRob2QgT3B0aW9uYWw6IElkZW50aWZ5IG9uZSBjYWxsYmFjayB0byBiZSByZW1vdmVkIHdoZW4gbXVsdGlwbGUgbGlzdGVuZXJzIGV4aXN0IGZvciBvbmUgcG9zaXRpb25cclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5jbGVhck9uUG9zaXRpb24gPSBmdW5jdGlvbihuUG9zaXRpb24sIG9NZXRob2QpIHtcclxuXHJcbiAgICAgIHZhciBpO1xyXG5cclxuICAgICAgblBvc2l0aW9uID0gcGFyc2VJbnQoblBvc2l0aW9uLCAxMCk7XHJcblxyXG4gICAgICBpZiAoaXNOYU4oblBvc2l0aW9uKSkge1xyXG4gICAgICAgIC8vIHNhZmV0eSBjaGVja1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChpPTA7IGkgPCBvblBvc2l0aW9uSXRlbXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgaWYgKG5Qb3NpdGlvbiA9PT0gb25Qb3NpdGlvbkl0ZW1zW2ldLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAvLyByZW1vdmUgdGhpcyBpdGVtIGlmIG5vIG1ldGhvZCB3YXMgc3BlY2lmaWVkLCBvciwgaWYgdGhlIG1ldGhvZCBtYXRjaGVzXHJcbiAgICAgICAgICBpZiAoIW9NZXRob2QgfHwgKG9NZXRob2QgPT09IG9uUG9zaXRpb25JdGVtc1tpXS5tZXRob2QpKSB7XHJcbiAgICAgICAgICAgIGlmIChvblBvc2l0aW9uSXRlbXNbaV0uZmlyZWQpIHtcclxuICAgICAgICAgICAgICAvLyBkZWNyZW1lbnQgXCJmaXJlZFwiIGNvdW50ZXIsIHRvb1xyXG4gICAgICAgICAgICAgIG9uUG9zaXRpb25GaXJlZC0tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9uUG9zaXRpb25JdGVtcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fcHJvY2Vzc09uUG9zaXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpLCBpdGVtLCBqID0gb25Qb3NpdGlvbkl0ZW1zLmxlbmd0aDtcclxuXHRcdFxyXG4gICAgICBpZiAoIWogfHwgIXMucGxheVN0YXRlIHx8IG9uUG9zaXRpb25GaXJlZCA+PSBqKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGk9ai0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGl0ZW0gPSBvblBvc2l0aW9uSXRlbXNbaV07XHJcbiAgICAgICAgaWYgKCFpdGVtLmZpcmVkICYmIHMucG9zaXRpb24gPj0gaXRlbS5wb3NpdGlvbikge1xyXG4gICAgICAgICAgaXRlbS5maXJlZCA9IHRydWU7XHJcbiAgICAgICAgICBvblBvc2l0aW9uRmlyZWQrKztcclxuICAgICAgICAgIGl0ZW0ubWV0aG9kLmFwcGx5KGl0ZW0uc2NvcGUsIFtpdGVtLnBvc2l0aW9uXSk7XHJcblx0XHQgIGogPSBvblBvc2l0aW9uSXRlbXMubGVuZ3RoOyAvLyAgcmVzZXQgaiAtLSBvblBvc2l0aW9uSXRlbXMubGVuZ3RoIGNhbiBiZSBjaGFuZ2VkIGluIHRoZSBpdGVtIGNhbGxiYWNrIGFib3ZlLi4uIG9jY2FzaW9uYWxseSBicmVha2luZyB0aGUgbG9vcC5cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHRcclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9yZXNldE9uUG9zaXRpb24gPSBmdW5jdGlvbihuUG9zaXRpb24pIHtcclxuXHJcbiAgICAgIC8vIHJlc2V0IFwiZmlyZWRcIiBmb3IgaXRlbXMgaW50ZXJlc3RlZCBpbiB0aGlzIHBvc2l0aW9uXHJcbiAgICAgIHZhciBpLCBpdGVtLCBqID0gb25Qb3NpdGlvbkl0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgIGlmICghaikge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChpPWotMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBpdGVtID0gb25Qb3NpdGlvbkl0ZW1zW2ldO1xyXG4gICAgICAgIGlmIChpdGVtLmZpcmVkICYmIG5Qb3NpdGlvbiA8PSBpdGVtLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgICBpdGVtLmZpcmVkID0gZmFsc2U7XHJcbiAgICAgICAgICBvblBvc2l0aW9uRmlyZWQtLTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTTVNvdW5kKCkgcHJpdmF0ZSBpbnRlcm5hbHNcclxuICAgICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgKi9cclxuXHJcbiAgICBhcHBseUZyb21UbyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGluc3RhbmNlT3B0aW9ucyA9IHMuX2lPLFxyXG4gICAgICAgICAgZiA9IGluc3RhbmNlT3B0aW9ucy5mcm9tLFxyXG4gICAgICAgICAgdCA9IGluc3RhbmNlT3B0aW9ucy50byxcclxuICAgICAgICAgIHN0YXJ0LCBlbmQ7XHJcblxyXG4gICAgICBlbmQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgLy8gZW5kIGhhcyBiZWVuIHJlYWNoZWQuXHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogXCJUb1wiIHRpbWUgb2YgJyArIHQgKyAnIHJlYWNoZWQuJyk7XHJcblxyXG4gICAgICAgIC8vIGRldGFjaCBsaXN0ZW5lclxyXG4gICAgICAgIHMuY2xlYXJPblBvc2l0aW9uKHQsIGVuZCk7XHJcblxyXG4gICAgICAgIC8vIHN0b3Agc2hvdWxkIGNsZWFyIHRoaXMsIHRvb1xyXG4gICAgICAgIHMuc3RvcCgpO1xyXG5cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHN0YXJ0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IFBsYXlpbmcgXCJmcm9tXCIgJyArIGYpO1xyXG5cclxuICAgICAgICAvLyBhZGQgbGlzdGVuZXIgZm9yIGVuZFxyXG4gICAgICAgIGlmICh0ICE9PSBudWxsICYmICFpc05hTih0KSkge1xyXG4gICAgICAgICAgcy5vblBvc2l0aW9uKHQsIGVuZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChmICE9PSBudWxsICYmICFpc05hTihmKSkge1xyXG5cclxuICAgICAgICAvLyBhcHBseSB0byBpbnN0YW5jZSBvcHRpb25zLCBndWFyYW50ZWVpbmcgY29ycmVjdCBzdGFydCBwb3NpdGlvbi5cclxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMucG9zaXRpb24gPSBmO1xyXG5cclxuICAgICAgICAvLyBtdWx0aVNob3QgdGltaW5nIGNhbid0IGJlIHRyYWNrZWQsIHNvIHByZXZlbnQgdGhhdC5cclxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMubXVsdGlTaG90ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHN0YXJ0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXR1cm4gdXBkYXRlZCBpbnN0YW5jZU9wdGlvbnMgaW5jbHVkaW5nIHN0YXJ0aW5nIHBvc2l0aW9uXHJcbiAgICAgIHJldHVybiBpbnN0YW5jZU9wdGlvbnM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBhdHRhY2hPblBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgaXRlbSxcclxuICAgICAgICAgIG9wID0gcy5faU8ub25wb3NpdGlvbjtcclxuXHJcbiAgICAgIC8vIGF0dGFjaCBvbnBvc2l0aW9uIHRoaW5ncywgaWYgYW55LCBub3cuXHJcblxyXG4gICAgICBpZiAob3ApIHtcclxuXHJcbiAgICAgICAgZm9yIChpdGVtIGluIG9wKSB7XHJcbiAgICAgICAgICBpZiAob3AuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcclxuICAgICAgICAgICAgcy5vblBvc2l0aW9uKHBhcnNlSW50KGl0ZW0sIDEwKSwgb3BbaXRlbV0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGRldGFjaE9uUG9zaXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpdGVtLFxyXG4gICAgICAgICAgb3AgPSBzLl9pTy5vbnBvc2l0aW9uO1xyXG5cclxuICAgICAgLy8gZGV0YWNoIGFueSBvbnBvc2l0aW9uKCktc3R5bGUgbGlzdGVuZXJzLlxyXG5cclxuICAgICAgaWYgKG9wKSB7XHJcblxyXG4gICAgICAgIGZvciAoaXRlbSBpbiBvcCkge1xyXG4gICAgICAgICAgaWYgKG9wLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XHJcbiAgICAgICAgICAgIHMuY2xlYXJPblBvc2l0aW9uKHBhcnNlSW50KGl0ZW0sIDEwKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgc3RhcnRfaHRtbDVfdGltZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmIChzLmlzSFRNTDUpIHtcclxuICAgICAgICBzdGFydFRpbWVyKHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBzdG9wX2h0bWw1X3RpbWVyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAocy5pc0hUTUw1KSB7XHJcbiAgICAgICAgc3RvcFRpbWVyKHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXNldFByb3BlcnRpZXMgPSBmdW5jdGlvbihyZXRhaW5Qb3NpdGlvbikge1xyXG5cclxuICAgICAgaWYgKCFyZXRhaW5Qb3NpdGlvbikge1xyXG4gICAgICAgIG9uUG9zaXRpb25JdGVtcyA9IFtdO1xyXG4gICAgICAgIG9uUG9zaXRpb25GaXJlZCA9IDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG9ucGxheV9jYWxsZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgIHMuX2hhc1RpbWVyID0gbnVsbDtcclxuICAgICAgcy5fYSA9IG51bGw7XHJcbiAgICAgIHMuX2h0bWw1X2NhbnBsYXkgPSBmYWxzZTtcclxuICAgICAgcy5ieXRlc0xvYWRlZCA9IG51bGw7XHJcbiAgICAgIHMuYnl0ZXNUb3RhbCA9IG51bGw7XHJcbiAgICAgIHMuZHVyYXRpb24gPSAocy5faU8gJiYgcy5faU8uZHVyYXRpb24gPyBzLl9pTy5kdXJhdGlvbiA6IG51bGwpO1xyXG4gICAgICBzLmR1cmF0aW9uRXN0aW1hdGUgPSBudWxsO1xyXG4gICAgICBzLmJ1ZmZlcmVkID0gW107XHJcblxyXG4gICAgICAvLyBsZWdhY3k6IDFEIGFycmF5XHJcbiAgICAgIHMuZXFEYXRhID0gW107XHJcblxyXG4gICAgICBzLmVxRGF0YS5sZWZ0ID0gW107XHJcbiAgICAgIHMuZXFEYXRhLnJpZ2h0ID0gW107XHJcblxyXG4gICAgICBzLmZhaWx1cmVzID0gMDtcclxuICAgICAgcy5pc0J1ZmZlcmluZyA9IGZhbHNlO1xyXG4gICAgICBzLmluc3RhbmNlT3B0aW9ucyA9IHt9O1xyXG4gICAgICBzLmluc3RhbmNlQ291bnQgPSAwO1xyXG4gICAgICBzLmxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICBzLm1ldGFkYXRhID0ge307XHJcblxyXG4gICAgICAvLyAwID0gdW5pbml0aWFsaXNlZCwgMSA9IGxvYWRpbmcsIDIgPSBmYWlsZWQvZXJyb3IsIDMgPSBsb2FkZWQvc3VjY2Vzc1xyXG4gICAgICBzLnJlYWR5U3RhdGUgPSAwO1xyXG5cclxuICAgICAgcy5tdXRlZCA9IGZhbHNlO1xyXG4gICAgICBzLnBhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgcy5wZWFrRGF0YSA9IHtcclxuICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgIHJpZ2h0OiAwXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBzLndhdmVmb3JtRGF0YSA9IHtcclxuICAgICAgICBsZWZ0OiBbXSxcclxuICAgICAgICByaWdodDogW11cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHMucGxheVN0YXRlID0gMDtcclxuICAgICAgcy5wb3NpdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICBzLmlkMyA9IHt9O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgcmVzZXRQcm9wZXJ0aWVzKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQc2V1ZG8tcHJpdmF0ZSBTTVNvdW5kIGludGVybmFsc1xyXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuX29uVGltZXIgPSBmdW5jdGlvbihiRm9yY2UpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBIVE1MNS1vbmx5IF93aGlsZXBsYXlpbmcoKSBldGMuXHJcbiAgICAgICAqIGNhbGxlZCBmcm9tIGJvdGggSFRNTDUgbmF0aXZlIGV2ZW50cywgYW5kIHBvbGxpbmcvaW50ZXJ2YWwtYmFzZWQgdGltZXJzXHJcbiAgICAgICAqIG1pbWljcyBmbGFzaCBhbmQgZmlyZXMgb25seSB3aGVuIHRpbWUvZHVyYXRpb24gY2hhbmdlLCBzbyBhcyB0byBiZSBwb2xsaW5nLWZyaWVuZGx5XHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgdmFyIGR1cmF0aW9uLCBpc05ldyA9IGZhbHNlLCB0aW1lLCB4ID0ge307XHJcblxyXG4gICAgICBpZiAocy5faGFzVGltZXIgfHwgYkZvcmNlKSB7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IE1heSBub3QgbmVlZCB0byB0cmFjayByZWFkeVN0YXRlICgxID0gbG9hZGluZylcclxuXHJcbiAgICAgICAgaWYgKHMuX2EgJiYgKGJGb3JjZSB8fCAoKHMucGxheVN0YXRlID4gMCB8fCBzLnJlYWR5U3RhdGUgPT09IDEpICYmICFzLnBhdXNlZCkpKSB7XHJcblxyXG4gICAgICAgICAgZHVyYXRpb24gPSBzLl9nZXRfaHRtbDVfZHVyYXRpb24oKTtcclxuXHJcbiAgICAgICAgICBpZiAoZHVyYXRpb24gIT09IGxhc3RIVE1MNVN0YXRlLmR1cmF0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICBsYXN0SFRNTDVTdGF0ZS5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gICAgICAgICAgICBzLmR1cmF0aW9uID0gZHVyYXRpb247XHJcbiAgICAgICAgICAgIGlzTmV3ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogaW52ZXN0aWdhdGUgd2h5IHRoaXMgZ29lcyB3YWNrIGlmIG5vdCBzZXQvcmUtc2V0IGVhY2ggdGltZS5cclxuICAgICAgICAgIHMuZHVyYXRpb25Fc3RpbWF0ZSA9IHMuZHVyYXRpb247XHJcblxyXG4gICAgICAgICAgdGltZSA9IChzLl9hLmN1cnJlbnRUaW1lICogbXNlY1NjYWxlIHx8IDApO1xyXG5cclxuICAgICAgICAgIGlmICh0aW1lICE9PSBsYXN0SFRNTDVTdGF0ZS50aW1lKSB7XHJcblxyXG4gICAgICAgICAgICBsYXN0SFRNTDVTdGF0ZS50aW1lID0gdGltZTtcclxuICAgICAgICAgICAgaXNOZXcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoaXNOZXcgfHwgYkZvcmNlKSB7XHJcblxyXG4gICAgICAgICAgICBzLl93aGlsZXBsYXlpbmcodGltZSx4LHgseCx4KTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0vKiBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBzbTIuX3dEKCdfb25UaW1lcjogV2FybiBmb3IgXCInK3MuaWQrJ1wiOiAnKyghcy5fYT8nQ291bGQgbm90IGZpbmQgZWxlbWVudC4gJzonJykrKHMucGxheVN0YXRlID09PSAwPydwbGF5U3RhdGUgYmFkLCAwPyc6J3BsYXlTdGF0ZSA9ICcrcy5wbGF5U3RhdGUrJywgT0snKSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgcmV0dXJuIGlzTmV3O1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fZ2V0X2h0bWw1X2R1cmF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gcy5faU8sXHJcbiAgICAgICAgICAvLyBpZiBhdWRpbyBvYmplY3QgZXhpc3RzLCB1c2UgaXRzIGR1cmF0aW9uIC0gZWxzZSwgaW5zdGFuY2Ugb3B0aW9uIGR1cmF0aW9uIChpZiBwcm92aWRlZCAtIGl0J3MgYSBoYWNrLCByZWFsbHksIGFuZCBzaG91bGQgYmUgcmV0aXJlZCkgT1IgbnVsbFxyXG4gICAgICAgICAgZCA9IChzLl9hICYmIHMuX2EuZHVyYXRpb24gPyBzLl9hLmR1cmF0aW9uKm1zZWNTY2FsZSA6IChpbnN0YW5jZU9wdGlvbnMgJiYgaW5zdGFuY2VPcHRpb25zLmR1cmF0aW9uID8gaW5zdGFuY2VPcHRpb25zLmR1cmF0aW9uIDogbnVsbCkpLFxyXG4gICAgICAgICAgcmVzdWx0ID0gKGQgJiYgIWlzTmFOKGQpICYmIGQgIT09IEluZmluaXR5ID8gZCA6IG51bGwpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX2FwcGx5X2xvb3AgPSBmdW5jdGlvbihhLCBuTG9vcHMpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBib29sZWFuIGluc3RlYWQgb2YgXCJsb29wXCIsIGZvciB3ZWJraXQ/IC0gc3BlYyBzYXlzIHN0cmluZy4gaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbC1tYXJrdXAvYXVkaW8uaHRtbCNhdWRpby5hdHRycy5sb29wXHJcbiAgICAgICAqIG5vdGUgdGhhdCBsb29wIGlzIGVpdGhlciBvZmYgb3IgaW5maW5pdGUgdW5kZXIgSFRNTDUsIHVubGlrZSBGbGFzaCB3aGljaCBhbGxvd3MgYXJiaXRyYXJ5IGxvb3AgY291bnRzIHRvIGJlIHNwZWNpZmllZC5cclxuICAgICAgICovXHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgaWYgKCFhLmxvb3AgJiYgbkxvb3BzID4gMSkge1xyXG4gICAgICAgIHNtMi5fd0QoJ05vdGU6IE5hdGl2ZSBIVE1MNSBsb29waW5nIGlzIGluZmluaXRlLicsIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIGEubG9vcCA9IChuTG9vcHMgPiAxID8gJ2xvb3AnIDogJycpO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fc2V0dXBfaHRtbDUgPSBmdW5jdGlvbihvT3B0aW9ucykge1xyXG5cclxuICAgICAgdmFyIGluc3RhbmNlT3B0aW9ucyA9IG1peGluKHMuX2lPLCBvT3B0aW9ucyksXHJcbiAgICAgICAgICBhID0gdXNlR2xvYmFsSFRNTDVBdWRpbyA/IGdsb2JhbEhUTUw1QXVkaW8gOiBzLl9hLFxyXG4gICAgICAgICAgZFVSTCA9IGRlY29kZVVSSShpbnN0YW5jZU9wdGlvbnMudXJsKSxcclxuICAgICAgICAgIHNhbWVVUkw7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogXCJGaXJzdCB0aGluZ3MgZmlyc3QsIEksIFBvcHBhLi4uXCIgKHJlc2V0IHRoZSBwcmV2aW91cyBzdGF0ZSBvZiB0aGUgb2xkIHNvdW5kLCBpZiBwbGF5aW5nKVxyXG4gICAgICAgKiBGaXhlcyBjYXNlIHdpdGggZGV2aWNlcyB0aGF0IGNhbiBvbmx5IHBsYXkgb25lIHNvdW5kIGF0IGEgdGltZVxyXG4gICAgICAgKiBPdGhlcndpc2UsIG90aGVyIHNvdW5kcyBpbiBtaWQtcGxheSB3aWxsIGJlIHRlcm1pbmF0ZWQgd2l0aG91dCB3YXJuaW5nIGFuZCBpbiBhIHN0dWNrIHN0YXRlXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgaWYgKHVzZUdsb2JhbEhUTUw1QXVkaW8pIHtcclxuXHJcbiAgICAgICAgaWYgKGRVUkwgPT09IGRlY29kZVVSSShsYXN0R2xvYmFsSFRNTDVVUkwpKSB7XHJcbiAgICAgICAgICAvLyBnbG9iYWwgSFRNTDUgYXVkaW86IHJlLXVzZSBvZiBVUkxcclxuICAgICAgICAgIHNhbWVVUkwgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoZFVSTCA9PT0gZGVjb2RlVVJJKGxhc3RVUkwpKSB7XHJcblxyXG4gICAgICAgIC8vIG9wdGlvbnMgVVJMIGlzIHRoZSBzYW1lIGFzIHRoZSBcImxhc3RcIiBVUkwsIGFuZCB3ZSB1c2VkIChsb2FkZWQpIGl0XHJcbiAgICAgICAgc2FtZVVSTCA9IHRydWU7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYSkge1xyXG5cclxuICAgICAgICBpZiAoYS5fcykge1xyXG5cclxuICAgICAgICAgIGlmICh1c2VHbG9iYWxIVE1MNUF1ZGlvKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYS5fcyAmJiBhLl9zLnBsYXlTdGF0ZSAmJiAhc2FtZVVSTCkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBnbG9iYWwgSFRNTDUgYXVkaW8gY2FzZSwgYW5kIGxvYWRpbmcgYSBuZXcgVVJMLiBzdG9wIHRoZSBjdXJyZW50bHktcGxheWluZyBvbmUuXHJcbiAgICAgICAgICAgICAgYS5fcy5zdG9wKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfSBlbHNlIGlmICghdXNlR2xvYmFsSFRNTDVBdWRpbyAmJiBkVVJMID09PSBkZWNvZGVVUkkobGFzdFVSTCkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIG5vbi1nbG9iYWwgSFRNTDUgcmV1c2UgY2FzZTogc2FtZSB1cmwsIGlnbm9yZSByZXF1ZXN0XHJcbiAgICAgICAgICAgIHMuX2FwcGx5X2xvb3AoYSwgaW5zdGFuY2VPcHRpb25zLmxvb3BzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXNhbWVVUkwpIHtcclxuXHJcbiAgICAgICAgICAvLyBkb24ndCByZXRhaW4gb25Qb3NpdGlvbigpIHN0dWZmIHdpdGggbmV3IFVSTHMuXHJcblxyXG4gICAgICAgICAgaWYgKGxhc3RVUkwpIHtcclxuICAgICAgICAgICAgcmVzZXRQcm9wZXJ0aWVzKGZhbHNlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBhc3NpZ24gbmV3IEhUTUw1IFVSTFxyXG5cclxuICAgICAgICAgIGEuc3JjID0gaW5zdGFuY2VPcHRpb25zLnVybDtcclxuXHJcbiAgICAgICAgICBzLnVybCA9IGluc3RhbmNlT3B0aW9ucy51cmw7XHJcblxyXG4gICAgICAgICAgbGFzdFVSTCA9IGluc3RhbmNlT3B0aW9ucy51cmw7XHJcblxyXG4gICAgICAgICAgbGFzdEdsb2JhbEhUTUw1VVJMID0gaW5zdGFuY2VPcHRpb25zLnVybDtcclxuXHJcbiAgICAgICAgICBhLl9jYWxsZWRfbG9hZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLmF1dG9Mb2FkIHx8IGluc3RhbmNlT3B0aW9ucy5hdXRvUGxheSkge1xyXG5cclxuICAgICAgICAgIHMuX2EgPSBuZXcgQXVkaW8oaW5zdGFuY2VPcHRpb25zLnVybCk7XHJcbiAgICAgICAgICBzLl9hLmxvYWQoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBudWxsIGZvciBzdHVwaWQgT3BlcmEgOS42NCBjYXNlXHJcbiAgICAgICAgICBzLl9hID0gKGlzT3BlcmEgJiYgb3BlcmEudmVyc2lvbigpIDwgMTAgPyBuZXcgQXVkaW8obnVsbCkgOiBuZXcgQXVkaW8oKSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYXNzaWduIGxvY2FsIHJlZmVyZW5jZVxyXG4gICAgICAgIGEgPSBzLl9hO1xyXG5cclxuICAgICAgICBhLl9jYWxsZWRfbG9hZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodXNlR2xvYmFsSFRNTDVBdWRpbykge1xyXG5cclxuICAgICAgICAgIGdsb2JhbEhUTUw1QXVkaW8gPSBhO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBzLmlzSFRNTDUgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gc3RvcmUgYSByZWYgb24gdGhlIHRyYWNrXHJcbiAgICAgIHMuX2EgPSBhO1xyXG5cclxuICAgICAgLy8gc3RvcmUgYSByZWYgb24gdGhlIGF1ZGlvXHJcbiAgICAgIGEuX3MgPSBzO1xyXG5cclxuICAgICAgYWRkX2h0bWw1X2V2ZW50cygpO1xyXG5cclxuICAgICAgcy5fYXBwbHlfbG9vcChhLCBpbnN0YW5jZU9wdGlvbnMubG9vcHMpO1xyXG5cclxuICAgICAgaWYgKGluc3RhbmNlT3B0aW9ucy5hdXRvTG9hZCB8fCBpbnN0YW5jZU9wdGlvbnMuYXV0b1BsYXkpIHtcclxuXHJcbiAgICAgICAgcy5sb2FkKCk7XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBlYXJseSBIVE1MNSBpbXBsZW1lbnRhdGlvbiAobm9uLXN0YW5kYXJkKVxyXG4gICAgICAgIGEuYXV0b2J1ZmZlciA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBzdGFuZGFyZCAoJ25vbmUnIGlzIGFsc28gYW4gb3B0aW9uLilcclxuICAgICAgICBhLnByZWxvYWQgPSAnYXV0byc7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGFkZF9odG1sNV9ldmVudHMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmIChzLl9hLl9hZGRlZF9ldmVudHMpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBmO1xyXG5cclxuICAgICAgZnVuY3Rpb24gYWRkKG9FdnQsIG9GbiwgYkNhcHR1cmUpIHtcclxuICAgICAgICByZXR1cm4gcy5fYSA/IHMuX2EuYWRkRXZlbnRMaXN0ZW5lcihvRXZ0LCBvRm4sIGJDYXB0dXJlfHxmYWxzZSkgOiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzLl9hLl9hZGRlZF9ldmVudHMgPSB0cnVlO1xyXG5cclxuICAgICAgZm9yIChmIGluIGh0bWw1X2V2ZW50cykge1xyXG4gICAgICAgIGlmIChodG1sNV9ldmVudHMuaGFzT3duUHJvcGVydHkoZikpIHtcclxuICAgICAgICAgIGFkZChmLCBodG1sNV9ldmVudHNbZl0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZW1vdmVfaHRtbDVfZXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzXHJcblxyXG4gICAgICB2YXIgZjtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHJlbW92ZShvRXZ0LCBvRm4sIGJDYXB0dXJlKSB7XHJcbiAgICAgICAgcmV0dXJuIChzLl9hID8gcy5fYS5yZW1vdmVFdmVudExpc3RlbmVyKG9FdnQsIG9GbiwgYkNhcHR1cmV8fGZhbHNlKSA6IG51bGwpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBSZW1vdmluZyBldmVudCBsaXN0ZW5lcnMnKTtcclxuICAgICAgcy5fYS5fYWRkZWRfZXZlbnRzID0gZmFsc2U7XHJcblxyXG4gICAgICBmb3IgKGYgaW4gaHRtbDVfZXZlbnRzKSB7XHJcbiAgICAgICAgaWYgKGh0bWw1X2V2ZW50cy5oYXNPd25Qcm9wZXJ0eShmKSkge1xyXG4gICAgICAgICAgcmVtb3ZlKGYsIGh0bWw1X2V2ZW50c1tmXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBzZXVkby1wcml2YXRlIGV2ZW50IGludGVybmFsc1xyXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLl9vbmxvYWQgPSBmdW5jdGlvbihuU3VjY2Vzcykge1xyXG5cclxuICAgICAgdmFyIGZOLFxyXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGR1cmF0aW9uIHRvIHByZXZlbnQgZmFsc2UgcG9zaXRpdmVzIGZyb20gZmxhc2ggOCB3aGVuIGxvYWRpbmcgZnJvbSBjYWNoZS5cclxuICAgICAgICAgIGxvYWRPSyA9ICEhblN1Y2Nlc3MgfHwgKCFzLmlzSFRNTDUgJiYgZlYgPT09IDggJiYgcy5kdXJhdGlvbik7XHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgZk4gPSBzLmlkICsgJzogJztcclxuICAgICAgc20yLl93RChmTiArIChsb2FkT0sgPyAnb25sb2FkKCknIDogJ0ZhaWxlZCB0byBsb2FkIC8gaW52YWxpZCBzb3VuZD8nICsgKCFzLmR1cmF0aW9uID8gJyBaZXJvLWxlbmd0aCBkdXJhdGlvbiByZXBvcnRlZC4nIDogJyAtJykgKyAnICgnICsgcy51cmwgKyAnKScpLCAobG9hZE9LID8gMSA6IDIpKTtcclxuICAgICAgaWYgKCFsb2FkT0sgJiYgIXMuaXNIVE1MNSkge1xyXG4gICAgICAgIGlmIChzbTIuc2FuZGJveC5ub1JlbW90ZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgc20yLl93RChmTiArIHN0cignbm9OZXQnKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzbTIuc2FuZGJveC5ub0xvY2FsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgc3RyKCdub0xvY2FsJyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICBzLmxvYWRlZCA9IGxvYWRPSztcclxuICAgICAgcy5yZWFkeVN0YXRlID0gbG9hZE9LPzM6MjtcclxuICAgICAgcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcblxyXG4gICAgICBpZiAocy5faU8ub25sb2FkKSB7XHJcbiAgICAgICAgd3JhcENhbGxiYWNrKHMsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcy5faU8ub25sb2FkLmFwcGx5KHMsIFtsb2FkT0tdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9vbmJ1ZmZlcmNoYW5nZSA9IGZ1bmN0aW9uKG5Jc0J1ZmZlcmluZykge1xyXG5cclxuICAgICAgaWYgKHMucGxheVN0YXRlID09PSAwKSB7XHJcbiAgICAgICAgLy8gaWdub3JlIGlmIG5vdCBwbGF5aW5nXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoKG5Jc0J1ZmZlcmluZyAmJiBzLmlzQnVmZmVyaW5nKSB8fCAoIW5Jc0J1ZmZlcmluZyAmJiAhcy5pc0J1ZmZlcmluZykpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuaXNCdWZmZXJpbmcgPSAobklzQnVmZmVyaW5nID09PSAxKTtcclxuICAgICAgaWYgKHMuX2lPLm9uYnVmZmVyY2hhbmdlKSB7XHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogQnVmZmVyIHN0YXRlIGNoYW5nZTogJyArIG5Jc0J1ZmZlcmluZyk7XHJcbiAgICAgICAgcy5faU8ub25idWZmZXJjaGFuZ2UuYXBwbHkocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQbGF5YmFjayBtYXkgaGF2ZSBzdG9wcGVkIGR1ZSB0byBidWZmZXJpbmcsIG9yIHJlbGF0ZWQgcmVhc29uLlxyXG4gICAgICogVGhpcyBzdGF0ZSBjYW4gYmUgZW5jb3VudGVyZWQgb24gaU9TIDwgNiB3aGVuIGF1dG8tcGxheSBpcyBibG9ja2VkLlxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5fb25zdXNwZW5kID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAocy5faU8ub25zdXNwZW5kKSB7XHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogUGxheWJhY2sgc3VzcGVuZGVkJyk7XHJcbiAgICAgICAgcy5faU8ub25zdXNwZW5kLmFwcGx5KHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmxhc2ggOS9tb3ZpZVN0YXIgKyBSVE1QLW9ubHkgbWV0aG9kLCBzaG91bGQgZmlyZSBvbmx5IG9uY2UgYXQgbW9zdFxyXG4gICAgICogYXQgdGhpcyBwb2ludCB3ZSBqdXN0IHJlY3JlYXRlIGZhaWxlZCBzb3VuZHMgcmF0aGVyIHRoYW4gdHJ5aW5nIHRvIHJlY29ubmVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5fb25mYWlsdXJlID0gZnVuY3Rpb24obXNnLCBsZXZlbCwgY29kZSkge1xyXG5cclxuICAgICAgcy5mYWlsdXJlcysrO1xyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBGYWlsdXJlcyA9ICcgKyBzLmZhaWx1cmVzKTtcclxuXHJcbiAgICAgIGlmIChzLl9pTy5vbmZhaWx1cmUgJiYgcy5mYWlsdXJlcyA9PT0gMSkge1xyXG4gICAgICAgIHMuX2lPLm9uZmFpbHVyZShzLCBtc2csIGxldmVsLCBjb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBJZ25vcmluZyBmYWlsdXJlJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX29uZmluaXNoID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAvLyBzdG9yZSBsb2NhbCBjb3B5IGJlZm9yZSBpdCBnZXRzIHRyYXNoZWQuLi5cclxuICAgICAgdmFyIGlvX29uZmluaXNoID0gcy5faU8ub25maW5pc2g7XHJcblxyXG4gICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuICAgICAgcy5fcmVzZXRPblBvc2l0aW9uKDApO1xyXG5cclxuICAgICAgLy8gcmVzZXQgc29tZSBzdGF0ZSBpdGVtc1xyXG4gICAgICBpZiAocy5pbnN0YW5jZUNvdW50KSB7XHJcblxyXG4gICAgICAgIHMuaW5zdGFuY2VDb3VudC0tO1xyXG5cclxuICAgICAgICBpZiAoIXMuaW5zdGFuY2VDb3VudCkge1xyXG5cclxuICAgICAgICAgIC8vIHJlbW92ZSBvblBvc2l0aW9uIGxpc3RlbmVycywgaWYgYW55XHJcbiAgICAgICAgICBkZXRhY2hPblBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgLy8gcmVzZXQgaW5zdGFuY2Ugb3B0aW9uc1xyXG4gICAgICAgICAgcy5wbGF5U3RhdGUgPSAwO1xyXG4gICAgICAgICAgcy5wYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICAgIHMuaW5zdGFuY2VDb3VudCA9IDA7XHJcbiAgICAgICAgICBzLmluc3RhbmNlT3B0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgcy5faU8gPSB7fTtcclxuICAgICAgICAgIHN0b3BfaHRtbDVfdGltZXIoKTtcclxuXHJcbiAgICAgICAgICAvLyByZXNldCBwb3NpdGlvbiwgdG9vXHJcbiAgICAgICAgICBpZiAocy5pc0hUTUw1KSB7XHJcbiAgICAgICAgICAgIHMucG9zaXRpb24gPSAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghcy5pbnN0YW5jZUNvdW50IHx8IHMuX2lPLm11bHRpU2hvdEV2ZW50cykge1xyXG4gICAgICAgICAgLy8gZmlyZSBvbmZpbmlzaCBmb3IgbGFzdCwgb3IgZXZlcnkgaW5zdGFuY2VcclxuICAgICAgICAgIGlmIChpb19vbmZpbmlzaCkge1xyXG4gICAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBvbmZpbmlzaCgpJyk7XHJcbiAgICAgICAgICAgIHdyYXBDYWxsYmFjayhzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICBpb19vbmZpbmlzaC5hcHBseShzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fd2hpbGVsb2FkaW5nID0gZnVuY3Rpb24obkJ5dGVzTG9hZGVkLCBuQnl0ZXNUb3RhbCwgbkR1cmF0aW9uLCBuQnVmZmVyTGVuZ3RoKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gcy5faU87XHJcblxyXG4gICAgICBzLmJ5dGVzTG9hZGVkID0gbkJ5dGVzTG9hZGVkO1xyXG4gICAgICBzLmJ5dGVzVG90YWwgPSBuQnl0ZXNUb3RhbDtcclxuICAgICAgcy5kdXJhdGlvbiA9IE1hdGguZmxvb3IobkR1cmF0aW9uKTtcclxuICAgICAgcy5idWZmZXJMZW5ndGggPSBuQnVmZmVyTGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUgJiYgIWluc3RhbmNlT3B0aW9ucy5pc01vdmllU3Rhcikge1xyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLmR1cmF0aW9uKSB7XHJcbiAgICAgICAgICAvLyB1c2UgZHVyYXRpb24gZnJvbSBvcHRpb25zLCBpZiBzcGVjaWZpZWQgYW5kIGxhcmdlci4gbm9ib2R5IHNob3VsZCBiZSBzcGVjaWZ5aW5nIGR1cmF0aW9uIGluIG9wdGlvbnMsIGFjdHVhbGx5LCBhbmQgaXQgc2hvdWxkIGJlIHJldGlyZWQuXHJcbiAgICAgICAgICBzLmR1cmF0aW9uRXN0aW1hdGUgPSAocy5kdXJhdGlvbiA+IGluc3RhbmNlT3B0aW9ucy5kdXJhdGlvbikgPyBzLmR1cmF0aW9uIDogaW5zdGFuY2VPcHRpb25zLmR1cmF0aW9uO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzLmR1cmF0aW9uRXN0aW1hdGUgPSBwYXJzZUludCgocy5ieXRlc1RvdGFsIC8gcy5ieXRlc0xvYWRlZCkgKiBzLmR1cmF0aW9uLCAxMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgcy5kdXJhdGlvbkVzdGltYXRlID0gcy5kdXJhdGlvbjtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGZvciBmbGFzaCwgcmVmbGVjdCBzZXF1ZW50aWFsLWxvYWQtc3R5bGUgYnVmZmVyaW5nXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgcy5idWZmZXJlZCA9IFt7XHJcbiAgICAgICAgICAnc3RhcnQnOiAwLFxyXG4gICAgICAgICAgJ2VuZCc6IHMuZHVyYXRpb25cclxuICAgICAgICB9XTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYWxsb3cgd2hpbGVsb2FkaW5nIHRvIGZpcmUgZXZlbiBpZiBcImxvYWRcIiBmaXJlZCB1bmRlciBIVE1MNSwgZHVlIHRvIEhUVFAgcmFuZ2UvcGFydGlhbHNcclxuICAgICAgaWYgKChzLnJlYWR5U3RhdGUgIT09IDMgfHwgcy5pc0hUTUw1KSAmJiBpbnN0YW5jZU9wdGlvbnMud2hpbGVsb2FkaW5nKSB7XHJcbiAgICAgICAgaW5zdGFuY2VPcHRpb25zLndoaWxlbG9hZGluZy5hcHBseShzKTtcclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fd2hpbGVwbGF5aW5nID0gZnVuY3Rpb24oblBvc2l0aW9uLCBvUGVha0RhdGEsIG9XYXZlZm9ybURhdGFMZWZ0LCBvV2F2ZWZvcm1EYXRhUmlnaHQsIG9FUURhdGEpIHtcclxuXHJcbiAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTyxcclxuICAgICAgICAgIGVxTGVmdDtcclxuXHJcbiAgICAgIGlmIChpc05hTihuUG9zaXRpb24pIHx8IG5Qb3NpdGlvbiA9PT0gbnVsbCkge1xyXG4gICAgICAgIC8vIGZsYXNoIHNhZmV0eSBuZXRcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFNhZmFyaSBIVE1MNSBwbGF5KCkgbWF5IHJldHVybiBzbWFsbCAtdmUgdmFsdWVzIHdoZW4gc3RhcnRpbmcgZnJvbSBwb3NpdGlvbjogMCwgZWcuIC01MC4xMjAzOTY4NzUuIFVuZXhwZWN0ZWQvaW52YWxpZCBwZXIgVzMsIEkgdGhpbmsuIE5vcm1hbGl6ZSB0byAwLlxyXG4gICAgICBzLnBvc2l0aW9uID0gTWF0aC5tYXgoMCwgblBvc2l0aW9uKTtcclxuXHJcbiAgICAgIHMuX3Byb2Nlc3NPblBvc2l0aW9uKCk7XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSAmJiBmViA+IDgpIHtcclxuXHJcbiAgICAgICAgaWYgKGluc3RhbmNlT3B0aW9ucy51c2VQZWFrRGF0YSAmJiBvUGVha0RhdGEgIT09IF91bmRlZmluZWQgJiYgb1BlYWtEYXRhKSB7XHJcbiAgICAgICAgICBzLnBlYWtEYXRhID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiBvUGVha0RhdGEubGVmdFBlYWssXHJcbiAgICAgICAgICAgIHJpZ2h0OiBvUGVha0RhdGEucmlnaHRQZWFrXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluc3RhbmNlT3B0aW9ucy51c2VXYXZlZm9ybURhdGEgJiYgb1dhdmVmb3JtRGF0YUxlZnQgIT09IF91bmRlZmluZWQgJiYgb1dhdmVmb3JtRGF0YUxlZnQpIHtcclxuICAgICAgICAgIHMud2F2ZWZvcm1EYXRhID0ge1xyXG4gICAgICAgICAgICBsZWZ0OiBvV2F2ZWZvcm1EYXRhTGVmdC5zcGxpdCgnLCcpLFxyXG4gICAgICAgICAgICByaWdodDogb1dhdmVmb3JtRGF0YVJpZ2h0LnNwbGl0KCcsJylcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnVzZUVRRGF0YSkge1xyXG4gICAgICAgICAgaWYgKG9FUURhdGEgIT09IF91bmRlZmluZWQgJiYgb0VRRGF0YSAmJiBvRVFEYXRhLmxlZnRFUSkge1xyXG4gICAgICAgICAgICBlcUxlZnQgPSBvRVFEYXRhLmxlZnRFUS5zcGxpdCgnLCcpO1xyXG4gICAgICAgICAgICBzLmVxRGF0YSA9IGVxTGVmdDtcclxuICAgICAgICAgICAgcy5lcURhdGEubGVmdCA9IGVxTGVmdDtcclxuICAgICAgICAgICAgaWYgKG9FUURhdGEucmlnaHRFUSAhPT0gX3VuZGVmaW5lZCAmJiBvRVFEYXRhLnJpZ2h0RVEpIHtcclxuICAgICAgICAgICAgICBzLmVxRGF0YS5yaWdodCA9IG9FUURhdGEucmlnaHRFUS5zcGxpdCgnLCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHMucGxheVN0YXRlID09PSAxKSB7XHJcblxyXG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZS9oYWNrOiBlbnN1cmUgYnVmZmVyaW5nIGlzIGZhbHNlIGlmIGxvYWRpbmcgZnJvbSBjYWNoZSAoYW5kIG5vdCB5ZXQgc3RhcnRlZClcclxuICAgICAgICBpZiAoIXMuaXNIVE1MNSAmJiBmViA9PT0gOCAmJiAhcy5wb3NpdGlvbiAmJiBzLmlzQnVmZmVyaW5nKSB7XHJcbiAgICAgICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMud2hpbGVwbGF5aW5nKSB7XHJcbiAgICAgICAgICAvLyBmbGFzaCBtYXkgY2FsbCBhZnRlciBhY3R1YWwgZmluaXNoXHJcbiAgICAgICAgICBpbnN0YW5jZU9wdGlvbnMud2hpbGVwbGF5aW5nLmFwcGx5KHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fb25jYXB0aW9uZGF0YSA9IGZ1bmN0aW9uKG9EYXRhKSB7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogaW50ZXJuYWw6IGZsYXNoIDkgKyBOZXRTdHJlYW0gKE1vdmllU3Rhci9SVE1QLW9ubHkpIGZlYXR1cmVcclxuICAgICAgICpcclxuICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9EYXRhXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogQ2FwdGlvbiBkYXRhIHJlY2VpdmVkLicpO1xyXG5cclxuICAgICAgcy5jYXB0aW9uZGF0YSA9IG9EYXRhO1xyXG5cclxuICAgICAgaWYgKHMuX2lPLm9uY2FwdGlvbmRhdGEpIHtcclxuICAgICAgICBzLl9pTy5vbmNhcHRpb25kYXRhLmFwcGx5KHMsIFtvRGF0YV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9vbm1ldGFkYXRhID0gZnVuY3Rpb24ob01EUHJvcHMsIG9NRERhdGEpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBpbnRlcm5hbDogZmxhc2ggOSArIE5ldFN0cmVhbSAoTW92aWVTdGFyL1JUTVAtb25seSkgZmVhdHVyZVxyXG4gICAgICAgKiBSVE1QIG1heSBpbmNsdWRlIHNvbmcgdGl0bGUsIE1vdmllU3RhciBjb250ZW50IG1heSBpbmNsdWRlIGVuY29kaW5nIGluZm9cclxuICAgICAgICpcclxuICAgICAgICogQHBhcmFtIHthcnJheX0gb01EUHJvcHMgKG5hbWVzKVxyXG4gICAgICAgKiBAcGFyYW0ge2FycmF5fSBvTUREYXRhICh2YWx1ZXMpXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogTWV0YWRhdGEgcmVjZWl2ZWQuJyk7XHJcblxyXG4gICAgICB2YXIgb0RhdGEgPSB7fSwgaSwgajtcclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGogPSBvTURQcm9wcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcclxuICAgICAgICBvRGF0YVtvTURQcm9wc1tpXV0gPSBvTUREYXRhW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIHMubWV0YWRhdGEgPSBvRGF0YTtcclxuXHJcbiAgICAgIGlmIChzLl9pTy5vbm1ldGFkYXRhKSB7XHJcbiAgICAgICAgcy5faU8ub25tZXRhZGF0YS5hcHBseShzKTtcclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fb25pZDMgPSBmdW5jdGlvbihvSUQzUHJvcHMsIG9JRDNEYXRhKSB7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogaW50ZXJuYWw6IGZsYXNoIDggKyBmbGFzaCA5IElEMyBmZWF0dXJlXHJcbiAgICAgICAqIG1heSBpbmNsdWRlIGFydGlzdCwgc29uZyB0aXRsZSBldGMuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIEBwYXJhbSB7YXJyYXl9IG9JRDNQcm9wcyAobmFtZXMpXHJcbiAgICAgICAqIEBwYXJhbSB7YXJyYXl9IG9JRDNEYXRhICh2YWx1ZXMpXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogSUQzIGRhdGEgcmVjZWl2ZWQuJyk7XHJcblxyXG4gICAgICB2YXIgb0RhdGEgPSBbXSwgaSwgajtcclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGogPSBvSUQzUHJvcHMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XHJcbiAgICAgICAgb0RhdGFbb0lEM1Byb3BzW2ldXSA9IG9JRDNEYXRhW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIHMuaWQzID0gbWl4aW4ocy5pZDMsIG9EYXRhKTtcclxuXHJcbiAgICAgIGlmIChzLl9pTy5vbmlkMykge1xyXG4gICAgICAgIHMuX2lPLm9uaWQzLmFwcGx5KHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBmbGFzaC9SVE1QLW9ubHlcclxuXHJcbiAgICB0aGlzLl9vbmNvbm5lY3QgPSBmdW5jdGlvbihiU3VjY2Vzcykge1xyXG5cclxuICAgICAgYlN1Y2Nlc3MgPSAoYlN1Y2Nlc3MgPT09IDEpO1xyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiAnICsgKGJTdWNjZXNzID8gJ0Nvbm5lY3RlZC4nIDogJ0ZhaWxlZCB0byBjb25uZWN0PyAtICcgKyBzLnVybCksIChiU3VjY2VzcyA/IDEgOiAyKSk7XHJcbiAgICAgIHMuY29ubmVjdGVkID0gYlN1Y2Nlc3M7XHJcblxyXG4gICAgICBpZiAoYlN1Y2Nlc3MpIHtcclxuXHJcbiAgICAgICAgcy5mYWlsdXJlcyA9IDA7XHJcblxyXG4gICAgICAgIGlmIChpZENoZWNrKHMuaWQpKSB7XHJcbiAgICAgICAgICBpZiAocy5nZXRBdXRvUGxheSgpKSB7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgdXBkYXRlIHRoZSBwbGF5IHN0YXRlIGlmIGF1dG8gcGxheWluZ1xyXG4gICAgICAgICAgICBzLnBsYXkoX3VuZGVmaW5lZCwgcy5nZXRBdXRvUGxheSgpKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAocy5faU8uYXV0b0xvYWQpIHtcclxuICAgICAgICAgICAgcy5sb2FkKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocy5faU8ub25jb25uZWN0KSB7XHJcbiAgICAgICAgICBzLl9pTy5vbmNvbm5lY3QuYXBwbHkocywgW2JTdWNjZXNzXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fb25kYXRhZXJyb3IgPSBmdW5jdGlvbihzRXJyb3IpIHtcclxuXHJcbiAgICAgIC8vIGZsYXNoIDkgd2F2ZS9lcSBkYXRhIGhhbmRsZXJcclxuICAgICAgLy8gaGFjazogY2FsbGVkIGF0IHN0YXJ0LCBhbmQgZW5kIGZyb20gZmxhc2ggYXQvYWZ0ZXIgb25maW5pc2goKVxyXG4gICAgICBpZiAocy5wbGF5U3RhdGUgPiAwKSB7XHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogRGF0YSBlcnJvcjogJyArIHNFcnJvcik7XHJcbiAgICAgICAgaWYgKHMuX2lPLm9uZGF0YWVycm9yKSB7XHJcbiAgICAgICAgICBzLl9pTy5vbmRhdGFlcnJvci5hcHBseShzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgdGhpcy5fZGVidWcoKTtcclxuICAgIC8vIDwvZD5cclxuXHJcbiAgfTsgLy8gU01Tb3VuZCgpXHJcblxyXG4gIC8qKlxyXG4gICAqIFByaXZhdGUgU291bmRNYW5hZ2VyIGludGVybmFsc1xyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqL1xyXG5cclxuICBnZXREb2N1bWVudCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHJldHVybiAoZG9jLmJvZHkgfHwgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVswXSk7XHJcblxyXG4gIH07XHJcblxyXG4gIGlkID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgcmV0dXJuIGRvYy5nZXRFbGVtZW50QnlJZChzSUQpO1xyXG5cclxuICB9O1xyXG5cclxuICBtaXhpbiA9IGZ1bmN0aW9uKG9NYWluLCBvQWRkKSB7XHJcblxyXG4gICAgLy8gbm9uLWRlc3RydWN0aXZlIG1lcmdlXHJcbiAgICB2YXIgbzEgPSAob01haW4gfHwge30pLCBvMiwgbztcclxuXHJcbiAgICAvLyBpZiB1bnNwZWNpZmllZCwgbzIgaXMgdGhlIGRlZmF1bHQgb3B0aW9ucyBvYmplY3RcclxuICAgIG8yID0gKG9BZGQgPT09IF91bmRlZmluZWQgPyBzbTIuZGVmYXVsdE9wdGlvbnMgOiBvQWRkKTtcclxuXHJcbiAgICBmb3IgKG8gaW4gbzIpIHtcclxuXHJcbiAgICAgIGlmIChvMi5oYXNPd25Qcm9wZXJ0eShvKSAmJiBvMVtvXSA9PT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG8yW29dICE9PSAnb2JqZWN0JyB8fCBvMltvXSA9PT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgIC8vIGFzc2lnbiBkaXJlY3RseVxyXG4gICAgICAgICAgbzFbb10gPSBvMltvXTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyByZWN1cnNlIHRocm91Z2ggbzJcclxuICAgICAgICAgIG8xW29dID0gbWl4aW4obzFbb10sIG8yW29dKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbzE7XHJcblxyXG4gIH07XHJcblxyXG4gIHdyYXBDYWxsYmFjayA9IGZ1bmN0aW9uKG9Tb3VuZCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIDAzLzAzLzIwMTM6IEZpeCBmb3IgRmxhc2ggUGxheWVyIDExLjYuNjAyLjE3MSArIEZsYXNoIDggKGZsYXNoVmVyc2lvbiA9IDgpIFNXRiBpc3N1ZVxyXG4gICAgICogc2V0VGltZW91dCgpIGZpeCBmb3IgY2VydGFpbiBTTVNvdW5kIGNhbGxiYWNrcyBsaWtlIG9ubG9hZCgpIGFuZCBvbmZpbmlzaCgpLCB3aGVyZSBzdWJzZXF1ZW50IGNhbGxzIGxpa2UgcGxheSgpIGFuZCBsb2FkKCkgZmFpbCB3aGVuIEZsYXNoIFBsYXllciAxMS42LjYwMi4xNzEgaXMgaW5zdGFsbGVkLCBhbmQgdXNpbmcgc291bmRNYW5hZ2VyIHdpdGggZmxhc2hWZXJzaW9uID0gOCAod2hpY2ggaXMgdGhlIGRlZmF1bHQpLlxyXG4gICAgICogTm90IHN1cmUgb2YgZXhhY3QgY2F1c2UuIFN1c3BlY3QgcmFjZSBjb25kaXRpb24gYW5kL29yIGludmFsaWQgKE5hTi1zdHlsZSkgcG9zaXRpb24gYXJndW1lbnQgdHJpY2tsaW5nIGRvd24gdG8gdGhlIG5leHQgSlMgLT4gRmxhc2ggX3N0YXJ0KCkgY2FsbCwgaW4gdGhlIHBsYXkoKSBjYXNlLlxyXG4gICAgICogRml4OiBzZXRUaW1lb3V0KCkgdG8geWllbGQsIHBsdXMgc2FmZXIgbnVsbCAvIE5hTiBjaGVja2luZyBvbiBwb3NpdGlvbiBhcmd1bWVudCBwcm92aWRlZCB0byBGbGFzaC5cclxuICAgICAqIGh0dHBzOi8vZ2V0c2F0aXNmYWN0aW9uLmNvbS9zY2hpbGxtYW5pYS90b3BpY3MvcmVjZW50X2Nocm9tZV91cGRhdGVfc2VlbXNfdG9faGF2ZV9icm9rZW5fbXlfc20yX2F1ZGlvX3BsYXllclxyXG4gICAgICovXHJcbiAgICBpZiAoIW9Tb3VuZC5pc0hUTUw1ICYmIGZWID09PSA4KSB7XHJcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8vIGFkZGl0aW9uYWwgc291bmRNYW5hZ2VyIHByb3BlcnRpZXMgdGhhdCBzb3VuZE1hbmFnZXIuc2V0dXAoKSB3aWxsIGFjY2VwdFxyXG5cclxuICBleHRyYU9wdGlvbnMgPSB7XHJcbiAgICAnb25yZWFkeSc6IDEsXHJcbiAgICAnb250aW1lb3V0JzogMSxcclxuICAgICdkZWZhdWx0T3B0aW9ucyc6IDEsXHJcbiAgICAnZmxhc2g5T3B0aW9ucyc6IDEsXHJcbiAgICAnbW92aWVTdGFyT3B0aW9ucyc6IDFcclxuICB9O1xyXG5cclxuICBhc3NpZ24gPSBmdW5jdGlvbihvLCBvUGFyZW50KSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZWN1cnNpdmUgYXNzaWdubWVudCBvZiBwcm9wZXJ0aWVzLCBzb3VuZE1hbmFnZXIuc2V0dXAoKSBoZWxwZXJcclxuICAgICAqIGFsbG93cyBwcm9wZXJ0eSBhc3NpZ25tZW50IGJhc2VkIG9uIHdoaXRlbGlzdFxyXG4gICAgICovXHJcblxyXG4gICAgdmFyIGksXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZSxcclxuICAgICAgICBoYXNQYXJlbnQgPSAob1BhcmVudCAhPT0gX3VuZGVmaW5lZCksXHJcbiAgICAgICAgc2V0dXBPcHRpb25zID0gc20yLnNldHVwT3B0aW9ucyxcclxuICAgICAgICBib251c09wdGlvbnMgPSBleHRyYU9wdGlvbnM7XHJcblxyXG4gICAgLy8gPGQ+XHJcblxyXG4gICAgLy8gaWYgc291bmRNYW5hZ2VyLnNldHVwKCkgY2FsbGVkLCBzaG93IGFjY2VwdGVkIHBhcmFtZXRlcnMuXHJcblxyXG4gICAgaWYgKG8gPT09IF91bmRlZmluZWQpIHtcclxuXHJcbiAgICAgIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgZm9yIChpIGluIHNldHVwT3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAoc2V0dXBPcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgICAgICByZXN1bHQucHVzaChpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGkgaW4gYm9udXNPcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChib251c09wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuXHJcbiAgICAgICAgICBpZiAodHlwZW9mIHNtMltpXSA9PT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGkrJzogey4uLn0nKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHNtMltpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQucHVzaChpKyc6IGZ1bmN0aW9uKCkgey4uLn0nKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goaSk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuX3dEKHN0cignc2V0dXAnLCByZXN1bHQuam9pbignLCAnKSkpO1xyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgZm9yIChpIGluIG8pIHtcclxuXHJcbiAgICAgIGlmIChvLmhhc093blByb3BlcnR5KGkpKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIG5vdCBhbiB7b2JqZWN0fSB3ZSB3YW50IHRvIHJlY3Vyc2UgdGhyb3VnaC4uLlxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9baV0gIT09ICdvYmplY3QnIHx8IG9baV0gPT09IG51bGwgfHwgb1tpXSBpbnN0YW5jZW9mIEFycmF5IHx8IG9baV0gaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuXHJcbiAgICAgICAgICAvLyBjaGVjayBcImFsbG93ZWRcIiBvcHRpb25zXHJcblxyXG4gICAgICAgICAgaWYgKGhhc1BhcmVudCAmJiBib251c09wdGlvbnNbb1BhcmVudF0gIT09IF91bmRlZmluZWQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHZhbGlkIHJlY3Vyc2l2ZSAvIG5lc3RlZCBvYmplY3Qgb3B0aW9uLCBlZy4sIHsgZGVmYXVsdE9wdGlvbnM6IHsgdm9sdW1lOiA1MCB9IH1cclxuICAgICAgICAgICAgc20yW29QYXJlbnRdW2ldID0gb1tpXTtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHNldHVwT3B0aW9uc1tpXSAhPT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBhc3NpZ24gdG8gc2V0dXBPcHRpb25zIG9iamVjdCwgd2hpY2ggc291bmRNYW5hZ2VyIHByb3BlcnR5IHJlZmVyZW5jZXNcclxuICAgICAgICAgICAgc20yLnNldHVwT3B0aW9uc1tpXSA9IG9baV07XHJcblxyXG4gICAgICAgICAgICAvLyBhc3NpZ24gZGlyZWN0bHkgdG8gc291bmRNYW5hZ2VyLCB0b29cclxuICAgICAgICAgICAgc20yW2ldID0gb1tpXTtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGJvbnVzT3B0aW9uc1tpXSA9PT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICAgICAgLy8gaW52YWxpZCBvciBkaXNhbGxvd2VkIHBhcmFtZXRlci4gY29tcGxhaW4uXHJcbiAgICAgICAgICAgIGNvbXBsYWluKHN0cigoc20yW2ldID09PSBfdW5kZWZpbmVkID8gJ3NldHVwVW5kZWYnIDogJ3NldHVwRXJyb3InKSwgaSksIDIpO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiB2YWxpZCBleHRyYU9wdGlvbnMgKGJvbnVzT3B0aW9ucykgcGFyYW1ldGVyLlxyXG4gICAgICAgICAgICAgKiBpcyBpdCBhIG1ldGhvZCwgbGlrZSBvbnJlYWR5L29udGltZW91dD8gY2FsbCBpdC5cclxuICAgICAgICAgICAgICogbXVsdGlwbGUgcGFyYW1ldGVycyBzaG91bGQgYmUgaW4gYW4gYXJyYXksIGVnLiBzb3VuZE1hbmFnZXIuc2V0dXAoe29ucmVhZHk6IFtteUhhbmRsZXIsIG15U2NvcGVdfSk7XHJcbiAgICAgICAgICAgICAqL1xyXG5cclxuICAgICAgICAgICAgaWYgKHNtMltpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgIHNtMltpXS5hcHBseShzbTIsIChvW2ldIGluc3RhbmNlb2YgQXJyYXk/IG9baV0gOiBbb1tpXV0pKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIGdvb2Qgb2xkLWZhc2hpb25lZCBkaXJlY3QgYXNzaWdubWVudFxyXG4gICAgICAgICAgICAgIHNtMltpXSA9IG9baV07XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIHJlY3Vyc2lvbiBjYXNlLCBlZy4sIHsgZGVmYXVsdE9wdGlvbnM6IHsgLi4uIH0gfVxyXG5cclxuICAgICAgICAgIGlmIChib251c09wdGlvbnNbaV0gPT09IF91bmRlZmluZWQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGludmFsaWQgb3IgZGlzYWxsb3dlZCBwYXJhbWV0ZXIuIGNvbXBsYWluLlxyXG4gICAgICAgICAgICBjb21wbGFpbihzdHIoKHNtMltpXSA9PT0gX3VuZGVmaW5lZCA/ICdzZXR1cFVuZGVmJyA6ICdzZXR1cEVycm9yJyksIGkpLCAyKTtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyByZWN1cnNlIHRocm91Z2ggb2JqZWN0XHJcbiAgICAgICAgICAgIHJldHVybiBhc3NpZ24ob1tpXSwgaSk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG4gIGZ1bmN0aW9uIHByZWZlckZsYXNoQ2hlY2soa2luZCkge1xyXG5cclxuICAgIC8vIHdoZXRoZXIgZmxhc2ggc2hvdWxkIHBsYXkgYSBnaXZlbiB0eXBlXHJcbiAgICByZXR1cm4gKHNtMi5wcmVmZXJGbGFzaCAmJiBoYXNGbGFzaCAmJiAhc20yLmlnbm9yZUZsYXNoICYmIChzbTIuZmxhc2hba2luZF0gIT09IF91bmRlZmluZWQgJiYgc20yLmZsYXNoW2tpbmRdKSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJuYWwgRE9NMi1sZXZlbCBldmVudCBoZWxwZXJzXHJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICovXHJcblxyXG4gIGV2ZW50ID0gKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIG5vcm1hbGl6ZSBldmVudCBtZXRob2RzXHJcbiAgICB2YXIgb2xkID0gKHdpbmRvdy5hdHRhY2hFdmVudCksXHJcbiAgICBldnQgPSB7XHJcbiAgICAgIGFkZDogKG9sZD8nYXR0YWNoRXZlbnQnOidhZGRFdmVudExpc3RlbmVyJyksXHJcbiAgICAgIHJlbW92ZTogKG9sZD8nZGV0YWNoRXZlbnQnOidyZW1vdmVFdmVudExpc3RlbmVyJylcclxuICAgIH07XHJcblxyXG4gICAgLy8gbm9ybWFsaXplIFwib25cIiBldmVudCBwcmVmaXgsIG9wdGlvbmFsIGNhcHR1cmUgYXJndW1lbnRcclxuICAgIGZ1bmN0aW9uIGdldEFyZ3Mob0FyZ3MpIHtcclxuXHJcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChvQXJncyksXHJcbiAgICAgICAgICBsZW4gPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgIGlmIChvbGQpIHtcclxuICAgICAgICAvLyBwcmVmaXhcclxuICAgICAgICBhcmdzWzFdID0gJ29uJyArIGFyZ3NbMV07XHJcbiAgICAgICAgaWYgKGxlbiA+IDMpIHtcclxuICAgICAgICAgIC8vIG5vIGNhcHR1cmVcclxuICAgICAgICAgIGFyZ3MucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKGxlbiA9PT0gMykge1xyXG4gICAgICAgIGFyZ3MucHVzaChmYWxzZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBhcmdzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseShhcmdzLCBzVHlwZSkge1xyXG5cclxuICAgICAgLy8gbm9ybWFsaXplIGFuZCBjYWxsIHRoZSBldmVudCBtZXRob2QsIHdpdGggdGhlIHByb3BlciBhcmd1bWVudHNcclxuICAgICAgdmFyIGVsZW1lbnQgPSBhcmdzLnNoaWZ0KCksXHJcbiAgICAgICAgICBtZXRob2QgPSBbZXZ0W3NUeXBlXV07XHJcblxyXG4gICAgICBpZiAob2xkKSB7XHJcbiAgICAgICAgLy8gb2xkIElFIGNhbid0IGRvIGFwcGx5KCkuXHJcbiAgICAgICAgZWxlbWVudFttZXRob2RdKGFyZ3NbMF0sIGFyZ3NbMV0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW1lbnRbbWV0aG9kXS5hcHBseShlbGVtZW50LCBhcmdzKTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhZGQoKSB7XHJcblxyXG4gICAgICBhcHBseShnZXRBcmdzKGFyZ3VtZW50cyksICdhZGQnKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlKCkge1xyXG5cclxuICAgICAgYXBwbHkoZ2V0QXJncyhhcmd1bWVudHMpLCAncmVtb3ZlJyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICdhZGQnOiBhZGQsXHJcbiAgICAgICdyZW1vdmUnOiByZW1vdmVcclxuICAgIH07XHJcblxyXG4gIH0oKSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEludGVybmFsIEhUTUw1IGV2ZW50IGhhbmRsaW5nXHJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKi9cclxuXHJcbiAgZnVuY3Rpb24gaHRtbDVfZXZlbnQob0ZuKSB7XHJcblxyXG4gICAgLy8gd3JhcCBodG1sNSBldmVudCBoYW5kbGVycyBzbyB3ZSBkb24ndCBjYWxsIHRoZW0gb24gZGVzdHJveWVkIGFuZC9vciB1bmxvYWRlZCBzb3VuZHNcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cclxuICAgICAgdmFyIHMgPSB0aGlzLl9zLFxyXG4gICAgICAgICAgcmVzdWx0O1xyXG5cclxuICAgICAgaWYgKCFzIHx8ICFzLl9hKSB7XHJcbiAgICAgICAgLy8gPGQ+XHJcbiAgICAgICAgaWYgKHMgJiYgcy5pZCkge1xyXG4gICAgICAgICAgc20yLl93RChzLmlkICsgJzogSWdub3JpbmcgJyArIGUudHlwZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNtMi5fd0QoaDUgKyAnSWdub3JpbmcgJyArIGUudHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDwvZD5cclxuICAgICAgICByZXN1bHQgPSBudWxsO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9IG9Gbi5jYWxsKHRoaXMsIGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH07XHJcblxyXG4gIH1cclxuXHJcbiAgaHRtbDVfZXZlbnRzID0ge1xyXG5cclxuICAgIC8vIEhUTUw1IGV2ZW50LW5hbWUtdG8taGFuZGxlciBtYXBcclxuXHJcbiAgICBhYm9ydDogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBhYm9ydCcpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIC8vIGVub3VnaCBoYXMgbG9hZGVkIHRvIHBsYXlcclxuXHJcbiAgICBjYW5wbGF5OiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcyxcclxuICAgICAgICAgIHBvc2l0aW9uMUs7XHJcblxyXG4gICAgICBpZiAocy5faHRtbDVfY2FucGxheSkge1xyXG4gICAgICAgIC8vIHRoaXMgZXZlbnQgaGFzIGFscmVhZHkgZmlyZWQuIGlnbm9yZS5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcy5faHRtbDVfY2FucGxheSA9IHRydWU7XHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IGNhbnBsYXknKTtcclxuICAgICAgcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcblxyXG4gICAgICAvLyBwb3NpdGlvbiBhY2NvcmRpbmcgdG8gaW5zdGFuY2Ugb3B0aW9uc1xyXG4gICAgICBwb3NpdGlvbjFLID0gKHMuX2lPLnBvc2l0aW9uICE9PSBfdW5kZWZpbmVkICYmICFpc05hTihzLl9pTy5wb3NpdGlvbik/cy5faU8ucG9zaXRpb24vbXNlY1NjYWxlOm51bGwpO1xyXG5cclxuICAgICAgLy8gc2V0IHRoZSBwb3NpdGlvbiBpZiBwb3NpdGlvbiB3YXMgc2V0IGJlZm9yZSB0aGUgc291bmQgbG9hZGVkXHJcbiAgICAgIGlmIChzLnBvc2l0aW9uICYmIHRoaXMuY3VycmVudFRpbWUgIT09IHBvc2l0aW9uMUspIHtcclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBjYW5wbGF5OiBTZXR0aW5nIHBvc2l0aW9uIHRvICcgKyBwb3NpdGlvbjFLKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IHBvc2l0aW9uMUs7XHJcbiAgICAgICAgfSBjYXRjaChlZSkge1xyXG4gICAgICAgICAgc20yLl93RChzLmlkICsgJzogY2FucGxheTogU2V0dGluZyBwb3NpdGlvbiBvZiAnICsgcG9zaXRpb24xSyArICcgZmFpbGVkOiAnICsgZWUubWVzc2FnZSwgMik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBoYWNrIGZvciBIVE1MNSBmcm9tL3RvIGNhc2VcclxuICAgICAgaWYgKHMuX2lPLl9vbmNhbnBsYXkpIHtcclxuICAgICAgICBzLl9pTy5fb25jYW5wbGF5KCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBjYW5wbGF5dGhyb3VnaDogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcyA9IHRoaXMuX3M7XHJcblxyXG4gICAgICBpZiAoIXMubG9hZGVkKSB7XHJcbiAgICAgICAgcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcbiAgICAgICAgcy5fd2hpbGVsb2FkaW5nKHMuYnl0ZXNMb2FkZWQsIHMuYnl0ZXNUb3RhbCwgcy5fZ2V0X2h0bWw1X2R1cmF0aW9uKCkpO1xyXG4gICAgICAgIHMuX29ubG9hZCh0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFRPRE86IFJlc2VydmVkIGZvciBwb3RlbnRpYWwgdXNlXHJcbiAgICAvKlxyXG4gICAgZW1wdGllZDogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBlbXB0aWVkJyk7XHJcblxyXG4gICAgfSksXHJcbiAgICAqL1xyXG5cclxuICAgIGVuZGVkOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcztcclxuXHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IGVuZGVkJyk7XHJcblxyXG4gICAgICBzLl9vbmZpbmlzaCgpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIGVycm9yOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IEhUTUw1IGVycm9yLCBjb2RlICcgKyB0aGlzLmVycm9yLmNvZGUpO1xyXG4gICAgICAvKipcclxuICAgICAgICogSFRNTDUgZXJyb3IgY29kZXMsIHBlciBXM0NcclxuICAgICAgICogRXJyb3IgMTogQ2xpZW50IGFib3J0ZWQgZG93bmxvYWQgYXQgdXNlcidzIHJlcXVlc3QuXHJcbiAgICAgICAqIEVycm9yIDI6IE5ldHdvcmsgZXJyb3IgYWZ0ZXIgbG9hZCBzdGFydGVkLlxyXG4gICAgICAgKiBFcnJvciAzOiBEZWNvZGluZyBpc3N1ZS5cclxuICAgICAgICogRXJyb3IgNDogTWVkaWEgKGF1ZGlvIGZpbGUpIG5vdCBzdXBwb3J0ZWQuXHJcbiAgICAgICAqIFJlZmVyZW5jZTogaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdGhlLXZpZGVvLWVsZW1lbnQuaHRtbCNlcnJvci1jb2Rlc1xyXG4gICAgICAgKi9cclxuICAgICAgLy8gY2FsbCBsb2FkIHdpdGggZXJyb3Igc3RhdGU/XHJcbiAgICAgIHRoaXMuX3MuX29ubG9hZChmYWxzZSk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgbG9hZGVkZGF0YTogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcyA9IHRoaXMuX3M7XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBsb2FkZWRkYXRhJyk7XHJcblxyXG4gICAgICAvLyBzYWZhcmkgc2VlbXMgdG8gbmljZWx5IHJlcG9ydCBwcm9ncmVzcyBldmVudHMsIGV2ZW50dWFsbHkgdG90YWxsaW5nIDEwMCVcclxuICAgICAgaWYgKCFzLl9sb2FkZWQgJiYgIWlzU2FmYXJpKSB7XHJcbiAgICAgICAgcy5kdXJhdGlvbiA9IHMuX2dldF9odG1sNV9kdXJhdGlvbigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgbG9hZGVkbWV0YWRhdGE6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogbG9hZGVkbWV0YWRhdGEnKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBsb2Fkc3RhcnQ6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogbG9hZHN0YXJ0Jyk7XHJcbiAgICAgIC8vIGFzc3VtZSBidWZmZXJpbmcgYXQgZmlyc3RcclxuICAgICAgdGhpcy5fcy5fb25idWZmZXJjaGFuZ2UoMSk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgcGxheTogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAvLyBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBwbGF5KCknKTtcclxuICAgICAgLy8gb25jZSBwbGF5IHN0YXJ0cywgbm8gYnVmZmVyaW5nXHJcbiAgICAgIHRoaXMuX3MuX29uYnVmZmVyY2hhbmdlKDApO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIHBsYXlpbmc6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogcGxheWluZycpO1xyXG4gICAgICAvLyBvbmNlIHBsYXkgc3RhcnRzLCBubyBidWZmZXJpbmdcclxuICAgICAgdGhpcy5fcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgcHJvZ3Jlc3M6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKGUpIHtcclxuXHJcbiAgICAgIC8vIG5vdGU6IGNhbiBmaXJlIHJlcGVhdGVkbHkgYWZ0ZXIgXCJsb2FkZWRcIiBldmVudCwgZHVlIHRvIHVzZSBvZiBIVFRQIHJhbmdlL3BhcnRpYWxzXHJcblxyXG4gICAgICB2YXIgcyA9IHRoaXMuX3MsXHJcbiAgICAgICAgICBpLCBqLCBwcm9nU3RyLCBidWZmZXJlZCA9IDAsXHJcbiAgICAgICAgICBpc1Byb2dyZXNzID0gKGUudHlwZSA9PT0gJ3Byb2dyZXNzJyksXHJcbiAgICAgICAgICByYW5nZXMgPSBlLnRhcmdldC5idWZmZXJlZCxcclxuICAgICAgICAgIC8vIGZpcmVmb3ggMy42IGltcGxlbWVudHMgZS5sb2FkZWQvdG90YWwgKGJ5dGVzKVxyXG4gICAgICAgICAgbG9hZGVkID0gKGUubG9hZGVkfHwwKSxcclxuICAgICAgICAgIHRvdGFsID0gKGUudG90YWx8fDEpO1xyXG5cclxuICAgICAgLy8gcmVzZXQgdGhlIFwiYnVmZmVyZWRcIiAobG9hZGVkIGJ5dGUgcmFuZ2VzKSBhcnJheVxyXG4gICAgICBzLmJ1ZmZlcmVkID0gW107XHJcblxyXG4gICAgICBpZiAocmFuZ2VzICYmIHJhbmdlcy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgbG9hZGVkIGlzIDAsIHRyeSBUaW1lUmFuZ2VzIGltcGxlbWVudGF0aW9uIGFzICUgb2YgbG9hZFxyXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0RPTS9UaW1lUmFuZ2VzXHJcblxyXG4gICAgICAgIC8vIHJlLWJ1aWxkIFwiYnVmZmVyZWRcIiBhcnJheVxyXG4gICAgICAgIC8vIEhUTUw1IHJldHVybnMgc2Vjb25kcy4gU00yIEFQSSB1c2VzIG1zZWMgZm9yIHNldFBvc2l0aW9uKCkgZXRjLiwgd2hldGhlciBGbGFzaCBvciBIVE1MNS5cclxuICAgICAgICBmb3IgKGk9MCwgaj1yYW5nZXMubGVuZ3RoOyBpPGo7IGkrKykge1xyXG4gICAgICAgICAgcy5idWZmZXJlZC5wdXNoKHtcclxuICAgICAgICAgICAgJ3N0YXJ0JzogcmFuZ2VzLnN0YXJ0KGkpICogbXNlY1NjYWxlLFxyXG4gICAgICAgICAgICAnZW5kJzogcmFuZ2VzLmVuZChpKSAqIG1zZWNTY2FsZVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB1c2UgdGhlIGxhc3QgdmFsdWUgbG9jYWxseVxyXG4gICAgICAgIGJ1ZmZlcmVkID0gKHJhbmdlcy5lbmQoMCkgLSByYW5nZXMuc3RhcnQoMCkpICogbXNlY1NjYWxlO1xyXG5cclxuICAgICAgICAvLyBsaW5lYXIgY2FzZSwgYnVmZmVyIHN1bTsgZG9lcyBub3QgYWNjb3VudCBmb3Igc2Vla2luZyBhbmQgSFRUUCBwYXJ0aWFscyAvIGJ5dGUgcmFuZ2VzXHJcbiAgICAgICAgbG9hZGVkID0gTWF0aC5taW4oMSwgYnVmZmVyZWQvKGUudGFyZ2V0LmR1cmF0aW9uKm1zZWNTY2FsZSkpO1xyXG5cclxuICAgICAgICAvLyA8ZD5cclxuICAgICAgICBpZiAoaXNQcm9ncmVzcyAmJiByYW5nZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgcHJvZ1N0ciA9IFtdO1xyXG4gICAgICAgICAgaiA9IHJhbmdlcy5sZW5ndGg7XHJcbiAgICAgICAgICBmb3IgKGk9MDsgaTxqOyBpKyspIHtcclxuICAgICAgICAgICAgcHJvZ1N0ci5wdXNoKGUudGFyZ2V0LmJ1ZmZlcmVkLnN0YXJ0KGkpKm1zZWNTY2FsZSArJy0nKyBlLnRhcmdldC5idWZmZXJlZC5lbmQoaSkqbXNlY1NjYWxlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHByb2dyZXNzLCB0aW1lUmFuZ2VzOiAnICsgcHJvZ1N0ci5qb2luKCcsICcpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1Byb2dyZXNzICYmICFpc05hTihsb2FkZWQpKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBwcm9ncmVzcywgJyArIE1hdGguZmxvb3IobG9hZGVkKjEwMCkgKyAnJSBsb2FkZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFpc05hTihsb2FkZWQpKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIHByb2dyZXNzLCBsaWtlbHkgbm90IGJ1ZmZlcmluZ1xyXG4gICAgICAgIHMuX29uYnVmZmVyY2hhbmdlKDApO1xyXG4gICAgICAgIC8vIFRPRE86IHByZXZlbnQgY2FsbHMgd2l0aCBkdXBsaWNhdGUgdmFsdWVzLlxyXG4gICAgICAgIHMuX3doaWxlbG9hZGluZyhsb2FkZWQsIHRvdGFsLCBzLl9nZXRfaHRtbDVfZHVyYXRpb24oKSk7XHJcbiAgICAgICAgaWYgKGxvYWRlZCAmJiB0b3RhbCAmJiBsb2FkZWQgPT09IHRvdGFsKSB7XHJcbiAgICAgICAgICAvLyBpbiBjYXNlIFwib25sb2FkXCIgZG9lc24ndCBmaXJlIChlZy4gZ2Vja28gMS45LjIpXHJcbiAgICAgICAgICBodG1sNV9ldmVudHMuY2FucGxheXRocm91Z2guY2FsbCh0aGlzLCBlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgcmF0ZWNoYW5nZTogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiByYXRlY2hhbmdlJyk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgc3VzcGVuZDogaHRtbDVfZXZlbnQoZnVuY3Rpb24oZSkge1xyXG5cclxuICAgICAgLy8gZG93bmxvYWQgcGF1c2VkL3N0b3BwZWQsIG1heSBoYXZlIGZpbmlzaGVkIChlZy4gb25sb2FkKVxyXG4gICAgICB2YXIgcyA9IHRoaXMuX3M7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBzdXNwZW5kJyk7XHJcbiAgICAgIGh0bWw1X2V2ZW50cy5wcm9ncmVzcy5jYWxsKHRoaXMsIGUpO1xyXG4gICAgICBzLl9vbnN1c3BlbmQoKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBzdGFsbGVkOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHN0YWxsZWQnKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICB0aW1ldXBkYXRlOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX3MuX29uVGltZXIoKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICB3YWl0aW5nOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcztcclxuXHJcbiAgICAgIC8vIHNlZSBhbHNvOiBzZWVraW5nXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHdhaXRpbmcnKTtcclxuXHJcbiAgICAgIC8vIHBsYXliYWNrIGZhc3RlciB0aGFuIGRvd25sb2FkIHJhdGUsIGV0Yy5cclxuICAgICAgcy5fb25idWZmZXJjaGFuZ2UoMSk7XHJcblxyXG4gICAgfSlcclxuXHJcbiAgfTtcclxuXHJcbiAgaHRtbDVPSyA9IGZ1bmN0aW9uKGlPKSB7XHJcblxyXG4gICAgLy8gcGxheWFiaWxpdHkgdGVzdCBiYXNlZCBvbiBVUkwgb3IgTUlNRSB0eXBlXHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuXHJcbiAgICBpZiAoIWlPIHx8ICghaU8udHlwZSAmJiAhaU8udXJsICYmICFpTy5zZXJ2ZXJVUkwpKSB7XHJcblxyXG4gICAgICAvLyBub3RoaW5nIHRvIGNoZWNrXHJcbiAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgIH0gZWxzZSBpZiAoaU8uc2VydmVyVVJMIHx8IChpTy50eXBlICYmIHByZWZlckZsYXNoQ2hlY2soaU8udHlwZSkpKSB7XHJcblxyXG4gICAgICAvLyBSVE1QLCBvciBwcmVmZXJyaW5nIGZsYXNoXHJcbiAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBVc2UgdHlwZSwgaWYgc3BlY2lmaWVkLiBQYXNzIGRhdGE6IFVSSXMgdG8gSFRNTDUuIElmIEhUTUw1LW9ubHkgbW9kZSwgbm8gb3RoZXIgb3B0aW9ucywgc28ganVzdCBnaXZlICdlclxyXG4gICAgICByZXN1bHQgPSAoKGlPLnR5cGUgPyBodG1sNUNhblBsYXkoe3R5cGU6aU8udHlwZX0pIDogaHRtbDVDYW5QbGF5KHt1cmw6aU8udXJsfSkgfHwgc20yLmh0bWw1T25seSB8fCBpTy51cmwubWF0Y2goL2RhdGFcXDovaSkpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgaHRtbDVVbmxvYWQgPSBmdW5jdGlvbihvQXVkaW8pIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludGVybmFsIG1ldGhvZDogVW5sb2FkIG1lZGlhLCBhbmQgY2FuY2VsIGFueSBjdXJyZW50L3BlbmRpbmcgbmV0d29yayByZXF1ZXN0cy5cclxuICAgICAqIEZpcmVmb3ggY2FuIGxvYWQgYW4gZW1wdHkgVVJMLCB3aGljaCBhbGxlZ2VkbHkgZGVzdHJveXMgdGhlIGRlY29kZXIgYW5kIHN0b3BzIHRoZSBkb3dubG9hZC5cclxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL0VuL1VzaW5nX2F1ZGlvX2FuZF92aWRlb19pbl9GaXJlZm94I1N0b3BwaW5nX3RoZV9kb3dubG9hZF9vZl9tZWRpYVxyXG4gICAgICogSG93ZXZlciwgRmlyZWZveCBoYXMgYmVlbiBzZWVuIGxvYWRpbmcgYSByZWxhdGl2ZSBVUkwgZnJvbSAnJyBhbmQgdGh1cyByZXF1ZXN0aW5nIHRoZSBob3N0aW5nIHBhZ2Ugb24gdW5sb2FkLlxyXG4gICAgICogT3RoZXIgVUEgYmVoYXZpb3VyIGlzIHVuY2xlYXIsIHNvIGV2ZXJ5b25lIGVsc2UgZ2V0cyBhbiBhYm91dDpibGFuay1zdHlsZSBVUkwuXHJcbiAgICAgKi9cclxuXHJcbiAgICB2YXIgdXJsO1xyXG5cclxuICAgIGlmIChvQXVkaW8pIHtcclxuXHJcbiAgICAgIC8vIEZpcmVmb3ggYW5kIENocm9tZSBhY2NlcHQgc2hvcnQgV0FWZSBkYXRhOiBVUklzLiBDaG9tZSBkaXNsaWtlcyBhdWRpby93YXYsIGJ1dCBhY2NlcHRzIGF1ZGlvL3dhdiBmb3IgZGF0YTogTUlNRS5cclxuICAgICAgLy8gRGVza3RvcCBTYWZhcmkgY29tcGxhaW5zIC8gZmFpbHMgb24gZGF0YTogVVJJLCBzbyBpdCBnZXRzIGFib3V0OmJsYW5rLlxyXG4gICAgICB1cmwgPSAoaXNTYWZhcmkgPyBlbXB0eVVSTCA6IChzbTIuaHRtbDUuY2FuUGxheVR5cGUoJ2F1ZGlvL3dhdicpID8gZW1wdHlXQVYgOiBlbXB0eVVSTCkpO1xyXG5cclxuICAgICAgb0F1ZGlvLnNyYyA9IHVybDtcclxuXHJcbiAgICAgIC8vIHJlc2V0IHNvbWUgc3RhdGUsIHRvb1xyXG4gICAgICBpZiAob0F1ZGlvLl9jYWxsZWRfdW5sb2FkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBvQXVkaW8uX2NhbGxlZF9sb2FkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHVzZUdsb2JhbEhUTUw1QXVkaW8pIHtcclxuXHJcbiAgICAgIC8vIGVuc3VyZSBVUkwgc3RhdGUgaXMgdHJhc2hlZCwgYWxzb1xyXG4gICAgICBsYXN0R2xvYmFsSFRNTDVVUkwgPSBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG5cclxuICB9O1xyXG5cclxuICBodG1sNUNhblBsYXkgPSBmdW5jdGlvbihvKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcnkgdG8gZmluZCBNSU1FLCB0ZXN0IGFuZCByZXR1cm4gdHJ1dGhpbmVzc1xyXG4gICAgICogbyA9IHtcclxuICAgICAqICB1cmw6ICcvcGF0aC90by9hbi5tcDMnLFxyXG4gICAgICogIHR5cGU6ICdhdWRpby9tcDMnXHJcbiAgICAgKiB9XHJcbiAgICAgKi9cclxuXHJcbiAgICBpZiAoIXNtMi51c2VIVE1MNUF1ZGlvIHx8ICFzbTIuaGFzSFRNTDUpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB1cmwgPSAoby51cmwgfHwgbnVsbCksXHJcbiAgICAgICAgbWltZSA9IChvLnR5cGUgfHwgbnVsbCksXHJcbiAgICAgICAgYUYgPSBzbTIuYXVkaW9Gb3JtYXRzLFxyXG4gICAgICAgIHJlc3VsdCxcclxuICAgICAgICBvZmZzZXQsXHJcbiAgICAgICAgZmlsZUV4dCxcclxuICAgICAgICBpdGVtO1xyXG5cclxuICAgIC8vIGFjY291bnQgZm9yIGtub3duIGNhc2VzIGxpa2UgYXVkaW8vbXAzXHJcblxyXG4gICAgaWYgKG1pbWUgJiYgc20yLmh0bWw1W21pbWVdICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAoc20yLmh0bWw1W21pbWVdICYmICFwcmVmZXJGbGFzaENoZWNrKG1pbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWh0bWw1RXh0KSB7XHJcbiAgICAgIGh0bWw1RXh0ID0gW107XHJcbiAgICAgIGZvciAoaXRlbSBpbiBhRikge1xyXG4gICAgICAgIGlmIChhRi5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xyXG4gICAgICAgICAgaHRtbDVFeHQucHVzaChpdGVtKTtcclxuICAgICAgICAgIGlmIChhRltpdGVtXS5yZWxhdGVkKSB7XHJcbiAgICAgICAgICAgIGh0bWw1RXh0ID0gaHRtbDVFeHQuY29uY2F0KGFGW2l0ZW1dLnJlbGF0ZWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBodG1sNUV4dCA9IG5ldyBSZWdFeHAoJ1xcXFwuKCcraHRtbDVFeHQuam9pbignfCcpKycpKFxcXFw/LiopPyQnLCdpJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogU3RyaXAgVVJMIHF1ZXJpZXMsIGV0Yy5cclxuICAgIGZpbGVFeHQgPSAodXJsID8gdXJsLnRvTG93ZXJDYXNlKCkubWF0Y2goaHRtbDVFeHQpIDogbnVsbCk7XHJcblxyXG4gICAgaWYgKCFmaWxlRXh0IHx8ICFmaWxlRXh0Lmxlbmd0aCkge1xyXG4gICAgICBpZiAoIW1pbWUpIHtcclxuICAgICAgICByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBhdWRpby9tcDMgLT4gbXAzLCByZXN1bHQgc2hvdWxkIGJlIGtub3duXHJcbiAgICAgICAgb2Zmc2V0ID0gbWltZS5pbmRleE9mKCc7Jyk7XHJcbiAgICAgICAgLy8gc3RyaXAgXCJhdWRpby9YOyBjb2RlY3MuLi5cIlxyXG4gICAgICAgIGZpbGVFeHQgPSAob2Zmc2V0ICE9PSAtMT9taW1lLnN1YnN0cigwLG9mZnNldCk6bWltZSkuc3Vic3RyKDYpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBtYXRjaCB0aGUgcmF3IGV4dGVuc2lvbiBuYW1lIC0gXCJtcDNcIiwgZm9yIGV4YW1wbGVcclxuICAgICAgZmlsZUV4dCA9IGZpbGVFeHRbMV07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZpbGVFeHQgJiYgc20yLmh0bWw1W2ZpbGVFeHRdICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIHJlc3VsdCBrbm93blxyXG4gICAgICByZXN1bHQgPSAoc20yLmh0bWw1W2ZpbGVFeHRdICYmICFwcmVmZXJGbGFzaENoZWNrKGZpbGVFeHQpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1pbWUgPSAnYXVkaW8vJytmaWxlRXh0O1xyXG4gICAgICByZXN1bHQgPSBzbTIuaHRtbDUuY2FuUGxheVR5cGUoe3R5cGU6bWltZX0pO1xyXG4gICAgICBzbTIuaHRtbDVbZmlsZUV4dF0gPSByZXN1bHQ7XHJcbiAgICAgIC8vIHNtMi5fd0QoJ2NhblBsYXlUeXBlLCBmb3VuZCByZXN1bHQ6ICcgKyByZXN1bHQpO1xyXG4gICAgICByZXN1bHQgPSAocmVzdWx0ICYmIHNtMi5odG1sNVttaW1lXSAmJiAhcHJlZmVyRmxhc2hDaGVjayhtaW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgdGVzdEhUTUw1ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnRlcm5hbDogSXRlcmF0ZXMgb3ZlciBhdWRpb0Zvcm1hdHMsIGRldGVybWluaW5nIHN1cHBvcnQgZWcuIGF1ZGlvL21wMywgYXVkaW8vbXBlZyBhbmQgc28gb25cclxuICAgICAqIGFzc2lnbnMgcmVzdWx0cyB0byBodG1sNVtdIGFuZCBmbGFzaFtdLlxyXG4gICAgICovXHJcblxyXG4gICAgaWYgKCFzbTIudXNlSFRNTDVBdWRpbyB8fCAhc20yLmhhc0hUTUw1KSB7XHJcbiAgICAgIC8vIHdpdGhvdXQgSFRNTDUsIHdlIG5lZWQgRmxhc2guXHJcbiAgICAgIHNtMi5odG1sNS51c2luZ0ZsYXNoID0gdHJ1ZTtcclxuICAgICAgbmVlZHNGbGFzaCA9IHRydWU7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb3VibGUtd2hhbW15OiBPcGVyYSA5LjY0IHRocm93cyBXUk9OR19BUkdVTUVOVFNfRVJSIGlmIG5vIHBhcmFtZXRlciBwYXNzZWQgdG8gQXVkaW8oKSwgYW5kIFdlYmtpdCArIGlPUyBoYXBwaWx5IHRyaWVzIHRvIGxvYWQgXCJudWxsXCIgYXMgYSBVUkwuIDovXHJcbiAgICB2YXIgYSA9IChBdWRpbyAhPT0gX3VuZGVmaW5lZCA/IChpc09wZXJhICYmIG9wZXJhLnZlcnNpb24oKSA8IDEwID8gbmV3IEF1ZGlvKG51bGwpIDogbmV3IEF1ZGlvKCkpIDogbnVsbCksXHJcbiAgICAgICAgaXRlbSwgbG9va3VwLCBzdXBwb3J0ID0ge30sIGFGLCBpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGNwKG0pIHtcclxuXHJcbiAgICAgIHZhciBjYW5QbGF5LCBqLFxyXG4gICAgICAgICAgcmVzdWx0ID0gZmFsc2UsXHJcbiAgICAgICAgICBpc09LID0gZmFsc2U7XHJcblxyXG4gICAgICBpZiAoIWEgfHwgdHlwZW9mIGEuY2FuUGxheVR5cGUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobSBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgLy8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBtaW1lIHR5cGVzLCByZXR1cm4gYW55IHN1Y2Nlc3Nlc1xyXG4gICAgICAgIGZvciAoaT0wLCBqPW0ubGVuZ3RoOyBpPGo7IGkrKykge1xyXG4gICAgICAgICAgaWYgKHNtMi5odG1sNVttW2ldXSB8fCBhLmNhblBsYXlUeXBlKG1baV0pLm1hdGNoKHNtMi5odG1sNVRlc3QpKSB7XHJcbiAgICAgICAgICAgIGlzT0sgPSB0cnVlO1xyXG4gICAgICAgICAgICBzbTIuaHRtbDVbbVtpXV0gPSB0cnVlO1xyXG4gICAgICAgICAgICAvLyBub3RlIGZsYXNoIHN1cHBvcnQsIHRvb1xyXG4gICAgICAgICAgICBzbTIuZmxhc2hbbVtpXV0gPSAhIShtW2ldLm1hdGNoKGZsYXNoTUlNRSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXN1bHQgPSBpc09LO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNhblBsYXkgPSAoYSAmJiB0eXBlb2YgYS5jYW5QbGF5VHlwZSA9PT0gJ2Z1bmN0aW9uJyA/IGEuY2FuUGxheVR5cGUobSkgOiBmYWxzZSk7XHJcbiAgICAgICAgcmVzdWx0ID0gISEoY2FuUGxheSAmJiAoY2FuUGxheS5tYXRjaChzbTIuaHRtbDVUZXN0KSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyB0ZXN0IGFsbCByZWdpc3RlcmVkIGZvcm1hdHMgKyBjb2RlY3NcclxuXHJcbiAgICBhRiA9IHNtMi5hdWRpb0Zvcm1hdHM7XHJcblxyXG4gICAgZm9yIChpdGVtIGluIGFGKSB7XHJcblxyXG4gICAgICBpZiAoYUYuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcclxuXHJcbiAgICAgICAgbG9va3VwID0gJ2F1ZGlvLycgKyBpdGVtO1xyXG5cclxuICAgICAgICBzdXBwb3J0W2l0ZW1dID0gY3AoYUZbaXRlbV0udHlwZSk7XHJcblxyXG4gICAgICAgIC8vIHdyaXRlIGJhY2sgZ2VuZXJpYyB0eXBlIHRvbywgZWcuIGF1ZGlvL21wM1xyXG4gICAgICAgIHN1cHBvcnRbbG9va3VwXSA9IHN1cHBvcnRbaXRlbV07XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiBmbGFzaFxyXG4gICAgICAgIGlmIChpdGVtLm1hdGNoKGZsYXNoTUlNRSkpIHtcclxuXHJcbiAgICAgICAgICBzbTIuZmxhc2hbaXRlbV0gPSB0cnVlO1xyXG4gICAgICAgICAgc20yLmZsYXNoW2xvb2t1cF0gPSB0cnVlO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHNtMi5mbGFzaFtpdGVtXSA9IGZhbHNlO1xyXG4gICAgICAgICAgc20yLmZsYXNoW2xvb2t1cF0gPSBmYWxzZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhc3NpZ24gcmVzdWx0IHRvIHJlbGF0ZWQgZm9ybWF0cywgdG9vXHJcblxyXG4gICAgICAgIGlmIChhRltpdGVtXSAmJiBhRltpdGVtXS5yZWxhdGVkKSB7XHJcblxyXG4gICAgICAgICAgZm9yIChpPWFGW2l0ZW1dLnJlbGF0ZWQubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBlZy4gYXVkaW8vbTRhXHJcbiAgICAgICAgICAgIHN1cHBvcnRbJ2F1ZGlvLycrYUZbaXRlbV0ucmVsYXRlZFtpXV0gPSBzdXBwb3J0W2l0ZW1dO1xyXG4gICAgICAgICAgICBzbTIuaHRtbDVbYUZbaXRlbV0ucmVsYXRlZFtpXV0gPSBzdXBwb3J0W2l0ZW1dO1xyXG4gICAgICAgICAgICBzbTIuZmxhc2hbYUZbaXRlbV0ucmVsYXRlZFtpXV0gPSBzdXBwb3J0W2l0ZW1dO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdXBwb3J0LmNhblBsYXlUeXBlID0gKGE/Y3A6bnVsbCk7XHJcbiAgICBzbTIuaHRtbDUgPSBtaXhpbihzbTIuaHRtbDUsIHN1cHBvcnQpO1xyXG5cclxuICAgIHNtMi5odG1sNS51c2luZ0ZsYXNoID0gZmVhdHVyZUNoZWNrKCk7XHJcbiAgICBuZWVkc0ZsYXNoID0gc20yLmh0bWw1LnVzaW5nRmxhc2g7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIHN0cmluZ3MgPSB7XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBub3RSZWFkeTogJ1VuYXZhaWxhYmxlIC0gd2FpdCB1bnRpbCBvbnJlYWR5KCkgaGFzIGZpcmVkLicsXHJcbiAgICBub3RPSzogJ0F1ZGlvIHN1cHBvcnQgaXMgbm90IGF2YWlsYWJsZS4nLFxyXG4gICAgZG9tRXJyb3I6IHNtICsgJ2V4Y2VwdGlvbiBjYXVnaHQgd2hpbGUgYXBwZW5kaW5nIFNXRiB0byBET00uJyxcclxuICAgIHNwY1dtb2RlOiAnUmVtb3Zpbmcgd21vZGUsIHByZXZlbnRpbmcga25vd24gU1dGIGxvYWRpbmcgaXNzdWUocyknLFxyXG4gICAgc3dmNDA0OiBzbWMgKyAnVmVyaWZ5IHRoYXQgJXMgaXMgYSB2YWxpZCBwYXRoLicsXHJcbiAgICB0cnlEZWJ1ZzogJ1RyeSAnICsgc20gKyAnLmRlYnVnRmxhc2ggPSB0cnVlIGZvciBtb3JlIHNlY3VyaXR5IGRldGFpbHMgKG91dHB1dCBnb2VzIHRvIFNXRi4pJyxcclxuICAgIGNoZWNrU1dGOiAnU2VlIFNXRiBvdXRwdXQgZm9yIG1vcmUgZGVidWcgaW5mby4nLFxyXG4gICAgbG9jYWxGYWlsOiBzbWMgKyAnTm9uLUhUVFAgcGFnZSAoJyArIGRvYy5sb2NhdGlvbi5wcm90b2NvbCArICcgVVJMPykgUmV2aWV3IEZsYXNoIHBsYXllciBzZWN1cml0eSBzZXR0aW5ncyBmb3IgdGhpcyBzcGVjaWFsIGNhc2U6XFxuaHR0cDovL3d3dy5tYWNyb21lZGlhLmNvbS9zdXBwb3J0L2RvY3VtZW50YXRpb24vZW4vZmxhc2hwbGF5ZXIvaGVscC9zZXR0aW5nc19tYW5hZ2VyMDQuaHRtbFxcbk1heSBuZWVkIHRvIGFkZC9hbGxvdyBwYXRoLCBlZy4gYzovc20yLyBvciAvdXNlcnMvbWUvc20yLycsXHJcbiAgICB3YWl0Rm9jdXM6IHNtYyArICdTcGVjaWFsIGNhc2U6IFdhaXRpbmcgZm9yIFNXRiB0byBsb2FkIHdpdGggd2luZG93IGZvY3VzLi4uJyxcclxuICAgIHdhaXRGb3JldmVyOiBzbWMgKyAnV2FpdGluZyBpbmRlZmluaXRlbHkgZm9yIEZsYXNoICh3aWxsIHJlY292ZXIgaWYgdW5ibG9ja2VkKS4uLicsXHJcbiAgICB3YWl0U1dGOiBzbWMgKyAnV2FpdGluZyBmb3IgMTAwJSBTV0YgbG9hZC4uLicsXHJcbiAgICBuZWVkRnVuY3Rpb246IHNtYyArICdGdW5jdGlvbiBvYmplY3QgZXhwZWN0ZWQgZm9yICVzJyxcclxuICAgIGJhZElEOiAnU291bmQgSUQgXCIlc1wiIHNob3VsZCBiZSBhIHN0cmluZywgc3RhcnRpbmcgd2l0aCBhIG5vbi1udW1lcmljIGNoYXJhY3RlcicsXHJcbiAgICBjdXJyZW50T2JqOiBzbWMgKyAnX2RlYnVnKCk6IEN1cnJlbnQgc291bmQgb2JqZWN0cycsXHJcbiAgICB3YWl0T25sb2FkOiBzbWMgKyAnV2FpdGluZyBmb3Igd2luZG93Lm9ubG9hZCgpJyxcclxuICAgIGRvY0xvYWRlZDogc21jICsgJ0RvY3VtZW50IGFscmVhZHkgbG9hZGVkJyxcclxuICAgIG9ubG9hZDogc21jICsgJ2luaXRDb21wbGV0ZSgpOiBjYWxsaW5nIHNvdW5kTWFuYWdlci5vbmxvYWQoKScsXHJcbiAgICBvbmxvYWRPSzogc20gKyAnLm9ubG9hZCgpIGNvbXBsZXRlJyxcclxuICAgIGRpZEluaXQ6IHNtYyArICdpbml0KCk6IEFscmVhZHkgY2FsbGVkPycsXHJcbiAgICBzZWNOb3RlOiAnRmxhc2ggc2VjdXJpdHkgbm90ZTogTmV0d29yay9pbnRlcm5ldCBVUkxzIHdpbGwgbm90IGxvYWQgZHVlIHRvIHNlY3VyaXR5IHJlc3RyaWN0aW9ucy4gQWNjZXNzIGNhbiBiZSBjb25maWd1cmVkIHZpYSBGbGFzaCBQbGF5ZXIgR2xvYmFsIFNlY3VyaXR5IFNldHRpbmdzIFBhZ2U6IGh0dHA6Ly93d3cubWFjcm9tZWRpYS5jb20vc3VwcG9ydC9kb2N1bWVudGF0aW9uL2VuL2ZsYXNocGxheWVyL2hlbHAvc2V0dGluZ3NfbWFuYWdlcjA0Lmh0bWwnLFxyXG4gICAgYmFkUmVtb3ZlOiBzbWMgKyAnRmFpbGVkIHRvIHJlbW92ZSBGbGFzaCBub2RlLicsXHJcbiAgICBzaHV0ZG93bjogc20gKyAnLmRpc2FibGUoKTogU2h1dHRpbmcgZG93bicsXHJcbiAgICBxdWV1ZTogc21jICsgJ1F1ZXVlaW5nICVzIGhhbmRsZXInLFxyXG4gICAgc21FcnJvcjogJ1NNU291bmQubG9hZCgpOiBFeGNlcHRpb246IEpTLUZsYXNoIGNvbW11bmljYXRpb24gZmFpbGVkLCBvciBKUyBlcnJvci4nLFxyXG4gICAgZmJUaW1lb3V0OiAnTm8gZmxhc2ggcmVzcG9uc2UsIGFwcGx5aW5nIC4nK3N3ZkNTUy5zd2ZUaW1lZG91dCsnIENTUy4uLicsXHJcbiAgICBmYkxvYWRlZDogJ0ZsYXNoIGxvYWRlZCcsXHJcbiAgICBmYkhhbmRsZXI6IHNtYyArICdmbGFzaEJsb2NrSGFuZGxlcigpJyxcclxuICAgIG1hblVSTDogJ1NNU291bmQubG9hZCgpOiBVc2luZyBtYW51YWxseS1hc3NpZ25lZCBVUkwnLFxyXG4gICAgb25VUkw6IHNtICsgJy5sb2FkKCk6IGN1cnJlbnQgVVJMIGFscmVhZHkgYXNzaWduZWQuJyxcclxuICAgIGJhZEZWOiBzbSArICcuZmxhc2hWZXJzaW9uIG11c3QgYmUgOCBvciA5LiBcIiVzXCIgaXMgaW52YWxpZC4gUmV2ZXJ0aW5nIHRvICVzLicsXHJcbiAgICBhczJsb29wOiAnTm90ZTogU2V0dGluZyBzdHJlYW06ZmFsc2Ugc28gbG9vcGluZyBjYW4gd29yayAoZmxhc2ggOCBsaW1pdGF0aW9uKScsXHJcbiAgICBub05TTG9vcDogJ05vdGU6IExvb3Bpbmcgbm90IGltcGxlbWVudGVkIGZvciBNb3ZpZVN0YXIgZm9ybWF0cycsXHJcbiAgICBuZWVkZmw5OiAnTm90ZTogU3dpdGNoaW5nIHRvIGZsYXNoIDksIHJlcXVpcmVkIGZvciBNUDQgZm9ybWF0cy4nLFxyXG4gICAgbWZUaW1lb3V0OiAnU2V0dGluZyBmbGFzaExvYWRUaW1lb3V0ID0gMCAoaW5maW5pdGUpIGZvciBvZmYtc2NyZWVuLCBtb2JpbGUgZmxhc2ggY2FzZScsXHJcbiAgICBuZWVkRmxhc2g6IHNtYyArICdGYXRhbCBlcnJvcjogRmxhc2ggaXMgbmVlZGVkIHRvIHBsYXkgc29tZSByZXF1aXJlZCBmb3JtYXRzLCBidXQgaXMgbm90IGF2YWlsYWJsZS4nLFxyXG4gICAgZ290Rm9jdXM6IHNtYyArICdHb3Qgd2luZG93IGZvY3VzLicsXHJcbiAgICBwb2xpY3k6ICdFbmFibGluZyB1c2VQb2xpY3lGaWxlIGZvciBkYXRhIGFjY2VzcycsXHJcbiAgICBzZXR1cDogc20gKyAnLnNldHVwKCk6IGFsbG93ZWQgcGFyYW1ldGVyczogJXMnLFxyXG4gICAgc2V0dXBFcnJvcjogc20gKyAnLnNldHVwKCk6IFwiJXNcIiBjYW5ub3QgYmUgYXNzaWduZWQgd2l0aCB0aGlzIG1ldGhvZC4nLFxyXG4gICAgc2V0dXBVbmRlZjogc20gKyAnLnNldHVwKCk6IENvdWxkIG5vdCBmaW5kIG9wdGlvbiBcIiVzXCInLFxyXG4gICAgc2V0dXBMYXRlOiBzbSArICcuc2V0dXAoKTogdXJsLCBmbGFzaFZlcnNpb24gYW5kIGh0bWw1VGVzdCBwcm9wZXJ0eSBjaGFuZ2VzIHdpbGwgbm90IHRha2UgZWZmZWN0IHVudGlsIHJlYm9vdCgpLicsXHJcbiAgICBub1VSTDogc21jICsgJ0ZsYXNoIFVSTCByZXF1aXJlZC4gQ2FsbCBzb3VuZE1hbmFnZXIuc2V0dXAoe3VybDouLi59KSB0byBnZXQgc3RhcnRlZC4nLFxyXG4gICAgc20yTG9hZGVkOiAnU291bmRNYW5hZ2VyIDI6IFJlYWR5LicsXHJcbiAgICByZXNldDogc20gKyAnLnJlc2V0KCk6IFJlbW92aW5nIGV2ZW50IGNhbGxiYWNrcycsXHJcbiAgICBtb2JpbGVVQTogJ01vYmlsZSBVQSBkZXRlY3RlZCwgcHJlZmVycmluZyBIVE1MNSBieSBkZWZhdWx0LicsXHJcbiAgICBnbG9iYWxIVE1MNTogJ1VzaW5nIHNpbmdsZXRvbiBIVE1MNSBBdWRpbygpIHBhdHRlcm4gZm9yIHRoaXMgZGV2aWNlLidcclxuICAgIC8vIDwvZD5cclxuXHJcbiAgfTtcclxuXHJcbiAgc3RyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgc3RyaW5nIHJlcGxhY2UgaGVscGVyLlxyXG4gICAgLy8gYXJndW1lbnRzOiBvIFssaXRlbXMgdG8gcmVwbGFjZV1cclxuICAgIC8vIDxkPlxyXG5cclxuICAgIHZhciBhcmdzLFxyXG4gICAgICAgIGksIGosIG8sXHJcbiAgICAgICAgc3N0cjtcclxuXHJcbiAgICAvLyByZWFsIGFycmF5LCBwbGVhc2VcclxuICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblxyXG4gICAgLy8gZmlyc3QgYXJndW1lbnRcclxuICAgIG8gPSBhcmdzLnNoaWZ0KCk7XHJcblxyXG4gICAgc3N0ciA9IChzdHJpbmdzICYmIHN0cmluZ3Nbb10gPyBzdHJpbmdzW29dIDogJycpO1xyXG5cclxuICAgIGlmIChzc3RyICYmIGFyZ3MgJiYgYXJncy5sZW5ndGgpIHtcclxuICAgICAgZm9yIChpID0gMCwgaiA9IGFyZ3MubGVuZ3RoOyBpIDwgajsgaSsrKSB7XHJcbiAgICAgICAgc3N0ciA9IHNzdHIucmVwbGFjZSgnJXMnLCBhcmdzW2ldKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzc3RyO1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBsb29wRml4ID0gZnVuY3Rpb24oc09wdCkge1xyXG5cclxuICAgIC8vIGZsYXNoIDggcmVxdWlyZXMgc3RyZWFtID0gZmFsc2UgZm9yIGxvb3BpbmcgdG8gd29ya1xyXG4gICAgaWYgKGZWID09PSA4ICYmIHNPcHQubG9vcHMgPiAxICYmIHNPcHQuc3RyZWFtKSB7XHJcbiAgICAgIF93RFMoJ2FzMmxvb3AnKTtcclxuICAgICAgc09wdC5zdHJlYW0gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc09wdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgcG9saWN5Rml4ID0gZnVuY3Rpb24oc09wdCwgc1ByZSkge1xyXG5cclxuICAgIGlmIChzT3B0ICYmICFzT3B0LnVzZVBvbGljeUZpbGUgJiYgKHNPcHQub25pZDMgfHwgc09wdC51c2VQZWFrRGF0YSB8fCBzT3B0LnVzZVdhdmVmb3JtRGF0YSB8fCBzT3B0LnVzZUVRRGF0YSkpIHtcclxuICAgICAgc20yLl93RCgoc1ByZSB8fCAnJykgKyBzdHIoJ3BvbGljeScpKTtcclxuICAgICAgc09wdC51c2VQb2xpY3lGaWxlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc09wdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgY29tcGxhaW4gPSBmdW5jdGlvbihzTXNnKSB7XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBpZiAoaGFzQ29uc29sZSAmJiBjb25zb2xlLndhcm4gIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgY29uc29sZS53YXJuKHNNc2cpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc20yLl93RChzTXNnKTtcclxuICAgIH1cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgfTtcclxuXHJcbiAgZG9Ob3RoaW5nID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICB9O1xyXG5cclxuICBkaXNhYmxlT2JqZWN0ID0gZnVuY3Rpb24obykge1xyXG5cclxuICAgIHZhciBvUHJvcDtcclxuXHJcbiAgICBmb3IgKG9Qcm9wIGluIG8pIHtcclxuICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkob1Byb3ApICYmIHR5cGVvZiBvW29Qcm9wXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG9bb1Byb3BdID0gZG9Ob3RoaW5nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb1Byb3AgPSBudWxsO1xyXG5cclxuICB9O1xyXG5cclxuICBmYWlsU2FmZWx5ID0gZnVuY3Rpb24oYk5vRGlzYWJsZSkge1xyXG5cclxuICAgIC8vIGdlbmVyYWwgZmFpbHVyZSBleGNlcHRpb24gaGFuZGxlclxyXG5cclxuICAgIGlmIChiTm9EaXNhYmxlID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIGJOb0Rpc2FibGUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGlzYWJsZWQgfHwgYk5vRGlzYWJsZSkge1xyXG4gICAgICBzbTIuZGlzYWJsZShiTm9EaXNhYmxlKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgbm9ybWFsaXplTW92aWVVUkwgPSBmdW5jdGlvbihzbVVSTCkge1xyXG5cclxuICAgIHZhciB1cmxQYXJhbXMgPSBudWxsLCB1cmw7XHJcblxyXG4gICAgaWYgKHNtVVJMKSB7XHJcbiAgICAgIGlmIChzbVVSTC5tYXRjaCgvXFwuc3dmKFxcPy4qKT8kL2kpKSB7XHJcbiAgICAgICAgdXJsUGFyYW1zID0gc21VUkwuc3Vic3RyKHNtVVJMLnRvTG93ZXJDYXNlKCkubGFzdEluZGV4T2YoJy5zd2Y/JykgKyA0KTtcclxuICAgICAgICBpZiAodXJsUGFyYW1zKSB7XHJcbiAgICAgICAgICAvLyBhc3N1bWUgdXNlciBrbm93cyB3aGF0IHRoZXkncmUgZG9pbmdcclxuICAgICAgICAgIHJldHVybiBzbVVSTDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoc21VUkwubGFzdEluZGV4T2YoJy8nKSAhPT0gc21VUkwubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgIC8vIGFwcGVuZCB0cmFpbGluZyBzbGFzaCwgaWYgbmVlZGVkXHJcbiAgICAgICAgc21VUkwgKz0gJy8nO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdXJsID0gKHNtVVJMICYmIHNtVVJMLmxhc3RJbmRleE9mKCcvJykgIT09IC0gMSA/IHNtVVJMLnN1YnN0cigwLCBzbVVSTC5sYXN0SW5kZXhPZignLycpICsgMSkgOiAnLi8nKSArIHNtMi5tb3ZpZVVSTDtcclxuXHJcbiAgICBpZiAoc20yLm5vU1dGQ2FjaGUpIHtcclxuICAgICAgdXJsICs9ICgnP3RzPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVybDtcclxuXHJcbiAgfTtcclxuXHJcbiAgc2V0VmVyc2lvbkluZm8gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBzaG9ydC1oYW5kIGZvciBpbnRlcm5hbCB1c2VcclxuXHJcbiAgICBmViA9IHBhcnNlSW50KHNtMi5mbGFzaFZlcnNpb24sIDEwKTtcclxuXHJcbiAgICBpZiAoZlYgIT09IDggJiYgZlYgIT09IDkpIHtcclxuICAgICAgc20yLl93RChzdHIoJ2JhZEZWJywgZlYsIGRlZmF1bHRGbGFzaFZlcnNpb24pKTtcclxuICAgICAgc20yLmZsYXNoVmVyc2lvbiA9IGZWID0gZGVmYXVsdEZsYXNoVmVyc2lvbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkZWJ1ZyBmbGFzaCBtb3ZpZSwgaWYgYXBwbGljYWJsZVxyXG5cclxuICAgIHZhciBpc0RlYnVnID0gKHNtMi5kZWJ1Z01vZGUgfHwgc20yLmRlYnVnRmxhc2g/J19kZWJ1Zy5zd2YnOicuc3dmJyk7XHJcblxyXG4gICAgaWYgKHNtMi51c2VIVE1MNUF1ZGlvICYmICFzbTIuaHRtbDVPbmx5ICYmIHNtMi5hdWRpb0Zvcm1hdHMubXA0LnJlcXVpcmVkICYmIGZWIDwgOSkge1xyXG4gICAgICBzbTIuX3dEKHN0cignbmVlZGZsOScpKTtcclxuICAgICAgc20yLmZsYXNoVmVyc2lvbiA9IGZWID0gOTtcclxuICAgIH1cclxuXHJcbiAgICBzbTIudmVyc2lvbiA9IHNtMi52ZXJzaW9uTnVtYmVyICsgKHNtMi5odG1sNU9ubHk/JyAoSFRNTDUtb25seSBtb2RlKSc6KGZWID09PSA5PycgKEFTMy9GbGFzaCA5KSc6JyAoQVMyL0ZsYXNoIDgpJykpO1xyXG5cclxuICAgIC8vIHNldCB1cCBkZWZhdWx0IG9wdGlvbnNcclxuICAgIGlmIChmViA+IDgpIHtcclxuICAgICAgLy8gK2ZsYXNoIDkgYmFzZSBvcHRpb25zXHJcbiAgICAgIHNtMi5kZWZhdWx0T3B0aW9ucyA9IG1peGluKHNtMi5kZWZhdWx0T3B0aW9ucywgc20yLmZsYXNoOU9wdGlvbnMpO1xyXG4gICAgICBzbTIuZmVhdHVyZXMuYnVmZmVyaW5nID0gdHJ1ZTtcclxuICAgICAgLy8gK21vdmllc3RhciBzdXBwb3J0XHJcbiAgICAgIHNtMi5kZWZhdWx0T3B0aW9ucyA9IG1peGluKHNtMi5kZWZhdWx0T3B0aW9ucywgc20yLm1vdmllU3Rhck9wdGlvbnMpO1xyXG4gICAgICBzbTIuZmlsZVBhdHRlcm5zLmZsYXNoOSA9IG5ldyBSZWdFeHAoJ1xcXFwuKG1wM3wnICsgbmV0U3RyZWFtVHlwZXMuam9pbignfCcpICsgJykoXFxcXD8uKik/JCcsICdpJyk7XHJcbiAgICAgIHNtMi5mZWF0dXJlcy5tb3ZpZVN0YXIgPSB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc20yLmZlYXR1cmVzLm1vdmllU3RhciA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlZ0V4cCBmb3IgZmxhc2ggY2FuUGxheSgpLCBldGMuXHJcbiAgICBzbTIuZmlsZVBhdHRlcm4gPSBzbTIuZmlsZVBhdHRlcm5zWyhmViAhPT0gOD8nZmxhc2g5JzonZmxhc2g4JyldO1xyXG5cclxuICAgIC8vIGlmIGFwcGxpY2FibGUsIHVzZSBfZGVidWcgdmVyc2lvbnMgb2YgU1dGc1xyXG4gICAgc20yLm1vdmllVVJMID0gKGZWID09PSA4Pydzb3VuZG1hbmFnZXIyLnN3Zic6J3NvdW5kbWFuYWdlcjJfZmxhc2g5LnN3ZicpLnJlcGxhY2UoJy5zd2YnLCBpc0RlYnVnKTtcclxuXHJcbiAgICBzbTIuZmVhdHVyZXMucGVha0RhdGEgPSBzbTIuZmVhdHVyZXMud2F2ZWZvcm1EYXRhID0gc20yLmZlYXR1cmVzLmVxRGF0YSA9IChmViA+IDgpO1xyXG5cclxuICB9O1xyXG5cclxuICBzZXRQb2xsaW5nID0gZnVuY3Rpb24oYlBvbGxpbmcsIGJIaWdoUGVyZm9ybWFuY2UpIHtcclxuXHJcbiAgICBpZiAoIWZsYXNoKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBmbGFzaC5fc2V0UG9sbGluZyhiUG9sbGluZywgYkhpZ2hQZXJmb3JtYW5jZSk7XHJcblxyXG4gIH07XHJcblxyXG4gIGluaXREZWJ1ZyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIHN0YXJ0cyBkZWJ1ZyBtb2RlLCBjcmVhdGluZyBvdXRwdXQgPGRpdj4gZm9yIFVBcyB3aXRob3V0IGNvbnNvbGUgb2JqZWN0XHJcblxyXG4gICAgLy8gYWxsb3cgZm9yY2Ugb2YgZGVidWcgbW9kZSB2aWEgVVJMXHJcbiAgICAvLyA8ZD5cclxuICAgIGlmIChzbTIuZGVidWdVUkxQYXJhbS50ZXN0KHdsKSkge1xyXG4gICAgICBzbTIuZGVidWdNb2RlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaWQoc20yLmRlYnVnSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb0QsIG9EZWJ1Zywgb1RhcmdldCwgb1RvZ2dsZSwgdG1wO1xyXG5cclxuICAgIGlmIChzbTIuZGVidWdNb2RlICYmICFpZChzbTIuZGVidWdJRCkgJiYgKCFoYXNDb25zb2xlIHx8ICFzbTIudXNlQ29uc29sZSB8fCAhc20yLmNvbnNvbGVPbmx5KSkge1xyXG5cclxuICAgICAgb0QgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIG9ELmlkID0gc20yLmRlYnVnSUQgKyAnLXRvZ2dsZSc7XHJcblxyXG4gICAgICBvVG9nZ2xlID0ge1xyXG4gICAgICAgICdwb3NpdGlvbic6ICdmaXhlZCcsXHJcbiAgICAgICAgJ2JvdHRvbSc6ICcwcHgnLFxyXG4gICAgICAgICdyaWdodCc6ICcwcHgnLFxyXG4gICAgICAgICd3aWR0aCc6ICcxLjJlbScsXHJcbiAgICAgICAgJ2hlaWdodCc6ICcxLjJlbScsXHJcbiAgICAgICAgJ2xpbmVIZWlnaHQnOiAnMS4yZW0nLFxyXG4gICAgICAgICdtYXJnaW4nOiAnMnB4JyxcclxuICAgICAgICAndGV4dEFsaWduJzogJ2NlbnRlcicsXHJcbiAgICAgICAgJ2JvcmRlcic6ICcxcHggc29saWQgIzk5OScsXHJcbiAgICAgICAgJ2N1cnNvcic6ICdwb2ludGVyJyxcclxuICAgICAgICAnYmFja2dyb3VuZCc6ICcjZmZmJyxcclxuICAgICAgICAnY29sb3InOiAnIzMzMycsXHJcbiAgICAgICAgJ3pJbmRleCc6IDEwMDAxXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBvRC5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUoJy0nKSk7XHJcbiAgICAgIG9ELm9uY2xpY2sgPSB0b2dnbGVEZWJ1ZztcclxuICAgICAgb0QudGl0bGUgPSAnVG9nZ2xlIFNNMiBkZWJ1ZyBjb25zb2xlJztcclxuXHJcbiAgICAgIGlmICh1YS5tYXRjaCgvbXNpZSA2L2kpKSB7XHJcbiAgICAgICAgb0Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIG9ELnN0eWxlLmN1cnNvciA9ICdoYW5kJztcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICh0bXAgaW4gb1RvZ2dsZSkge1xyXG4gICAgICAgIGlmIChvVG9nZ2xlLmhhc093blByb3BlcnR5KHRtcCkpIHtcclxuICAgICAgICAgIG9ELnN0eWxlW3RtcF0gPSBvVG9nZ2xlW3RtcF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBvRGVidWcgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIG9EZWJ1Zy5pZCA9IHNtMi5kZWJ1Z0lEO1xyXG4gICAgICBvRGVidWcuc3R5bGUuZGlzcGxheSA9IChzbTIuZGVidWdNb2RlPydibG9jayc6J25vbmUnKTtcclxuXHJcbiAgICAgIGlmIChzbTIuZGVidWdNb2RlICYmICFpZChvRC5pZCkpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgb1RhcmdldCA9IGdldERvY3VtZW50KCk7XHJcbiAgICAgICAgICBvVGFyZ2V0LmFwcGVuZENoaWxkKG9EKTtcclxuICAgICAgICB9IGNhdGNoKGUyKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3RyKCdkb21FcnJvcicpKycgXFxuJytlMi50b1N0cmluZygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb1RhcmdldC5hcHBlbmRDaGlsZChvRGVidWcpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9UYXJnZXQgPSBudWxsO1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBpZENoZWNrID0gdGhpcy5nZXRTb3VuZEJ5SWQ7XHJcblxyXG4gIC8vIDxkPlxyXG4gIF93RFMgPSBmdW5jdGlvbihvLCBlcnJvckxldmVsKSB7XHJcblxyXG4gICAgcmV0dXJuICghbyA/ICcnIDogc20yLl93RChzdHIobyksIGVycm9yTGV2ZWwpKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgdG9nZ2xlRGVidWcgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgbyA9IGlkKHNtMi5kZWJ1Z0lEKSxcclxuICAgIG9UID0gaWQoc20yLmRlYnVnSUQgKyAnLXRvZ2dsZScpO1xyXG5cclxuICAgIGlmICghbykge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRlYnVnT3Blbikge1xyXG4gICAgICAvLyBtaW5pbWl6ZVxyXG4gICAgICBvVC5pbm5lckhUTUwgPSAnKyc7XHJcbiAgICAgIG8uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG9ULmlubmVySFRNTCA9ICctJztcclxuICAgICAgby5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIH1cclxuXHJcbiAgICBkZWJ1Z09wZW4gPSAhZGVidWdPcGVuO1xyXG5cclxuICB9O1xyXG5cclxuICBkZWJ1Z1RTID0gZnVuY3Rpb24oc0V2ZW50VHlwZSwgYlN1Y2Nlc3MsIHNNZXNzYWdlKSB7XHJcblxyXG4gICAgLy8gdHJvdWJsZXNob290ZXIgZGVidWcgaG9va3NcclxuXHJcbiAgICBpZiAod2luZG93LnNtMkRlYnVnZ2VyICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgc20yRGVidWdnZXIuaGFuZGxlRXZlbnQoc0V2ZW50VHlwZSwgYlN1Y2Nlc3MsIHNNZXNzYWdlKTtcclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgLy8gb2ggd2VsbFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG4gIC8vIDwvZD5cclxuXHJcbiAgZ2V0U1dGQ1NTID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIGNzcyA9IFtdO1xyXG5cclxuICAgIGlmIChzbTIuZGVidWdNb2RlKSB7XHJcbiAgICAgIGNzcy5wdXNoKHN3ZkNTUy5zbTJEZWJ1Zyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNtMi5kZWJ1Z0ZsYXNoKSB7XHJcbiAgICAgIGNzcy5wdXNoKHN3ZkNTUy5mbGFzaERlYnVnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc20yLnVzZUhpZ2hQZXJmb3JtYW5jZSkge1xyXG4gICAgICBjc3MucHVzaChzd2ZDU1MuaGlnaFBlcmYpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjc3Muam9pbignICcpO1xyXG5cclxuICB9O1xyXG5cclxuICBmbGFzaEJsb2NrSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vICpwb3NzaWJsZSogZmxhc2ggYmxvY2sgc2l0dWF0aW9uLlxyXG5cclxuICAgIHZhciBuYW1lID0gc3RyKCdmYkhhbmRsZXInKSxcclxuICAgICAgICBwID0gc20yLmdldE1vdmllUGVyY2VudCgpLFxyXG4gICAgICAgIGNzcyA9IHN3ZkNTUyxcclxuICAgICAgICBlcnJvciA9IHt0eXBlOidGTEFTSEJMT0NLJ307XHJcblxyXG4gICAgaWYgKHNtMi5odG1sNU9ubHkpIHtcclxuICAgICAgLy8gbm8gZmxhc2gsIG9yIHVudXNlZFxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFzbTIub2soKSkge1xyXG5cclxuICAgICAgaWYgKG5lZWRzRmxhc2gpIHtcclxuICAgICAgICAvLyBtYWtlIHRoZSBtb3ZpZSBtb3JlIHZpc2libGUsIHNvIHVzZXIgY2FuIGZpeFxyXG4gICAgICAgIHNtMi5vTUMuY2xhc3NOYW1lID0gZ2V0U1dGQ1NTKCkgKyAnICcgKyBjc3Muc3dmRGVmYXVsdCArICcgJyArIChwID09PSBudWxsP2Nzcy5zd2ZUaW1lZG91dDpjc3Muc3dmRXJyb3IpO1xyXG4gICAgICAgIHNtMi5fd0QobmFtZSArICc6ICcgKyBzdHIoJ2ZiVGltZW91dCcpICsgKHAgPyAnICgnICsgc3RyKCdmYkxvYWRlZCcpICsgJyknIDogJycpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc20yLmRpZEZsYXNoQmxvY2sgPSB0cnVlO1xyXG5cclxuICAgICAgLy8gZmlyZSBvbnJlYWR5KCksIGNvbXBsYWluIGxpZ2h0bHlcclxuICAgICAgcHJvY2Vzc09uRXZlbnRzKHt0eXBlOidvbnRpbWVvdXQnLCBpZ25vcmVJbml0OnRydWUsIGVycm9yOmVycm9yfSk7XHJcbiAgICAgIGNhdGNoRXJyb3IoZXJyb3IpO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBTTTIgbG9hZGVkIE9LIChvciByZWNvdmVyZWQpXHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgaWYgKHNtMi5kaWRGbGFzaEJsb2NrKSB7XHJcbiAgICAgICAgc20yLl93RChuYW1lICsgJzogVW5ibG9ja2VkJyk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgaWYgKHNtMi5vTUMpIHtcclxuICAgICAgICBzbTIub01DLmNsYXNzTmFtZSA9IFtnZXRTV0ZDU1MoKSwgY3NzLnN3ZkRlZmF1bHQsIGNzcy5zd2ZMb2FkZWQgKyAoc20yLmRpZEZsYXNoQmxvY2s/JyAnK2Nzcy5zd2ZVbmJsb2NrZWQ6JycpXS5qb2luKCcgJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGFkZE9uRXZlbnQgPSBmdW5jdGlvbihzVHlwZSwgb01ldGhvZCwgb1Njb3BlKSB7XHJcblxyXG4gICAgaWYgKG9uX3F1ZXVlW3NUeXBlXSA9PT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICBvbl9xdWV1ZVtzVHlwZV0gPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBvbl9xdWV1ZVtzVHlwZV0ucHVzaCh7XHJcbiAgICAgICdtZXRob2QnOiBvTWV0aG9kLFxyXG4gICAgICAnc2NvcGUnOiAob1Njb3BlIHx8IG51bGwpLFxyXG4gICAgICAnZmlyZWQnOiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcblxyXG4gIHByb2Nlc3NPbkV2ZW50cyA9IGZ1bmN0aW9uKG9PcHRpb25zKSB7XHJcblxyXG4gICAgLy8gaWYgdW5zcGVjaWZpZWQsIGFzc3VtZSBPSy9lcnJvclxyXG5cclxuICAgIGlmICghb09wdGlvbnMpIHtcclxuICAgICAgb09wdGlvbnMgPSB7XHJcbiAgICAgICAgdHlwZTogKHNtMi5vaygpID8gJ29ucmVhZHknIDogJ29udGltZW91dCcpXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFkaWRJbml0ICYmIG9PcHRpb25zICYmICFvT3B0aW9ucy5pZ25vcmVJbml0KSB7XHJcbiAgICAgIC8vIG5vdCByZWFkeSB5ZXQuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob09wdGlvbnMudHlwZSA9PT0gJ29udGltZW91dCcgJiYgKHNtMi5vaygpIHx8IChkaXNhYmxlZCAmJiAhb09wdGlvbnMuaWdub3JlSW5pdCkpKSB7XHJcbiAgICAgIC8vIGludmFsaWQgY2FzZVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHN0YXR1cyA9IHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IChvT3B0aW9ucyAmJiBvT3B0aW9ucy5pZ25vcmVJbml0P3NtMi5vaygpOiFkaXNhYmxlZClcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBxdWV1ZSBzcGVjaWZpZWQgYnkgdHlwZSwgb3Igbm9uZVxyXG4gICAgICAgIHNyY1F1ZXVlID0gKG9PcHRpb25zICYmIG9PcHRpb25zLnR5cGU/b25fcXVldWVbb09wdGlvbnMudHlwZV18fFtdOltdKSxcclxuXHJcbiAgICAgICAgcXVldWUgPSBbXSwgaSwgaixcclxuICAgICAgICBhcmdzID0gW3N0YXR1c10sXHJcbiAgICAgICAgY2FuUmV0cnkgPSAobmVlZHNGbGFzaCAmJiAhc20yLm9rKCkpO1xyXG5cclxuICAgIGlmIChvT3B0aW9ucy5lcnJvcikge1xyXG4gICAgICBhcmdzWzBdLmVycm9yID0gb09wdGlvbnMuZXJyb3I7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChpID0gMCwgaiA9IHNyY1F1ZXVlLmxlbmd0aDsgaSA8IGo7IGkrKykge1xyXG4gICAgICBpZiAoc3JjUXVldWVbaV0uZmlyZWQgIT09IHRydWUpIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKHNyY1F1ZXVlW2ldKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgLy8gc20yLl93RChzbSArICc6IEZpcmluZyAnICsgcXVldWUubGVuZ3RoICsgJyAnICsgb09wdGlvbnMudHlwZSArICcoKSBpdGVtJyArIChxdWV1ZS5sZW5ndGggPT09IDEgPyAnJyA6ICdzJykpO1xyXG4gICAgICBmb3IgKGkgPSAwLCBqID0gcXVldWUubGVuZ3RoOyBpIDwgajsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHF1ZXVlW2ldLnNjb3BlKSB7XHJcbiAgICAgICAgICBxdWV1ZVtpXS5tZXRob2QuYXBwbHkocXVldWVbaV0uc2NvcGUsIGFyZ3MpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBxdWV1ZVtpXS5tZXRob2QuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghY2FuUmV0cnkpIHtcclxuICAgICAgICAgIC8vIHVzZUZsYXNoQmxvY2sgYW5kIFNXRiB0aW1lb3V0IGNhc2UgZG9lc24ndCBjb3VudCBoZXJlLlxyXG4gICAgICAgICAgcXVldWVbaV0uZmlyZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICBpbml0VXNlck9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHNtMi51c2VGbGFzaEJsb2NrKSB7XHJcbiAgICAgICAgZmxhc2hCbG9ja0hhbmRsZXIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcHJvY2Vzc09uRXZlbnRzKCk7XHJcblxyXG4gICAgICAvLyBjYWxsIHVzZXItZGVmaW5lZCBcIm9ubG9hZFwiLCBzY29wZWQgdG8gd2luZG93XHJcblxyXG4gICAgICBpZiAodHlwZW9mIHNtMi5vbmxvYWQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBfd0RTKCdvbmxvYWQnLCAxKTtcclxuICAgICAgICBzbTIub25sb2FkLmFwcGx5KHdpbmRvdyk7XHJcbiAgICAgICAgX3dEUygnb25sb2FkT0snLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNtMi53YWl0Rm9yV2luZG93TG9hZCkge1xyXG4gICAgICAgIGV2ZW50LmFkZCh3aW5kb3csICdsb2FkJywgaW5pdFVzZXJPbmxvYWQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSwxKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgZGV0ZWN0Rmxhc2ggPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBoYXQgdGlwOiBGbGFzaCBEZXRlY3QgbGlicmFyeSAoQlNELCAoQykgMjAwNykgYnkgQ2FybCBcIkRvY1llc1wiIFMuIFllc3RyYXUgLSBodHRwOi8vZmVhdHVyZWJsZW5kLmNvbS9qYXZhc2NyaXB0LWZsYXNoLWRldGVjdGlvbi1saWJyYXJ5Lmh0bWwgLyBodHRwOi8vZmVhdHVyZWJsZW5kLmNvbS9saWNlbnNlLnR4dFxyXG5cclxuICAgIGlmIChoYXNGbGFzaCAhPT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAvLyB0aGlzIHdvcmsgaGFzIGFscmVhZHkgYmVlbiBkb25lLlxyXG4gICAgICByZXR1cm4gaGFzRmxhc2g7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGhhc1BsdWdpbiA9IGZhbHNlLCBuID0gbmF2aWdhdG9yLCBuUCA9IG4ucGx1Z2lucywgb2JqLCB0eXBlLCB0eXBlcywgQVggPSB3aW5kb3cuQWN0aXZlWE9iamVjdDtcclxuXHJcbiAgICBpZiAoblAgJiYgblAubGVuZ3RoKSB7XHJcbiAgICAgIHR5cGUgPSAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnO1xyXG4gICAgICB0eXBlcyA9IG4ubWltZVR5cGVzO1xyXG4gICAgICBpZiAodHlwZXMgJiYgdHlwZXNbdHlwZV0gJiYgdHlwZXNbdHlwZV0uZW5hYmxlZFBsdWdpbiAmJiB0eXBlc1t0eXBlXS5lbmFibGVkUGx1Z2luLmRlc2NyaXB0aW9uKSB7XHJcbiAgICAgICAgaGFzUGx1Z2luID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChBWCAhPT0gX3VuZGVmaW5lZCAmJiAhdWEubWF0Y2goL01TQXBwSG9zdC9pKSkge1xyXG4gICAgICAvLyBXaW5kb3dzIDggU3RvcmUgQXBwcyAoTVNBcHBIb3N0KSBhcmUgd2VpcmQgKGNvbXBhdGliaWxpdHk/KSBhbmQgd29uJ3QgY29tcGxhaW4gaGVyZSwgYnV0IHdpbGwgYmFyZiBpZiBGbGFzaC9BY3RpdmVYIG9iamVjdCBpcyBhcHBlbmRlZCB0byB0aGUgRE9NLlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG9iaiA9IG5ldyBBWCgnU2hvY2t3YXZlRmxhc2guU2hvY2t3YXZlRmxhc2gnKTtcclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgLy8gb2ggd2VsbFxyXG4gICAgICAgIG9iaiA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgaGFzUGx1Z2luID0gKCEhb2JqKTtcclxuICAgICAgLy8gY2xlYW51cCwgYmVjYXVzZSBpdCBpcyBBY3RpdmVYIGFmdGVyIGFsbFxyXG4gICAgICBvYmogPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0ZsYXNoID0gaGFzUGx1Z2luO1xyXG5cclxuICAgIHJldHVybiBoYXNQbHVnaW47XHJcblxyXG4gIH07XHJcblxyXG4gIGZlYXR1cmVDaGVjayA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBmbGFzaE5lZWRlZCxcclxuICAgICAgICBpdGVtLFxyXG4gICAgICAgIGZvcm1hdHMgPSBzbTIuYXVkaW9Gb3JtYXRzLFxyXG4gICAgICAgIC8vIGlQaG9uZSA8PSAzLjEgaGFzIGJyb2tlbiBIVE1MNSBhdWRpbygpLCBidXQgZmlybXdhcmUgMy4yIChvcmlnaW5hbCBpUGFkKSArIGlPUzQgd29ya3MuXHJcbiAgICAgICAgaXNTcGVjaWFsID0gKGlzX2lEZXZpY2UgJiYgISEodWEubWF0Y2goL29zICgxfDJ8M18wfDNfMSkvaSkpKTtcclxuXHJcbiAgICBpZiAoaXNTcGVjaWFsKSB7XHJcblxyXG4gICAgICAvLyBoYXMgQXVkaW8oKSwgYnV0IGlzIGJyb2tlbjsgbGV0IGl0IGxvYWQgbGlua3MgZGlyZWN0bHkuXHJcbiAgICAgIHNtMi5oYXNIVE1MNSA9IGZhbHNlO1xyXG5cclxuICAgICAgLy8gaWdub3JlIGZsYXNoIGNhc2UsIGhvd2V2ZXJcclxuICAgICAgc20yLmh0bWw1T25seSA9IHRydWU7XHJcblxyXG4gICAgICAvLyBoaWRlIHRoZSBTV0YsIGlmIHByZXNlbnRcclxuICAgICAgaWYgKHNtMi5vTUMpIHtcclxuICAgICAgICBzbTIub01DLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgaWYgKHNtMi51c2VIVE1MNUF1ZGlvKSB7XHJcblxyXG4gICAgICAgIGlmICghc20yLmh0bWw1IHx8ICFzbTIuaHRtbDUuY2FuUGxheVR5cGUpIHtcclxuICAgICAgICAgIHNtMi5fd0QoJ1NvdW5kTWFuYWdlcjogTm8gSFRNTDUgQXVkaW8oKSBzdXBwb3J0IGRldGVjdGVkLicpO1xyXG4gICAgICAgICAgc20yLmhhc0hUTUw1ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA8ZD5cclxuICAgICAgICBpZiAoaXNCYWRTYWZhcmkpIHtcclxuICAgICAgICAgIHNtMi5fd0Qoc21jICsgJ05vdGU6IEJ1Z2d5IEhUTUw1IEF1ZGlvIGluIFNhZmFyaSBvbiB0aGlzIE9TIFggcmVsZWFzZSwgc2VlIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0zMjE1OSAtICcgKyAoIWhhc0ZsYXNoID8nIHdvdWxkIHVzZSBmbGFzaCBmYWxsYmFjayBmb3IgTVAzL01QNCwgYnV0IG5vbmUgZGV0ZWN0ZWQuJyA6ICd3aWxsIHVzZSBmbGFzaCBmYWxsYmFjayBmb3IgTVAzL01QNCwgaWYgYXZhaWxhYmxlJyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbTIudXNlSFRNTDVBdWRpbyAmJiBzbTIuaGFzSFRNTDUpIHtcclxuXHJcbiAgICAgIC8vIHNvcnQgb3V0IHdoZXRoZXIgZmxhc2ggaXMgb3B0aW9uYWwsIHJlcXVpcmVkIG9yIGNhbiBiZSBpZ25vcmVkLlxyXG5cclxuICAgICAgLy8gaW5ub2NlbnQgdW50aWwgcHJvdmVuIGd1aWx0eS5cclxuICAgICAgY2FuSWdub3JlRmxhc2ggPSB0cnVlO1xyXG5cclxuICAgICAgZm9yIChpdGVtIGluIGZvcm1hdHMpIHtcclxuICAgICAgICBpZiAoZm9ybWF0cy5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xyXG4gICAgICAgICAgaWYgKGZvcm1hdHNbaXRlbV0ucmVxdWlyZWQpIHtcclxuICAgICAgICAgICAgaWYgKCFzbTIuaHRtbDUuY2FuUGxheVR5cGUoZm9ybWF0c1tpdGVtXS50eXBlKSkge1xyXG4gICAgICAgICAgICAgIC8vIDEwMCUgSFRNTDUgbW9kZSBpcyBub3QgcG9zc2libGUuXHJcbiAgICAgICAgICAgICAgY2FuSWdub3JlRmxhc2ggPSBmYWxzZTtcclxuICAgICAgICAgICAgICBmbGFzaE5lZWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc20yLnByZWZlckZsYXNoICYmIChzbTIuZmxhc2hbaXRlbV0gfHwgc20yLmZsYXNoW2Zvcm1hdHNbaXRlbV0udHlwZV0pKSB7XHJcbiAgICAgICAgICAgICAgLy8gZmxhc2ggbWF5IGJlIHJlcXVpcmVkLCBvciBwcmVmZXJyZWQgZm9yIHRoaXMgZm9ybWF0LlxyXG4gICAgICAgICAgICAgIGZsYXNoTmVlZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyBzYW5pdHkgY2hlY2suLi5cclxuICAgIGlmIChzbTIuaWdub3JlRmxhc2gpIHtcclxuICAgICAgZmxhc2hOZWVkZWQgPSBmYWxzZTtcclxuICAgICAgY2FuSWdub3JlRmxhc2ggPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNtMi5odG1sNU9ubHkgPSAoc20yLmhhc0hUTUw1ICYmIHNtMi51c2VIVE1MNUF1ZGlvICYmICFmbGFzaE5lZWRlZCk7XHJcblxyXG4gICAgcmV0dXJuICghc20yLmh0bWw1T25seSk7XHJcblxyXG4gIH07XHJcblxyXG4gIHBhcnNlVVJMID0gZnVuY3Rpb24odXJsKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnRlcm5hbDogRmluZHMgYW5kIHJldHVybnMgdGhlIGZpcnN0IHBsYXlhYmxlIFVSTCAob3IgZmFpbGluZyB0aGF0LCB0aGUgZmlyc3QgVVJMLilcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nIG9yIGFycmF5fSB1cmwgQSBzaW5nbGUgVVJMIHN0cmluZywgT1IsIGFuIGFycmF5IG9mIFVSTCBzdHJpbmdzIG9yIHt1cmw6Jy9wYXRoL3RvL3Jlc291cmNlJywgdHlwZTonYXVkaW8vbXAzJ30gb2JqZWN0cy5cclxuICAgICAqL1xyXG5cclxuICAgIHZhciBpLCBqLCB1cmxSZXN1bHQgPSAwLCByZXN1bHQ7XHJcblxyXG4gICAgaWYgKHVybCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcblxyXG4gICAgICAvLyBmaW5kIHRoZSBmaXJzdCBnb29kIG9uZVxyXG4gICAgICBmb3IgKGk9MCwgaj11cmwubGVuZ3RoOyBpPGo7IGkrKykge1xyXG5cclxuICAgICAgICBpZiAodXJsW2ldIGluc3RhbmNlb2YgT2JqZWN0KSB7XHJcbiAgICAgICAgICAvLyBNSU1FIGNoZWNrXHJcbiAgICAgICAgICBpZiAoc20yLmNhblBsYXlNSU1FKHVybFtpXS50eXBlKSkge1xyXG4gICAgICAgICAgICB1cmxSZXN1bHQgPSBpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChzbTIuY2FuUGxheVVSTCh1cmxbaV0pKSB7XHJcbiAgICAgICAgICAvLyBVUkwgc3RyaW5nIGNoZWNrXHJcbiAgICAgICAgICB1cmxSZXN1bHQgPSBpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gbm9ybWFsaXplIHRvIHN0cmluZ1xyXG4gICAgICBpZiAodXJsW3VybFJlc3VsdF0udXJsKSB7XHJcbiAgICAgICAgdXJsW3VybFJlc3VsdF0gPSB1cmxbdXJsUmVzdWx0XS51cmw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlc3VsdCA9IHVybFt1cmxSZXN1bHRdO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAvLyBzaW5nbGUgVVJMIGNhc2VcclxuICAgICAgcmVzdWx0ID0gdXJsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuXHJcbiAgc3RhcnRUaW1lciA9IGZ1bmN0aW9uKG9Tb3VuZCkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogYXR0YWNoIGEgdGltZXIgdG8gdGhpcyBzb3VuZCwgYW5kIHN0YXJ0IGFuIGludGVydmFsIGlmIG5lZWRlZFxyXG4gICAgICovXHJcblxyXG4gICAgaWYgKCFvU291bmQuX2hhc1RpbWVyKSB7XHJcblxyXG4gICAgICBvU291bmQuX2hhc1RpbWVyID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICghbW9iaWxlSFRNTDUgJiYgc20yLmh0bWw1UG9sbGluZ0ludGVydmFsKSB7XHJcblxyXG4gICAgICAgIGlmIChoNUludGVydmFsVGltZXIgPT09IG51bGwgJiYgaDVUaW1lckNvdW50ID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgaDVJbnRlcnZhbFRpbWVyID0gc2V0SW50ZXJ2YWwodGltZXJFeGVjdXRlLCBzbTIuaHRtbDVQb2xsaW5nSW50ZXJ2YWwpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGg1VGltZXJDb3VudCsrO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgc3RvcFRpbWVyID0gZnVuY3Rpb24ob1NvdW5kKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkZXRhY2ggYSB0aW1lclxyXG4gICAgICovXHJcblxyXG4gICAgaWYgKG9Tb3VuZC5faGFzVGltZXIpIHtcclxuXHJcbiAgICAgIG9Tb3VuZC5faGFzVGltZXIgPSBmYWxzZTtcclxuXHJcbiAgICAgIGlmICghbW9iaWxlSFRNTDUgJiYgc20yLmh0bWw1UG9sbGluZ0ludGVydmFsKSB7XHJcblxyXG4gICAgICAgIC8vIGludGVydmFsIHdpbGwgc3RvcCBpdHNlbGYgYXQgbmV4dCBleGVjdXRpb24uXHJcblxyXG4gICAgICAgIGg1VGltZXJDb3VudC0tO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgdGltZXJFeGVjdXRlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYW51YWwgcG9sbGluZyBmb3IgSFRNTDUgcHJvZ3Jlc3MgZXZlbnRzLCBpZS4sIHdoaWxlcGxheWluZygpIChjYW4gYWNoaWV2ZSBncmVhdGVyIHByZWNpc2lvbiB0aGFuIGNvbnNlcnZhdGl2ZSBkZWZhdWx0IEhUTUw1IGludGVydmFsKVxyXG4gICAgICovXHJcblxyXG4gICAgdmFyIGk7XHJcblxyXG4gICAgaWYgKGg1SW50ZXJ2YWxUaW1lciAhPT0gbnVsbCAmJiAhaDVUaW1lckNvdW50KSB7XHJcblxyXG4gICAgICAvLyBubyBhY3RpdmUgdGltZXJzLCBzdG9wIHBvbGxpbmcgaW50ZXJ2YWwuXHJcblxyXG4gICAgICBjbGVhckludGVydmFsKGg1SW50ZXJ2YWxUaW1lcik7XHJcblxyXG4gICAgICBoNUludGVydmFsVGltZXIgPSBudWxsO1xyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyBjaGVjayBhbGwgSFRNTDUgc291bmRzIHdpdGggdGltZXJzXHJcblxyXG4gICAgZm9yIChpID0gc20yLnNvdW5kSURzLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG5cclxuICAgICAgaWYgKHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXS5pc0hUTUw1ICYmIHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXS5faGFzVGltZXIpIHtcclxuXHJcbiAgICAgICAgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLl9vblRpbWVyKCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBjYXRjaEVycm9yID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuICAgIG9wdGlvbnMgPSAob3B0aW9ucyAhPT0gX3VuZGVmaW5lZCA/IG9wdGlvbnMgOiB7fSk7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBzbTIub25lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBzbTIub25lcnJvci5hcHBseSh3aW5kb3csIFt7dHlwZToob3B0aW9ucy50eXBlICE9PSBfdW5kZWZpbmVkID8gb3B0aW9ucy50eXBlIDogbnVsbCl9XSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZmF0YWwgIT09IF91bmRlZmluZWQgJiYgb3B0aW9ucy5mYXRhbCkge1xyXG4gICAgICBzbTIuZGlzYWJsZSgpO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBiYWRTYWZhcmlGaXggPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBzcGVjaWFsIGNhc2U6IFwiYmFkXCIgU2FmYXJpIChPUyBYIDEwLjMgLSAxMC43KSBtdXN0IGZhbGwgYmFjayB0byBmbGFzaCBmb3IgTVAzL01QNFxyXG4gICAgaWYgKCFpc0JhZFNhZmFyaSB8fCAhZGV0ZWN0Rmxhc2goKSkge1xyXG4gICAgICAvLyBkb2Vzbid0IGFwcGx5XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYUYgPSBzbTIuYXVkaW9Gb3JtYXRzLCBpLCBpdGVtO1xyXG5cclxuICAgIGZvciAoaXRlbSBpbiBhRikge1xyXG4gICAgICBpZiAoYUYuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcclxuICAgICAgICBpZiAoaXRlbSA9PT0gJ21wMycgfHwgaXRlbSA9PT0gJ21wNCcpIHtcclxuICAgICAgICAgIHNtMi5fd0Qoc20gKyAnOiBVc2luZyBmbGFzaCBmYWxsYmFjayBmb3IgJyArIGl0ZW0gKyAnIGZvcm1hdCcpO1xyXG4gICAgICAgICAgc20yLmh0bWw1W2l0ZW1dID0gZmFsc2U7XHJcbiAgICAgICAgICAvLyBhc3NpZ24gcmVzdWx0IHRvIHJlbGF0ZWQgZm9ybWF0cywgdG9vXHJcbiAgICAgICAgICBpZiAoYUZbaXRlbV0gJiYgYUZbaXRlbV0ucmVsYXRlZCkge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSBhRltpdGVtXS5yZWxhdGVkLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgIHNtMi5odG1sNVthRltpdGVtXS5yZWxhdGVkW2ldXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFBzZXVkby1wcml2YXRlIGZsYXNoL0V4dGVybmFsSW50ZXJmYWNlIG1ldGhvZHNcclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICovXHJcblxyXG4gIHRoaXMuX3NldFNhbmRib3hUeXBlID0gZnVuY3Rpb24oc2FuZGJveFR5cGUpIHtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIHZhciBzYiA9IHNtMi5zYW5kYm94O1xyXG5cclxuICAgIHNiLnR5cGUgPSBzYW5kYm94VHlwZTtcclxuICAgIHNiLmRlc2NyaXB0aW9uID0gc2IudHlwZXNbKHNiLnR5cGVzW3NhbmRib3hUeXBlXSAhPT0gX3VuZGVmaW5lZD9zYW5kYm94VHlwZTondW5rbm93bicpXTtcclxuXHJcbiAgICBpZiAoc2IudHlwZSA9PT0gJ2xvY2FsV2l0aEZpbGUnKSB7XHJcblxyXG4gICAgICBzYi5ub1JlbW90ZSA9IHRydWU7XHJcbiAgICAgIHNiLm5vTG9jYWwgPSBmYWxzZTtcclxuICAgICAgX3dEUygnc2VjTm90ZScsIDIpO1xyXG5cclxuICAgIH0gZWxzZSBpZiAoc2IudHlwZSA9PT0gJ2xvY2FsV2l0aE5ldHdvcmsnKSB7XHJcblxyXG4gICAgICBzYi5ub1JlbW90ZSA9IGZhbHNlO1xyXG4gICAgICBzYi5ub0xvY2FsID0gdHJ1ZTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKHNiLnR5cGUgPT09ICdsb2NhbFRydXN0ZWQnKSB7XHJcblxyXG4gICAgICBzYi5ub1JlbW90ZSA9IGZhbHNlO1xyXG4gICAgICBzYi5ub0xvY2FsID0gZmFsc2U7XHJcblxyXG4gICAgfVxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICB0aGlzLl9leHRlcm5hbEludGVyZmFjZU9LID0gZnVuY3Rpb24oc3dmVmVyc2lvbikge1xyXG5cclxuICAgIC8vIGZsYXNoIGNhbGxiYWNrIGNvbmZpcm1pbmcgZmxhc2ggbG9hZGVkLCBFSSB3b3JraW5nIGV0Yy5cclxuICAgIC8vIHN3ZlZlcnNpb246IFNXRiBidWlsZCBzdHJpbmdcclxuXHJcbiAgICBpZiAoc20yLnN3ZkxvYWRlZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGU7XHJcblxyXG4gICAgZGVidWdUUygnc3dmJywgdHJ1ZSk7XHJcbiAgICBkZWJ1Z1RTKCdmbGFzaHRvanMnLCB0cnVlKTtcclxuICAgIHNtMi5zd2ZMb2FkZWQgPSB0cnVlO1xyXG4gICAgdHJ5SW5pdE9uRm9jdXMgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoaXNCYWRTYWZhcmkpIHtcclxuICAgICAgYmFkU2FmYXJpRml4KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29tcGxhaW4gaWYgSlMgKyBTV0YgYnVpbGQvdmVyc2lvbiBzdHJpbmdzIGRvbid0IG1hdGNoLCBleGNsdWRpbmcgK0RFViBidWlsZHNcclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKCFzd2ZWZXJzaW9uIHx8IHN3ZlZlcnNpb24ucmVwbGFjZSgvXFwrZGV2L2ksJycpICE9PSBzbTIudmVyc2lvbk51bWJlci5yZXBsYWNlKC9cXCtkZXYvaSwgJycpKSB7XHJcblxyXG4gICAgICBlID0gc20gKyAnOiBGYXRhbDogSmF2YVNjcmlwdCBmaWxlIGJ1aWxkIFwiJyArIHNtMi52ZXJzaW9uTnVtYmVyICsgJ1wiIGRvZXMgbm90IG1hdGNoIEZsYXNoIFNXRiBidWlsZCBcIicgKyBzd2ZWZXJzaW9uICsgJ1wiIGF0ICcgKyBzbTIudXJsICsgJy4gRW5zdXJlIGJvdGggYXJlIHVwLXRvLWRhdGUuJztcclxuXHJcbiAgICAgIC8vIGVzY2FwZSBmbGFzaCAtPiBKUyBzdGFjayBzbyB0aGlzIGVycm9yIGZpcmVzIGluIHdpbmRvdy5cclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiB2ZXJzaW9uTWlzbWF0Y2goKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGUpO1xyXG4gICAgICB9LCAwKTtcclxuXHJcbiAgICAgIC8vIGV4aXQsIGluaXQgd2lsbCBmYWlsIHdpdGggdGltZW91dFxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG4gICAgLy8gPC9kPlxyXG5cclxuICAgIC8vIElFIG5lZWRzIGEgbGFyZ2VyIHRpbWVvdXRcclxuICAgIHNldFRpbWVvdXQoaW5pdCwgaXNJRSA/IDEwMCA6IDEpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBQcml2YXRlIGluaXRpYWxpemF0aW9uIGhlbHBlcnNcclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKi9cclxuXHJcbiAgY3JlYXRlTW92aWUgPSBmdW5jdGlvbihzbUlELCBzbVVSTCkge1xyXG5cclxuICAgIGlmIChkaWRBcHBlbmQgJiYgYXBwZW5kU3VjY2Vzcykge1xyXG4gICAgICAvLyBpZ25vcmUgaWYgYWxyZWFkeSBzdWNjZWVkZWRcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGluaXRNc2coKSB7XHJcblxyXG4gICAgICAvLyA8ZD5cclxuXHJcbiAgICAgIHZhciBvcHRpb25zID0gW10sXHJcbiAgICAgICAgICB0aXRsZSxcclxuICAgICAgICAgIG1zZyA9IFtdLFxyXG4gICAgICAgICAgZGVsaW1pdGVyID0gJyArICc7XHJcblxyXG4gICAgICB0aXRsZSA9ICdTb3VuZE1hbmFnZXIgJyArIHNtMi52ZXJzaW9uICsgKCFzbTIuaHRtbDVPbmx5ICYmIHNtMi51c2VIVE1MNUF1ZGlvID8gKHNtMi5oYXNIVE1MNSA/ICcgKyBIVE1MNSBhdWRpbycgOiAnLCBubyBIVE1MNSBhdWRpbyBzdXBwb3J0JykgOiAnJyk7XHJcblxyXG4gICAgICBpZiAoIXNtMi5odG1sNU9ubHkpIHtcclxuXHJcbiAgICAgICAgaWYgKHNtMi5wcmVmZXJGbGFzaCkge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCdwcmVmZXJGbGFzaCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNtMi51c2VIaWdoUGVyZm9ybWFuY2UpIHtcclxuICAgICAgICAgIG9wdGlvbnMucHVzaCgndXNlSGlnaFBlcmZvcm1hbmNlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc20yLmZsYXNoUG9sbGluZ0ludGVydmFsKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ2ZsYXNoUG9sbGluZ0ludGVydmFsICgnICsgc20yLmZsYXNoUG9sbGluZ0ludGVydmFsICsgJ21zKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNtMi5odG1sNVBvbGxpbmdJbnRlcnZhbCkge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCdodG1sNVBvbGxpbmdJbnRlcnZhbCAoJyArIHNtMi5odG1sNVBvbGxpbmdJbnRlcnZhbCArICdtcyknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzbTIud21vZGUpIHtcclxuICAgICAgICAgIG9wdGlvbnMucHVzaCgnd21vZGUgKCcgKyBzbTIud21vZGUgKyAnKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNtMi5kZWJ1Z0ZsYXNoKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ2RlYnVnRmxhc2gnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzbTIudXNlRmxhc2hCbG9jaykge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCdmbGFzaEJsb2NrJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgaWYgKHNtMi5odG1sNVBvbGxpbmdJbnRlcnZhbCkge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCdodG1sNVBvbGxpbmdJbnRlcnZhbCAoJyArIHNtMi5odG1sNVBvbGxpbmdJbnRlcnZhbCArICdtcyknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5sZW5ndGgpIHtcclxuICAgICAgICBtc2cgPSBtc2cuY29uY2F0KFtvcHRpb25zLmpvaW4oZGVsaW1pdGVyKV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuX3dEKHRpdGxlICsgKG1zZy5sZW5ndGggPyBkZWxpbWl0ZXIgKyBtc2cuam9pbignLCAnKSA6ICcnKSwgMSk7XHJcblxyXG4gICAgICBzaG93U3VwcG9ydCgpO1xyXG5cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc20yLmh0bWw1T25seSkge1xyXG5cclxuICAgICAgLy8gMTAwJSBIVE1MNSBtb2RlXHJcbiAgICAgIHNldFZlcnNpb25JbmZvKCk7XHJcblxyXG4gICAgICBpbml0TXNnKCk7XHJcbiAgICAgIHNtMi5vTUMgPSBpZChzbTIubW92aWVJRCk7XHJcbiAgICAgIGluaXQoKTtcclxuXHJcbiAgICAgIC8vIHByZXZlbnQgbXVsdGlwbGUgaW5pdCBhdHRlbXB0c1xyXG4gICAgICBkaWRBcHBlbmQgPSB0cnVlO1xyXG5cclxuICAgICAgYXBwZW5kU3VjY2VzcyA9IHRydWU7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIGZsYXNoIHBhdGhcclxuICAgIHZhciByZW1vdGVVUkwgPSAoc21VUkwgfHwgc20yLnVybCksXHJcbiAgICBsb2NhbFVSTCA9IChzbTIuYWx0VVJMIHx8IHJlbW90ZVVSTCksXHJcbiAgICBzd2ZUaXRsZSA9ICdKUy9GbGFzaCBhdWRpbyBjb21wb25lbnQgKFNvdW5kTWFuYWdlciAyKScsXHJcbiAgICBvVGFyZ2V0ID0gZ2V0RG9jdW1lbnQoKSxcclxuICAgIGV4dHJhQ2xhc3MgPSBnZXRTV0ZDU1MoKSxcclxuICAgIGlzUlRMID0gbnVsbCxcclxuICAgIGh0bWwgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2h0bWwnKVswXSxcclxuICAgIG9FbWJlZCwgb01vdmllLCB0bXAsIG1vdmllSFRNTCwgb0VsLCBzLCB4LCBzQ2xhc3M7XHJcblxyXG4gICAgaXNSVEwgPSAoaHRtbCAmJiBodG1sLmRpciAmJiBodG1sLmRpci5tYXRjaCgvcnRsL2kpKTtcclxuICAgIHNtSUQgPSAoc21JRCA9PT0gX3VuZGVmaW5lZD9zbTIuaWQ6c21JRCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyYW0obmFtZSwgdmFsdWUpIHtcclxuICAgICAgcmV0dXJuICc8cGFyYW0gbmFtZT1cIicrbmFtZSsnXCIgdmFsdWU9XCInK3ZhbHVlKydcIiAvPic7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2FmZXR5IGNoZWNrIGZvciBsZWdhY3kgKGNoYW5nZSB0byBGbGFzaCA5IFVSTClcclxuICAgIHNldFZlcnNpb25JbmZvKCk7XHJcbiAgICBzbTIudXJsID0gbm9ybWFsaXplTW92aWVVUkwob3ZlckhUVFA/cmVtb3RlVVJMOmxvY2FsVVJMKTtcclxuICAgIHNtVVJMID0gc20yLnVybDtcclxuXHJcbiAgICBzbTIud21vZGUgPSAoIXNtMi53bW9kZSAmJiBzbTIudXNlSGlnaFBlcmZvcm1hbmNlID8gJ3RyYW5zcGFyZW50JyA6IHNtMi53bW9kZSk7XHJcblxyXG4gICAgaWYgKHNtMi53bW9kZSAhPT0gbnVsbCAmJiAodWEubWF0Y2goL21zaWUgOC9pKSB8fCAoIWlzSUUgJiYgIXNtMi51c2VIaWdoUGVyZm9ybWFuY2UpKSAmJiBuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goL3dpbjMyfHdpbjY0L2kpKSB7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBleHRyYS1zcGVjaWFsIGNhc2U6IG1vdmllIGRvZXNuJ3QgbG9hZCB1bnRpbCBzY3JvbGxlZCBpbnRvIHZpZXcgd2hlbiB1c2luZyB3bW9kZSA9IGFueXRoaW5nIGJ1dCAnd2luZG93JyBoZXJlXHJcbiAgICAgICAqIGRvZXMgbm90IGFwcGx5IHdoZW4gdXNpbmcgaGlnaCBwZXJmb3JtYW5jZSAocG9zaXRpb246Zml4ZWQgbWVhbnMgb24tc2NyZWVuKSwgT1IgaW5maW5pdGUgZmxhc2ggbG9hZCB0aW1lb3V0XHJcbiAgICAgICAqIHdtb2RlIGJyZWFrcyBJRSA4IG9uIFZpc3RhICsgV2luNyB0b28gaW4gc29tZSBjYXNlcywgYXMgb2YgSmFudWFyeSAyMDExICg/KVxyXG4gICAgICAgKi9cclxuICAgICAgIG1lc3NhZ2VzLnB1c2goc3RyaW5ncy5zcGNXbW9kZSk7XHJcbiAgICAgIHNtMi53bW9kZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgb0VtYmVkID0ge1xyXG4gICAgICAnbmFtZSc6IHNtSUQsXHJcbiAgICAgICdpZCc6IHNtSUQsXHJcbiAgICAgICdzcmMnOiBzbVVSTCxcclxuICAgICAgJ3F1YWxpdHknOiAnaGlnaCcsXHJcbiAgICAgICdhbGxvd1NjcmlwdEFjY2Vzcyc6IHNtMi5hbGxvd1NjcmlwdEFjY2VzcyxcclxuICAgICAgJ2JnY29sb3InOiBzbTIuYmdDb2xvcixcclxuICAgICAgJ3BsdWdpbnNwYWdlJzogaHR0cCsnd3d3Lm1hY3JvbWVkaWEuY29tL2dvL2dldGZsYXNocGxheWVyJyxcclxuICAgICAgJ3RpdGxlJzogc3dmVGl0bGUsXHJcbiAgICAgICd0eXBlJzogJ2FwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoJyxcclxuICAgICAgJ3dtb2RlJzogc20yLndtb2RlLFxyXG4gICAgICAvLyBodHRwOi8vaGVscC5hZG9iZS5jb20vZW5fVVMvYXMzL21vYmlsZS9XUzRiZWJjZDY2YTc0Mjc1YzM2Y2ZiODEzNzEyNDMxOGVlYmM2LTdmZmQuaHRtbFxyXG4gICAgICAnaGFzUHJpb3JpdHknOiAndHJ1ZSdcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHNtMi5kZWJ1Z0ZsYXNoKSB7XHJcbiAgICAgIG9FbWJlZC5GbGFzaFZhcnMgPSAnZGVidWc9MSc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFzbTIud21vZGUpIHtcclxuICAgICAgLy8gZG9uJ3Qgd3JpdGUgZW1wdHkgYXR0cmlidXRlXHJcbiAgICAgIGRlbGV0ZSBvRW1iZWQud21vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzSUUpIHtcclxuXHJcbiAgICAgIC8vIElFIGlzIFwic3BlY2lhbFwiLlxyXG4gICAgICBvTW92aWUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIG1vdmllSFRNTCA9IFtcclxuICAgICAgICAnPG9iamVjdCBpZD1cIicgKyBzbUlEICsgJ1wiIGRhdGE9XCInICsgc21VUkwgKyAnXCIgdHlwZT1cIicgKyBvRW1iZWQudHlwZSArICdcIiB0aXRsZT1cIicgKyBvRW1iZWQudGl0bGUgKydcIiBjbGFzc2lkPVwiY2xzaWQ6RDI3Q0RCNkUtQUU2RC0xMWNmLTk2QjgtNDQ0NTUzNTQwMDAwXCIgY29kZWJhc2U9XCInICsgaHR0cCsnZG93bmxvYWQubWFjcm9tZWRpYS5jb20vcHViL3Nob2Nrd2F2ZS9jYWJzL2ZsYXNoL3N3Zmxhc2guY2FiI3ZlcnNpb249NiwwLDQwLDBcIj4nLFxyXG4gICAgICAgIHBhcmFtKCdtb3ZpZScsIHNtVVJMKSxcclxuICAgICAgICBwYXJhbSgnQWxsb3dTY3JpcHRBY2Nlc3MnLCBzbTIuYWxsb3dTY3JpcHRBY2Nlc3MpLFxyXG4gICAgICAgIHBhcmFtKCdxdWFsaXR5Jywgb0VtYmVkLnF1YWxpdHkpLFxyXG4gICAgICAgIChzbTIud21vZGU/IHBhcmFtKCd3bW9kZScsIHNtMi53bW9kZSk6ICcnKSxcclxuICAgICAgICBwYXJhbSgnYmdjb2xvcicsIHNtMi5iZ0NvbG9yKSxcclxuICAgICAgICBwYXJhbSgnaGFzUHJpb3JpdHknLCAndHJ1ZScpLFxyXG4gICAgICAgIChzbTIuZGVidWdGbGFzaCA/IHBhcmFtKCdGbGFzaFZhcnMnLCBvRW1iZWQuRmxhc2hWYXJzKSA6ICcnKSxcclxuICAgICAgICAnPC9vYmplY3Q+J1xyXG4gICAgICBdLmpvaW4oJycpO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBvTW92aWUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZW1iZWQnKTtcclxuICAgICAgZm9yICh0bXAgaW4gb0VtYmVkKSB7XHJcbiAgICAgICAgaWYgKG9FbWJlZC5oYXNPd25Qcm9wZXJ0eSh0bXApKSB7XHJcbiAgICAgICAgICBvTW92aWUuc2V0QXR0cmlidXRlKHRtcCwgb0VtYmVkW3RtcF0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0RGVidWcoKTtcclxuICAgIGV4dHJhQ2xhc3MgPSBnZXRTV0ZDU1MoKTtcclxuICAgIG9UYXJnZXQgPSBnZXREb2N1bWVudCgpO1xyXG5cclxuICAgIGlmIChvVGFyZ2V0KSB7XHJcblxyXG4gICAgICBzbTIub01DID0gKGlkKHNtMi5tb3ZpZUlEKSB8fCBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xyXG5cclxuICAgICAgaWYgKCFzbTIub01DLmlkKSB7XHJcblxyXG4gICAgICAgIHNtMi5vTUMuaWQgPSBzbTIubW92aWVJRDtcclxuICAgICAgICBzbTIub01DLmNsYXNzTmFtZSA9IHN3ZkNTUy5zd2ZEZWZhdWx0ICsgJyAnICsgZXh0cmFDbGFzcztcclxuICAgICAgICBzID0gbnVsbDtcclxuICAgICAgICBvRWwgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIXNtMi51c2VGbGFzaEJsb2NrKSB7XHJcbiAgICAgICAgICBpZiAoc20yLnVzZUhpZ2hQZXJmb3JtYW5jZSkge1xyXG4gICAgICAgICAgICAvLyBvbi1zY3JlZW4gYXQgYWxsIHRpbWVzXHJcbiAgICAgICAgICAgIHMgPSB7XHJcbiAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAnd2lkdGgnOiAnOHB4JyxcclxuICAgICAgICAgICAgICAnaGVpZ2h0JzogJzhweCcsXHJcbiAgICAgICAgICAgICAgLy8gPj0gNnB4IGZvciBmbGFzaCB0byBydW4gZmFzdCwgPj0gOHB4IHRvIHN0YXJ0IHVwIHVuZGVyIEZpcmVmb3gvd2luMzIgaW4gc29tZSBjYXNlcy4gb2RkPyB5ZXMuXHJcbiAgICAgICAgICAgICAgJ2JvdHRvbSc6ICcwcHgnLFxyXG4gICAgICAgICAgICAgICdsZWZ0JzogJzBweCcsXHJcbiAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGhpZGUgb2ZmLXNjcmVlbiwgbG93ZXIgcHJpb3JpdHlcclxuICAgICAgICAgICAgcyA9IHtcclxuICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICd3aWR0aCc6ICc2cHgnLFxyXG4gICAgICAgICAgICAgICdoZWlnaHQnOiAnNnB4JyxcclxuICAgICAgICAgICAgICAndG9wJzogJy05OTk5cHgnLFxyXG4gICAgICAgICAgICAgICdsZWZ0JzogJy05OTk5cHgnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChpc1JUTCkge1xyXG4gICAgICAgICAgICAgIHMubGVmdCA9IE1hdGguYWJzKHBhcnNlSW50KHMubGVmdCwxMCkpKydweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1dlYmtpdCkge1xyXG4gICAgICAgICAgLy8gc291bmRjbG91ZC1yZXBvcnRlZCByZW5kZXIvY3Jhc2ggZml4LCBzYWZhcmkgNVxyXG4gICAgICAgICAgc20yLm9NQy5zdHlsZS56SW5kZXggPSAxMDAwMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc20yLmRlYnVnRmxhc2gpIHtcclxuICAgICAgICAgIGZvciAoeCBpbiBzKSB7XHJcbiAgICAgICAgICAgIGlmIChzLmhhc093blByb3BlcnR5KHgpKSB7XHJcbiAgICAgICAgICAgICAgc20yLm9NQy5zdHlsZVt4XSA9IHNbeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAoIWlzSUUpIHtcclxuICAgICAgICAgICAgc20yLm9NQy5hcHBlbmRDaGlsZChvTW92aWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgb1RhcmdldC5hcHBlbmRDaGlsZChzbTIub01DKTtcclxuICAgICAgICAgIGlmIChpc0lFKSB7XHJcbiAgICAgICAgICAgIG9FbCA9IHNtMi5vTUMuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcclxuICAgICAgICAgICAgb0VsLmNsYXNzTmFtZSA9IHN3ZkNTUy5zd2ZCb3g7XHJcbiAgICAgICAgICAgIG9FbC5pbm5lckhUTUwgPSBtb3ZpZUhUTUw7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhcHBlbmRTdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIoJ2RvbUVycm9yJykrJyBcXG4nK2UudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gU00yIGNvbnRhaW5lciBpcyBhbHJlYWR5IGluIHRoZSBkb2N1bWVudCAoZWcuIGZsYXNoYmxvY2sgdXNlIGNhc2UpXHJcbiAgICAgICAgc0NsYXNzID0gc20yLm9NQy5jbGFzc05hbWU7XHJcbiAgICAgICAgc20yLm9NQy5jbGFzc05hbWUgPSAoc0NsYXNzP3NDbGFzcysnICc6c3dmQ1NTLnN3ZkRlZmF1bHQpICsgKGV4dHJhQ2xhc3M/JyAnK2V4dHJhQ2xhc3M6JycpO1xyXG4gICAgICAgIHNtMi5vTUMuYXBwZW5kQ2hpbGQob01vdmllKTtcclxuICAgICAgICBpZiAoaXNJRSkge1xyXG4gICAgICAgICAgb0VsID0gc20yLm9NQy5hcHBlbmRDaGlsZChkb2MuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xyXG4gICAgICAgICAgb0VsLmNsYXNzTmFtZSA9IHN3ZkNTUy5zd2ZCb3g7XHJcbiAgICAgICAgICBvRWwuaW5uZXJIVE1MID0gbW92aWVIVE1MO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhcHBlbmRTdWNjZXNzID0gdHJ1ZTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZGlkQXBwZW5kID0gdHJ1ZTtcclxuICAgIGluaXRNc2coKTtcclxuICAgIC8vIHNtMi5fd0Qoc20gKyAnOiBUcnlpbmcgdG8gbG9hZCAnICsgc21VUkwgKyAoIW92ZXJIVFRQICYmIHNtMi5hbHRVUkwgPyAnIChhbHRlcm5hdGUgVVJMKScgOiAnJyksIDEpO1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICBpbml0TW92aWUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZiAoc20yLmh0bWw1T25seSkge1xyXG4gICAgICBjcmVhdGVNb3ZpZSgpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYXR0ZW1wdCB0byBnZXQsIG9yIGNyZWF0ZSwgbW92aWUgKG1heSBhbHJlYWR5IGV4aXN0KVxyXG4gICAgaWYgKGZsYXNoKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNtMi51cmwpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTb21ldGhpbmcgaXNuJ3QgcmlnaHQgLSB3ZSd2ZSByZWFjaGVkIGluaXQsIGJ1dCB0aGUgc291bmRNYW5hZ2VyIHVybCBwcm9wZXJ0eSBoYXMgbm90IGJlZW4gc2V0LlxyXG4gICAgICAgKiBVc2VyIGhhcyBub3QgY2FsbGVkIHNldHVwKHt1cmw6IC4uLn0pLCBvciBoYXMgbm90IHNldCBzb3VuZE1hbmFnZXIudXJsIChsZWdhY3kgdXNlIGNhc2UpIGRpcmVjdGx5IGJlZm9yZSBpbml0IHRpbWUuXHJcbiAgICAgICAqIE5vdGlmeSBhbmQgZXhpdC4gSWYgdXNlciBjYWxscyBzZXR1cCgpIHdpdGggYSB1cmw6IHByb3BlcnR5LCBpbml0IHdpbGwgYmUgcmVzdGFydGVkIGFzIGluIHRoZSBkZWZlcnJlZCBsb2FkaW5nIGNhc2UuXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgIF93RFMoJ25vVVJMJyk7XHJcbiAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIGlubGluZSBtYXJrdXAgY2FzZVxyXG4gICAgZmxhc2ggPSBzbTIuZ2V0TW92aWUoc20yLmlkKTtcclxuXHJcbiAgICBpZiAoIWZsYXNoKSB7XHJcbiAgICAgIGlmICghb1JlbW92ZWQpIHtcclxuICAgICAgICAvLyB0cnkgdG8gY3JlYXRlXHJcbiAgICAgICAgY3JlYXRlTW92aWUoc20yLmlkLCBzbTIudXJsKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyB0cnkgdG8gcmUtYXBwZW5kIHJlbW92ZWQgbW92aWUgYWZ0ZXIgcmVib290KClcclxuICAgICAgICBpZiAoIWlzSUUpIHtcclxuICAgICAgICAgIHNtMi5vTUMuYXBwZW5kQ2hpbGQob1JlbW92ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzbTIub01DLmlubmVySFRNTCA9IG9SZW1vdmVkSFRNTDtcclxuICAgICAgICB9XHJcbiAgICAgICAgb1JlbW92ZWQgPSBudWxsO1xyXG4gICAgICAgIGRpZEFwcGVuZCA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZmxhc2ggPSBzbTIuZ2V0TW92aWUoc20yLmlkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHNtMi5vbmluaXRtb3ZpZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBzZXRUaW1lb3V0KHNtMi5vbmluaXRtb3ZpZSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBmbHVzaE1lc3NhZ2VzKCk7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGRlbGF5V2FpdEZvckVJID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgc2V0VGltZW91dCh3YWl0Rm9yRUksIDEwMDApO1xyXG5cclxuICB9O1xyXG5cclxuICByZWJvb3RJbnRvSFRNTDUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHRyeSBmb3IgYSByZWJvb3Qgd2l0aCBwcmVmZXJGbGFzaDogZmFsc2UsIGlmIDEwMCUgSFRNTDUgbW9kZSBpcyBwb3NzaWJsZSBhbmQgdXNlRmxhc2hCbG9jayBpcyBub3QgZW5hYmxlZC5cclxuXHJcbiAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGNvbXBsYWluKHNtYyArICd1c2VGbGFzaEJsb2NrIGlzIGZhbHNlLCAxMDAlIEhUTUw1IG1vZGUgaXMgcG9zc2libGUuIFJlYm9vdGluZyB3aXRoIHByZWZlckZsYXNoOiBmYWxzZS4uLicpO1xyXG5cclxuICAgICAgc20yLnNldHVwKHtcclxuICAgICAgICBwcmVmZXJGbGFzaDogZmFsc2VcclxuICAgICAgfSkucmVib290KCk7XHJcblxyXG4gICAgICAvLyBpZiBmb3Igc29tZSByZWFzb24geW91IHdhbnQgdG8gZGV0ZWN0IHRoaXMgY2FzZSwgdXNlIGFuIG9udGltZW91dCgpIGNhbGxiYWNrIGFuZCBsb29rIGZvciBodG1sNU9ubHkgYW5kIGRpZEZsYXNoQmxvY2sgPT0gdHJ1ZS5cclxuICAgICAgc20yLmRpZEZsYXNoQmxvY2sgPSB0cnVlO1xyXG5cclxuICAgICAgc20yLmJlZ2luRGVsYXllZEluaXQoKTtcclxuXHJcbiAgICB9LCAxKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2FpdEZvckVJID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIHAsXHJcbiAgICAgICAgbG9hZEluY29tcGxldGUgPSBmYWxzZTtcclxuXHJcbiAgICBpZiAoIXNtMi51cmwpIHtcclxuICAgICAgLy8gTm8gU1dGIHVybCB0byBsb2FkIChub1VSTCBjYXNlKSAtIGV4aXQgZm9yIG5vdy4gV2lsbCBiZSByZXRyaWVkIHdoZW4gdXJsIGlzIHNldC5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh3YWl0aW5nRm9yRUkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHdhaXRpbmdGb3JFSSA9IHRydWU7XHJcbiAgICBldmVudC5yZW1vdmUod2luZG93LCAnbG9hZCcsIGRlbGF5V2FpdEZvckVJKTtcclxuXHJcbiAgICBpZiAoaGFzRmxhc2ggJiYgdHJ5SW5pdE9uRm9jdXMgJiYgIWlzRm9jdXNlZCkge1xyXG4gICAgICAvLyBTYWZhcmkgd29uJ3QgbG9hZCBmbGFzaCBpbiBiYWNrZ3JvdW5kIHRhYnMsIG9ubHkgd2hlbiBmb2N1c2VkLlxyXG4gICAgICBfd0RTKCd3YWl0Rm9jdXMnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZGlkSW5pdCkge1xyXG4gICAgICBwID0gc20yLmdldE1vdmllUGVyY2VudCgpO1xyXG4gICAgICBpZiAocCA+IDAgJiYgcCA8IDEwMCkge1xyXG4gICAgICAgIGxvYWRJbmNvbXBsZXRlID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBwID0gc20yLmdldE1vdmllUGVyY2VudCgpO1xyXG5cclxuICAgICAgaWYgKGxvYWRJbmNvbXBsZXRlKSB7XHJcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBpZiBtb3ZpZSAqcGFydGlhbGx5KiBsb2FkZWQsIHJldHJ5IHVudGlsIGl0J3MgMTAwJSBiZWZvcmUgYXNzdW1pbmcgZmFpbHVyZS5cclxuICAgICAgICB3YWl0aW5nRm9yRUkgPSBmYWxzZTtcclxuICAgICAgICBzbTIuX3dEKHN0cignd2FpdFNXRicpKTtcclxuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChkZWxheVdhaXRGb3JFSSwgMSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgaWYgKCFkaWRJbml0KSB7XHJcblxyXG4gICAgICAgIHNtMi5fd0Qoc20gKyAnOiBObyBGbGFzaCByZXNwb25zZSB3aXRoaW4gZXhwZWN0ZWQgdGltZS4gTGlrZWx5IGNhdXNlczogJyArIChwID09PSAwID8gJ1NXRiBsb2FkIGZhaWxlZCwgJzonJykgKyAnRmxhc2ggYmxvY2tlZCBvciBKUy1GbGFzaCBzZWN1cml0eSBlcnJvci4nICsgKHNtMi5kZWJ1Z0ZsYXNoPycgJyArIHN0cignY2hlY2tTV0YnKTonJyksIDIpO1xyXG5cclxuICAgICAgICBpZiAoIW92ZXJIVFRQICYmIHApIHtcclxuXHJcbiAgICAgICAgICBfd0RTKCdsb2NhbEZhaWwnLCAyKTtcclxuXHJcbiAgICAgICAgICBpZiAoIXNtMi5kZWJ1Z0ZsYXNoKSB7XHJcbiAgICAgICAgICAgIF93RFMoJ3RyeURlYnVnJywgMik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHAgPT09IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBpZiAwIChub3QgbnVsbCksIHByb2JhYmx5IGEgNDA0LlxyXG4gICAgICAgICAgc20yLl93RChzdHIoJ3N3ZjQwNCcsIHNtMi51cmwpLCAxKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkZWJ1Z1RTKCdmbGFzaHRvanMnLCBmYWxzZSwgJzogVGltZWQgb3V0JyArIG92ZXJIVFRQPycgKENoZWNrIGZsYXNoIHNlY3VyaXR5IG9yIGZsYXNoIGJsb2NrZXJzKSc6JyAoTm8gcGx1Z2luL21pc3NpbmcgU1dGPyknKTtcclxuXHJcbiAgICAgIH1cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgLy8gZ2l2ZSB1cCAvIHRpbWUtb3V0LCBkZXBlbmRpbmdcclxuXHJcbiAgICAgIGlmICghZGlkSW5pdCAmJiBva1RvRGlzYWJsZSkge1xyXG5cclxuICAgICAgICBpZiAocCA9PT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgIC8vIFNXRiBmYWlsZWQgdG8gcmVwb3J0IGxvYWQgcHJvZ3Jlc3MuIFBvc3NpYmx5IGJsb2NrZWQuXHJcblxyXG4gICAgICAgICAgaWYgKHNtMi51c2VGbGFzaEJsb2NrIHx8IHNtMi5mbGFzaExvYWRUaW1lb3V0ID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoc20yLnVzZUZsYXNoQmxvY2spIHtcclxuXHJcbiAgICAgICAgICAgICAgZmxhc2hCbG9ja0hhbmRsZXIoKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIF93RFMoJ3dhaXRGb3JldmVyJyk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIG5vIGN1c3RvbSBmbGFzaCBibG9jayBoYW5kbGluZywgYnV0IFNXRiBoYXMgdGltZWQgb3V0LiBXaWxsIHJlY292ZXIgaWYgdXNlciB1bmJsb2NrcyAvIGFsbG93cyBTV0YgbG9hZC5cclxuXHJcbiAgICAgICAgICAgIGlmICghc20yLnVzZUZsYXNoQmxvY2sgJiYgY2FuSWdub3JlRmxhc2gpIHtcclxuXHJcbiAgICAgICAgICAgICAgcmVib290SW50b0hUTUw1KCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICBfd0RTKCd3YWl0Rm9yZXZlcicpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBmaXJlIGFueSByZWd1bGFyIHJlZ2lzdGVyZWQgb250aW1lb3V0KCkgbGlzdGVuZXJzLlxyXG4gICAgICAgICAgICAgIHByb2Nlc3NPbkV2ZW50cyh7dHlwZTonb250aW1lb3V0JywgaWdub3JlSW5pdDogdHJ1ZSwgZXJyb3I6IHt0eXBlOiAnSU5JVF9GTEFTSEJMT0NLJ319KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gU1dGIGxvYWRlZD8gU2hvdWxkbid0IGJlIGEgYmxvY2tpbmcgaXNzdWUsIHRoZW4uXHJcblxyXG4gICAgICAgICAgaWYgKHNtMi5mbGFzaExvYWRUaW1lb3V0ID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgICBfd0RTKCd3YWl0Rm9yZXZlcicpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXNtMi51c2VGbGFzaEJsb2NrICYmIGNhbklnbm9yZUZsYXNoKSB7XHJcblxyXG4gICAgICAgICAgICAgIHJlYm9vdEludG9IVE1MNSgpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgZmFpbFNhZmVseSh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCBzbTIuZmxhc2hMb2FkVGltZW91dCk7XHJcblxyXG4gIH07XHJcblxyXG4gIGhhbmRsZUZvY3VzID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcclxuICAgICAgZXZlbnQucmVtb3ZlKHdpbmRvdywgJ2ZvY3VzJywgaGFuZGxlRm9jdXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc0ZvY3VzZWQgfHwgIXRyeUluaXRPbkZvY3VzKSB7XHJcbiAgICAgIC8vIGFscmVhZHkgZm9jdXNlZCwgb3Igbm90IHNwZWNpYWwgU2FmYXJpIGJhY2tncm91bmQgdGFiIGNhc2VcclxuICAgICAgY2xlYW51cCgpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBva1RvRGlzYWJsZSA9IHRydWU7XHJcbiAgICBpc0ZvY3VzZWQgPSB0cnVlO1xyXG4gICAgX3dEUygnZ290Rm9jdXMnKTtcclxuXHJcbiAgICAvLyBhbGxvdyBpbml0IHRvIHJlc3RhcnRcclxuICAgIHdhaXRpbmdGb3JFSSA9IGZhbHNlO1xyXG5cclxuICAgIC8vIGtpY2sgb2ZmIEV4dGVybmFsSW50ZXJmYWNlIHRpbWVvdXQsIG5vdyB0aGF0IHRoZSBTV0YgaGFzIHN0YXJ0ZWRcclxuICAgIGRlbGF5V2FpdEZvckVJKCk7XHJcblxyXG4gICAgY2xlYW51cCgpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGZsdXNoTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyA8ZD5cclxuXHJcbiAgICAvLyBTTTIgcHJlLWluaXQgZGVidWcgbWVzc2FnZXNcclxuICAgIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcclxuICAgICAgc20yLl93RCgnU291bmRNYW5hZ2VyIDI6ICcgKyBtZXNzYWdlcy5qb2luKCcgJyksIDEpO1xyXG4gICAgICBtZXNzYWdlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgfTtcclxuXHJcbiAgc2hvd1N1cHBvcnQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyA8ZD5cclxuXHJcbiAgICBmbHVzaE1lc3NhZ2VzKCk7XHJcblxyXG4gICAgdmFyIGl0ZW0sIHRlc3RzID0gW107XHJcblxyXG4gICAgaWYgKHNtMi51c2VIVE1MNUF1ZGlvICYmIHNtMi5oYXNIVE1MNSkge1xyXG4gICAgICBmb3IgKGl0ZW0gaW4gc20yLmF1ZGlvRm9ybWF0cykge1xyXG4gICAgICAgIGlmIChzbTIuYXVkaW9Gb3JtYXRzLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XHJcbiAgICAgICAgICB0ZXN0cy5wdXNoKGl0ZW0gKyAnID0gJyArIHNtMi5odG1sNVtpdGVtXSArICghc20yLmh0bWw1W2l0ZW1dICYmIG5lZWRzRmxhc2ggJiYgc20yLmZsYXNoW2l0ZW1dID8gJyAodXNpbmcgZmxhc2gpJyA6IChzbTIucHJlZmVyRmxhc2ggJiYgc20yLmZsYXNoW2l0ZW1dICYmIG5lZWRzRmxhc2ggPyAnIChwcmVmZXJyaW5nIGZsYXNoKSc6ICghc20yLmh0bWw1W2l0ZW1dID8gJyAoJyArIChzbTIuYXVkaW9Gb3JtYXRzW2l0ZW1dLnJlcXVpcmVkID8gJ3JlcXVpcmVkLCAnOicnKSArICdhbmQgbm8gZmxhc2ggc3VwcG9ydCknIDogJycpKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBzbTIuX3dEKCdTb3VuZE1hbmFnZXIgMiBIVE1MNSBzdXBwb3J0OiAnICsgdGVzdHMuam9pbignLCAnKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBpbml0Q29tcGxldGUgPSBmdW5jdGlvbihiTm9EaXNhYmxlKSB7XHJcblxyXG4gICAgaWYgKGRpZEluaXQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgIC8vIGFsbCBnb29kLlxyXG4gICAgICBfd0RTKCdzbTJMb2FkZWQnKTtcclxuICAgICAgZGlkSW5pdCA9IHRydWU7XHJcbiAgICAgIGluaXRVc2VyT25sb2FkKCk7XHJcbiAgICAgIGRlYnVnVFMoJ29ubG9hZCcsIHRydWUpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgd2FzVGltZW91dCA9IChzbTIudXNlRmxhc2hCbG9jayAmJiBzbTIuZmxhc2hMb2FkVGltZW91dCAmJiAhc20yLmdldE1vdmllUGVyY2VudCgpKSxcclxuICAgICAgICByZXN1bHQgPSB0cnVlLFxyXG4gICAgICAgIGVycm9yO1xyXG5cclxuICAgIGlmICghd2FzVGltZW91dCkge1xyXG4gICAgICBkaWRJbml0ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBlcnJvciA9IHt0eXBlOiAoIWhhc0ZsYXNoICYmIG5lZWRzRmxhc2ggPyAnTk9fRkxBU0gnIDogJ0lOSVRfVElNRU9VVCcpfTtcclxuXHJcbiAgICBzbTIuX3dEKCdTb3VuZE1hbmFnZXIgMiAnICsgKGRpc2FibGVkID8gJ2ZhaWxlZCB0byBsb2FkJyA6ICdsb2FkZWQnKSArICcgKCcgKyAoZGlzYWJsZWQgPyAnRmxhc2ggc2VjdXJpdHkvbG9hZCBlcnJvcicgOiAnT0snKSArICcpJywgZGlzYWJsZWQgPyAyOiAxKTtcclxuXHJcbiAgICBpZiAoZGlzYWJsZWQgfHwgYk5vRGlzYWJsZSkge1xyXG4gICAgICBpZiAoc20yLnVzZUZsYXNoQmxvY2sgJiYgc20yLm9NQykge1xyXG4gICAgICAgIHNtMi5vTUMuY2xhc3NOYW1lID0gZ2V0U1dGQ1NTKCkgKyAnICcgKyAoc20yLmdldE1vdmllUGVyY2VudCgpID09PSBudWxsP3N3ZkNTUy5zd2ZUaW1lZG91dDpzd2ZDU1Muc3dmRXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICAgIHByb2Nlc3NPbkV2ZW50cyh7dHlwZTonb250aW1lb3V0JywgZXJyb3I6ZXJyb3IsIGlnbm9yZUluaXQ6IHRydWV9KTtcclxuICAgICAgZGVidWdUUygnb25sb2FkJywgZmFsc2UpO1xyXG4gICAgICBjYXRjaEVycm9yKGVycm9yKTtcclxuICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkZWJ1Z1RTKCdvbmxvYWQnLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWRpc2FibGVkKSB7XHJcbiAgICAgIGlmIChzbTIud2FpdEZvcldpbmRvd0xvYWQgJiYgIXdpbmRvd0xvYWRlZCkge1xyXG4gICAgICAgIF93RFMoJ3dhaXRPbmxvYWQnKTtcclxuICAgICAgICBldmVudC5hZGQod2luZG93LCAnbG9hZCcsIGluaXRVc2VyT25sb2FkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyA8ZD5cclxuICAgICAgICBpZiAoc20yLndhaXRGb3JXaW5kb3dMb2FkICYmIHdpbmRvd0xvYWRlZCkge1xyXG4gICAgICAgICAgX3dEUygnZG9jTG9hZGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDwvZD5cclxuICAgICAgICBpbml0VXNlck9ubG9hZCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogYXBwbHkgdG9wLWxldmVsIHNldHVwT3B0aW9ucyBvYmplY3QgYXMgbG9jYWwgcHJvcGVydGllcywgZWcuLCB0aGlzLnNldHVwT3B0aW9ucy5mbGFzaFZlcnNpb24gLT4gdGhpcy5mbGFzaFZlcnNpb24gKHNvdW5kTWFuYWdlci5mbGFzaFZlcnNpb24pXHJcbiAgICogdGhpcyBtYWludGFpbnMgYmFja3dhcmQgY29tcGF0aWJpbGl0eSwgYW5kIGFsbG93cyBwcm9wZXJ0aWVzIHRvIGJlIGRlZmluZWQgc2VwYXJhdGVseSBmb3IgdXNlIGJ5IHNvdW5kTWFuYWdlci5zZXR1cCgpLlxyXG4gICAqL1xyXG5cclxuICBzZXRQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIGksXHJcbiAgICAgICAgbyA9IHNtMi5zZXR1cE9wdGlvbnM7XHJcblxyXG4gICAgZm9yIChpIGluIG8pIHtcclxuXHJcbiAgICAgIGlmIChvLmhhc093blByb3BlcnR5KGkpKSB7XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiBsb2NhbCBwcm9wZXJ0eSBpZiBub3QgYWxyZWFkeSBkZWZpbmVkXHJcblxyXG4gICAgICAgIGlmIChzbTJbaV0gPT09IF91bmRlZmluZWQpIHtcclxuXHJcbiAgICAgICAgICBzbTJbaV0gPSBvW2ldO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHNtMltpXSAhPT0gb1tpXSkge1xyXG5cclxuICAgICAgICAgIC8vIGxlZ2FjeSBzdXBwb3J0OiB3cml0ZSBtYW51YWxseS1hc3NpZ25lZCBwcm9wZXJ0eSAoZWcuLCBzb3VuZE1hbmFnZXIudXJsKSBiYWNrIHRvIHNldHVwT3B0aW9ucyB0byBrZWVwIHRoaW5ncyBpbiBzeW5jXHJcbiAgICAgICAgICBzbTIuc2V0dXBPcHRpb25zW2ldID0gc20yW2ldO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuXHJcbiAgaW5pdCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIGNhbGxlZCBhZnRlciBvbmxvYWQoKVxyXG5cclxuICAgIGlmIChkaWRJbml0KSB7XHJcbiAgICAgIF93RFMoJ2RpZEluaXQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XHJcbiAgICAgIGV2ZW50LnJlbW92ZSh3aW5kb3csICdsb2FkJywgc20yLmJlZ2luRGVsYXllZEluaXQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgIGlmICghZGlkSW5pdCkge1xyXG4gICAgICAgIC8vIHdlIGRvbid0IG5lZWQgbm8gc3RlZW5raW5nIGZsYXNoIVxyXG4gICAgICAgIGNsZWFudXAoKTtcclxuICAgICAgICBzbTIuZW5hYmxlZCA9IHRydWU7XHJcbiAgICAgICAgaW5pdENvbXBsZXRlKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZmxhc2ggcGF0aFxyXG4gICAgaW5pdE1vdmllKCk7XHJcblxyXG4gICAgdHJ5IHtcclxuXHJcbiAgICAgIC8vIGF0dGVtcHQgdG8gdGFsayB0byBGbGFzaFxyXG4gICAgICBmbGFzaC5fZXh0ZXJuYWxJbnRlcmZhY2VUZXN0KGZhbHNlKTtcclxuXHJcbiAgICAgIC8vIGFwcGx5IHVzZXItc3BlY2lmaWVkIHBvbGxpbmcgaW50ZXJ2YWwsIE9SLCBpZiBcImhpZ2ggcGVyZm9ybWFuY2VcIiBzZXQsIGZhc3RlciB2cy4gZGVmYXVsdCBwb2xsaW5nXHJcbiAgICAgIC8vIChkZXRlcm1pbmVzIGZyZXF1ZW5jeSBvZiB3aGlsZWxvYWRpbmcvd2hpbGVwbGF5aW5nIGNhbGxiYWNrcywgZWZmZWN0aXZlbHkgZHJpdmluZyBVSSBmcmFtZXJhdGVzKVxyXG4gICAgICBzZXRQb2xsaW5nKHRydWUsIChzbTIuZmxhc2hQb2xsaW5nSW50ZXJ2YWwgfHwgKHNtMi51c2VIaWdoUGVyZm9ybWFuY2UgPyAxMCA6IDUwKSkpO1xyXG5cclxuICAgICAgaWYgKCFzbTIuZGVidWdNb2RlKSB7XHJcbiAgICAgICAgLy8gc3RvcCB0aGUgU1dGIGZyb20gbWFraW5nIGRlYnVnIG91dHB1dCBjYWxscyB0byBKU1xyXG4gICAgICAgIGZsYXNoLl9kaXNhYmxlRGVidWcoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc20yLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICBkZWJ1Z1RTKCdqc3RvZmxhc2gnLCB0cnVlKTtcclxuXHJcbiAgICAgIGlmICghc20yLmh0bWw1T25seSkge1xyXG4gICAgICAgIC8vIHByZXZlbnQgYnJvd3NlciBmcm9tIHNob3dpbmcgY2FjaGVkIHBhZ2Ugc3RhdGUgKG9yIHJhdGhlciwgcmVzdG9yaW5nIFwic3VzcGVuZGVkXCIgcGFnZSBzdGF0ZSkgdmlhIGJhY2sgYnV0dG9uLCBiZWNhdXNlIGZsYXNoIG1heSBiZSBkZWFkXHJcbiAgICAgICAgLy8gaHR0cDovL3d3dy53ZWJraXQub3JnL2Jsb2cvNTE2L3dlYmtpdC1wYWdlLWNhY2hlLWlpLXRoZS11bmxvYWQtZXZlbnQvXHJcbiAgICAgICAgZXZlbnQuYWRkKHdpbmRvdywgJ3VubG9hZCcsIGRvTm90aGluZyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGNhdGNoKGUpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QoJ2pzL2ZsYXNoIGV4Y2VwdGlvbjogJyArIGUudG9TdHJpbmcoKSk7XHJcbiAgICAgIGRlYnVnVFMoJ2pzdG9mbGFzaCcsIGZhbHNlKTtcclxuICAgICAgY2F0Y2hFcnJvcih7dHlwZTonSlNfVE9fRkxBU0hfRVhDRVBUSU9OJywgZmF0YWw6dHJ1ZX0pO1xyXG4gICAgICAvLyBkb24ndCBkaXNhYmxlLCBmb3IgcmVib290KClcclxuICAgICAgZmFpbFNhZmVseSh0cnVlKTtcclxuICAgICAgaW5pdENvbXBsZXRlKCk7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRDb21wbGV0ZSgpO1xyXG5cclxuICAgIC8vIGRpc2Nvbm5lY3QgZXZlbnRzXHJcbiAgICBjbGVhbnVwKCk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGRvbUNvbnRlbnRMb2FkZWQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZiAoZGlkRENMb2FkZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGRpZERDTG9hZGVkID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBhc3NpZ24gdG9wLWxldmVsIHNvdW5kTWFuYWdlciBwcm9wZXJ0aWVzIGVnLiBzb3VuZE1hbmFnZXIudXJsXHJcbiAgICBzZXRQcm9wZXJ0aWVzKCk7XHJcblxyXG4gICAgaW5pdERlYnVnKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUZW1wb3JhcnkgZmVhdHVyZTogYWxsb3cgZm9yY2Ugb2YgSFRNTDUgdmlhIFVSTCBwYXJhbXM6IHNtMi11c2VodG1sNWF1ZGlvPTAgb3IgMVxyXG4gICAgICogRGl0dG8gZm9yIHNtMi1wcmVmZXJGbGFzaCwgdG9vLlxyXG4gICAgICovXHJcbiAgICAvLyA8ZD5cclxuICAgIChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgdmFyIGEgPSAnc20yLXVzZWh0bWw1YXVkaW89JyxcclxuICAgICAgICAgIGEyID0gJ3NtMi1wcmVmZXJmbGFzaD0nLFxyXG4gICAgICAgICAgYiA9IG51bGwsXHJcbiAgICAgICAgICBiMiA9IG51bGwsXHJcbiAgICAgICAgICBsID0gd2wudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgIGlmIChsLmluZGV4T2YoYSkgIT09IC0xKSB7XHJcbiAgICAgICAgYiA9IChsLmNoYXJBdChsLmluZGV4T2YoYSkrYS5sZW5ndGgpID09PSAnMScpO1xyXG4gICAgICAgIGlmIChoYXNDb25zb2xlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygoYj8nRW5hYmxpbmcgJzonRGlzYWJsaW5nICcpKyd1c2VIVE1MNUF1ZGlvIHZpYSBVUkwgcGFyYW1ldGVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNtMi5zZXR1cCh7XHJcbiAgICAgICAgICAndXNlSFRNTDVBdWRpbyc6IGJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGwuaW5kZXhPZihhMikgIT09IC0xKSB7XHJcbiAgICAgICAgYjIgPSAobC5jaGFyQXQobC5pbmRleE9mKGEyKSthMi5sZW5ndGgpID09PSAnMScpO1xyXG4gICAgICAgIGlmIChoYXNDb25zb2xlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygoYjI/J0VuYWJsaW5nICc6J0Rpc2FibGluZyAnKSsncHJlZmVyRmxhc2ggdmlhIFVSTCBwYXJhbWV0ZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc20yLnNldHVwKHtcclxuICAgICAgICAgICdwcmVmZXJGbGFzaCc6IGIyXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9KCkpO1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICAgIGlmICghaGFzRmxhc2ggJiYgc20yLmhhc0hUTUw1KSB7XHJcbiAgICAgIHNtMi5fd0QoJ1NvdW5kTWFuYWdlciAyOiBObyBGbGFzaCBkZXRlY3RlZCcgKyAoIXNtMi51c2VIVE1MNUF1ZGlvID8gJywgZW5hYmxpbmcgSFRNTDUuJyA6ICcuIFRyeWluZyBIVE1MNS1vbmx5IG1vZGUuJyksIDEpO1xyXG4gICAgICBzbTIuc2V0dXAoe1xyXG4gICAgICAgICd1c2VIVE1MNUF1ZGlvJzogdHJ1ZSxcclxuICAgICAgICAvLyBtYWtlIHN1cmUgd2UgYXJlbid0IHByZWZlcnJpbmcgZmxhc2gsIGVpdGhlclxyXG4gICAgICAgIC8vIFRPRE86IHByZWZlckZsYXNoIHNob3VsZCBub3QgbWF0dGVyIGlmIGZsYXNoIGlzIG5vdCBpbnN0YWxsZWQuIEN1cnJlbnRseSwgc3R1ZmYgYnJlYWtzIHdpdGhvdXQgdGhlIGJlbG93IHR3ZWFrLlxyXG4gICAgICAgICdwcmVmZXJGbGFzaCc6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRlc3RIVE1MNSgpO1xyXG5cclxuICAgIGlmICghaGFzRmxhc2ggJiYgbmVlZHNGbGFzaCkge1xyXG4gICAgICBtZXNzYWdlcy5wdXNoKHN0cmluZ3MubmVlZEZsYXNoKTtcclxuICAgICAgLy8gVE9ETzogRmF0YWwgaGVyZSB2cy4gdGltZW91dCBhcHByb2FjaCwgZXRjLlxyXG4gICAgICAvLyBoYWNrOiBmYWlsIHNvb25lci5cclxuICAgICAgc20yLnNldHVwKHtcclxuICAgICAgICAnZmxhc2hMb2FkVGltZW91dCc6IDFcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZG9tQ29udGVudExvYWRlZCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRNb3ZpZSgpO1xyXG5cclxuICAgIHJldHVybiB0cnVlO1xyXG5cclxuICB9O1xyXG5cclxuICBkb21Db250ZW50TG9hZGVkSUUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZiAoZG9jLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgZG9tQ29udGVudExvYWRlZCgpO1xyXG4gICAgICBkb2MuZGV0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGRvbUNvbnRlbnRMb2FkZWRJRSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIHdpbk9uTG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIGNhdGNoIGVkZ2UgY2FzZSBvZiBpbml0Q29tcGxldGUoKSBmaXJpbmcgYWZ0ZXIgd2luZG93LmxvYWQoKVxyXG4gICAgd2luZG93TG9hZGVkID0gdHJ1ZTtcclxuICAgIGV2ZW50LnJlbW92ZSh3aW5kb3csICdsb2FkJywgd2luT25Mb2FkKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogbWlzY2VsbGFuZW91cyBydW4tdGltZSwgcHJlLWluaXQgc3R1ZmZcclxuICAgKi9cclxuXHJcbiAgcHJlSW5pdCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmIChtb2JpbGVIVE1MNSkge1xyXG5cclxuICAgICAgLy8gcHJlZmVyIEhUTUw1IGZvciBtb2JpbGUgKyB0YWJsZXQtbGlrZSBkZXZpY2VzLCBwcm9iYWJseSBtb3JlIHJlbGlhYmxlIHZzLiBmbGFzaCBhdCB0aGlzIHBvaW50LlxyXG5cclxuICAgICAgLy8gPGQ+XHJcbiAgICAgIGlmICghc20yLnNldHVwT3B0aW9ucy51c2VIVE1MNUF1ZGlvIHx8IHNtMi5zZXR1cE9wdGlvbnMucHJlZmVyRmxhc2gpIHtcclxuICAgICAgICAvLyBub3RpZnkgdGhhdCBkZWZhdWx0cyBhcmUgYmVpbmcgY2hhbmdlZC5cclxuICAgICAgICBtZXNzYWdlcy5wdXNoKHN0cmluZ3MubW9iaWxlVUEpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIHNtMi5zZXR1cE9wdGlvbnMudXNlSFRNTDVBdWRpbyA9IHRydWU7XHJcbiAgICAgIHNtMi5zZXR1cE9wdGlvbnMucHJlZmVyRmxhc2ggPSBmYWxzZTtcclxuXHJcbiAgICAgIGlmIChpc19pRGV2aWNlIHx8IChpc0FuZHJvaWQgJiYgIXVhLm1hdGNoKC9hbmRyb2lkXFxzMlxcLjMvaSkpKSB7XHJcbiAgICAgICAgLy8gaU9TIGFuZCBBbmRyb2lkIGRldmljZXMgdGVuZCB0byB3b3JrIGJldHRlciB3aXRoIGEgc2luZ2xlIGF1ZGlvIGluc3RhbmNlLCBzcGVjaWZpY2FsbHkgZm9yIGNoYWluZWQgcGxheWJhY2sgb2Ygc291bmRzIGluIHNlcXVlbmNlLlxyXG4gICAgICAgIC8vIGNvbW1vbiB1c2UgY2FzZTogZXhpdGluZyBzb3VuZCBvbmZpbmlzaCgpIC0+IGNyZWF0ZVNvdW5kKCkgLT4gcGxheSgpXHJcbiAgICAgICAgLy8gPGQ+XHJcbiAgICAgICAgbWVzc2FnZXMucHVzaChzdHJpbmdzLmdsb2JhbEhUTUw1KTtcclxuICAgICAgICAvLyA8L2Q+XHJcbiAgICAgICAgaWYgKGlzX2lEZXZpY2UpIHtcclxuICAgICAgICAgIHNtMi5pZ25vcmVGbGFzaCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHVzZUdsb2JhbEhUTUw1QXVkaW8gPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBwcmVJbml0KCk7XHJcblxyXG4gIC8vIHNuaWZmIHVwLWZyb250XHJcbiAgZGV0ZWN0Rmxhc2goKTtcclxuXHJcbiAgLy8gZm9jdXMgYW5kIHdpbmRvdyBsb2FkLCBpbml0IChwcmltYXJpbHkgZmxhc2gtZHJpdmVuKVxyXG4gIGV2ZW50LmFkZCh3aW5kb3csICdmb2N1cycsIGhhbmRsZUZvY3VzKTtcclxuICBldmVudC5hZGQod2luZG93LCAnbG9hZCcsIGRlbGF5V2FpdEZvckVJKTtcclxuICBldmVudC5hZGQod2luZG93LCAnbG9hZCcsIHdpbk9uTG9hZCk7XHJcblxyXG4gIGlmIChkb2MuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cclxuICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZG9tQ29udGVudExvYWRlZCwgZmFsc2UpO1xyXG5cclxuICB9IGVsc2UgaWYgKGRvYy5hdHRhY2hFdmVudCkge1xyXG5cclxuICAgIGRvYy5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZG9tQ29udGVudExvYWRlZElFKTtcclxuXHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBubyBhZGQvYXR0YWNoZXZlbnQgc3VwcG9ydCAtIHNhZmUgdG8gYXNzdW1lIG5vIEpTIC0+IEZsYXNoIGVpdGhlclxyXG4gICAgZGVidWdUUygnb25sb2FkJywgZmFsc2UpO1xyXG4gICAgY2F0Y2hFcnJvcih7dHlwZTonTk9fRE9NMl9FVkVOVFMnLCBmYXRhbDp0cnVlfSk7XHJcblxyXG4gIH1cclxuXHJcbn0gLy8gU291bmRNYW5hZ2VyKClcclxuXHJcbi8vIFNNMl9ERUZFUiBkZXRhaWxzOiBodHRwOi8vd3d3LnNjaGlsbG1hbmlhLmNvbS9wcm9qZWN0cy9zb3VuZG1hbmFnZXIyL2RvYy9nZXRzdGFydGVkLyNsYXp5LWxvYWRpbmdcclxuXHJcbmlmICh3aW5kb3cuU00yX0RFRkVSID09PSB1bmRlZmluZWQgfHwgIVNNMl9ERUZFUikge1xyXG4gIHNvdW5kTWFuYWdlciA9IG5ldyBTb3VuZE1hbmFnZXIoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNvdW5kTWFuYWdlciBwdWJsaWMgaW50ZXJmYWNlc1xyXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICovXHJcblxyXG53aW5kb3cuU291bmRNYW5hZ2VyID0gU291bmRNYW5hZ2VyOyAvLyBjb25zdHJ1Y3RvclxyXG53aW5kb3cuc291bmRNYW5hZ2VyID0gc291bmRNYW5hZ2VyOyAvLyBwdWJsaWMgQVBJLCBmbGFzaCBjYWxsYmFja3MgZXRjLlxyXG5cclxufSh3aW5kb3cpKTtcclxuIl19
