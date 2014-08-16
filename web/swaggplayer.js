(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/* global define:false, soundManager: false */

;(function() {

  'use strict';

  require( './soundManager2' );
  var Song = require( './song' );

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
      console.log( opts );
      for ( var i = 0; i < opts.songs.length; i++ ) {
        var song = new Song( opts.songs[ i ] );
        song.id = i;
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
        autoLoad: true,
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
        whileplaying: function() {
          if ( opts.whilePlaying ) {
            var timeProgress    = _determineTimeProgress( this );
            var percentComplete = _determineByteProgress( this );
            opts.whilePlaying( timeProgress, percentComplete );
          }
        },
      });
    } // end create sound

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
      if ( cb ) {
        soundManager.onready( cb.bind( _api ) );
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

    // expose api
    _api.init     = init;
    _api.onReady  = _onReady;
    _api.onError  = _onError;
    _api.stop     = _stop;
    _api.play     = _play;
    _api.pause    = _pause;
    _api.next     = _next;
    _api.prev     = _prev;

    return _api;

  };


  if ( window.module && module.exports ) {
    module.exports = SwaggPlayer;
  } else {
    window.SwaggPlayer = SwaggPlayer;
  }

}() );
},{"./song":2,"./soundManager2":3}],2:[function(require,module,exports){

(function(){

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb2hubnkvcHJvai9zd2FnZ3BsYXllci9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL2Zha2VfZDgxM2RlZjYuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL3NvbmcuanMiLCIvVXNlcnMvam9obm55L3Byb2ovc3dhZ2dwbGF5ZXIvbGliL3NvdW5kTWFuYWdlcjIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8qIGdsb2JhbCBkZWZpbmU6ZmFsc2UsIHNvdW5kTWFuYWdlcjogZmFsc2UgKi9cblxuOyhmdW5jdGlvbigpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgcmVxdWlyZSggJy4vc291bmRNYW5hZ2VyMicgKTtcbiAgdmFyIFNvbmcgPSByZXF1aXJlKCAnLi9zb25nJyApO1xuXG4gIC8vIHZhcmlvdXMgdXRpbGl0eSBmdW5jdGlvbnNcbiAgdmFyIFV0aWxzID0ge1xuXG4gICAgZm9ybUlkOiBmdW5jdGlvbiggaW5kZXggKSB7XG4gICAgICByZXR1cm4gJ3RyYWNrLScgKyBpbmRleDtcbiAgICB9LFxuXG4gICAgc2hvdWxkUmVzdW1lOiBmdW5jdGlvbiggc29uZyApIHtcbiAgICAgIHJldHVybiBzb25nLnJhdy5wb3NpdGlvbiAmJiBzb25nLnJhdy5wb3NpdGlvbiA+IDA7XG4gICAgfSxcblxuICAgIHRpbWVTdHJpbmc6IGZ1bmN0aW9uKCBzdHIgKSB7XG4gICAgICB2YXIgdG1wID0gcGFyc2VJbnQoIHN0ciwgMTAgKTtcbiAgICAgIHZhciB0ID0gdG1wID4gOSA/IHN0ciA6ICcwJyArIHN0cjtcbiAgICAgIHJldHVybiB0ICE9PSAnNjAnID8gdCA6ICcwMCc7XG4gICAgfSxcblxuICAgIG1pbGxzVG9UaW1lIDogZnVuY3Rpb24oZHVyYXRpb24sIGZsYWcpIHtcbiAgICAgIHZhciBzZWNvbmRzID0gTWF0aC5mbG9vcihkdXJhdGlvbiAvIDEwMDApO1xuICAgICAgdmFyIG1pbnV0ZXMgPSAwO1xuXG4gICAgICBpZiAoc2Vjb25kcyA+IDYwKSB7XG4gICAgICAgIG1pbnV0ZXMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKHNlY29uZHMgJSA2MCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWNvbmRzID09PSA2MCkge1xuICAgICAgICBtaW51dGVzICs9IDE7XG4gICAgICAgIHNlY29uZHMgPSAwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBtaW5zOiBwYXJzZUludCggdGhpcy50aW1lU3RyaW5nKCBtaW51dGVzICkgKSwgc2VjcyA6IHBhcnNlSW50KCB0aGlzLnRpbWVTdHJpbmcoIHNlY29uZHMgKSApIH07XG4gICAgfSxcblxuICB9O1xuXG4gIHZhciBTd2FnZ1BsYXllciA9IGZ1bmN0aW9uKCl7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBkYXRhIGFuZCBzdWNoXG4gICAgdmFyIF9kYXRhID0ge307XG5cbiAgICAvLyBleHRlcm5hbCBBUElcbiAgICB2YXIgX2FwaSA9IHt9O1xuXG4gICAgLy8gaW5pdGlhbGl6ZSB0aGUgcGxheWVyIHdpdGggb3B0aW9uc1xuICAgIGZ1bmN0aW9uIGluaXQoIG9wdHMgKSB7XG4gICAgICBfZGF0YS5fZWxlbWVudCA9IG9wdHMuZWw7XG4gICAgICBfZGF0YS5zd2ZVcmwgID0gb3B0cy5zd2YgfHwgJy9zd2YnO1xuICAgICAgX2RhdGEuc29uZ3MgPSBbXTtcbiAgICAgIF9kYXRhLmN1cnJlbnRUcmFjayA9IDA7XG4gICAgICBzb3VuZE1hbmFnZXIuc2V0dXAoe1xuICAgICAgICB1cmw6IF9kYXRhLnN3ZlVybCxcbiAgICAgICAgb25yZWFkeTogZnVuY3Rpb24oKXtcbiAgICAgICAgICBfbG9hZCggb3B0cyApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIF9hcGk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHRoZSBzb3VuZCBtYW5hZ2VyIHNvdW5kIGluc3RhbmNlc1xuICAgIGZ1bmN0aW9uIF9sb2FkKCBvcHRzICkge1xuICAgICAgY29uc29sZS5sb2coIG9wdHMgKTtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IG9wdHMuc29uZ3MubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHZhciBzb25nID0gbmV3IFNvbmcoIG9wdHMuc29uZ3NbIGkgXSApO1xuICAgICAgICBzb25nLmlkID0gaTtcbiAgICAgICAgX2RhdGEuc29uZ3MucHVzaCggc29uZyApO1xuICAgICAgICBfY3JlYXRlTmV3U29uZyggc29uZywgb3B0cyApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNyZWF0ZXMgYSBzb3VuZCBtYW5hZ2VyIHNvdW5kIGluc3RhbmNlIGFuZCBjb25maWd1cmVzXG4gICAgLy8gYWxsIG9mIGl0J3Mgb3B0aW9ucyBhbmQgcmVnaXN0ZXJzIGNhbGxiYWNrc1xuICAgIGZ1bmN0aW9uIF9jcmVhdGVOZXdTb25nKCBzb25nRGF0YSwgb3B0cyApIHtcbiAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgdmFyIHNlbGYgPSBfZGF0YTtcbiAgICAgIHZhciBtZXRhID0ge1xuICAgICAgICBhcnRpc3Q6IHNvbmdEYXRhLmFydGlzdCxcbiAgICAgICAgdGl0bGU6IHNvbmdEYXRhLnRpdGxlLFxuICAgICAgICBhcnQ6IHNvbmdEYXRhLmFydFxuICAgICAgfTtcbiAgICAgIHZhciBmYXN0UG9sbGluZyA9ICggb3B0cy50aHJvdHRsZVBvbGxpbmcgKSA/IGZhbHNlIDogdHJ1ZTtcblxuICAgICAgc29uZ0RhdGEucmF3ID0gc291bmRNYW5hZ2VyLmNyZWF0ZVNvdW5kKHtcbiAgICAgICAgaWQ6IFV0aWxzLmZvcm1JZCggc29uZ0RhdGEuaWQgKSxcbiAgICAgICAgdXJsOiBzb25nRGF0YS51cmwsXG4gICAgICAgIGF1dG9Mb2FkOiB0cnVlLFxuICAgICAgICBhdXRvUGxheTogZmFsc2UsXG4gICAgICAgIHVzZUhpZ2hQZXJmb3JtYW5jZTogZmFzdFBvbGxpbmcsXG5cbiAgICAgICAgb25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVGhlICcgKyBzb25nRGF0YS50aXRsZSArICcgbG9hZGVkIScpO1xuICAgICAgICB9LFxuICAgICAgICBvbnBsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vblBsYXkgKSB7XG4gICAgICAgICAgICBvcHRzLm9uUGxheSggbWV0YSApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25yZXN1bWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vblJlc3VtZSApIHtcbiAgICAgICAgICAgIG9wdHMub25SZXN1bWUoIG1ldGEgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9ucGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vblBhdXNlICkge1xuICAgICAgICAgICAgb3B0cy5vblBhdXNlKCBtZXRhICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbnN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vblN0b3AgKSB7XG4gICAgICAgICAgICBvcHRzLm9uU3RvcCggbWV0YSApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25maW5pc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICggb3B0cy5vbkZpbmlzaCApIHtcbiAgICAgICAgICAgIG9wdHMub25GaW5pc2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHdoaWxlcGxheWluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCBvcHRzLndoaWxlUGxheWluZyApIHtcbiAgICAgICAgICAgIHZhciB0aW1lUHJvZ3Jlc3MgICAgPSBfZGV0ZXJtaW5lVGltZVByb2dyZXNzKCB0aGlzICk7XG4gICAgICAgICAgICB2YXIgcGVyY2VudENvbXBsZXRlID0gX2RldGVybWluZUJ5dGVQcm9ncmVzcyggdGhpcyApO1xuICAgICAgICAgICAgb3B0cy53aGlsZVBsYXlpbmcoIHRpbWVQcm9ncmVzcywgcGVyY2VudENvbXBsZXRlICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSAvLyBlbmQgY3JlYXRlIHNvdW5kXG5cbiAgICAvLyBkZXRlcm1pbmUgaG93IGZhciBhbG9uZyBhIHNvbmcgaXMgaW4gdGVybXMgb2YgaG93IG1hbnkgYnl0ZXNcbiAgICAvLyBoYXZlIGJlZW4gcGxheWVkIGluIHJlbGF0aW9uIHRvIHRoZSB0b3RhbCBieXRlc1xuICAgIGZ1bmN0aW9uIF9kZXRlcm1pbmVCeXRlUHJvZ3Jlc3MoIHNvdW5kICkge1xuICAgICAgLy8gZ2V0IGN1cnJlbnQgcG9zaXRpb24gb2YgY3VycmVudGx5IHBsYXlpbmcgc29uZ1xuICAgICAgdmFyIHBvcyA9IHNvdW5kLnBvc2l0aW9uO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICAgIHZhciBsb2FkZWRSYXRpbyA9IHNvdW5kLmJ5dGVzTG9hZGVkIC8gc291bmQuYnl0ZXNUb3RhbDtcblxuICAgICAgaWYgKCBzb3VuZC5sb2FkZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGR1cmF0aW9uID0gc291bmQuZHVyYXRpb25Fc3RpbWF0ZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBkdXJhdGlvbiA9IHNvdW5kLmR1cmF0aW9uO1xuICAgICAgfVxuXG4gICAgICAvLyByYXRpbyBvZiAoY3VycmVudCBwb3NpdGlvbiAvIHRvdGFsIGR1cmF0aW9uIG9mIHNvbmcpXG4gICAgICB2YXIgcG9zaXRpb25SYXRpbyA9IHBvcy9kdXJhdGlvbjtcblxuICAgICAgcmV0dXJuICggcG9zaXRpb25SYXRpby50b0ZpeGVkKCAyICkgKiAxMDAgKS50b0ZpeGVkKCAwICk7XG4gICAgfVxuXG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBjdXJyZW50IHNvbmcncyBwb3NpdGlvbiBpbiB0aW1lIG1tOnNzIC8gbW06c3NcbiAgICBmdW5jdGlvbiBfZGV0ZXJtaW5lVGltZVByb2dyZXNzKCBzb3VuZCApIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IHNvdW5kLmxvYWRlZCA9PT0gdHJ1ZSA/IHNvdW5kLmR1cmF0aW9uIDogc291bmQuZHVyYXRpb25Fc3RpbWF0ZTtcbiAgICAgIHZhciBjdXJyID0gVXRpbHMubWlsbHNUb1RpbWUoIHNvdW5kLnBvc2l0aW9uICk7XG4gICAgICB2YXIgdG90YWwgPSBVdGlscy5taWxsc1RvVGltZSggZHVyYXRpb24gKTtcbiAgICAgIHZhciB0aW1lID0ge1xuICAgICAgICBjdXJyZW50OiB7XG4gICAgICAgICAgbWluOiBjdXJyLm1pbnMsXG4gICAgICAgICAgc2VjOiBjdXJyLnNlY3MsXG4gICAgICAgIH0sXG4gICAgICAgIHRvdGFsOiB7XG4gICAgICAgICAgbWluOiB0b3RhbC5taW5zLFxuICAgICAgICAgIHNlYzogdG90YWwuc2Vjc1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHRpbWU7XG4gICAgfVxuXG4gICAgLy8gc3RvcCBhbGwgcGxheWluZyBzb3VuZHNcbiAgICBmdW5jdGlvbiBfc3RvcCgpIHtcbiAgICAgIHNvdW5kTWFuYWdlci5zdG9wQWxsKCk7XG4gICAgICByZXR1cm4gX2FwaTtcbiAgICB9XG5cbiAgICAvLyBwbGF5IGEgc29uZyBhdCB0aGUgZ2l2ZW4gaW5kZXhcbiAgICBmdW5jdGlvbiBfcGxheSggaW5kZXggKSB7XG4gICAgICAvLyBpZiBhbiBpbmRleCBpcyBzdXBwbGllZCBwbGF5IGEgc3BlY2lmaWMgc29uZ1xuICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgcGxheSB0aGUgY3VycmVudCBzb25nXG4gICAgICBpZiAoIGluZGV4ICkge1xuICAgICAgICBfZGF0YS5jdXJyZW50VHJhY2sgPSBpbmRleDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4ID0gX2RhdGEuY3VycmVudFRyYWNrO1xuICAgICAgfVxuXG4gICAgICB2YXIgc291bmQgPSBfZGF0YS5zb25nc1sgaW5kZXggXTtcblxuICAgICAgLy8gY2hlY2sgaWYgd2UncmUgaW4gYSBwYXVzZWQgc3RhdGUuIGlmIG5vdCwgcGxheSBmcm9tIHRoZSBiZWdpbm5pbmcuXG4gICAgICAvLyBpZiB3ZSBhcmUsIHRoZW4gcmVzdW1lIHBsYXlcbiAgICAgIGlmICggc291bmQgJiYgIVV0aWxzLnNob3VsZFJlc3VtZSggc291bmQgKSApIHtcbiAgICAgICAgX3N0b3AoKTtcbiAgICAgICAgc291bmQucmF3LnBsYXkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kLnJhdy50b2dnbGVQYXVzZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9hcGk7XG4gICAgfVxuXG4gICAgLy8gcGF1c2UgYWxsIHNvbmdzXG4gICAgZnVuY3Rpb24gX3BhdXNlKCkge1xuICAgICAgc291bmRNYW5hZ2VyLnBhdXNlQWxsKCk7XG4gICAgICByZXR1cm4gX2FwaTtcbiAgICB9XG5cbiAgICAvLyBwbGF5IHRoZSBuZXh0IHNvbmdcbiAgICBmdW5jdGlvbiBfbmV4dCgpIHtcbiAgICAgIF9zdG9wKCk7XG4gICAgICBfcmVzZXRTb3VuZCggX2RhdGEuY3VycmVudFRyYWNrICk7XG4gICAgICBfZGF0YS5jdXJyZW50VHJhY2sgPSBfZGF0YS5jdXJyZW50VHJhY2sgKyAxO1xuICAgICAgaWYgKCBfZGF0YS5jdXJyZW50VHJhY2sgPiAoIF9kYXRhLnNvbmdzLmxlbmd0aCAtIDEgKSApIHtcbiAgICAgICAgX2RhdGEuY3VycmVudFRyYWNrID0gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcGxheSgpO1xuICAgIH1cblxuICAgIC8vIHBsYXkgdGhlIHByZXZpb3VzIHNvbmdcbiAgICBmdW5jdGlvbiBfcHJldigpIHtcbiAgICAgIF9zdG9wKCk7XG4gICAgICBfcmVzZXRTb3VuZCggX2RhdGEuY3VycmVudFRyYWNrICk7XG4gICAgICBfZGF0YS5jdXJyZW50VHJhY2sgLT0gMTtcbiAgICAgIGlmICggX2RhdGEuY3VycmVudFRyYWNrIDwgMCApIHtcbiAgICAgICAgdmFyIHNvbmcgPSBfZGF0YS5zb25nc1sgX2RhdGEuc29uZ3MubGVuZ3RoIC0gMSBdO1xuICAgICAgICBfZGF0YS5jdXJyZW50VHJhY2sgPSBzb25nLmlkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gdG8gYmUgZmlyZWQgd2hlbiB0aGUgcGxheWVyIGlzIHJlYWR5IHRvIGdvXG4gICAgZnVuY3Rpb24gX29uUmVhZHkoY2IpIHtcbiAgICAgIGlmICggY2IgKSB7XG4gICAgICAgIHNvdW5kTWFuYWdlci5vbnJlYWR5KCBjYi5iaW5kKCBfYXBpICkgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfYXBpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vbkVycm9yKGNiKSB7XG4gICAgICBpZiAoIGNiICkge1xuICAgICAgICBzb3VuZE1hbmFnZXIub25lcnJvciggY2IuYmluZCggX2FwaSApICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX2FwaTtcbiAgICB9XG5cbiAgICAvLyByZXNldHMgdGhlIGN1cnJlbnQgcG9zaXRpb24gZm9yIGEgc29uZyB0byAwXG4gICAgZnVuY3Rpb24gX3Jlc2V0U291bmQoIGluZGV4ICkge1xuICAgICAgdmFyIGlkID0gVXRpbHMuZm9ybUlkKCBpbmRleCApO1xuICAgICAgc291bmRNYW5hZ2VyLmdldFNvdW5kQnlJZCggaWQgKS5wb3NpdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgLy8gZXhwb3NlIGFwaVxuICAgIF9hcGkuaW5pdCAgICAgPSBpbml0O1xuICAgIF9hcGkub25SZWFkeSAgPSBfb25SZWFkeTtcbiAgICBfYXBpLm9uRXJyb3IgID0gX29uRXJyb3I7XG4gICAgX2FwaS5zdG9wICAgICA9IF9zdG9wO1xuICAgIF9hcGkucGxheSAgICAgPSBfcGxheTtcbiAgICBfYXBpLnBhdXNlICAgID0gX3BhdXNlO1xuICAgIF9hcGkubmV4dCAgICAgPSBfbmV4dDtcbiAgICBfYXBpLnByZXYgICAgID0gX3ByZXY7XG5cbiAgICByZXR1cm4gX2FwaTtcblxuICB9O1xuXG5cbiAgaWYgKCB3aW5kb3cubW9kdWxlICYmIG1vZHVsZS5leHBvcnRzICkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU3dhZ2dQbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93LlN3YWdnUGxheWVyID0gU3dhZ2dQbGF5ZXI7XG4gIH1cblxufSgpICk7IiwiXG4oZnVuY3Rpb24oKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIFNvbmcgPSBmdW5jdGlvbiggb3B0cyApIHtcbiAgICB0aGlzLnRpdGxlICAgID0gb3B0cy50aXRsZTtcbiAgICB0aGlzLmFydGlzdCAgID0gb3B0cy5hcnRpc3Q7XG4gICAgdGhpcy51cmwgICAgICA9IG9wdHMudXJsO1xuICAgIHRoaXMuYXJ0ICAgICAgPSBvcHRzLmFydDtcbiAgICB0aGlzLmlkICAgICAgID0gb3B0cy5pZDtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IFNvbmc7XG5cbn0oKSk7IiwiLyoqIEBsaWNlbnNlXHJcbiAqXHJcbiAqIFNvdW5kTWFuYWdlciAyOiBKYXZhU2NyaXB0IFNvdW5kIGZvciB0aGUgV2ViXHJcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogaHR0cDovL3NjaGlsbG1hbmlhLmNvbS9wcm9qZWN0cy9zb3VuZG1hbmFnZXIyL1xyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDcsIFNjb3R0IFNjaGlsbGVyLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiBDb2RlIHByb3ZpZGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZTpcclxuICogaHR0cDovL3NjaGlsbG1hbmlhLmNvbS9wcm9qZWN0cy9zb3VuZG1hbmFnZXIyL2xpY2Vuc2UudHh0XHJcbiAqXHJcbiAqIFYyLjk3YS4yMDEzMTIwMVxyXG4gKi9cclxuXHJcbi8qZ2xvYmFsIHdpbmRvdywgU00yX0RFRkVSLCBzbTJEZWJ1Z2dlciwgY29uc29sZSwgZG9jdW1lbnQsIG5hdmlnYXRvciwgc2V0VGltZW91dCwgc2V0SW50ZXJ2YWwsIGNsZWFySW50ZXJ2YWwsIEF1ZGlvLCBvcGVyYSAqL1xyXG4vKmpzbGludCByZWdleHA6IHRydWUsIHNsb3BweTogdHJ1ZSwgd2hpdGU6IHRydWUsIG5vbWVuOiB0cnVlLCBwbHVzcGx1czogdHJ1ZSwgdG9kbzogdHJ1ZSAqL1xyXG5cclxuLyoqXHJcbiAqIEFib3V0IHRoaXMgZmlsZVxyXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqIFRoaXMgaXMgdGhlIGZ1bGx5LWNvbW1lbnRlZCBzb3VyY2UgdmVyc2lvbiBvZiB0aGUgU291bmRNYW5hZ2VyIDIgQVBJLFxyXG4gKiByZWNvbW1lbmRlZCBmb3IgdXNlIGR1cmluZyBkZXZlbG9wbWVudCBhbmQgdGVzdGluZy5cclxuICpcclxuICogU2VlIHNvdW5kbWFuYWdlcjItbm9kZWJ1Zy1qc21pbi5qcyBmb3IgYW4gb3B0aW1pemVkIGJ1aWxkICh+MTFLQiB3aXRoIGd6aXAuKVxyXG4gKiBodHRwOi8vc2NoaWxsbWFuaWEuY29tL3Byb2plY3RzL3NvdW5kbWFuYWdlcjIvZG9jL2dldHN0YXJ0ZWQvI2Jhc2ljLWluY2x1c2lvblxyXG4gKiBBbHRlcm5hdGVseSwgc2VydmUgdGhpcyBmaWxlIHdpdGggZ3ppcCBmb3IgNzUlIGNvbXByZXNzaW9uIHNhdmluZ3MgKH4zMEtCIG92ZXIgSFRUUC4pXHJcbiAqXHJcbiAqIFlvdSBtYXkgbm90aWNlIDxkPiBhbmQgPC9kPiBjb21tZW50cyBpbiB0aGlzIHNvdXJjZTsgdGhlc2UgYXJlIGRlbGltaXRlcnMgZm9yXHJcbiAqIGRlYnVnIGJsb2NrcyB3aGljaCBhcmUgcmVtb3ZlZCBpbiB0aGUgLW5vZGVidWcgYnVpbGRzLCBmdXJ0aGVyIG9wdGltaXppbmcgY29kZSBzaXplLlxyXG4gKlxyXG4gKiBBbHNvLCBhcyB5b3UgbWF5IG5vdGU6IFdob2EsIHJlbGlhYmxlIGNyb3NzLXBsYXRmb3JtL2RldmljZSBhdWRpbyBzdXBwb3J0IGlzIGhhcmQhIDspXHJcbiAqL1xyXG5cclxuKGZ1bmN0aW9uKHdpbmRvdywgX3VuZGVmaW5lZCkge1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG52YXIgc291bmRNYW5hZ2VyID0gbnVsbDtcclxuXHJcbi8qKlxyXG4gKiBUaGUgU291bmRNYW5hZ2VyIGNvbnN0cnVjdG9yLlxyXG4gKlxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IHNtVVJMIE9wdGlvbmFsOiBQYXRoIHRvIFNXRiBmaWxlc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gc21JRCBPcHRpb25hbDogVGhlIElEIHRvIHVzZSBmb3IgdGhlIFNXRiBjb250YWluZXIgZWxlbWVudFxyXG4gKiBAdGhpcyB7U291bmRNYW5hZ2VyfVxyXG4gKiBAcmV0dXJuIHtTb3VuZE1hbmFnZXJ9IFRoZSBuZXcgU291bmRNYW5hZ2VyIGluc3RhbmNlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU291bmRNYW5hZ2VyKHNtVVJMLCBzbUlEKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIHNvdW5kTWFuYWdlciBjb25maWd1cmF0aW9uIG9wdGlvbnMgbGlzdFxyXG4gICAqIGRlZmluZXMgdG9wLWxldmVsIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyB0byBiZSBhcHBsaWVkIHRvIHRoZSBzb3VuZE1hbmFnZXIgaW5zdGFuY2UgKGVnLiBzb3VuZE1hbmFnZXIuZmxhc2hWZXJzaW9uKVxyXG4gICAqIHRvIHNldCB0aGVzZSBwcm9wZXJ0aWVzLCB1c2UgdGhlIHNldHVwKCkgbWV0aG9kIC0gZWcuLCBzb3VuZE1hbmFnZXIuc2V0dXAoe3VybDogJy9zd2YvJywgZmxhc2hWZXJzaW9uOiA5fSlcclxuICAgKi9cclxuXHJcbiAgdGhpcy5zZXR1cE9wdGlvbnMgPSB7XHJcblxyXG4gICAgJ3VybCc6IChzbVVSTCB8fCBudWxsKSwgICAgICAgICAgICAgLy8gcGF0aCAoZGlyZWN0b3J5KSB3aGVyZSBTb3VuZE1hbmFnZXIgMiBTV0ZzIGV4aXN0LCBlZy4sIC9wYXRoL3RvL3N3ZnMvXHJcbiAgICAnZmxhc2hWZXJzaW9uJzogOCwgICAgICAgICAgICAgICAgICAvLyBmbGFzaCBidWlsZCB0byB1c2UgKDggb3IgOS4pIFNvbWUgQVBJIGZlYXR1cmVzIHJlcXVpcmUgOS5cclxuICAgICdkZWJ1Z01vZGUnOiB0cnVlLCAgICAgICAgICAgICAgICAgIC8vIGVuYWJsZSBkZWJ1Z2dpbmcgb3V0cHV0IChjb25zb2xlLmxvZygpIHdpdGggSFRNTCBmYWxsYmFjaylcclxuICAgICdkZWJ1Z0ZsYXNoJzogZmFsc2UsICAgICAgICAgICAgICAgIC8vIGVuYWJsZSBkZWJ1Z2dpbmcgb3V0cHV0IGluc2lkZSBTV0YsIHRyb3VibGVzaG9vdCBGbGFzaC9icm93c2VyIGlzc3Vlc1xyXG4gICAgJ3VzZUNvbnNvbGUnOiB0cnVlLCAgICAgICAgICAgICAgICAgLy8gdXNlIGNvbnNvbGUubG9nKCkgaWYgYXZhaWxhYmxlIChvdGhlcndpc2UsIHdyaXRlcyB0byAjc291bmRtYW5hZ2VyLWRlYnVnIGVsZW1lbnQpXHJcbiAgICAnY29uc29sZU9ubHknOiB0cnVlLCAgICAgICAgICAgICAgICAvLyBpZiBjb25zb2xlIGlzIGJlaW5nIHVzZWQsIGRvIG5vdCBjcmVhdGUvd3JpdGUgdG8gI3NvdW5kbWFuYWdlci1kZWJ1Z1xyXG4gICAgJ3dhaXRGb3JXaW5kb3dMb2FkJzogZmFsc2UsICAgICAgICAgLy8gZm9yY2UgU00yIHRvIHdhaXQgZm9yIHdpbmRvdy5vbmxvYWQoKSBiZWZvcmUgdHJ5aW5nIHRvIGNhbGwgc291bmRNYW5hZ2VyLm9ubG9hZCgpXHJcbiAgICAnYmdDb2xvcic6ICcjZmZmZmZmJywgICAgICAgICAgICAgICAvLyBTV0YgYmFja2dyb3VuZCBjb2xvci4gTi9BIHdoZW4gd21vZGUgPSAndHJhbnNwYXJlbnQnXHJcbiAgICAndXNlSGlnaFBlcmZvcm1hbmNlJzogZmFsc2UsICAgICAgICAvLyBwb3NpdGlvbjpmaXhlZCBmbGFzaCBtb3ZpZSBjYW4gaGVscCBpbmNyZWFzZSBqcy9mbGFzaCBzcGVlZCwgbWluaW1pemUgbGFnXHJcbiAgICAnZmxhc2hQb2xsaW5nSW50ZXJ2YWwnOiBudWxsLCAgICAgICAvLyBtc2VjIGFmZmVjdGluZyB3aGlsZXBsYXlpbmcvbG9hZGluZyBjYWxsYmFjayBmcmVxdWVuY3kuIElmIG51bGwsIGRlZmF1bHQgb2YgNTAgbXNlYyBpcyB1c2VkLlxyXG4gICAgJ2h0bWw1UG9sbGluZ0ludGVydmFsJzogbnVsbCwgICAgICAgLy8gbXNlYyBhZmZlY3Rpbmcgd2hpbGVwbGF5aW5nKCkgZm9yIEhUTUw1IGF1ZGlvLCBleGNsdWRpbmcgbW9iaWxlIGRldmljZXMuIElmIG51bGwsIG5hdGl2ZSBIVE1MNSB1cGRhdGUgZXZlbnRzIGFyZSB1c2VkLlxyXG4gICAgJ2ZsYXNoTG9hZFRpbWVvdXQnOiAxMDAwLCAgICAgICAgICAgLy8gbXNlYyB0byB3YWl0IGZvciBmbGFzaCBtb3ZpZSB0byBsb2FkIGJlZm9yZSBmYWlsaW5nICgwID0gaW5maW5pdHkpXHJcbiAgICAnd21vZGUnOiBudWxsLCAgICAgICAgICAgICAgICAgICAgICAvLyBmbGFzaCByZW5kZXJpbmcgbW9kZSAtIG51bGwsICd0cmFuc3BhcmVudCcsIG9yICdvcGFxdWUnIChsYXN0IHR3byBhbGxvdyB6LWluZGV4IHRvIHdvcmspXHJcbiAgICAnYWxsb3dTY3JpcHRBY2Nlc3MnOiAnYWx3YXlzJywgICAgICAvLyBmb3Igc2NyaXB0aW5nIHRoZSBTV0YgKG9iamVjdC9lbWJlZCBwcm9wZXJ0eSksICdhbHdheXMnIG9yICdzYW1lRG9tYWluJ1xyXG4gICAgJ3VzZUZsYXNoQmxvY2snOiBmYWxzZSwgICAgICAgICAgICAgLy8gKnJlcXVpcmVzIGZsYXNoYmxvY2suY3NzLCBzZWUgZGVtb3MqIC0gYWxsb3cgcmVjb3ZlcnkgZnJvbSBmbGFzaCBibG9ja2Vycy4gV2FpdCBpbmRlZmluaXRlbHkgYW5kIGFwcGx5IHRpbWVvdXQgQ1NTIHRvIFNXRiwgaWYgYXBwbGljYWJsZS5cclxuICAgICd1c2VIVE1MNUF1ZGlvJzogdHJ1ZSwgICAgICAgICAgICAgIC8vIHVzZSBIVE1MNSBBdWRpbygpIHdoZXJlIEFQSSBpcyBzdXBwb3J0ZWQgKG1vc3QgU2FmYXJpLCBDaHJvbWUgdmVyc2lvbnMpLCBGaXJlZm94IChubyBNUDMvTVA0LikgSWRlYWxseSwgdHJhbnNwYXJlbnQgdnMuIEZsYXNoIEFQSSB3aGVyZSBwb3NzaWJsZS5cclxuICAgICdodG1sNVRlc3QnOiAvXihwcm9iYWJseXxtYXliZSkkL2ksIC8vIEhUTUw1IEF1ZGlvKCkgZm9ybWF0IHN1cHBvcnQgdGVzdC4gVXNlIC9ecHJvYmFibHkkL2k7IGlmIHlvdSB3YW50IHRvIGJlIG1vcmUgY29uc2VydmF0aXZlLlxyXG4gICAgJ3ByZWZlckZsYXNoJzogZmFsc2UsICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGVzIHVzZUhUTUw1YXVkaW8sIHdpbGwgdXNlIEZsYXNoIGZvciBNUDMvTVA0L0FBQyBpZiBwcmVzZW50LiBQb3RlbnRpYWwgb3B0aW9uIGlmIEhUTUw1IHBsYXliYWNrIHdpdGggdGhlc2UgZm9ybWF0cyBpcyBxdWlya3kuXHJcbiAgICAnbm9TV0ZDYWNoZSc6IGZhbHNlLCAgICAgICAgICAgICAgICAvLyBpZiB0cnVlLCBhcHBlbmRzID90cz17ZGF0ZX0gdG8gYnJlYWsgYWdncmVzc2l2ZSBTV0YgY2FjaGluZy5cclxuICAgICdpZFByZWZpeCc6ICdzb3VuZCcgICAgICAgICAgICAgICAgIC8vIGlmIGFuIGlkIGlzIG5vdCBwcm92aWRlZCB0byBjcmVhdGVTb3VuZCgpLCB0aGlzIHByZWZpeCBpcyB1c2VkIGZvciBnZW5lcmF0ZWQgSURzIC0gJ3NvdW5kMCcsICdzb3VuZDEnIGV0Yy5cclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5kZWZhdWx0T3B0aW9ucyA9IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gZm9yIHNvdW5kIG9iamVjdHMgbWFkZSB3aXRoIGNyZWF0ZVNvdW5kKCkgYW5kIHJlbGF0ZWQgbWV0aG9kc1xyXG4gICAgICogZWcuLCB2b2x1bWUsIGF1dG8tbG9hZCBiZWhhdmlvdXIgYW5kIHNvIGZvcnRoXHJcbiAgICAgKi9cclxuXHJcbiAgICAnYXV0b0xvYWQnOiBmYWxzZSwgICAgICAgIC8vIGVuYWJsZSBhdXRvbWF0aWMgbG9hZGluZyAob3RoZXJ3aXNlIC5sb2FkKCkgd2lsbCBiZSBjYWxsZWQgb24gZGVtYW5kIHdpdGggLnBsYXkoKSwgdGhlIGxhdHRlciBiZWluZyBuaWNlciBvbiBiYW5kd2lkdGggLSBpZiB5b3Ugd2FudCB0byAubG9hZCB5b3Vyc2VsZiwgeW91IGFsc28gY2FuKVxyXG4gICAgJ2F1dG9QbGF5JzogZmFsc2UsICAgICAgICAvLyBlbmFibGUgcGxheWluZyBvZiBmaWxlIGFzIHNvb24gYXMgcG9zc2libGUgKG11Y2ggZmFzdGVyIGlmIFwic3RyZWFtXCIgaXMgdHJ1ZSlcclxuICAgICdmcm9tJzogbnVsbCwgICAgICAgICAgICAgLy8gcG9zaXRpb24gdG8gc3RhcnQgcGxheWJhY2sgd2l0aGluIGEgc291bmQgKG1zZWMpLCBkZWZhdWx0ID0gYmVnaW5uaW5nXHJcbiAgICAnbG9vcHMnOiAxLCAgICAgICAgICAgICAgIC8vIGhvdyBtYW55IHRpbWVzIHRvIHJlcGVhdCB0aGUgc291bmQgKHBvc2l0aW9uIHdpbGwgd3JhcCBhcm91bmQgdG8gMCwgc2V0UG9zaXRpb24oKSB3aWxsIGJyZWFrIG91dCBvZiBsb29wIHdoZW4gPjApXHJcbiAgICAnb25pZDMnOiBudWxsLCAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBcIklEMyBkYXRhIGlzIGFkZGVkL2F2YWlsYWJsZVwiXHJcbiAgICAnb25sb2FkJzogbnVsbCwgICAgICAgICAgIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIGZvciBcImxvYWQgZmluaXNoZWRcIlxyXG4gICAgJ3doaWxlbG9hZGluZyc6IG51bGwsICAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBmb3IgXCJkb3dubG9hZCBwcm9ncmVzcyB1cGRhdGVcIiAoWCBvZiBZIGJ5dGVzIHJlY2VpdmVkKVxyXG4gICAgJ29ucGxheSc6IG51bGwsICAgICAgICAgICAvLyBjYWxsYmFjayBmb3IgXCJwbGF5XCIgc3RhcnRcclxuICAgICdvbnBhdXNlJzogbnVsbCwgICAgICAgICAgLy8gY2FsbGJhY2sgZm9yIFwicGF1c2VcIlxyXG4gICAgJ29ucmVzdW1lJzogbnVsbCwgICAgICAgICAvLyBjYWxsYmFjayBmb3IgXCJyZXN1bWVcIiAocGF1c2UgdG9nZ2xlKVxyXG4gICAgJ3doaWxlcGxheWluZyc6IG51bGwsICAgICAvLyBjYWxsYmFjayBkdXJpbmcgcGxheSAocG9zaXRpb24gdXBkYXRlKVxyXG4gICAgJ29ucG9zaXRpb24nOiBudWxsLCAgICAgICAvLyBvYmplY3QgY29udGFpbmluZyB0aW1lcyBhbmQgZnVuY3Rpb24gY2FsbGJhY2tzIGZvciBwb3NpdGlvbnMgb2YgaW50ZXJlc3RcclxuICAgICdvbnN0b3AnOiBudWxsLCAgICAgICAgICAgLy8gY2FsbGJhY2sgZm9yIFwidXNlciBzdG9wXCJcclxuICAgICdvbmZhaWx1cmUnOiBudWxsLCAgICAgICAgLy8gY2FsbGJhY2sgZnVuY3Rpb24gZm9yIHdoZW4gcGxheWluZyBmYWlsc1xyXG4gICAgJ29uZmluaXNoJzogbnVsbCwgICAgICAgICAvLyBjYWxsYmFjayBmdW5jdGlvbiBmb3IgXCJzb3VuZCBmaW5pc2hlZCBwbGF5aW5nXCJcclxuICAgICdtdWx0aVNob3QnOiB0cnVlLCAgICAgICAgLy8gbGV0IHNvdW5kcyBcInJlc3RhcnRcIiBvciBsYXllciBvbiB0b3Agb2YgZWFjaCBvdGhlciB3aGVuIHBsYXllZCBtdWx0aXBsZSB0aW1lcywgcmF0aGVyIHRoYW4gb25lLXNob3Qvb25lIGF0IGEgdGltZVxyXG4gICAgJ211bHRpU2hvdEV2ZW50cyc6IGZhbHNlLCAvLyBmaXJlIG11bHRpcGxlIHNvdW5kIGV2ZW50cyAoY3VycmVudGx5IG9uZmluaXNoKCkgb25seSkgd2hlbiBtdWx0aVNob3QgaXMgZW5hYmxlZFxyXG4gICAgJ3Bvc2l0aW9uJzogbnVsbCwgICAgICAgICAvLyBvZmZzZXQgKG1pbGxpc2Vjb25kcykgdG8gc2VlayB0byB3aXRoaW4gbG9hZGVkIHNvdW5kIGRhdGEuXHJcbiAgICAncGFuJzogMCwgICAgICAgICAgICAgICAgIC8vIFwicGFuXCIgc2V0dGluZ3MsIGxlZnQtdG8tcmlnaHQsIC0xMDAgdG8gMTAwXHJcbiAgICAnc3RyZWFtJzogdHJ1ZSwgICAgICAgICAgIC8vIGFsbG93cyBwbGF5aW5nIGJlZm9yZSBlbnRpcmUgZmlsZSBoYXMgbG9hZGVkIChyZWNvbW1lbmRlZClcclxuICAgICd0byc6IG51bGwsICAgICAgICAgICAgICAgLy8gcG9zaXRpb24gdG8gZW5kIHBsYXliYWNrIHdpdGhpbiBhIHNvdW5kIChtc2VjKSwgZGVmYXVsdCA9IGVuZFxyXG4gICAgJ3R5cGUnOiBudWxsLCAgICAgICAgICAgICAvLyBNSU1FLWxpa2UgaGludCBmb3IgZmlsZSBwYXR0ZXJuIC8gY2FuUGxheSgpIHRlc3RzLCBlZy4gYXVkaW8vbXAzXHJcbiAgICAndXNlUG9saWN5RmlsZSc6IGZhbHNlLCAgIC8vIGVuYWJsZSBjcm9zc2RvbWFpbi54bWwgcmVxdWVzdCBmb3IgYXVkaW8gb24gcmVtb3RlIGRvbWFpbnMgKGZvciBJRDMvd2F2ZWZvcm0gYWNjZXNzKVxyXG4gICAgJ3ZvbHVtZSc6IDEwMCAgICAgICAgICAgICAvLyBzZWxmLWV4cGxhbmF0b3J5LiAwLTEwMCwgdGhlIGxhdHRlciBiZWluZyB0aGUgbWF4LlxyXG5cclxuICB9O1xyXG5cclxuICB0aGlzLmZsYXNoOU9wdGlvbnMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmbGFzaCA5LW9ubHkgb3B0aW9ucyxcclxuICAgICAqIG1lcmdlZCBpbnRvIGRlZmF1bHRPcHRpb25zIGlmIGZsYXNoIDkgaXMgYmVpbmcgdXNlZFxyXG4gICAgICovXHJcblxyXG4gICAgJ2lzTW92aWVTdGFyJzogbnVsbCwgICAgICAvLyBcIk1vdmllU3RhclwiIE1QRUc0IGF1ZGlvIG1vZGUuIE51bGwgKGRlZmF1bHQpID0gYXV0byBkZXRlY3QgTVA0LCBBQUMgZXRjLiBiYXNlZCBvbiBVUkwuIHRydWUgPSBmb3JjZSBvbiwgaWdub3JlIFVSTFxyXG4gICAgJ3VzZVBlYWtEYXRhJzogZmFsc2UsICAgICAvLyBlbmFibGUgbGVmdC9yaWdodCBjaGFubmVsIHBlYWsgKGxldmVsKSBkYXRhXHJcbiAgICAndXNlV2F2ZWZvcm1EYXRhJzogZmFsc2UsIC8vIGVuYWJsZSBzb3VuZCBzcGVjdHJ1bSAocmF3IHdhdmVmb3JtIGRhdGEpIC0gTk9URTogTWF5IGluY3JlYXNlIENQVSBsb2FkLlxyXG4gICAgJ3VzZUVRRGF0YSc6IGZhbHNlLCAgICAgICAvLyBlbmFibGUgc291bmQgRVEgKGZyZXF1ZW5jeSBzcGVjdHJ1bSBkYXRhKSAtIE5PVEU6IE1heSBpbmNyZWFzZSBDUFUgbG9hZC5cclxuICAgICdvbmJ1ZmZlcmNoYW5nZSc6IG51bGwsICAgLy8gY2FsbGJhY2sgZm9yIFwiaXNCdWZmZXJpbmdcIiBwcm9wZXJ0eSBjaGFuZ2VcclxuICAgICdvbmRhdGFlcnJvcic6IG51bGwgICAgICAgLy8gY2FsbGJhY2sgZm9yIHdhdmVmb3JtL2VxIGRhdGEgYWNjZXNzIGVycm9yIChmbGFzaCBwbGF5aW5nIGF1ZGlvIGluIG90aGVyIHRhYnMvZG9tYWlucylcclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5tb3ZpZVN0YXJPcHRpb25zID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogZmxhc2ggOS4wcjExNSsgTVBFRzQgYXVkaW8gb3B0aW9ucyxcclxuICAgICAqIG1lcmdlZCBpbnRvIGRlZmF1bHRPcHRpb25zIGlmIGZsYXNoIDkrbW92aWVTdGFyIG1vZGUgaXMgZW5hYmxlZFxyXG4gICAgICovXHJcblxyXG4gICAgJ2J1ZmZlclRpbWUnOiAzLCAgICAgICAgICAvLyBzZWNvbmRzIG9mIGRhdGEgdG8gYnVmZmVyIGJlZm9yZSBwbGF5YmFjayBiZWdpbnMgKG51bGwgPSBmbGFzaCBkZWZhdWx0IG9mIDAuMSBzZWNvbmRzIC0gaWYgQUFDIHBsYXliYWNrIGlzIGdhcHB5LCB0cnkgaW5jcmVhc2luZy4pXHJcbiAgICAnc2VydmVyVVJMJzogbnVsbCwgICAgICAgIC8vIHJ0bXA6IEZNUyBvciBGTUlTIHNlcnZlciB0byBjb25uZWN0IHRvLCByZXF1aXJlZCB3aGVuIHJlcXVlc3RpbmcgbWVkaWEgdmlhIFJUTVAgb3Igb25lIG9mIGl0cyB2YXJpYW50c1xyXG4gICAgJ29uY29ubmVjdCc6IG51bGwsICAgICAgICAvLyBydG1wOiBjYWxsYmFjayBmb3IgY29ubmVjdGlvbiB0byBmbGFzaCBtZWRpYSBzZXJ2ZXJcclxuICAgICdkdXJhdGlvbic6IG51bGwgICAgICAgICAgLy8gcnRtcDogc29uZyBkdXJhdGlvbiAobXNlYylcclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5hdWRpb0Zvcm1hdHMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkZXRlcm1pbmVzIEhUTUw1IHN1cHBvcnQgKyBmbGFzaCByZXF1aXJlbWVudHMuXHJcbiAgICAgKiBpZiBubyBzdXBwb3J0ICh2aWEgZmxhc2ggYW5kL29yIEhUTUw1KSBmb3IgYSBcInJlcXVpcmVkXCIgZm9ybWF0LCBTTTIgd2lsbCBmYWlsIHRvIHN0YXJ0LlxyXG4gICAgICogZmxhc2ggZmFsbGJhY2sgaXMgdXNlZCBmb3IgTVAzIG9yIE1QNCBpZiBIVE1MNSBjYW4ndCBwbGF5IGl0IChvciBpZiBwcmVmZXJGbGFzaCA9IHRydWUpXHJcbiAgICAgKi9cclxuXHJcbiAgICAnbXAzJzoge1xyXG4gICAgICAndHlwZSc6IFsnYXVkaW8vbXBlZzsgY29kZWNzPVwibXAzXCInLCAnYXVkaW8vbXBlZycsICdhdWRpby9tcDMnLCAnYXVkaW8vTVBBJywgJ2F1ZGlvL21wYS1yb2J1c3QnXSxcclxuICAgICAgJ3JlcXVpcmVkJzogdHJ1ZVxyXG4gICAgfSxcclxuXHJcbiAgICAnbXA0Jzoge1xyXG4gICAgICAncmVsYXRlZCc6IFsnYWFjJywnbTRhJywnbTRiJ10sIC8vIGFkZGl0aW9uYWwgZm9ybWF0cyB1bmRlciB0aGUgTVA0IGNvbnRhaW5lclxyXG4gICAgICAndHlwZSc6IFsnYXVkaW8vbXA0OyBjb2RlY3M9XCJtcDRhLjQwLjJcIicsICdhdWRpby9hYWMnLCAnYXVkaW8veC1tNGEnLCAnYXVkaW8vTVA0QS1MQVRNJywgJ2F1ZGlvL21wZWc0LWdlbmVyaWMnXSxcclxuICAgICAgJ3JlcXVpcmVkJzogZmFsc2VcclxuICAgIH0sXHJcblxyXG4gICAgJ29nZyc6IHtcclxuICAgICAgJ3R5cGUnOiBbJ2F1ZGlvL29nZzsgY29kZWNzPXZvcmJpcyddLFxyXG4gICAgICAncmVxdWlyZWQnOiBmYWxzZVxyXG4gICAgfSxcclxuXHJcbiAgICAnb3B1cyc6IHtcclxuICAgICAgJ3R5cGUnOiBbJ2F1ZGlvL29nZzsgY29kZWNzPW9wdXMnLCAnYXVkaW8vb3B1cyddLFxyXG4gICAgICAncmVxdWlyZWQnOiBmYWxzZVxyXG4gICAgfSxcclxuXHJcbiAgICAnd2F2Jzoge1xyXG4gICAgICAndHlwZSc6IFsnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInLCAnYXVkaW8vd2F2JywgJ2F1ZGlvL3dhdmUnLCAnYXVkaW8veC13YXYnXSxcclxuICAgICAgJ3JlcXVpcmVkJzogZmFsc2VcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gSFRNTCBhdHRyaWJ1dGVzIChpZCArIGNsYXNzIG5hbWVzKSBmb3IgdGhlIFNXRiBjb250YWluZXJcclxuXHJcbiAgdGhpcy5tb3ZpZUlEID0gJ3NtMi1jb250YWluZXInO1xyXG4gIHRoaXMuaWQgPSAoc21JRCB8fCAnc20ybW92aWUnKTtcclxuXHJcbiAgdGhpcy5kZWJ1Z0lEID0gJ3NvdW5kbWFuYWdlci1kZWJ1Zyc7XHJcbiAgdGhpcy5kZWJ1Z1VSTFBhcmFtID0gLyhbIz8mXSlkZWJ1Zz0xL2k7XHJcblxyXG4gIC8vIGR5bmFtaWMgYXR0cmlidXRlc1xyXG5cclxuICB0aGlzLnZlcnNpb25OdW1iZXIgPSAnVjIuOTdhLjIwMTMxMjAxJztcclxuICB0aGlzLnZlcnNpb24gPSBudWxsO1xyXG4gIHRoaXMubW92aWVVUkwgPSBudWxsO1xyXG4gIHRoaXMuYWx0VVJMID0gbnVsbDtcclxuICB0aGlzLnN3ZkxvYWRlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xyXG4gIHRoaXMub01DID0gbnVsbDtcclxuICB0aGlzLnNvdW5kcyA9IHt9O1xyXG4gIHRoaXMuc291bmRJRHMgPSBbXTtcclxuICB0aGlzLm11dGVkID0gZmFsc2U7XHJcbiAgdGhpcy5kaWRGbGFzaEJsb2NrID0gZmFsc2U7XHJcbiAgdGhpcy5maWxlUGF0dGVybiA9IG51bGw7XHJcblxyXG4gIHRoaXMuZmlsZVBhdHRlcm5zID0ge1xyXG5cclxuICAgICdmbGFzaDgnOiAvXFwubXAzKFxcPy4qKT8kL2ksXHJcbiAgICAnZmxhc2g5JzogL1xcLm1wMyhcXD8uKik/JC9pXHJcblxyXG4gIH07XHJcblxyXG4gIC8vIHN1cHBvcnQgaW5kaWNhdG9ycywgc2V0IGF0IGluaXRcclxuXHJcbiAgdGhpcy5mZWF0dXJlcyA9IHtcclxuXHJcbiAgICAnYnVmZmVyaW5nJzogZmFsc2UsXHJcbiAgICAncGVha0RhdGEnOiBmYWxzZSxcclxuICAgICd3YXZlZm9ybURhdGEnOiBmYWxzZSxcclxuICAgICdlcURhdGEnOiBmYWxzZSxcclxuICAgICdtb3ZpZVN0YXInOiBmYWxzZVxyXG5cclxuICB9O1xyXG5cclxuICAvLyBmbGFzaCBzYW5kYm94IGluZm8sIHVzZWQgcHJpbWFyaWx5IGluIHRyb3VibGVzaG9vdGluZ1xyXG5cclxuICB0aGlzLnNhbmRib3ggPSB7XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICAndHlwZSc6IG51bGwsXHJcbiAgICAndHlwZXMnOiB7XHJcbiAgICAgICdyZW1vdGUnOiAncmVtb3RlIChkb21haW4tYmFzZWQpIHJ1bGVzJyxcclxuICAgICAgJ2xvY2FsV2l0aEZpbGUnOiAnbG9jYWwgd2l0aCBmaWxlIGFjY2VzcyAobm8gaW50ZXJuZXQgYWNjZXNzKScsXHJcbiAgICAgICdsb2NhbFdpdGhOZXR3b3JrJzogJ2xvY2FsIHdpdGggbmV0d29yayAoaW50ZXJuZXQgYWNjZXNzIG9ubHksIG5vIGxvY2FsIGFjY2VzcyknLFxyXG4gICAgICAnbG9jYWxUcnVzdGVkJzogJ2xvY2FsLCB0cnVzdGVkIChsb2NhbCtpbnRlcm5ldCBhY2Nlc3MpJ1xyXG4gICAgfSxcclxuICAgICdkZXNjcmlwdGlvbic6IG51bGwsXHJcbiAgICAnbm9SZW1vdGUnOiBudWxsLFxyXG4gICAgJ25vTG9jYWwnOiBudWxsXHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIGZvcm1hdCBzdXBwb3J0IChodG1sNS9mbGFzaClcclxuICAgKiBzdG9yZXMgY2FuUGxheVR5cGUoKSByZXN1bHRzIGJhc2VkIG9uIGF1ZGlvRm9ybWF0cy5cclxuICAgKiBlZy4geyBtcDM6IGJvb2xlYW4sIG1wNDogYm9vbGVhbiB9XHJcbiAgICogdHJlYXQgYXMgcmVhZC1vbmx5LlxyXG4gICAqL1xyXG5cclxuICB0aGlzLmh0bWw1ID0ge1xyXG4gICAgJ3VzaW5nRmxhc2gnOiBudWxsIC8vIHNldCBpZi93aGVuIGZsYXNoIGZhbGxiYWNrIGlzIG5lZWRlZFxyXG4gIH07XHJcblxyXG4gIC8vIGZpbGUgdHlwZSBzdXBwb3J0IGhhc2hcclxuICB0aGlzLmZsYXNoID0ge307XHJcblxyXG4gIC8vIGRldGVybWluZWQgYXQgaW5pdCB0aW1lXHJcbiAgdGhpcy5odG1sNU9ubHkgPSBmYWxzZTtcclxuXHJcbiAgLy8gdXNlZCBmb3Igc3BlY2lhbCBjYXNlcyAoZWcuIGlQYWQvaVBob25lL3BhbG0gT1M/KVxyXG4gIHRoaXMuaWdub3JlRmxhc2ggPSBmYWxzZTtcclxuXHJcbiAgLyoqXHJcbiAgICogYSBmZXcgcHJpdmF0ZSBpbnRlcm5hbHMgKE9LLCBhIGxvdC4gOkQpXHJcbiAgICovXHJcblxyXG4gIHZhciBTTVNvdW5kLFxyXG4gIHNtMiA9IHRoaXMsIGdsb2JhbEhUTUw1QXVkaW8gPSBudWxsLCBmbGFzaCA9IG51bGwsIHNtID0gJ3NvdW5kTWFuYWdlcicsIHNtYyA9IHNtICsgJzogJywgaDUgPSAnSFRNTDU6OicsIGlkLCB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQsIHdsID0gd2luZG93LmxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKSwgZG9jID0gZG9jdW1lbnQsIGRvTm90aGluZywgc2V0UHJvcGVydGllcywgaW5pdCwgZlYsIG9uX3F1ZXVlID0gW10sIGRlYnVnT3BlbiA9IHRydWUsIGRlYnVnVFMsIGRpZEFwcGVuZCA9IGZhbHNlLCBhcHBlbmRTdWNjZXNzID0gZmFsc2UsIGRpZEluaXQgPSBmYWxzZSwgZGlzYWJsZWQgPSBmYWxzZSwgd2luZG93TG9hZGVkID0gZmFsc2UsIF93RFMsIHdkQ291bnQgPSAwLCBpbml0Q29tcGxldGUsIG1peGluLCBhc3NpZ24sIGV4dHJhT3B0aW9ucywgYWRkT25FdmVudCwgcHJvY2Vzc09uRXZlbnRzLCBpbml0VXNlck9ubG9hZCwgZGVsYXlXYWl0Rm9yRUksIHdhaXRGb3JFSSwgcmVib290SW50b0hUTUw1LCBzZXRWZXJzaW9uSW5mbywgaGFuZGxlRm9jdXMsIHN0cmluZ3MsIGluaXRNb3ZpZSwgcHJlSW5pdCwgZG9tQ29udGVudExvYWRlZCwgd2luT25Mb2FkLCBkaWREQ0xvYWRlZCwgZ2V0RG9jdW1lbnQsIGNyZWF0ZU1vdmllLCBjYXRjaEVycm9yLCBzZXRQb2xsaW5nLCBpbml0RGVidWcsIGRlYnVnTGV2ZWxzID0gWydsb2cnLCAnaW5mbycsICd3YXJuJywgJ2Vycm9yJ10sIGRlZmF1bHRGbGFzaFZlcnNpb24gPSA4LCBkaXNhYmxlT2JqZWN0LCBmYWlsU2FmZWx5LCBub3JtYWxpemVNb3ZpZVVSTCwgb1JlbW92ZWQgPSBudWxsLCBvUmVtb3ZlZEhUTUwgPSBudWxsLCBzdHIsIGZsYXNoQmxvY2tIYW5kbGVyLCBnZXRTV0ZDU1MsIHN3ZkNTUywgdG9nZ2xlRGVidWcsIGxvb3BGaXgsIHBvbGljeUZpeCwgY29tcGxhaW4sIGlkQ2hlY2ssIHdhaXRpbmdGb3JFSSA9IGZhbHNlLCBpbml0UGVuZGluZyA9IGZhbHNlLCBzdGFydFRpbWVyLCBzdG9wVGltZXIsIHRpbWVyRXhlY3V0ZSwgaDVUaW1lckNvdW50ID0gMCwgaDVJbnRlcnZhbFRpbWVyID0gbnVsbCwgcGFyc2VVUkwsIG1lc3NhZ2VzID0gW10sXHJcbiAgY2FuSWdub3JlRmxhc2gsIG5lZWRzRmxhc2ggPSBudWxsLCBmZWF0dXJlQ2hlY2ssIGh0bWw1T0ssIGh0bWw1Q2FuUGxheSwgaHRtbDVFeHQsIGh0bWw1VW5sb2FkLCBkb21Db250ZW50TG9hZGVkSUUsIHRlc3RIVE1MNSwgZXZlbnQsIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLCB1c2VHbG9iYWxIVE1MNUF1ZGlvID0gZmFsc2UsIGxhc3RHbG9iYWxIVE1MNVVSTCwgaGFzRmxhc2gsIGRldGVjdEZsYXNoLCBiYWRTYWZhcmlGaXgsIGh0bWw1X2V2ZW50cywgc2hvd1N1cHBvcnQsIGZsdXNoTWVzc2FnZXMsIHdyYXBDYWxsYmFjaywgaWRDb3VudGVyID0gMCxcclxuICBpc19pRGV2aWNlID0gdWEubWF0Y2goLyhpcGFkfGlwaG9uZXxpcG9kKS9pKSwgaXNBbmRyb2lkID0gdWEubWF0Y2goL2FuZHJvaWQvaSksIGlzSUUgPSB1YS5tYXRjaCgvbXNpZS9pKSwgaXNXZWJraXQgPSB1YS5tYXRjaCgvd2Via2l0L2kpLCBpc1NhZmFyaSA9ICh1YS5tYXRjaCgvc2FmYXJpL2kpICYmICF1YS5tYXRjaCgvY2hyb21lL2kpKSwgaXNPcGVyYSA9ICh1YS5tYXRjaCgvb3BlcmEvaSkpLFxyXG4gIG1vYmlsZUhUTUw1ID0gKHVhLm1hdGNoKC8obW9iaWxlfHByZVxcL3x4b29tKS9pKSB8fCBpc19pRGV2aWNlIHx8IGlzQW5kcm9pZCksXHJcbiAgaXNCYWRTYWZhcmkgPSAoIXdsLm1hdGNoKC91c2VodG1sNWF1ZGlvL2kpICYmICF3bC5tYXRjaCgvc20yXFwtaWdub3JlYmFkdWEvaSkgJiYgaXNTYWZhcmkgJiYgIXVhLm1hdGNoKC9zaWxrL2kpICYmIHVhLm1hdGNoKC9PUyBYIDEwXzZfKFszLTddKS9pKSksIC8vIFNhZmFyaSA0IGFuZCA1IChleGNsdWRpbmcgS2luZGxlIEZpcmUsIFwiU2lsa1wiKSBvY2Nhc2lvbmFsbHkgZmFpbCB0byBsb2FkL3BsYXkgSFRNTDUgYXVkaW8gb24gU25vdyBMZW9wYXJkIDEwLjYuMyB0aHJvdWdoIDEwLjYuNyBkdWUgdG8gYnVnKHMpIGluIFF1aWNrVGltZSBYIGFuZC9vciBvdGhlciB1bmRlcmx5aW5nIGZyYW1ld29ya3MuIDovIENvbmZpcm1lZCBidWcuIGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0zMjE1OVxyXG4gIGhhc0NvbnNvbGUgPSAod2luZG93LmNvbnNvbGUgIT09IF91bmRlZmluZWQgJiYgY29uc29sZS5sb2cgIT09IF91bmRlZmluZWQpLCBpc0ZvY3VzZWQgPSAoZG9jLmhhc0ZvY3VzICE9PSBfdW5kZWZpbmVkP2RvYy5oYXNGb2N1cygpOm51bGwpLCB0cnlJbml0T25Gb2N1cyA9IChpc1NhZmFyaSAmJiAoZG9jLmhhc0ZvY3VzID09PSBfdW5kZWZpbmVkIHx8ICFkb2MuaGFzRm9jdXMoKSkpLCBva1RvRGlzYWJsZSA9ICF0cnlJbml0T25Gb2N1cywgZmxhc2hNSU1FID0gLyhtcDN8bXA0fG1wYXxtNGF8bTRiKS9pLCBtc2VjU2NhbGUgPSAxMDAwLFxyXG4gIGVtcHR5VVJMID0gJ2Fib3V0OmJsYW5rJywgLy8gc2FmZSBVUkwgdG8gdW5sb2FkLCBvciBsb2FkIG5vdGhpbmcgZnJvbSAoZmxhc2ggOCArIG1vc3QgSFRNTDUgVUFzKVxyXG4gIGVtcHR5V0FWID0gJ2RhdGE6YXVkaW8vd2F2ZTtiYXNlNjQsL1VrbEdSaVlBQUFCWFFWWkZabTEwSUJBQUFBQUJBQUVBUkt3QUFJaFlBUUFDQUJBQVpHRjBZUUlBQUFELy93PT0nLCAvLyB0aW55IFdBViBmb3IgSFRNTDUgdW5sb2FkaW5nXHJcbiAgb3ZlckhUVFAgPSAoZG9jLmxvY2F0aW9uP2RvYy5sb2NhdGlvbi5wcm90b2NvbC5tYXRjaCgvaHR0cC9pKTpudWxsKSxcclxuICBodHRwID0gKCFvdmVySFRUUCA/ICdodHRwOi8nKycvJyA6ICcnKSxcclxuICAvLyBtcDMsIG1wNCwgYWFjIGV0Yy5cclxuICBuZXRTdHJlYW1NaW1lVHlwZXMgPSAvXlxccyphdWRpb1xcLyg/OngtKT8oPzptcGVnNHxhYWN8Zmx2fG1vdnxtcDR8fG00dnxtNGF8bTRifG1wNHZ8M2dwfDNnMilcXHMqKD86JHw7KS9pLFxyXG4gIC8vIEZsYXNoIHY5LjByMTE1KyBcIm1vdmllc3RhclwiIGZvcm1hdHNcclxuICBuZXRTdHJlYW1UeXBlcyA9IFsnbXBlZzQnLCAnYWFjJywgJ2ZsdicsICdtb3YnLCAnbXA0JywgJ200dicsICdmNHYnLCAnbTRhJywgJ200YicsICdtcDR2JywgJzNncCcsICczZzInXSxcclxuICBuZXRTdHJlYW1QYXR0ZXJuID0gbmV3IFJlZ0V4cCgnXFxcXC4oJyArIG5ldFN0cmVhbVR5cGVzLmpvaW4oJ3wnKSArICcpKFxcXFw/LiopPyQnLCAnaScpO1xyXG5cclxuICB0aGlzLm1pbWVQYXR0ZXJuID0gL15cXHMqYXVkaW9cXC8oPzp4LSk/KD86bXAoPzplZ3wzKSlcXHMqKD86JHw7KS9pOyAvLyBkZWZhdWx0IG1wMyBzZXRcclxuXHJcbiAgLy8gdXNlIGFsdFVSTCBpZiBub3QgXCJvbmxpbmVcIlxyXG4gIHRoaXMudXNlQWx0VVJMID0gIW92ZXJIVFRQO1xyXG5cclxuICBzd2ZDU1MgPSB7XHJcblxyXG4gICAgJ3N3ZkJveCc6ICdzbTItb2JqZWN0LWJveCcsXHJcbiAgICAnc3dmRGVmYXVsdCc6ICdtb3ZpZUNvbnRhaW5lcicsXHJcbiAgICAnc3dmRXJyb3InOiAnc3dmX2Vycm9yJywgLy8gU1dGIGxvYWRlZCwgYnV0IFNNMiBjb3VsZG4ndCBzdGFydCAob3RoZXIgZXJyb3IpXHJcbiAgICAnc3dmVGltZWRvdXQnOiAnc3dmX3RpbWVkb3V0JyxcclxuICAgICdzd2ZMb2FkZWQnOiAnc3dmX2xvYWRlZCcsXHJcbiAgICAnc3dmVW5ibG9ja2VkJzogJ3N3Zl91bmJsb2NrZWQnLCAvLyBvciBsb2FkZWQgT0tcclxuICAgICdzbTJEZWJ1Zyc6ICdzbTJfZGVidWcnLFxyXG4gICAgJ2hpZ2hQZXJmJzogJ2hpZ2hfcGVyZm9ybWFuY2UnLFxyXG4gICAgJ2ZsYXNoRGVidWcnOiAnZmxhc2hfZGVidWcnXHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIGJhc2ljIEhUTUw1IEF1ZGlvKCkgc3VwcG9ydCB0ZXN0XHJcbiAgICogdHJ5Li4uY2F0Y2ggYmVjYXVzZSBvZiBJRSA5IFwibm90IGltcGxlbWVudGVkXCIgbm9uc2Vuc2VcclxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMjI0XHJcbiAgICovXHJcblxyXG4gIHRoaXMuaGFzSFRNTDUgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBuZXcgQXVkaW8obnVsbCkgZm9yIHN0dXBpZCBPcGVyYSA5LjY0IGNhc2UsIHdoaWNoIHRocm93cyBub3RfZW5vdWdoX2FyZ3VtZW50cyBleGNlcHRpb24gb3RoZXJ3aXNlLlxyXG4gICAgICByZXR1cm4gKEF1ZGlvICE9PSBfdW5kZWZpbmVkICYmIChpc09wZXJhICYmIG9wZXJhICE9PSBfdW5kZWZpbmVkICYmIG9wZXJhLnZlcnNpb24oKSA8IDEwID8gbmV3IEF1ZGlvKG51bGwpIDogbmV3IEF1ZGlvKCkpLmNhblBsYXlUeXBlICE9PSBfdW5kZWZpbmVkKTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSgpKTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHVibGljIFNvdW5kTWFuYWdlciBBUElcclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqL1xyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIHRvcC1sZXZlbCBzb3VuZE1hbmFnZXIgcHJvcGVydGllcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIE9wdGlvbiBwYXJhbWV0ZXJzLCBlZy4geyBmbGFzaFZlcnNpb246IDksIHVybDogJy9wYXRoL3RvL3N3ZnMvJyB9XHJcbiAgICogb25yZWFkeSBhbmQgb250aW1lb3V0IGFyZSBhbHNvIGFjY2VwdGVkIHBhcmFtZXRlcnMuIGNhbGwgc291bmRNYW5hZ2VyLnNldHVwKCkgdG8gc2VlIHRoZSBmdWxsIGxpc3QuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuc2V0dXAgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIG5vVVJMID0gKCFzbTIudXJsKTtcclxuXHJcbiAgICAvLyB3YXJuIGlmIGZsYXNoIG9wdGlvbnMgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZFxyXG5cclxuICAgIGlmIChvcHRpb25zICE9PSBfdW5kZWZpbmVkICYmIGRpZEluaXQgJiYgbmVlZHNGbGFzaCAmJiBzbTIub2soKSAmJiAob3B0aW9ucy5mbGFzaFZlcnNpb24gIT09IF91bmRlZmluZWQgfHwgb3B0aW9ucy51cmwgIT09IF91bmRlZmluZWQgfHwgb3B0aW9ucy5odG1sNVRlc3QgIT09IF91bmRlZmluZWQpKSB7XHJcbiAgICAgIGNvbXBsYWluKHN0cignc2V0dXBMYXRlJykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IGRlZmVyOiB0cnVlP1xyXG5cclxuICAgIGFzc2lnbihvcHRpb25zKTtcclxuXHJcbiAgICAvLyBzcGVjaWFsIGNhc2UgMTogXCJMYXRlIHNldHVwXCIuIFNNMiBsb2FkZWQgbm9ybWFsbHksIGJ1dCB1c2VyIGRpZG4ndCBhc3NpZ24gZmxhc2ggVVJMIGVnLiwgc2V0dXAoe3VybDouLi59KSBiZWZvcmUgU00yIGluaXQuIFRyZWF0IGFzIGRlbGF5ZWQgaW5pdC5cclxuXHJcbiAgICBpZiAob3B0aW9ucykge1xyXG5cclxuICAgICAgaWYgKG5vVVJMICYmIGRpZERDTG9hZGVkICYmIG9wdGlvbnMudXJsICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc20yLmJlZ2luRGVsYXllZEluaXQoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc3BlY2lhbCBjYXNlIDI6IElmIGxhenktbG9hZGluZyBTTTIgKERPTUNvbnRlbnRMb2FkZWQgaGFzIGFscmVhZHkgaGFwcGVuZWQpIGFuZCB1c2VyIGNhbGxzIHNldHVwKCkgd2l0aCB1cmw6IHBhcmFtZXRlciwgdHJ5IHRvIGluaXQgQVNBUC5cclxuXHJcbiAgICAgIGlmICghZGlkRENMb2FkZWQgJiYgb3B0aW9ucy51cmwgIT09IF91bmRlZmluZWQgJiYgZG9jLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGRvbUNvbnRlbnRMb2FkZWQsIDEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzbTI7XHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMub2sgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICByZXR1cm4gKG5lZWRzRmxhc2ggPyAoZGlkSW5pdCAmJiAhZGlzYWJsZWQpIDogKHNtMi51c2VIVE1MNUF1ZGlvICYmIHNtMi5oYXNIVE1MNSkpO1xyXG5cclxuICB9O1xyXG5cclxuICB0aGlzLnN1cHBvcnRlZCA9IHRoaXMub2s7IC8vIGxlZ2FjeVxyXG5cclxuICB0aGlzLmdldE1vdmllID0gZnVuY3Rpb24oc21JRCkge1xyXG5cclxuICAgIC8vIHNhZmV0eSBuZXQ6IHNvbWUgb2xkIGJyb3dzZXJzIGRpZmZlciBvbiBTV0YgcmVmZXJlbmNlcywgcG9zc2libHkgcmVsYXRlZCB0byBFeHRlcm5hbEludGVyZmFjZSAvIGZsYXNoIHZlcnNpb25cclxuICAgIHJldHVybiBpZChzbUlEKSB8fCBkb2Nbc21JRF0gfHwgd2luZG93W3NtSURdO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgU01Tb3VuZCBzb3VuZCBvYmplY3QgaW5zdGFuY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgU291bmQgb3B0aW9ucyAoYXQgbWluaW11bSwgaWQgYW5kIHVybCBwYXJhbWV0ZXJzIGFyZSByZXF1aXJlZC4pXHJcbiAgICogQHJldHVybiB7b2JqZWN0fSBTTVNvdW5kIFRoZSBuZXcgU01Tb3VuZCBvYmplY3QuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuY3JlYXRlU291bmQgPSBmdW5jdGlvbihvT3B0aW9ucywgX3VybCkge1xyXG5cclxuICAgIHZhciBjcywgY3Nfc3RyaW5nLCBvcHRpb25zLCBvU291bmQgPSBudWxsO1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgY3MgPSBzbSArICcuY3JlYXRlU291bmQoKTogJztcclxuICAgIGNzX3N0cmluZyA9IGNzICsgc3RyKCFkaWRJbml0Pydub3RSZWFkeSc6J25vdE9LJyk7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgaWYgKCFkaWRJbml0IHx8ICFzbTIub2soKSkge1xyXG4gICAgICBjb21wbGFpbihjc19zdHJpbmcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF91cmwgIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgLy8gZnVuY3Rpb24gb3ZlcmxvYWRpbmcgaW4gSlMhIDopIC4uYXNzdW1lIHNpbXBsZSBjcmVhdGVTb3VuZChpZCwgdXJsKSB1c2UgY2FzZVxyXG4gICAgICBvT3B0aW9ucyA9IHtcclxuICAgICAgICAnaWQnOiBvT3B0aW9ucyxcclxuICAgICAgICAndXJsJzogX3VybFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluaGVyaXQgZnJvbSBkZWZhdWx0T3B0aW9uc1xyXG4gICAgb3B0aW9ucyA9IG1peGluKG9PcHRpb25zKTtcclxuXHJcbiAgICBvcHRpb25zLnVybCA9IHBhcnNlVVJMKG9wdGlvbnMudXJsKTtcclxuXHJcbiAgICAvLyBnZW5lcmF0ZSBhbiBpZCwgaWYgbmVlZGVkLlxyXG4gICAgaWYgKG9wdGlvbnMuaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBvcHRpb25zLmlkID0gc20yLnNldHVwT3B0aW9ucy5pZFByZWZpeCArIChpZENvdW50ZXIrKyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBpZiAob3B0aW9ucy5pZC50b1N0cmluZygpLmNoYXJBdCgwKS5tYXRjaCgvXlswLTldJC8pKSB7XHJcbiAgICAgIHNtMi5fd0QoY3MgKyBzdHIoJ2JhZElEJywgb3B0aW9ucy5pZCksIDIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNtMi5fd0QoY3MgKyBvcHRpb25zLmlkICsgKG9wdGlvbnMudXJsID8gJyAoJyArIG9wdGlvbnMudXJsICsgJyknIDogJycpLCAxKTtcclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICBpZiAoaWRDaGVjayhvcHRpb25zLmlkLCB0cnVlKSkge1xyXG4gICAgICBzbTIuX3dEKGNzICsgb3B0aW9ucy5pZCArICcgZXhpc3RzJywgMSk7XHJcbiAgICAgIHJldHVybiBzbTIuc291bmRzW29wdGlvbnMuaWRdO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1ha2UoKSB7XHJcblxyXG4gICAgICBvcHRpb25zID0gbG9vcEZpeChvcHRpb25zKTtcclxuICAgICAgc20yLnNvdW5kc1tvcHRpb25zLmlkXSA9IG5ldyBTTVNvdW5kKG9wdGlvbnMpO1xyXG4gICAgICBzbTIuc291bmRJRHMucHVzaChvcHRpb25zLmlkKTtcclxuICAgICAgcmV0dXJuIHNtMi5zb3VuZHNbb3B0aW9ucy5pZF07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChodG1sNU9LKG9wdGlvbnMpKSB7XHJcblxyXG4gICAgICBvU291bmQgPSBtYWtlKCk7XHJcbiAgICAgIHNtMi5fd0Qob3B0aW9ucy5pZCArICc6IFVzaW5nIEhUTUw1Jyk7XHJcbiAgICAgIG9Tb3VuZC5fc2V0dXBfaHRtbDUob3B0aW9ucyk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgICAgc20yLl93RChvcHRpb25zLmlkICsgJzogTm8gSFRNTDUgc3VwcG9ydCBmb3IgdGhpcyBzb3VuZCwgYW5kIG5vIEZsYXNoLiBFeGl0aW5nLicpO1xyXG4gICAgICAgIHJldHVybiBtYWtlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFRPRE86IE1vdmUgSFRNTDUvZmxhc2ggY2hlY2tzIGludG8gZ2VuZXJpYyBVUkwgcGFyc2luZy9oYW5kbGluZyBmdW5jdGlvbi5cclxuXHJcbiAgICAgIGlmIChzbTIuaHRtbDUudXNpbmdGbGFzaCAmJiBvcHRpb25zLnVybCAmJiBvcHRpb25zLnVybC5tYXRjaCgvZGF0YVxcOi9pKSkge1xyXG4gICAgICAgIC8vIGRhdGE6IFVSSXMgbm90IHN1cHBvcnRlZCBieSBGbGFzaCwgZWl0aGVyLlxyXG4gICAgICAgIHNtMi5fd0Qob3B0aW9ucy5pZCArICc6IGRhdGE6IFVSSXMgbm90IHN1cHBvcnRlZCB2aWEgRmxhc2guIEV4aXRpbmcuJyk7XHJcbiAgICAgICAgcmV0dXJuIG1ha2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGZWID4gOCkge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmlzTW92aWVTdGFyID09PSBudWxsKSB7XHJcbiAgICAgICAgICAvLyBhdHRlbXB0IHRvIGRldGVjdCBNUEVHLTQgZm9ybWF0c1xyXG4gICAgICAgICAgb3B0aW9ucy5pc01vdmllU3RhciA9ICEhKG9wdGlvbnMuc2VydmVyVVJMIHx8IChvcHRpb25zLnR5cGUgPyBvcHRpb25zLnR5cGUubWF0Y2gobmV0U3RyZWFtTWltZVR5cGVzKSA6IGZhbHNlKSB8fCAob3B0aW9ucy51cmwgJiYgb3B0aW9ucy51cmwubWF0Y2gobmV0U3RyZWFtUGF0dGVybikpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gPGQ+XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuaXNNb3ZpZVN0YXIpIHtcclxuICAgICAgICAgIHNtMi5fd0QoY3MgKyAndXNpbmcgTW92aWVTdGFyIGhhbmRsaW5nJyk7XHJcbiAgICAgICAgICBpZiAob3B0aW9ucy5sb29wcyA+IDEpIHtcclxuICAgICAgICAgICAgX3dEUygnbm9OU0xvb3AnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gPC9kPlxyXG4gICAgICB9XHJcblxyXG4gICAgICBvcHRpb25zID0gcG9saWN5Rml4KG9wdGlvbnMsIGNzKTtcclxuICAgICAgb1NvdW5kID0gbWFrZSgpO1xyXG5cclxuICAgICAgaWYgKGZWID09PSA4KSB7XHJcbiAgICAgICAgZmxhc2guX2NyZWF0ZVNvdW5kKG9wdGlvbnMuaWQsIG9wdGlvbnMubG9vcHN8fDEsIG9wdGlvbnMudXNlUG9saWN5RmlsZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZmxhc2guX2NyZWF0ZVNvdW5kKG9wdGlvbnMuaWQsIG9wdGlvbnMudXJsLCBvcHRpb25zLnVzZVBlYWtEYXRhLCBvcHRpb25zLnVzZVdhdmVmb3JtRGF0YSwgb3B0aW9ucy51c2VFUURhdGEsIG9wdGlvbnMuaXNNb3ZpZVN0YXIsIChvcHRpb25zLmlzTW92aWVTdGFyP29wdGlvbnMuYnVmZmVyVGltZTpmYWxzZSksIG9wdGlvbnMubG9vcHN8fDEsIG9wdGlvbnMuc2VydmVyVVJMLCBvcHRpb25zLmR1cmF0aW9ufHxudWxsLCBvcHRpb25zLmF1dG9QbGF5LCB0cnVlLCBvcHRpb25zLmF1dG9Mb2FkLCBvcHRpb25zLnVzZVBvbGljeUZpbGUpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy5zZXJ2ZXJVUkwpIHtcclxuICAgICAgICAgIC8vIFdlIGFyZSBjb25uZWN0ZWQgaW1tZWRpYXRlbHlcclxuICAgICAgICAgIG9Tb3VuZC5jb25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgaWYgKG9wdGlvbnMub25jb25uZWN0KSB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMub25jb25uZWN0LmFwcGx5KG9Tb3VuZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIW9wdGlvbnMuc2VydmVyVVJMICYmIChvcHRpb25zLmF1dG9Mb2FkIHx8IG9wdGlvbnMuYXV0b1BsYXkpKSB7XHJcbiAgICAgICAgLy8gY2FsbCBsb2FkIGZvciBub24tcnRtcCBzdHJlYW1zXHJcbiAgICAgICAgb1NvdW5kLmxvYWQob3B0aW9ucyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gcnRtcCB3aWxsIHBsYXkgaW4gb25jb25uZWN0XHJcbiAgICBpZiAoIW9wdGlvbnMuc2VydmVyVVJMICYmIG9wdGlvbnMuYXV0b1BsYXkpIHtcclxuICAgICAgb1NvdW5kLnBsYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb1NvdW5kO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhIFNNU291bmQgc291bmQgb2JqZWN0IGluc3RhbmNlLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kIHRvIGRlc3Ryb3lcclxuICAgKi9cclxuXHJcbiAgdGhpcy5kZXN0cm95U291bmQgPSBmdW5jdGlvbihzSUQsIF9iRnJvbVNvdW5kKSB7XHJcblxyXG4gICAgLy8gZXhwbGljaXRseSBkZXN0cm95IGEgc291bmQgYmVmb3JlIG5vcm1hbCBwYWdlIHVubG9hZCwgZXRjLlxyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb1MgPSBzbTIuc291bmRzW3NJRF0sIGk7XHJcblxyXG4gICAgLy8gRGlzYWJsZSBhbGwgY2FsbGJhY2tzIHdoaWxlIHRoZSBzb3VuZCBpcyBiZWluZyBkZXN0cm95ZWRcclxuICAgIG9TLl9pTyA9IHt9O1xyXG5cclxuICAgIG9TLnN0b3AoKTtcclxuICAgIG9TLnVubG9hZCgpO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBzbTIuc291bmRJRHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHNtMi5zb3VuZElEc1tpXSA9PT0gc0lEKSB7XHJcbiAgICAgICAgc20yLnNvdW5kSURzLnNwbGljZShpLCAxKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghX2JGcm9tU291bmQpIHtcclxuICAgICAgLy8gaWdub3JlIGlmIGJlaW5nIGNhbGxlZCBmcm9tIFNNU291bmQgaW5zdGFuY2VcclxuICAgICAgb1MuZGVzdHJ1Y3QodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgb1MgPSBudWxsO1xyXG4gICAgZGVsZXRlIHNtMi5zb3VuZHNbc0lEXTtcclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIGxvYWQoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvT3B0aW9ucyBPcHRpb25hbDogU291bmQgb3B0aW9uc1xyXG4gICAqL1xyXG5cclxuICB0aGlzLmxvYWQgPSBmdW5jdGlvbihzSUQsIG9PcHRpb25zKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5sb2FkKG9PcHRpb25zKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHVubG9hZCgpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICovXHJcblxyXG4gIHRoaXMudW5sb2FkID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS51bmxvYWQoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIG9uUG9zaXRpb24oKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuUG9zaXRpb24gVGhlIHBvc2l0aW9uIHRvIHdhdGNoIGZvclxyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9NZXRob2QgVGhlIHJlbGV2YW50IGNhbGxiYWNrIHRvIGZpcmVcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb1Njb3BlIE9wdGlvbmFsOiBUaGUgc2NvcGUgdG8gYXBwbHkgdGhlIGNhbGxiYWNrIHRvXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMub25Qb3NpdGlvbiA9IGZ1bmN0aW9uKHNJRCwgblBvc2l0aW9uLCBvTWV0aG9kLCBvU2NvcGUpIHtcclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLm9ucG9zaXRpb24oblBvc2l0aW9uLCBvTWV0aG9kLCBvU2NvcGUpO1xyXG5cclxuICB9O1xyXG5cclxuICAvLyBsZWdhY3kvYmFja3dhcmRzLWNvbXBhYmlsaXR5OiBsb3dlci1jYXNlIG1ldGhvZCBuYW1lXHJcbiAgdGhpcy5vbnBvc2l0aW9uID0gdGhpcy5vblBvc2l0aW9uO1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgY2xlYXJPblBvc2l0aW9uKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge251bWJlcn0gblBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byB3YXRjaCBmb3JcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvTWV0aG9kIE9wdGlvbmFsOiBUaGUgcmVsZXZhbnQgY2FsbGJhY2sgdG8gZmlyZVxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLmNsZWFyT25Qb3NpdGlvbiA9IGZ1bmN0aW9uKHNJRCwgblBvc2l0aW9uLCBvTWV0aG9kKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5jbGVhck9uUG9zaXRpb24oblBvc2l0aW9uLCBvTWV0aG9kKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHBsYXkoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvT3B0aW9ucyBPcHRpb25hbDogU291bmQgb3B0aW9uc1xyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnBsYXkgPSBmdW5jdGlvbihzSUQsIG9PcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IG51bGwsXHJcbiAgICAgICAgLy8gbGVnYWN5IGZ1bmN0aW9uLW92ZXJsb2FkaW5nIHVzZSBjYXNlOiBwbGF5KCdteVNvdW5kJywgJy9wYXRoL3RvL3NvbWUubXAzJyk7XHJcbiAgICAgICAgb3ZlcmxvYWRlZCA9IChvT3B0aW9ucyAmJiAhKG9PcHRpb25zIGluc3RhbmNlb2YgT2JqZWN0KSk7XHJcblxyXG4gICAgaWYgKCFkaWRJbml0IHx8ICFzbTIub2soKSkge1xyXG4gICAgICBjb21wbGFpbihzbSArICcucGxheSgpOiAnICsgc3RyKCFkaWRJbml0Pydub3RSZWFkeSc6J25vdE9LJykpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCwgb3ZlcmxvYWRlZCkpIHtcclxuXHJcbiAgICAgIGlmICghb3ZlcmxvYWRlZCkge1xyXG4gICAgICAgIC8vIG5vIHNvdW5kIGZvdW5kIGZvciB0aGUgZ2l2ZW4gSUQuIEJhaWwuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAob3ZlcmxvYWRlZCkge1xyXG4gICAgICAgIG9PcHRpb25zID0ge1xyXG4gICAgICAgICAgdXJsOiBvT3B0aW9uc1xyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvT3B0aW9ucyAmJiBvT3B0aW9ucy51cmwpIHtcclxuICAgICAgICAvLyBvdmVybG9hZGluZyB1c2UgY2FzZSwgY3JlYXRlK3BsYXk6IC5wbGF5KCdzb21lSUQnLCB7dXJsOicvcGF0aC90by5tcDMnfSk7XHJcbiAgICAgICAgc20yLl93RChzbSArICcucGxheSgpOiBBdHRlbXB0aW5nIHRvIGNyZWF0ZSBcIicgKyBzSUQgKyAnXCInLCAxKTtcclxuICAgICAgICBvT3B0aW9ucy5pZCA9IHNJRDtcclxuICAgICAgICByZXN1bHQgPSBzbTIuY3JlYXRlU291bmQob09wdGlvbnMpLnBsYXkoKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSBpZiAob3ZlcmxvYWRlZCkge1xyXG5cclxuICAgICAgLy8gZXhpc3Rpbmcgc291bmQgb2JqZWN0IGNhc2VcclxuICAgICAgb09wdGlvbnMgPSB7XHJcbiAgICAgICAgdXJsOiBvT3B0aW9uc1xyXG4gICAgICB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgIC8vIGRlZmF1bHQgY2FzZVxyXG4gICAgICByZXN1bHQgPSBzbTIuc291bmRzW3NJRF0ucGxheShvT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgdGhpcy5zdGFydCA9IHRoaXMucGxheTsgLy8ganVzdCBmb3IgY29udmVuaWVuY2VcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHNldFBvc2l0aW9uKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcGFyYW0ge251bWJlcn0gbk1zZWNPZmZzZXQgUG9zaXRpb24gKG1pbGxpc2Vjb25kcylcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy5zZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKHNJRCwgbk1zZWNPZmZzZXQpIHtcclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLnNldFBvc2l0aW9uKG5Nc2VjT2Zmc2V0KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHN0b3AoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnN0b3AgPSBmdW5jdGlvbihzSUQpIHtcclxuXHJcbiAgICBpZiAoIWlkQ2hlY2soc0lEKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc20yLl93RChzbSArICcuc3RvcCgnICsgc0lEICsgJyknLCAxKTtcclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0uc3RvcCgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTdG9wcyBhbGwgY3VycmVudGx5LXBsYXlpbmcgc291bmRzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLnN0b3BBbGwgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgb1NvdW5kO1xyXG4gICAgc20yLl93RChzbSArICcuc3RvcEFsbCgpJywgMSk7XHJcblxyXG4gICAgZm9yIChvU291bmQgaW4gc20yLnNvdW5kcykge1xyXG4gICAgICBpZiAoc20yLnNvdW5kcy5oYXNPd25Qcm9wZXJ0eShvU291bmQpKSB7XHJcbiAgICAgICAgLy8gYXBwbHkgb25seSB0byBzb3VuZCBvYmplY3RzXHJcbiAgICAgICAgc20yLnNvdW5kc1tvU291bmRdLnN0b3AoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgcGF1c2UoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5wYXVzZSgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBQYXVzZXMgYWxsIGN1cnJlbnRseS1wbGF5aW5nIHNvdW5kcy5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5wYXVzZUFsbCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBpO1xyXG4gICAgZm9yIChpID0gc20yLnNvdW5kSURzLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0ucGF1c2UoKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHJlc3VtZSgpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5yZXN1bWUoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdW1lcyBhbGwgY3VycmVudGx5LXBhdXNlZCBzb3VuZHMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMucmVzdW1lQWxsID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIGk7XHJcbiAgICBmb3IgKGkgPSBzbTIuc291bmRJRHMubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXS5yZXN1bWUoKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHRvZ2dsZVBhdXNlKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy50b2dnbGVQYXVzZSA9IGZ1bmN0aW9uKHNJRCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0udG9nZ2xlUGF1c2UoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgdGhlIHNldFBhbigpIG1ldGhvZCBvZiBhIFNNU291bmQgb2JqZWN0IGJ5IElELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBUaGUgSUQgb2YgdGhlIHNvdW5kXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG5QYW4gVGhlIHBhbiB2YWx1ZSAoLTEwMCB0byAxMDApXHJcbiAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIHRoaXMuc2V0UGFuID0gZnVuY3Rpb24oc0lELCBuUGFuKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS5zZXRQYW4oblBhbik7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBzZXRWb2x1bWUoKSBtZXRob2Qgb2YgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBuVm9sIFRoZSB2b2x1bWUgdmFsdWUgKDAgdG8gMTAwKVxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLnNldFZvbHVtZSA9IGZ1bmN0aW9uKHNJRCwgblZvbCkge1xyXG5cclxuICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBzbTIuc291bmRzW3NJRF0uc2V0Vm9sdW1lKG5Wb2wpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDYWxscyB0aGUgbXV0ZSgpIG1ldGhvZCBvZiBlaXRoZXIgYSBzaW5nbGUgU01Tb3VuZCBvYmplY3QgYnkgSUQsIG9yIGFsbCBzb3VuZCBvYmplY3RzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNJRCBPcHRpb25hbDogVGhlIElEIG9mIHRoZSBzb3VuZCAoaWYgb21pdHRlZCwgYWxsIHNvdW5kcyB3aWxsIGJlIHVzZWQuKVxyXG4gICAqL1xyXG5cclxuICB0aGlzLm11dGUgPSBmdW5jdGlvbihzSUQpIHtcclxuXHJcbiAgICB2YXIgaSA9IDA7XHJcblxyXG4gICAgaWYgKHNJRCBpbnN0YW5jZW9mIFN0cmluZykge1xyXG4gICAgICBzSUQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc0lEKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHNtICsgJy5tdXRlKCk6IE11dGluZyBhbGwgc291bmRzJyk7XHJcbiAgICAgIGZvciAoaSA9IHNtMi5zb3VuZElEcy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0ubXV0ZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHNtMi5tdXRlZCA9IHRydWU7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHNtMi5fd0Qoc20gKyAnLm11dGUoKTogTXV0aW5nIFwiJyArIHNJRCArICdcIicpO1xyXG4gICAgICByZXR1cm4gc20yLnNvdW5kc1tzSURdLm11dGUoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIE11dGVzIGFsbCBzb3VuZHMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMubXV0ZUFsbCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHNtMi5tdXRlKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSB1bm11dGUoKSBtZXRob2Qgb2YgZWl0aGVyIGEgc2luZ2xlIFNNU291bmQgb2JqZWN0IGJ5IElELCBvciBhbGwgc291bmQgb2JqZWN0cy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgT3B0aW9uYWw6IFRoZSBJRCBvZiB0aGUgc291bmQgKGlmIG9taXR0ZWQsIGFsbCBzb3VuZHMgd2lsbCBiZSB1c2VkLilcclxuICAgKi9cclxuXHJcbiAgdGhpcy51bm11dGUgPSBmdW5jdGlvbihzSUQpIHtcclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBpZiAoc0lEIGluc3RhbmNlb2YgU3RyaW5nKSB7XHJcbiAgICAgIHNJRCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFzSUQpIHtcclxuXHJcbiAgICAgIHNtMi5fd0Qoc20gKyAnLnVubXV0ZSgpOiBVbm11dGluZyBhbGwgc291bmRzJyk7XHJcbiAgICAgIGZvciAoaSA9IHNtMi5zb3VuZElEcy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0udW5tdXRlKCk7XHJcbiAgICAgIH1cclxuICAgICAgc20yLm11dGVkID0gZmFsc2U7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIGlmICghaWRDaGVjayhzSUQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHNtMi5fd0Qoc20gKyAnLnVubXV0ZSgpOiBVbm11dGluZyBcIicgKyBzSUQgKyAnXCInKTtcclxuICAgICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS51bm11dGUoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFVubXV0ZXMgYWxsIHNvdW5kcy5cclxuICAgKi9cclxuXHJcbiAgdGhpcy51bm11dGVBbGwgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBzbTIudW5tdXRlKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSB0b2dnbGVNdXRlKCkgbWV0aG9kIG9mIGEgU01Tb3VuZCBvYmplY3QgYnkgSUQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc0lEIFRoZSBJRCBvZiB0aGUgc291bmRcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgKi9cclxuXHJcbiAgdGhpcy50b2dnbGVNdXRlID0gZnVuY3Rpb24oc0lEKSB7XHJcblxyXG4gICAgaWYgKCFpZENoZWNrKHNJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNtMi5zb3VuZHNbc0lEXS50b2dnbGVNdXRlKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHJpZXZlcyB0aGUgbWVtb3J5IHVzZWQgYnkgdGhlIGZsYXNoIHBsdWdpbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFtb3VudCBvZiBtZW1vcnkgaW4gdXNlXHJcbiAgICovXHJcblxyXG4gIHRoaXMuZ2V0TWVtb3J5VXNlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gZmxhc2gtb25seVxyXG4gICAgdmFyIHJhbSA9IDA7XHJcblxyXG4gICAgaWYgKGZsYXNoICYmIGZWICE9PSA4KSB7XHJcbiAgICAgIHJhbSA9IHBhcnNlSW50KGZsYXNoLl9nZXRNZW1vcnlVc2UoKSwgMTApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByYW07XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFVuZG9jdW1lbnRlZDogTk9QcyBzb3VuZE1hbmFnZXIgYW5kIGFsbCBTTVNvdW5kIG9iamVjdHMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuZGlzYWJsZSA9IGZ1bmN0aW9uKGJOb0Rpc2FibGUpIHtcclxuXHJcbiAgICAvLyBkZXN0cm95IGFsbCBmdW5jdGlvbnNcclxuICAgIHZhciBpO1xyXG5cclxuICAgIGlmIChiTm9EaXNhYmxlID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIGJOb0Rpc2FibGUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGlzYWJsZWQpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc2FibGVkID0gdHJ1ZTtcclxuICAgIF93RFMoJ3NodXRkb3duJywgMSk7XHJcblxyXG4gICAgZm9yIChpID0gc20yLnNvdW5kSURzLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICBkaXNhYmxlT2JqZWN0KHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZmlyZSBcImNvbXBsZXRlXCIsIGRlc3BpdGUgZmFpbFxyXG4gICAgaW5pdENvbXBsZXRlKGJOb0Rpc2FibGUpO1xyXG4gICAgZXZlbnQucmVtb3ZlKHdpbmRvdywgJ2xvYWQnLCBpbml0VXNlck9ubG9hZCk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgcGxheWFiaWxpdHkgb2YgYSBNSU1FIHR5cGUsIGVnLiAnYXVkaW8vbXAzJy5cclxuICAgKi9cclxuXHJcbiAgdGhpcy5jYW5QbGF5TUlNRSA9IGZ1bmN0aW9uKHNNSU1FKSB7XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuXHJcbiAgICBpZiAoc20yLmhhc0hUTUw1KSB7XHJcbiAgICAgIHJlc3VsdCA9IGh0bWw1Q2FuUGxheSh7dHlwZTpzTUlNRX0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzdWx0ICYmIG5lZWRzRmxhc2gpIHtcclxuICAgICAgLy8gaWYgZmxhc2ggOSwgdGVzdCBuZXRTdHJlYW0gKG1vdmllU3RhcikgdHlwZXMgYXMgd2VsbC5cclxuICAgICAgcmVzdWx0ID0gKHNNSU1FICYmIHNtMi5vaygpID8gISEoKGZWID4gOCA/IHNNSU1FLm1hdGNoKG5ldFN0cmVhbU1pbWVUeXBlcykgOiBudWxsKSB8fCBzTUlNRS5tYXRjaChzbTIubWltZVBhdHRlcm4pKSA6IG51bGwpOyAvLyBUT0RPOiBtYWtlIGxlc3MgXCJ3ZWlyZFwiIChwZXIgSlNMaW50KVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIERldGVybWluZXMgcGxheWFiaWxpdHkgb2YgYSBVUkwgYmFzZWQgb24gYXVkaW8gc3VwcG9ydC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzVVJMIFRoZSBVUkwgdG8gdGVzdFxyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFVSTCBwbGF5YWJpbGl0eVxyXG4gICAqL1xyXG5cclxuICB0aGlzLmNhblBsYXlVUkwgPSBmdW5jdGlvbihzVVJMKSB7XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuXHJcbiAgICBpZiAoc20yLmhhc0hUTUw1KSB7XHJcbiAgICAgIHJlc3VsdCA9IGh0bWw1Q2FuUGxheSh7dXJsOiBzVVJMfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFyZXN1bHQgJiYgbmVlZHNGbGFzaCkge1xyXG4gICAgICByZXN1bHQgPSAoc1VSTCAmJiBzbTIub2soKSA/ICEhKHNVUkwubWF0Y2goc20yLmZpbGVQYXR0ZXJuKSkgOiBudWxsKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHBsYXlhYmlsaXR5IG9mIGFuIEhUTUwgRE9NICZsdDthJmd0OyBvYmplY3QgKG9yIHNpbWlsYXIgb2JqZWN0IGxpdGVyYWwpIGJhc2VkIG9uIGF1ZGlvIHN1cHBvcnQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb0xpbmsgYW4gSFRNTCBET00gJmx0O2EmZ3Q7IG9iamVjdCBvciBvYmplY3QgbGl0ZXJhbCBpbmNsdWRpbmcgaHJlZiBhbmQvb3IgdHlwZSBhdHRyaWJ1dGVzXHJcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVVJMIHBsYXlhYmlsaXR5XHJcbiAgICovXHJcblxyXG4gIHRoaXMuY2FuUGxheUxpbmsgPSBmdW5jdGlvbihvTGluaykge1xyXG5cclxuICAgIGlmIChvTGluay50eXBlICE9PSBfdW5kZWZpbmVkICYmIG9MaW5rLnR5cGUpIHtcclxuICAgICAgaWYgKHNtMi5jYW5QbGF5TUlNRShvTGluay50eXBlKSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNtMi5jYW5QbGF5VVJMKG9MaW5rLmhyZWYpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgYSBTTVNvdW5kIG9iamVjdCBieSBJRC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzSUQgVGhlIElEIG9mIHRoZSBzb3VuZFxyXG4gICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAqL1xyXG5cclxuICB0aGlzLmdldFNvdW5kQnlJZCA9IGZ1bmN0aW9uKHNJRCwgX3N1cHByZXNzRGVidWcpIHtcclxuXHJcbiAgICBpZiAoIXNJRCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gc20yLnNvdW5kc1tzSURdO1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKCFyZXN1bHQgJiYgIV9zdXBwcmVzc0RlYnVnKSB7XHJcbiAgICAgIHNtMi5fd0Qoc20gKyAnLmdldFNvdW5kQnlJZCgpOiBTb3VuZCBcIicgKyBzSUQgKyAnXCIgbm90IGZvdW5kLicsIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gPC9kPlxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFF1ZXVlcyBhIGNhbGxiYWNrIGZvciBleGVjdXRpb24gd2hlbiBTb3VuZE1hbmFnZXIgaGFzIHN1Y2Nlc3NmdWxseSBpbml0aWFsaXplZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9NZXRob2QgVGhlIGNhbGxiYWNrIG1ldGhvZCB0byBmaXJlXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9TY29wZSBPcHRpb25hbDogVGhlIHNjb3BlIHRvIGFwcGx5IHRvIHRoZSBjYWxsYmFja1xyXG4gICAqL1xyXG5cclxuICB0aGlzLm9ucmVhZHkgPSBmdW5jdGlvbihvTWV0aG9kLCBvU2NvcGUpIHtcclxuXHJcbiAgICB2YXIgc1R5cGUgPSAnb25yZWFkeScsXHJcbiAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBvTWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgaWYgKGRpZEluaXQpIHtcclxuICAgICAgICBzbTIuX3dEKHN0cigncXVldWUnLCBzVHlwZSkpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIGlmICghb1Njb3BlKSB7XHJcbiAgICAgICAgb1Njb3BlID0gd2luZG93O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhZGRPbkV2ZW50KHNUeXBlLCBvTWV0aG9kLCBvU2NvcGUpO1xyXG4gICAgICBwcm9jZXNzT25FdmVudHMoKTtcclxuXHJcbiAgICAgIHJlc3VsdCA9IHRydWU7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIHRocm93IHN0cignbmVlZEZ1bmN0aW9uJywgc1R5cGUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBRdWV1ZXMgYSBjYWxsYmFjayBmb3IgZXhlY3V0aW9uIHdoZW4gU291bmRNYW5hZ2VyIGhhcyBmYWlsZWQgdG8gaW5pdGlhbGl6ZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9NZXRob2QgVGhlIGNhbGxiYWNrIG1ldGhvZCB0byBmaXJlXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9TY29wZSBPcHRpb25hbDogVGhlIHNjb3BlIHRvIGFwcGx5IHRvIHRoZSBjYWxsYmFja1xyXG4gICAqL1xyXG5cclxuICB0aGlzLm9udGltZW91dCA9IGZ1bmN0aW9uKG9NZXRob2QsIG9TY29wZSkge1xyXG5cclxuICAgIHZhciBzVHlwZSA9ICdvbnRpbWVvdXQnLFxyXG4gICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG5cclxuICAgIGlmICh0eXBlb2Ygb01ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuICAgICAgLy8gPGQ+XHJcbiAgICAgIGlmIChkaWRJbml0KSB7XHJcbiAgICAgICAgc20yLl93RChzdHIoJ3F1ZXVlJywgc1R5cGUpKTtcclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICBpZiAoIW9TY29wZSkge1xyXG4gICAgICAgIG9TY29wZSA9IHdpbmRvdztcclxuICAgICAgfVxyXG5cclxuICAgICAgYWRkT25FdmVudChzVHlwZSwgb01ldGhvZCwgb1Njb3BlKTtcclxuICAgICAgcHJvY2Vzc09uRXZlbnRzKHt0eXBlOnNUeXBlfSk7XHJcblxyXG4gICAgICByZXN1bHQgPSB0cnVlO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICB0aHJvdyBzdHIoJ25lZWRGdW5jdGlvbicsIHNUeXBlKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogV3JpdGVzIGNvbnNvbGUubG9nKCktc3R5bGUgZGVidWcgb3V0cHV0IHRvIGEgY29uc29sZSBvciBpbi1icm93c2VyIGVsZW1lbnQuXHJcbiAgICogQXBwbGllcyB3aGVuIGRlYnVnTW9kZSA9IHRydWVcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzVGV4dCBUaGUgY29uc29sZSBtZXNzYWdlXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG5UeXBlIE9wdGlvbmFsIGxvZyBsZXZlbCAobnVtYmVyKSwgb3Igb2JqZWN0LiBOdW1iZXIgY2FzZTogTG9nIHR5cGUvc3R5bGUgd2hlcmUgMCA9ICdpbmZvJywgMSA9ICd3YXJuJywgMiA9ICdlcnJvcicuIE9iamVjdCBjYXNlOiBPYmplY3QgdG8gYmUgZHVtcGVkLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLl93cml0ZURlYnVnID0gZnVuY3Rpb24oc1RleHQsIHNUeXBlT3JPYmplY3QpIHtcclxuXHJcbiAgICAvLyBwc2V1ZG8tcHJpdmF0ZSBjb25zb2xlLmxvZygpLXN0eWxlIG91dHB1dFxyXG4gICAgLy8gPGQ+XHJcblxyXG4gICAgdmFyIHNESUQgPSAnc291bmRtYW5hZ2VyLWRlYnVnJywgbywgb0l0ZW07XHJcblxyXG4gICAgaWYgKCFzbTIuZGVidWdNb2RlKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFzQ29uc29sZSAmJiBzbTIudXNlQ29uc29sZSkge1xyXG4gICAgICBpZiAoc1R5cGVPck9iamVjdCAmJiB0eXBlb2Ygc1R5cGVPck9iamVjdCA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAvLyBvYmplY3QgcGFzc2VkOyBkdW1wIHRvIGNvbnNvbGUuXHJcbiAgICAgICAgY29uc29sZS5sb2coc1RleHQsIHNUeXBlT3JPYmplY3QpO1xyXG4gICAgICB9IGVsc2UgaWYgKGRlYnVnTGV2ZWxzW3NUeXBlT3JPYmplY3RdICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgY29uc29sZVtkZWJ1Z0xldmVsc1tzVHlwZU9yT2JqZWN0XV0oc1RleHQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNUZXh0KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoc20yLmNvbnNvbGVPbmx5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvID0gaWQoc0RJRCk7XHJcblxyXG4gICAgaWYgKCFvKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBvSXRlbSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbiAgICBpZiAoKyt3ZENvdW50ICUgMiA9PT0gMCkge1xyXG4gICAgICBvSXRlbS5jbGFzc05hbWUgPSAnc20yLWFsdCc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNUeXBlT3JPYmplY3QgPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgc1R5cGVPck9iamVjdCA9IDA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzVHlwZU9yT2JqZWN0ID0gcGFyc2VJbnQoc1R5cGVPck9iamVjdCwgMTApO1xyXG4gICAgfVxyXG5cclxuICAgIG9JdGVtLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShzVGV4dCkpO1xyXG5cclxuICAgIGlmIChzVHlwZU9yT2JqZWN0KSB7XHJcbiAgICAgIGlmIChzVHlwZU9yT2JqZWN0ID49IDIpIHtcclxuICAgICAgICBvSXRlbS5zdHlsZS5mb250V2VpZ2h0ID0gJ2JvbGQnO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzVHlwZU9yT2JqZWN0ID09PSAzKSB7XHJcbiAgICAgICAgb0l0ZW0uc3R5bGUuY29sb3IgPSAnI2ZmMzMzMyc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyB0b3AtdG8tYm90dG9tXHJcbiAgICAvLyBvLmFwcGVuZENoaWxkKG9JdGVtKTtcclxuXHJcbiAgICAvLyBib3R0b20tdG8tdG9wXHJcbiAgICBvLmluc2VydEJlZm9yZShvSXRlbSwgby5maXJzdENoaWxkKTtcclxuXHJcbiAgICBvID0gbnVsbDtcclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gPGQ+XHJcbiAgLy8gbGFzdC1yZXNvcnQgZGVidWdnaW5nIG9wdGlvblxyXG4gIGlmICh3bC5pbmRleE9mKCdzbTItZGVidWc9YWxlcnQnKSAhPT0gLTEpIHtcclxuICAgIHRoaXMuX3dyaXRlRGVidWcgPSBmdW5jdGlvbihzVGV4dCkge1xyXG4gICAgICB3aW5kb3cuYWxlcnQoc1RleHQpO1xyXG4gICAgfTtcclxuICB9XHJcbiAgLy8gPC9kPlxyXG5cclxuICAvLyBhbGlhc1xyXG4gIHRoaXMuX3dEID0gdGhpcy5fd3JpdGVEZWJ1ZztcclxuXHJcbiAgLyoqXHJcbiAgICogUHJvdmlkZXMgZGVidWcgLyBzdGF0ZSBpbmZvcm1hdGlvbiBvbiBhbGwgU01Tb3VuZCBvYmplY3RzLlxyXG4gICAqL1xyXG5cclxuICB0aGlzLl9kZWJ1ZyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgdmFyIGksIGo7XHJcbiAgICBfd0RTKCdjdXJyZW50T2JqJywgMSk7XHJcblxyXG4gICAgZm9yIChpID0gMCwgaiA9IHNtMi5zb3VuZElEcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcclxuICAgICAgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLl9kZWJ1ZygpO1xyXG4gICAgfVxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBSZXN0YXJ0cyBhbmQgcmUtaW5pdGlhbGl6ZXMgdGhlIFNvdW5kTWFuYWdlciBpbnN0YW5jZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVzZXRFdmVudHMgT3B0aW9uYWw6IFdoZW4gdHJ1ZSwgcmVtb3ZlcyBhbGwgcmVnaXN0ZXJlZCBvbnJlYWR5IGFuZCBvbnRpbWVvdXQgZXZlbnQgY2FsbGJhY2tzLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZXhjbHVkZUluaXQgT3B0aW9uczogV2hlbiB0cnVlLCBkb2VzIG5vdCBjYWxsIGJlZ2luRGVsYXllZEluaXQoKSAod2hpY2ggd291bGQgcmVzdGFydCBTTTIpLlxyXG4gICAqIEByZXR1cm4ge29iamVjdH0gc291bmRNYW5hZ2VyIFRoZSBzb3VuZE1hbmFnZXIgaW5zdGFuY2UuXHJcbiAgICovXHJcblxyXG4gIHRoaXMucmVib290ID0gZnVuY3Rpb24ocmVzZXRFdmVudHMsIGV4Y2x1ZGVJbml0KSB7XHJcblxyXG4gICAgLy8gcmVzZXQgc29tZSAob3IgYWxsKSBzdGF0ZSwgYW5kIHJlLWluaXQgdW5sZXNzIG90aGVyd2lzZSBzcGVjaWZpZWQuXHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBpZiAoc20yLnNvdW5kSURzLmxlbmd0aCkge1xyXG4gICAgICBzbTIuX3dEKCdEZXN0cm95aW5nICcgKyBzbTIuc291bmRJRHMubGVuZ3RoICsgJyBTTVNvdW5kIG9iamVjdCcgKyAoc20yLnNvdW5kSURzLmxlbmd0aCAhPT0gMSA/ICdzJyA6ICcnKSArICcuLi4nKTtcclxuICAgIH1cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICB2YXIgaSwgaiwgaztcclxuXHJcbiAgICBmb3IgKGkgPSBzbTIuc291bmRJRHMubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIHNtMi5zb3VuZHNbc20yLnNvdW5kSURzW2ldXS5kZXN0cnVjdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRyYXNoIHplIGZsYXNoIChyZW1vdmUgZnJvbSB0aGUgRE9NKVxyXG5cclxuICAgIGlmIChmbGFzaCkge1xyXG5cclxuICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgaWYgKGlzSUUpIHtcclxuICAgICAgICAgIG9SZW1vdmVkSFRNTCA9IGZsYXNoLmlubmVySFRNTDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9SZW1vdmVkID0gZmxhc2gucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmbGFzaCk7XHJcblxyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGZhaWxlZD8gTWF5IGJlIGR1ZSB0byBmbGFzaCBibG9ja2VycyBzaWxlbnRseSByZW1vdmluZyB0aGUgU1dGIG9iamVjdC9lbWJlZCBub2RlIGZyb20gdGhlIERPTS4gV2FybiBhbmQgY29udGludWUuXHJcblxyXG4gICAgICAgIF93RFMoJ2JhZFJlbW92ZScsIDIpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyBhY3R1YWxseSwgZm9yY2UgcmVjcmVhdGUgb2YgbW92aWUuXHJcblxyXG4gICAgb1JlbW92ZWRIVE1MID0gb1JlbW92ZWQgPSBuZWVkc0ZsYXNoID0gZmxhc2ggPSBudWxsO1xyXG5cclxuICAgIHNtMi5lbmFibGVkID0gZGlkRENMb2FkZWQgPSBkaWRJbml0ID0gd2FpdGluZ0ZvckVJID0gaW5pdFBlbmRpbmcgPSBkaWRBcHBlbmQgPSBhcHBlbmRTdWNjZXNzID0gZGlzYWJsZWQgPSB1c2VHbG9iYWxIVE1MNUF1ZGlvID0gc20yLnN3ZkxvYWRlZCA9IGZhbHNlO1xyXG5cclxuICAgIHNtMi5zb3VuZElEcyA9IFtdO1xyXG4gICAgc20yLnNvdW5kcyA9IHt9O1xyXG5cclxuICAgIGlkQ291bnRlciA9IDA7XHJcblxyXG4gICAgaWYgKCFyZXNldEV2ZW50cykge1xyXG4gICAgICAvLyByZXNldCBjYWxsYmFja3MgZm9yIG9ucmVhZHksIG9udGltZW91dCBldGMuIHNvIHRoYXQgdGhleSB3aWxsIGZpcmUgYWdhaW4gb24gcmUtaW5pdFxyXG4gICAgICBmb3IgKGkgaW4gb25fcXVldWUpIHtcclxuICAgICAgICBpZiAob25fcXVldWUuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBvbl9xdWV1ZVtpXS5sZW5ndGg7IGogPCBrOyBqKyspIHtcclxuICAgICAgICAgICAgb25fcXVldWVbaV1bal0uZmlyZWQgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHJlbW92ZSBhbGwgY2FsbGJhY2tzIGVudGlyZWx5XHJcbiAgICAgIG9uX3F1ZXVlID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICBpZiAoIWV4Y2x1ZGVJbml0KSB7XHJcbiAgICAgIHNtMi5fd0Qoc20gKyAnOiBSZWJvb3RpbmcuLi4nKTtcclxuICAgIH1cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICAvLyByZXNldCBIVE1MNSBhbmQgZmxhc2ggY2FuUGxheSB0ZXN0IHJlc3VsdHNcclxuXHJcbiAgICBzbTIuaHRtbDUgPSB7XHJcbiAgICAgICd1c2luZ0ZsYXNoJzogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICBzbTIuZmxhc2ggPSB7fTtcclxuXHJcbiAgICAvLyByZXNldCBkZXZpY2Utc3BlY2lmaWMgSFRNTC9mbGFzaCBtb2RlIHN3aXRjaGVzXHJcblxyXG4gICAgc20yLmh0bWw1T25seSA9IGZhbHNlO1xyXG4gICAgc20yLmlnbm9yZUZsYXNoID0gZmFsc2U7XHJcblxyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBwcmVJbml0KCk7XHJcblxyXG4gICAgICAvLyBieSBkZWZhdWx0LCByZS1pbml0XHJcblxyXG4gICAgICBpZiAoIWV4Y2x1ZGVJbml0KSB7XHJcbiAgICAgICAgc20yLmJlZ2luRGVsYXllZEluaXQoKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0sIDIwKTtcclxuXHJcbiAgICByZXR1cm4gc20yO1xyXG5cclxuICB9O1xyXG5cclxuICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaHV0cyBkb3duIGFuZCByZXN0b3JlcyB0aGUgU291bmRNYW5hZ2VyIGluc3RhbmNlIHRvIGl0cyBvcmlnaW5hbCBsb2FkZWQgc3RhdGUsIHdpdGhvdXQgYW4gZXhwbGljaXQgcmVib290LiBBbGwgb25yZWFkeS9vbnRpbWVvdXQgaGFuZGxlcnMgYXJlIHJlbW92ZWQuXHJcbiAgICAgKiBBZnRlciB0aGlzIGNhbGwsIFNNMiBtYXkgYmUgcmUtaW5pdGlhbGl6ZWQgdmlhIHNvdW5kTWFuYWdlci5iZWdpbkRlbGF5ZWRJbml0KCkuXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IHNvdW5kTWFuYWdlciBUaGUgc291bmRNYW5hZ2VyIGluc3RhbmNlLlxyXG4gICAgICovXHJcblxyXG4gICAgX3dEUygncmVzZXQnKTtcclxuICAgIHJldHVybiBzbTIucmVib290KHRydWUsIHRydWUpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBVbmRvY3VtZW50ZWQ6IERldGVybWluZXMgdGhlIFNNMiBmbGFzaCBtb3ZpZSdzIGxvYWQgcHJvZ3Jlc3MuXHJcbiAgICpcclxuICAgKiBAcmV0dXJuIHtudW1iZXIgb3IgbnVsbH0gUGVyY2VudCBsb2FkZWQsIG9yIGlmIGludmFsaWQvdW5zdXBwb3J0ZWQsIG51bGwuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuZ2V0TW92aWVQZXJjZW50ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnRlcmVzdGluZyBzeW50YXggbm90ZXMuLi5cclxuICAgICAqIEZsYXNoL0V4dGVybmFsSW50ZXJmYWNlIChBY3RpdmVYL05QQVBJKSBicmlkZ2UgbWV0aG9kcyBhcmUgbm90IHR5cGVvZiBcImZ1bmN0aW9uXCIgbm9yIGluc3RhbmNlb2YgRnVuY3Rpb24sIGJ1dCBhcmUgc3RpbGwgdmFsaWQuXHJcbiAgICAgKiBBZGRpdGlvbmFsbHksIEpTTGludCBkaXNsaWtlcyAoJ1BlcmNlbnRMb2FkZWQnIGluIGZsYXNoKS1zdHlsZSBzeW50YXggYW5kIHJlY29tbWVuZHMgaGFzT3duUHJvcGVydHkoKSwgd2hpY2ggZG9lcyBub3Qgd29yayBpbiB0aGlzIGNhc2UuXHJcbiAgICAgKiBGdXJ0aGVybW9yZSwgdXNpbmcgKGZsYXNoICYmIGZsYXNoLlBlcmNlbnRMb2FkZWQpIGNhdXNlcyBJRSB0byB0aHJvdyBcIm9iamVjdCBkb2Vzbid0IHN1cHBvcnQgdGhpcyBwcm9wZXJ0eSBvciBtZXRob2RcIi5cclxuICAgICAqIFRodXMsICdpbicgc3ludGF4IG11c3QgYmUgdXNlZC5cclxuICAgICAqL1xyXG5cclxuICAgIHJldHVybiAoZmxhc2ggJiYgJ1BlcmNlbnRMb2FkZWQnIGluIGZsYXNoID8gZmxhc2guUGVyY2VudExvYWRlZCgpIDogbnVsbCk7IC8vIFllcywgSlNMaW50LiBTZWUgbmVhcmJ5IGNvbW1lbnQgaW4gc291cmNlIGZvciBleHBsYW5hdGlvbi5cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkaXRpb25hbCBoZWxwZXIgZm9yIG1hbnVhbGx5IGludm9raW5nIFNNMidzIGluaXQgcHJvY2VzcyBhZnRlciBET00gUmVhZHkgLyB3aW5kb3cub25sb2FkKCkuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuYmVnaW5EZWxheWVkSW5pdCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHdpbmRvd0xvYWRlZCA9IHRydWU7XHJcbiAgICBkb21Db250ZW50TG9hZGVkKCk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmIChpbml0UGVuZGluZykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY3JlYXRlTW92aWUoKTtcclxuICAgICAgaW5pdE1vdmllKCk7XHJcbiAgICAgIGluaXRQZW5kaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH0sIDIwKTtcclxuXHJcbiAgICBkZWxheVdhaXRGb3JFSSgpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgU291bmRNYW5hZ2VyIGluc3RhbmNlIGFuZCBhbGwgU01Tb3VuZCBpbnN0YW5jZXMuXHJcbiAgICovXHJcblxyXG4gIHRoaXMuZGVzdHJ1Y3QgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBzbTIuX3dEKHNtICsgJy5kZXN0cnVjdCgpJyk7XHJcbiAgICBzbTIuZGlzYWJsZSh0cnVlKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogU01Tb3VuZCgpIChzb3VuZCBvYmplY3QpIGNvbnN0cnVjdG9yXHJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb09wdGlvbnMgU291bmQgb3B0aW9ucyAoaWQgYW5kIHVybCBhcmUgcmVxdWlyZWQgYXR0cmlidXRlcylcclxuICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgbmV3IFNNU291bmQgb2JqZWN0XHJcbiAgICovXHJcblxyXG4gIFNNU291bmQgPSBmdW5jdGlvbihvT3B0aW9ucykge1xyXG5cclxuICAgIHZhciBzID0gdGhpcywgcmVzZXRQcm9wZXJ0aWVzLCBhZGRfaHRtbDVfZXZlbnRzLCByZW1vdmVfaHRtbDVfZXZlbnRzLCBzdG9wX2h0bWw1X3RpbWVyLCBzdGFydF9odG1sNV90aW1lciwgYXR0YWNoT25Qb3NpdGlvbiwgb25wbGF5X2NhbGxlZCA9IGZhbHNlLCBvblBvc2l0aW9uSXRlbXMgPSBbXSwgb25Qb3NpdGlvbkZpcmVkID0gMCwgZGV0YWNoT25Qb3NpdGlvbiwgYXBwbHlGcm9tVG8sIGxhc3RVUkwgPSBudWxsLCBsYXN0SFRNTDVTdGF0ZSwgdXJsT21pdHRlZDtcclxuXHJcbiAgICBsYXN0SFRNTDVTdGF0ZSA9IHtcclxuICAgICAgLy8gdHJhY2tzIGR1cmF0aW9uICsgcG9zaXRpb24gKHRpbWUpXHJcbiAgICAgIGR1cmF0aW9uOiBudWxsLFxyXG4gICAgICB0aW1lOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaWQgPSBvT3B0aW9ucy5pZDtcclxuXHJcbiAgICAvLyBsZWdhY3lcclxuICAgIHRoaXMuc0lEID0gdGhpcy5pZDtcclxuXHJcbiAgICB0aGlzLnVybCA9IG9PcHRpb25zLnVybDtcclxuICAgIHRoaXMub3B0aW9ucyA9IG1peGluKG9PcHRpb25zKTtcclxuXHJcbiAgICAvLyBwZXItcGxheS1pbnN0YW5jZS1zcGVjaWZpYyBvcHRpb25zXHJcbiAgICB0aGlzLmluc3RhbmNlT3B0aW9ucyA9IHRoaXMub3B0aW9ucztcclxuXHJcbiAgICAvLyBzaG9ydCBhbGlhc1xyXG4gICAgdGhpcy5faU8gPSB0aGlzLmluc3RhbmNlT3B0aW9ucztcclxuXHJcbiAgICAvLyBhc3NpZ24gcHJvcGVydHkgZGVmYXVsdHNcclxuICAgIHRoaXMucGFuID0gdGhpcy5vcHRpb25zLnBhbjtcclxuICAgIHRoaXMudm9sdW1lID0gdGhpcy5vcHRpb25zLnZvbHVtZTtcclxuXHJcbiAgICAvLyB3aGV0aGVyIG9yIG5vdCB0aGlzIG9iamVjdCBpcyB1c2luZyBIVE1MNVxyXG4gICAgdGhpcy5pc0hUTUw1ID0gZmFsc2U7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgSFRNTDUgQXVkaW8oKSBvYmplY3QgcmVmZXJlbmNlXHJcbiAgICB0aGlzLl9hID0gbnVsbDtcclxuXHJcbiAgICAvLyBmb3IgZmxhc2ggOCBzcGVjaWFsLWNhc2UgY3JlYXRlU291bmQoKSB3aXRob3V0IHVybCwgZm9sbG93ZWQgYnkgbG9hZC9wbGF5IHdpdGggdXJsIGNhc2VcclxuICAgIHVybE9taXR0ZWQgPSAodGhpcy51cmwgPyBmYWxzZSA6IHRydWUpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU01Tb3VuZCgpIHB1YmxpYyBtZXRob2RzXHJcbiAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuaWQzID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXcml0ZXMgU01Tb3VuZCBvYmplY3QgcGFyYW1ldGVycyB0byBkZWJ1ZyBjb25zb2xlXHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLl9kZWJ1ZyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgLy8gPGQ+XHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IE1lcmdlZCBvcHRpb25zOicsIHMub3B0aW9ucyk7XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmVnaW5zIGxvYWRpbmcgYSBzb3VuZCBwZXIgaXRzICp1cmwqLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvT3B0aW9ucyBPcHRpb25hbDogU291bmQgb3B0aW9uc1xyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbihvT3B0aW9ucykge1xyXG5cclxuICAgICAgdmFyIG9Tb3VuZCA9IG51bGwsIGluc3RhbmNlT3B0aW9ucztcclxuXHJcbiAgICAgIGlmIChvT3B0aW9ucyAhPT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIHMuX2lPID0gbWl4aW4ob09wdGlvbnMsIHMub3B0aW9ucyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb09wdGlvbnMgPSBzLm9wdGlvbnM7XHJcbiAgICAgICAgcy5faU8gPSBvT3B0aW9ucztcclxuICAgICAgICBpZiAobGFzdFVSTCAmJiBsYXN0VVJMICE9PSBzLnVybCkge1xyXG4gICAgICAgICAgX3dEUygnbWFuVVJMJyk7XHJcbiAgICAgICAgICBzLl9pTy51cmwgPSBzLnVybDtcclxuICAgICAgICAgIHMudXJsID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghcy5faU8udXJsKSB7XHJcbiAgICAgICAgcy5faU8udXJsID0gcy51cmw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuX2lPLnVybCA9IHBhcnNlVVJMKHMuX2lPLnVybCk7XHJcblxyXG4gICAgICAvLyBlbnN1cmUgd2UncmUgaW4gc3luY1xyXG4gICAgICBzLmluc3RhbmNlT3B0aW9ucyA9IHMuX2lPO1xyXG5cclxuICAgICAgLy8gbG9jYWwgc2hvcnRjdXRcclxuICAgICAgaW5zdGFuY2VPcHRpb25zID0gcy5faU87XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBsb2FkICgnICsgaW5zdGFuY2VPcHRpb25zLnVybCArICcpJyk7XHJcblxyXG4gICAgICBpZiAoIWluc3RhbmNlT3B0aW9ucy51cmwgJiYgIXMudXJsKSB7XHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogbG9hZCgpOiB1cmwgaXMgdW5hc3NpZ25lZC4gRXhpdGluZy4nLCAyKTtcclxuICAgICAgICByZXR1cm4gcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gPGQ+XHJcbiAgICAgIGlmICghcy5pc0hUTUw1ICYmIGZWID09PSA4ICYmICFzLnVybCAmJiAhaW5zdGFuY2VPcHRpb25zLmF1dG9QbGF5KSB7XHJcbiAgICAgICAgLy8gZmxhc2ggOCBsb2FkKCkgLT4gcGxheSgpIHdvbid0IHdvcmsgYmVmb3JlIG9ubG9hZCBoYXMgZmlyZWQuXHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogRmxhc2ggOCBsb2FkKCkgbGltaXRhdGlvbjogV2FpdCBmb3Igb25sb2FkKCkgYmVmb3JlIGNhbGxpbmcgcGxheSgpLicsIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMudXJsID09PSBzLnVybCAmJiBzLnJlYWR5U3RhdGUgIT09IDAgJiYgcy5yZWFkeVN0YXRlICE9PSAyKSB7XHJcbiAgICAgICAgX3dEUygnb25VUkwnLCAxKTtcclxuICAgICAgICAvLyBpZiBsb2FkZWQgYW5kIGFuIG9ubG9hZCgpIGV4aXN0cywgZmlyZSBpbW1lZGlhdGVseS5cclxuICAgICAgICBpZiAocy5yZWFkeVN0YXRlID09PSAzICYmIGluc3RhbmNlT3B0aW9ucy5vbmxvYWQpIHtcclxuICAgICAgICAgIC8vIGFzc3VtZSBzdWNjZXNzIGJhc2VkIG9uIHRydXRoeSBkdXJhdGlvbi5cclxuICAgICAgICAgIHdyYXBDYWxsYmFjayhzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaW5zdGFuY2VPcHRpb25zLm9ubG9hZC5hcHBseShzLCBbKCEhcy5kdXJhdGlvbildKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVzZXQgYSBmZXcgc3RhdGUgcHJvcGVydGllc1xyXG5cclxuICAgICAgcy5sb2FkZWQgPSBmYWxzZTtcclxuICAgICAgcy5yZWFkeVN0YXRlID0gMTtcclxuICAgICAgcy5wbGF5U3RhdGUgPSAwO1xyXG4gICAgICBzLmlkMyA9IHt9O1xyXG5cclxuICAgICAgLy8gVE9ETzogSWYgc3dpdGNoaW5nIGZyb20gSFRNTDUgLT4gZmxhc2ggKG9yIHZpY2UgdmVyc2EpLCBzdG9wIGN1cnJlbnRseS1wbGF5aW5nIGF1ZGlvLlxyXG5cclxuICAgICAgaWYgKGh0bWw1T0soaW5zdGFuY2VPcHRpb25zKSkge1xyXG5cclxuICAgICAgICBvU291bmQgPSBzLl9zZXR1cF9odG1sNShpbnN0YW5jZU9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpZiAoIW9Tb3VuZC5fY2FsbGVkX2xvYWQpIHtcclxuXHJcbiAgICAgICAgICBzLl9odG1sNV9jYW5wbGF5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogcmV2aWV3IGNhbGxlZF9sb2FkIC8gaHRtbDVfY2FucGxheSBsb2dpY1xyXG5cclxuICAgICAgICAgIC8vIGlmIHVybCBwcm92aWRlZCBkaXJlY3RseSB0byBsb2FkKCksIGFzc2lnbiBpdCBoZXJlLlxyXG5cclxuICAgICAgICAgIGlmIChzLnVybCAhPT0gaW5zdGFuY2VPcHRpb25zLnVybCkge1xyXG5cclxuICAgICAgICAgICAgc20yLl93RChfd0RTKCdtYW5VUkwnKSArICc6ICcgKyBpbnN0YW5jZU9wdGlvbnMudXJsKTtcclxuXHJcbiAgICAgICAgICAgIHMuX2Euc3JjID0gaW5zdGFuY2VPcHRpb25zLnVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlldyAvIHJlLWFwcGx5IGFsbCByZWxldmFudCBvcHRpb25zICh2b2x1bWUsIGxvb3AsIG9ucG9zaXRpb24gZXRjLilcclxuXHJcbiAgICAgICAgICAgIC8vIHJlc2V0IHBvc2l0aW9uIGZvciBuZXcgVVJMXHJcbiAgICAgICAgICAgIHMuc2V0UG9zaXRpb24oMCk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIGdpdmVuIGV4cGxpY2l0IGxvYWQgY2FsbCwgdHJ5IHRvIHByZWxvYWQuXHJcblxyXG4gICAgICAgICAgLy8gZWFybHkgSFRNTDUgaW1wbGVtZW50YXRpb24gKG5vbi1zdGFuZGFyZClcclxuICAgICAgICAgIHMuX2EuYXV0b2J1ZmZlciA9ICdhdXRvJztcclxuXHJcbiAgICAgICAgICAvLyBzdGFuZGFyZCBwcm9wZXJ0eSwgdmFsdWVzOiBub25lIC8gbWV0YWRhdGEgLyBhdXRvXHJcbiAgICAgICAgICAvLyByZWZlcmVuY2U6IGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9mZjk3NDc1OSUyOHY9dnMuODUlMjkuYXNweFxyXG4gICAgICAgICAgcy5fYS5wcmVsb2FkID0gJ2F1dG8nO1xyXG5cclxuICAgICAgICAgIHMuX2EuX2NhbGxlZF9sb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBJZ25vcmluZyByZXF1ZXN0IHRvIGxvYWQgYWdhaW4nKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgaWYgKHNtMi5odG1sNU9ubHkpIHtcclxuICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IE5vIGZsYXNoIHN1cHBvcnQuIEV4aXRpbmcuJyk7XHJcbiAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzLl9pTy51cmwgJiYgcy5faU8udXJsLm1hdGNoKC9kYXRhXFw6L2kpKSB7XHJcbiAgICAgICAgICAvLyBkYXRhOiBVUklzIG5vdCBzdXBwb3J0ZWQgYnkgRmxhc2gsIGVpdGhlci5cclxuICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IGRhdGE6IFVSSXMgbm90IHN1cHBvcnRlZCB2aWEgRmxhc2guIEV4aXRpbmcuJyk7XHJcbiAgICAgICAgICByZXR1cm4gcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBzLmlzSFRNTDUgPSBmYWxzZTtcclxuICAgICAgICAgIHMuX2lPID0gcG9saWN5Rml4KGxvb3BGaXgoaW5zdGFuY2VPcHRpb25zKSk7XHJcbiAgICAgICAgICAvLyByZS1hc3NpZ24gbG9jYWwgc2hvcnRjdXRcclxuICAgICAgICAgIGluc3RhbmNlT3B0aW9ucyA9IHMuX2lPO1xyXG4gICAgICAgICAgaWYgKGZWID09PSA4KSB7XHJcbiAgICAgICAgICAgIGZsYXNoLl9sb2FkKHMuaWQsIGluc3RhbmNlT3B0aW9ucy51cmwsIGluc3RhbmNlT3B0aW9ucy5zdHJlYW0sIGluc3RhbmNlT3B0aW9ucy5hdXRvUGxheSwgaW5zdGFuY2VPcHRpb25zLnVzZVBvbGljeUZpbGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmxhc2guX2xvYWQocy5pZCwgaW5zdGFuY2VPcHRpb25zLnVybCwgISEoaW5zdGFuY2VPcHRpb25zLnN0cmVhbSksICEhKGluc3RhbmNlT3B0aW9ucy5hdXRvUGxheSksIGluc3RhbmNlT3B0aW9ucy5sb29wc3x8MSwgISEoaW5zdGFuY2VPcHRpb25zLmF1dG9Mb2FkKSwgaW5zdGFuY2VPcHRpb25zLnVzZVBvbGljeUZpbGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgX3dEUygnc21FcnJvcicsIDIpO1xyXG4gICAgICAgICAgZGVidWdUUygnb25sb2FkJywgZmFsc2UpO1xyXG4gICAgICAgICAgY2F0Y2hFcnJvcih7dHlwZTonU01TT1VORF9MT0FEX0pTX0VYQ0VQVElPTicsIGZhdGFsOnRydWV9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhZnRlciBhbGwgb2YgdGhpcywgZW5zdXJlIHNvdW5kIHVybCBpcyB1cCB0byBkYXRlLlxyXG4gICAgICBzLnVybCA9IGluc3RhbmNlT3B0aW9ucy51cmw7XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5sb2FkcyBhIHNvdW5kLCBjYW5jZWxpbmcgYW55IG9wZW4gSFRUUCByZXF1ZXN0cy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMudW5sb2FkID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAvLyBGbGFzaCA4L0FTMiBjYW4ndCBcImNsb3NlXCIgYSBzdHJlYW0gLSBmYWtlIGl0IGJ5IGxvYWRpbmcgYW4gZW1wdHkgVVJMXHJcbiAgICAgIC8vIEZsYXNoIDkvQVMzOiBDbG9zZSBzdHJlYW0sIHByZXZlbnRpbmcgZnVydGhlciBsb2FkXHJcbiAgICAgIC8vIEhUTUw1OiBNb3N0IFVBcyB3aWxsIHVzZSBlbXB0eSBVUkxcclxuXHJcbiAgICAgIGlmIChzLnJlYWR5U3RhdGUgIT09IDApIHtcclxuXHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogdW5sb2FkKCknKTtcclxuXHJcbiAgICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoZlYgPT09IDgpIHtcclxuICAgICAgICAgICAgZmxhc2guX3VubG9hZChzLmlkLCBlbXB0eVVSTCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmbGFzaC5fdW5sb2FkKHMuaWQpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHN0b3BfaHRtbDVfdGltZXIoKTtcclxuXHJcbiAgICAgICAgICBpZiAocy5fYSkge1xyXG5cclxuICAgICAgICAgICAgcy5fYS5wYXVzZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8gdXBkYXRlIGVtcHR5IFVSTCwgdG9vXHJcbiAgICAgICAgICAgIGxhc3RVUkwgPSBodG1sNVVubG9hZChzLl9hKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVzZXQgbG9hZC9zdGF0dXMgZmxhZ3NcclxuICAgICAgICByZXNldFByb3BlcnRpZXMoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmxvYWRzIGFuZCBkZXN0cm95cyBhIHNvdW5kLlxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5kZXN0cnVjdCA9IGZ1bmN0aW9uKF9iRnJvbVNNKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBEZXN0cnVjdCcpO1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgLy8ga2lsbCBzb3VuZCB3aXRoaW4gRmxhc2hcclxuICAgICAgICAvLyBEaXNhYmxlIHRoZSBvbmZhaWx1cmUgaGFuZGxlclxyXG4gICAgICAgIHMuX2lPLm9uZmFpbHVyZSA9IG51bGw7XHJcbiAgICAgICAgZmxhc2guX2Rlc3Ryb3lTb3VuZChzLmlkKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIHN0b3BfaHRtbDVfdGltZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHMuX2EpIHtcclxuICAgICAgICAgIHMuX2EucGF1c2UoKTtcclxuICAgICAgICAgIGh0bWw1VW5sb2FkKHMuX2EpO1xyXG4gICAgICAgICAgaWYgKCF1c2VHbG9iYWxIVE1MNUF1ZGlvKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZV9odG1sNV9ldmVudHMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGJyZWFrIG9idmlvdXMgY2lyY3VsYXIgcmVmZXJlbmNlXHJcbiAgICAgICAgICBzLl9hLl9zID0gbnVsbDtcclxuICAgICAgICAgIHMuX2EgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghX2JGcm9tU00pIHtcclxuICAgICAgICAvLyBlbnN1cmUgZGVsZXRpb24gZnJvbSBjb250cm9sbGVyXHJcbiAgICAgICAgc20yLmRlc3Ryb3lTb3VuZChzLmlkLCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCZWdpbnMgcGxheWluZyBhIHNvdW5kLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvT3B0aW9ucyBPcHRpb25hbDogU291bmQgb3B0aW9uc1xyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnBsYXkgPSBmdW5jdGlvbihvT3B0aW9ucywgX3VwZGF0ZVBsYXlTdGF0ZSkge1xyXG5cclxuICAgICAgdmFyIGZOLCBhbGxvd011bHRpLCBhLCBvbnJlYWR5LFxyXG4gICAgICAgICAgYXVkaW9DbG9uZSwgb25lbmRlZCwgb25jYW5wbGF5LFxyXG4gICAgICAgICAgc3RhcnRPSyA9IHRydWUsXHJcbiAgICAgICAgICBleGl0ID0gbnVsbDtcclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBmTiA9IHMuaWQgKyAnOiBwbGF5KCk6ICc7XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIC8vIGRlZmF1bHQgdG8gdHJ1ZVxyXG4gICAgICBfdXBkYXRlUGxheVN0YXRlID0gKF91cGRhdGVQbGF5U3RhdGUgPT09IF91bmRlZmluZWQgPyB0cnVlIDogX3VwZGF0ZVBsYXlTdGF0ZSk7XHJcblxyXG4gICAgICBpZiAoIW9PcHRpb25zKSB7XHJcbiAgICAgICAgb09wdGlvbnMgPSB7fTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZmlyc3QsIHVzZSBsb2NhbCBVUkwgKGlmIHNwZWNpZmllZClcclxuICAgICAgaWYgKHMudXJsKSB7XHJcbiAgICAgICAgcy5faU8udXJsID0gcy51cmw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIG1peCBpbiBhbnkgb3B0aW9ucyBkZWZpbmVkIGF0IGNyZWF0ZVNvdW5kKClcclxuICAgICAgcy5faU8gPSBtaXhpbihzLl9pTywgcy5vcHRpb25zKTtcclxuXHJcbiAgICAgIC8vIG1peCBpbiBhbnkgb3B0aW9ucyBzcGVjaWZpYyB0byB0aGlzIG1ldGhvZFxyXG4gICAgICBzLl9pTyA9IG1peGluKG9PcHRpb25zLCBzLl9pTyk7XHJcblxyXG4gICAgICBzLl9pTy51cmwgPSBwYXJzZVVSTChzLl9pTy51cmwpO1xyXG5cclxuICAgICAgcy5pbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuXHJcbiAgICAgIC8vIFJUTVAtb25seVxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSAmJiBzLl9pTy5zZXJ2ZXJVUkwgJiYgIXMuY29ubmVjdGVkKSB7XHJcbiAgICAgICAgaWYgKCFzLmdldEF1dG9QbGF5KCkpIHtcclxuICAgICAgICAgIHNtMi5fd0QoZk4gKycgTmV0c3RyZWFtIG5vdCBjb25uZWN0ZWQgeWV0IC0gc2V0dGluZyBhdXRvUGxheScpO1xyXG4gICAgICAgICAgcy5zZXRBdXRvUGxheSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGxheSB3aWxsIGJlIGNhbGxlZCBpbiBvbmNvbm5lY3QoKVxyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaHRtbDVPSyhzLl9pTykpIHtcclxuICAgICAgICBzLl9zZXR1cF9odG1sNShzLl9pTyk7XHJcbiAgICAgICAgc3RhcnRfaHRtbDVfdGltZXIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHMucGxheVN0YXRlID09PSAxICYmICFzLnBhdXNlZCkge1xyXG4gICAgICAgIGFsbG93TXVsdGkgPSBzLl9pTy5tdWx0aVNob3Q7XHJcbiAgICAgICAgaWYgKCFhbGxvd011bHRpKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgJ0FscmVhZHkgcGxheWluZyAob25lLXNob3QpJywgMSk7XHJcbiAgICAgICAgICBpZiAocy5pc0hUTUw1KSB7XHJcbiAgICAgICAgICAgIC8vIGdvIGJhY2sgdG8gb3JpZ2luYWwgcG9zaXRpb24uXHJcbiAgICAgICAgICAgIHMuc2V0UG9zaXRpb24ocy5faU8ucG9zaXRpb24pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZXhpdCA9IHM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNtMi5fd0QoZk4gKyAnQWxyZWFkeSBwbGF5aW5nIChtdWx0aS1zaG90KScsIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGV4aXQgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gZXhpdDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZWRnZSBjYXNlOiBwbGF5KCkgd2l0aCBleHBsaWNpdCBVUkwgcGFyYW1ldGVyXHJcbiAgICAgIGlmIChvT3B0aW9ucy51cmwgJiYgb09wdGlvbnMudXJsICE9PSBzLnVybCkge1xyXG5cclxuICAgICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIGNyZWF0ZVNvdW5kKCkgZm9sbG93ZWQgYnkgbG9hZCgpIC8gcGxheSgpIHdpdGggdXJsOyBhdm9pZCBkb3VibGUtbG9hZCBjYXNlLlxyXG4gICAgICAgIGlmICghcy5yZWFkeVN0YXRlICYmICFzLmlzSFRNTDUgJiYgZlYgPT09IDggJiYgdXJsT21pdHRlZCkge1xyXG5cclxuICAgICAgICAgIHVybE9taXR0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBsb2FkIHVzaW5nIG1lcmdlZCBvcHRpb25zXHJcbiAgICAgICAgICBzLmxvYWQocy5faU8pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXMubG9hZGVkKSB7XHJcblxyXG4gICAgICAgIGlmIChzLnJlYWR5U3RhdGUgPT09IDApIHtcclxuXHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgJ0F0dGVtcHRpbmcgdG8gbG9hZCcpO1xyXG5cclxuICAgICAgICAgIC8vIHRyeSB0byBnZXQgdGhpcyBzb3VuZCBwbGF5aW5nIEFTQVBcclxuICAgICAgICAgIGlmICghcy5pc0hUTUw1ICYmICFzbTIuaHRtbDVPbmx5KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBmbGFzaDogYXNzaWduIGRpcmVjdGx5IGJlY2F1c2Ugc2V0QXV0b1BsYXkoKSBpbmNyZW1lbnRzIHRoZSBpbnN0YW5jZUNvdW50XHJcbiAgICAgICAgICAgIHMuX2lPLmF1dG9QbGF5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgcy5sb2FkKHMuX2lPKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHMuaXNIVE1MNSkge1xyXG5cclxuICAgICAgICAgICAgLy8gaU9TIG5lZWRzIHRoaXMgd2hlbiByZWN5Y2xpbmcgc291bmRzLCBsb2FkaW5nIGEgbmV3IFVSTCBvbiBhbiBleGlzdGluZyBvYmplY3QuXHJcbiAgICAgICAgICAgIHMubG9hZChzLl9pTyk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIHNtMi5fd0QoZk4gKyAnVW5zdXBwb3J0ZWQgdHlwZS4gRXhpdGluZy4nKTtcclxuICAgICAgICAgICAgZXhpdCA9IHM7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEhUTUw1IGhhY2sgLSByZS1zZXQgaW5zdGFuY2VPcHRpb25zP1xyXG4gICAgICAgICAgcy5pbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChzLnJlYWR5U3RhdGUgPT09IDIpIHtcclxuXHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgJ0NvdWxkIG5vdCBsb2FkIC0gZXhpdGluZycsIDIpO1xyXG4gICAgICAgICAgZXhpdCA9IHM7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc20yLl93RChmTiArICdMb2FkaW5nIC0gYXR0ZW1wdGluZyB0byBwbGF5Li4uJyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIFwicGxheSgpXCJcclxuICAgICAgICBzbTIuX3dEKGZOLnN1YnN0cigwLCBmTi5sYXN0SW5kZXhPZignOicpKSk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZXhpdCAhPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBleGl0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSAmJiBmViA9PT0gOSAmJiBzLnBvc2l0aW9uID4gMCAmJiBzLnBvc2l0aW9uID09PSBzLmR1cmF0aW9uKSB7XHJcbiAgICAgICAgLy8gZmxhc2ggOSBuZWVkcyBhIHBvc2l0aW9uIHJlc2V0IGlmIHBsYXkoKSBpcyBjYWxsZWQgd2hpbGUgYXQgdGhlIGVuZCBvZiBhIHNvdW5kLlxyXG4gICAgICAgIHNtMi5fd0QoZk4gKyAnU291bmQgYXQgZW5kLCByZXNldHRpbmcgdG8gcG9zaXRpb246MCcpO1xyXG4gICAgICAgIG9PcHRpb25zLnBvc2l0aW9uID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFN0cmVhbXMgd2lsbCBwYXVzZSB3aGVuIHRoZWlyIGJ1ZmZlciBpcyBmdWxsIGlmIHRoZXkgYXJlIGJlaW5nIGxvYWRlZC5cclxuICAgICAgICogSW4gdGhpcyBjYXNlIHBhdXNlZCBpcyB0cnVlLCBidXQgdGhlIHNvbmcgaGFzbid0IHN0YXJ0ZWQgcGxheWluZyB5ZXQuXHJcbiAgICAgICAqIElmIHdlIGp1c3QgY2FsbCByZXN1bWUoKSB0aGUgb25wbGF5KCkgY2FsbGJhY2sgd2lsbCBuZXZlciBiZSBjYWxsZWQuXHJcbiAgICAgICAqIFNvIG9ubHkgY2FsbCByZXN1bWUoKSBpZiB0aGUgcG9zaXRpb24gaXMgPiAwLlxyXG4gICAgICAgKiBBbm90aGVyIHJlYXNvbiBpcyBiZWNhdXNlIG9wdGlvbnMgbGlrZSB2b2x1bWUgd29uJ3QgaGF2ZSBiZWVuIGFwcGxpZWQgeWV0LlxyXG4gICAgICAgKiBGb3Igbm9ybWFsIHNvdW5kcywganVzdCByZXN1bWUuXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgaWYgKHMucGF1c2VkICYmIHMucG9zaXRpb24gPj0gMCAmJiAoIXMuX2lPLnNlcnZlclVSTCB8fCBzLnBvc2l0aW9uID4gMCkpIHtcclxuXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMzdiMTdkZjc1Y2M0ZDdhOTBiZjZcclxuICAgICAgICBzbTIuX3dEKGZOICsgJ1Jlc3VtaW5nIGZyb20gcGF1c2VkIHN0YXRlJywgMSk7XHJcbiAgICAgICAgcy5yZXN1bWUoKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIHMuX2lPID0gbWl4aW4ob09wdGlvbnMsIHMuX2lPKTtcclxuXHJcbiAgICAgICAgLy8gYXBwbHkgZnJvbS90byBwYXJhbWV0ZXJzLCBpZiB0aGV5IGV4aXN0IChhbmQgbm90IHVzaW5nIFJUTVApXHJcbiAgICAgICAgaWYgKHMuX2lPLmZyb20gIT09IG51bGwgJiYgcy5faU8udG8gIT09IG51bGwgJiYgcy5pbnN0YW5jZUNvdW50ID09PSAwICYmIHMucGxheVN0YXRlID09PSAwICYmICFzLl9pTy5zZXJ2ZXJVUkwpIHtcclxuXHJcbiAgICAgICAgICBvbnJlYWR5ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIHNvdW5kIFwiY2FucGxheVwiIG9yIG9ubG9hZCgpXHJcbiAgICAgICAgICAgIC8vIHJlLWFwcGx5IGZyb20vdG8gdG8gaW5zdGFuY2Ugb3B0aW9ucywgYW5kIHN0YXJ0IHBsYXliYWNrXHJcbiAgICAgICAgICAgIHMuX2lPID0gbWl4aW4ob09wdGlvbnMsIHMuX2lPKTtcclxuICAgICAgICAgICAgcy5wbGF5KHMuX2lPKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgLy8gSFRNTDUgbmVlZHMgdG8gYXQgbGVhc3QgaGF2ZSBcImNhbnBsYXlcIiBmaXJlZCBiZWZvcmUgc2Vla2luZy5cclxuICAgICAgICAgIGlmIChzLmlzSFRNTDUgJiYgIXMuX2h0bWw1X2NhbnBsYXkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHRoaXMgaGFzbid0IGJlZW4gbG9hZGVkIHlldC4gbG9hZCBpdCBmaXJzdCwgYW5kIHRoZW4gZG8gdGhpcyBhZ2Fpbi5cclxuICAgICAgICAgICAgc20yLl93RChmTiArICdCZWdpbm5pbmcgbG9hZCBmb3IgZnJvbS90byBjYXNlJyk7XHJcblxyXG4gICAgICAgICAgICBzLmxvYWQoe1xyXG4gICAgICAgICAgICAgIC8vIG5vdGU6IGN1c3RvbSBIVE1MNS1vbmx5IGV2ZW50IGFkZGVkIGZvciBmcm9tL3RvIGltcGxlbWVudGF0aW9uLlxyXG4gICAgICAgICAgICAgIF9vbmNhbnBsYXk6IG9ucmVhZHlcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBleGl0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIGlmICghcy5pc0hUTUw1ICYmICFzLmxvYWRlZCAmJiAoIXMucmVhZHlTdGF0ZSB8fCBzLnJlYWR5U3RhdGUgIT09IDIpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyB0byBiZSBzYWZlLCBwcmVsb2FkIHRoZSB3aG9sZSB0aGluZyBpbiBGbGFzaC5cclxuXHJcbiAgICAgICAgICAgIHNtMi5fd0QoZk4gKyAnUHJlbG9hZGluZyBmb3IgZnJvbS90byBjYXNlJyk7XHJcblxyXG4gICAgICAgICAgICBzLmxvYWQoe1xyXG4gICAgICAgICAgICAgIG9ubG9hZDogb25yZWFkeVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGV4aXQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGV4aXQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV4aXQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlLCB3ZSdyZSByZWFkeSB0byBnby4gcmUtYXBwbHkgbG9jYWwgb3B0aW9ucywgYW5kIGNvbnRpbnVlXHJcblxyXG4gICAgICAgICAgcy5faU8gPSBhcHBseUZyb21UbygpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNtMi5fd0QoZk4gKyAnU3RhcnRpbmcgdG8gcGxheScpO1xyXG5cclxuICAgICAgICAvLyBpbmNyZW1lbnQgaW5zdGFuY2UgY291bnRlciwgd2hlcmUgZW5hYmxlZCArIHN1cHBvcnRlZFxyXG4gICAgICAgIGlmICghcy5pbnN0YW5jZUNvdW50IHx8IHMuX2lPLm11bHRpU2hvdEV2ZW50cyB8fCAocy5pc0hUTUw1ICYmIHMuX2lPLm11bHRpU2hvdCAmJiAhdXNlR2xvYmFsSFRNTDVBdWRpbykgfHwgKCFzLmlzSFRNTDUgJiYgZlYgPiA4ICYmICFzLmdldEF1dG9QbGF5KCkpKSB7XHJcbiAgICAgICAgICBzLmluc3RhbmNlQ291bnQrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIGZpcnN0IHBsYXkgYW5kIG9ucG9zaXRpb24gcGFyYW1ldGVycyBleGlzdCwgYXBwbHkgdGhlbSBub3dcclxuICAgICAgICBpZiAocy5faU8ub25wb3NpdGlvbiAmJiBzLnBsYXlTdGF0ZSA9PT0gMCkge1xyXG4gICAgICAgICAgYXR0YWNoT25Qb3NpdGlvbihzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHMucGxheVN0YXRlID0gMTtcclxuICAgICAgICBzLnBhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBzLnBvc2l0aW9uID0gKHMuX2lPLnBvc2l0aW9uICE9PSBfdW5kZWZpbmVkICYmICFpc05hTihzLl9pTy5wb3NpdGlvbikgPyBzLl9pTy5wb3NpdGlvbiA6IDApO1xyXG5cclxuICAgICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG4gICAgICAgICAgcy5faU8gPSBwb2xpY3lGaXgobG9vcEZpeChzLl9pTykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHMuX2lPLm9ucGxheSAmJiBfdXBkYXRlUGxheVN0YXRlKSB7XHJcbiAgICAgICAgICBzLl9pTy5vbnBsYXkuYXBwbHkocyk7XHJcbiAgICAgICAgICBvbnBsYXlfY2FsbGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHMuc2V0Vm9sdW1lKHMuX2lPLnZvbHVtZSwgdHJ1ZSk7XHJcbiAgICAgICAgcy5zZXRQYW4ocy5faU8ucGFuLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgICBzdGFydE9LID0gZmxhc2guX3N0YXJ0KHMuaWQsIHMuX2lPLmxvb3BzIHx8IDEsIChmViA9PT0gOSA/IHMucG9zaXRpb24gOiBzLnBvc2l0aW9uIC8gbXNlY1NjYWxlKSwgcy5faU8ubXVsdGlTaG90IHx8IGZhbHNlKTtcclxuXHJcbiAgICAgICAgICBpZiAoZlYgPT09IDkgJiYgIXN0YXJ0T0spIHtcclxuICAgICAgICAgICAgLy8gZWRnZSBjYXNlOiBubyBzb3VuZCBoYXJkd2FyZSwgb3IgMzItY2hhbm5lbCBmbGFzaCBjZWlsaW5nIGhpdC5cclxuICAgICAgICAgICAgLy8gYXBwbGllcyBvbmx5IHRvIEZsYXNoIDksIG5vbi1OZXRTdHJlYW0vTW92aWVTdGFyIHNvdW5kcy5cclxuICAgICAgICAgICAgLy8gaHR0cDovL2hlbHAuYWRvYmUuY29tL2VuX1VTL0ZsYXNoUGxhdGZvcm0vcmVmZXJlbmNlL2FjdGlvbnNjcmlwdC8zL2ZsYXNoL21lZGlhL1NvdW5kLmh0bWwjcGxheSUyOCUyOVxyXG4gICAgICAgICAgICBzbTIuX3dEKGZOICsgJ05vIHNvdW5kIGhhcmR3YXJlLCBvciAzMi1zb3VuZCBjZWlsaW5nIGhpdCcsIDIpO1xyXG4gICAgICAgICAgICBpZiAocy5faU8ub25wbGF5ZXJyb3IpIHtcclxuICAgICAgICAgICAgICBzLl9pTy5vbnBsYXllcnJvci5hcHBseShzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBpZiAocy5pbnN0YW5jZUNvdW50IDwgMikge1xyXG5cclxuICAgICAgICAgICAgLy8gSFRNTDUgc2luZ2xlLWluc3RhbmNlIGNhc2VcclxuXHJcbiAgICAgICAgICAgIHN0YXJ0X2h0bWw1X3RpbWVyKCk7XHJcblxyXG4gICAgICAgICAgICBhID0gcy5fc2V0dXBfaHRtbDUoKTtcclxuXHJcbiAgICAgICAgICAgIHMuc2V0UG9zaXRpb24ocy5faU8ucG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgYS5wbGF5KCk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEhUTUw1IG11bHRpLXNob3QgY2FzZVxyXG5cclxuICAgICAgICAgICAgc20yLl93RChzLmlkICsgJzogQ2xvbmluZyBBdWRpbygpIGZvciBpbnN0YW5jZSAjJyArIHMuaW5zdGFuY2VDb3VudCArICcuLi4nKTtcclxuXHJcbiAgICAgICAgICAgIGF1ZGlvQ2xvbmUgPSBuZXcgQXVkaW8ocy5faU8udXJsKTtcclxuXHJcbiAgICAgICAgICAgIG9uZW5kZWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICBldmVudC5yZW1vdmUoYXVkaW9DbG9uZSwgJ2VuZGVkJywgb25lbmRlZCk7XHJcbiAgICAgICAgICAgICAgcy5fb25maW5pc2gocyk7XHJcbiAgICAgICAgICAgICAgLy8gY2xlYW51cFxyXG4gICAgICAgICAgICAgIGh0bWw1VW5sb2FkKGF1ZGlvQ2xvbmUpO1xyXG4gICAgICAgICAgICAgIGF1ZGlvQ2xvbmUgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgb25jYW5wbGF5ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgZXZlbnQucmVtb3ZlKGF1ZGlvQ2xvbmUsICdjYW5wbGF5Jywgb25jYW5wbGF5KTtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXVkaW9DbG9uZS5jdXJyZW50VGltZSA9IHMuX2lPLnBvc2l0aW9uL21zZWNTY2FsZTtcclxuICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29tcGxhaW4ocy5pZCArICc6IG11bHRpU2hvdCBwbGF5KCkgZmFpbGVkIHRvIGFwcGx5IHBvc2l0aW9uIG9mICcgKyAocy5faU8ucG9zaXRpb24vbXNlY1NjYWxlKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGF1ZGlvQ2xvbmUucGxheSgpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZXZlbnQuYWRkKGF1ZGlvQ2xvbmUsICdlbmRlZCcsIG9uZW5kZWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gYXBwbHkgdm9sdW1lIHRvIGNsb25lcywgdG9vXHJcbiAgICAgICAgICAgIGlmIChzLl9pTy52b2x1bWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGF1ZGlvQ2xvbmUudm9sdW1lID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcy5faU8udm9sdW1lLzEwMCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBwbGF5aW5nIG11bHRpcGxlIG11dGVkIHNvdW5kcz8gaWYgeW91IGRvIHRoaXMsIHlvdSdyZSB3ZWlyZCA7KSAtIGJ1dCBsZXQncyBjb3ZlciBpdC5cclxuICAgICAgICAgICAgaWYgKHMubXV0ZWQpIHtcclxuICAgICAgICAgICAgICBhdWRpb0Nsb25lLm11dGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHMuX2lPLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgLy8gSFRNTDUgYXVkaW8gY2FuJ3Qgc2VlayBiZWZvcmUgb25wbGF5KCkgZXZlbnQgaGFzIGZpcmVkLlxyXG4gICAgICAgICAgICAgIC8vIHdhaXQgZm9yIGNhbnBsYXksIHRoZW4gc2VlayB0byBwb3NpdGlvbiBhbmQgc3RhcnQgcGxheWJhY2suXHJcbiAgICAgICAgICAgICAgZXZlbnQuYWRkKGF1ZGlvQ2xvbmUsICdjYW5wbGF5Jywgb25jYW5wbGF5KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBiZWdpbiBwbGF5YmFjayBhdCBjdXJyZW50VGltZTogMFxyXG4gICAgICAgICAgICAgIGF1ZGlvQ2xvbmUucGxheSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGp1c3QgZm9yIGNvbnZlbmllbmNlXHJcbiAgICB0aGlzLnN0YXJ0ID0gdGhpcy5wbGF5O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3RvcHMgcGxheWluZyBhIHNvdW5kIChhbmQgb3B0aW9uYWxseSwgYWxsIHNvdW5kcylcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJBbGwgT3B0aW9uYWw6IFdoZXRoZXIgdG8gc3RvcCBhbGwgc291bmRzXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGJBbGwpIHtcclxuXHJcbiAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTyxcclxuICAgICAgICAgIG9yaWdpbmFsUG9zaXRpb247XHJcblxyXG4gICAgICBpZiAocy5wbGF5U3RhdGUgPT09IDEpIHtcclxuXHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogc3RvcCgpJyk7XHJcblxyXG4gICAgICAgIHMuX29uYnVmZmVyY2hhbmdlKDApO1xyXG4gICAgICAgIHMuX3Jlc2V0T25Qb3NpdGlvbigwKTtcclxuICAgICAgICBzLnBhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG4gICAgICAgICAgcy5wbGF5U3RhdGUgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIG9uUG9zaXRpb24gbGlzdGVuZXJzLCBpZiBhbnlcclxuICAgICAgICBkZXRhY2hPblBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIGFuZCBcInRvXCIgcG9zaXRpb24sIGlmIHNldFxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMudG8pIHtcclxuICAgICAgICAgIHMuY2xlYXJPblBvc2l0aW9uKGluc3RhbmNlT3B0aW9ucy50byk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXMuaXNIVE1MNSkge1xyXG5cclxuICAgICAgICAgIGZsYXNoLl9zdG9wKHMuaWQsIGJBbGwpO1xyXG5cclxuICAgICAgICAgIC8vIGhhY2sgZm9yIG5ldFN0cmVhbToganVzdCB1bmxvYWRcclxuICAgICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMuc2VydmVyVVJMKSB7XHJcbiAgICAgICAgICAgIHMudW5sb2FkKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgaWYgKHMuX2EpIHtcclxuXHJcbiAgICAgICAgICAgIG9yaWdpbmFsUG9zaXRpb24gPSBzLnBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgLy8gYWN0IGxpa2UgRmxhc2gsIHRob3VnaFxyXG4gICAgICAgICAgICBzLnNldFBvc2l0aW9uKDApO1xyXG5cclxuICAgICAgICAgICAgLy8gaGFjazogcmVmbGVjdCBvbGQgcG9zaXRpb24gZm9yIG9uc3RvcCgpIChhbHNvIGxpa2UgRmxhc2gpXHJcbiAgICAgICAgICAgIHMucG9zaXRpb24gPSBvcmlnaW5hbFBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgLy8gaHRtbDUgaGFzIG5vIHN0b3AoKVxyXG4gICAgICAgICAgICAvLyBOT1RFOiBwYXVzaW5nIG1lYW5zIGlPUyByZXF1aXJlcyBpbnRlcmFjdGlvbiB0byByZXN1bWUuXHJcbiAgICAgICAgICAgIHMuX2EucGF1c2UoKTtcclxuXHJcbiAgICAgICAgICAgIHMucGxheVN0YXRlID0gMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGFuZCB1cGRhdGUgVUlcclxuICAgICAgICAgICAgcy5fb25UaW1lcigpO1xyXG5cclxuICAgICAgICAgICAgc3RvcF9odG1sNV90aW1lcigpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzLmluc3RhbmNlQ291bnQgPSAwO1xyXG4gICAgICAgIHMuX2lPID0ge307XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMub25zdG9wKSB7XHJcbiAgICAgICAgICBpbnN0YW5jZU9wdGlvbnMub25zdG9wLmFwcGx5KHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmRvY3VtZW50ZWQvaW50ZXJuYWw6IFNldHMgYXV0b1BsYXkgZm9yIFJUTVAuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhdXRvUGxheSBzdGF0ZVxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5zZXRBdXRvUGxheSA9IGZ1bmN0aW9uKGF1dG9QbGF5KSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBBdXRvcGxheSB0dXJuZWQgJyArIChhdXRvUGxheSA/ICdvbicgOiAnb2ZmJykpO1xyXG4gICAgICBzLl9pTy5hdXRvUGxheSA9IGF1dG9QbGF5O1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICBmbGFzaC5fc2V0QXV0b1BsYXkocy5pZCwgYXV0b1BsYXkpO1xyXG4gICAgICAgIGlmIChhdXRvUGxheSkge1xyXG4gICAgICAgICAgLy8gb25seSBpbmNyZW1lbnQgdGhlIGluc3RhbmNlQ291bnQgaWYgdGhlIHNvdW5kIGlzbid0IGxvYWRlZCAoVE9ETzogdmVyaWZ5IFJUTVApXHJcbiAgICAgICAgICBpZiAoIXMuaW5zdGFuY2VDb3VudCAmJiBzLnJlYWR5U3RhdGUgPT09IDEpIHtcclxuICAgICAgICAgICAgcy5pbnN0YW5jZUNvdW50Kys7XHJcbiAgICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IEluY3JlbWVudGVkIGluc3RhbmNlIGNvdW50IHRvICcrcy5pbnN0YW5jZUNvdW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5kb2N1bWVudGVkL2ludGVybmFsOiBSZXR1cm5zIHRoZSBhdXRvUGxheSBib29sZWFuLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFRoZSBjdXJyZW50IGF1dG9QbGF5IHZhbHVlXHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLmdldEF1dG9QbGF5ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICByZXR1cm4gcy5faU8uYXV0b1BsYXk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIGEgc291bmQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5Nc2VjT2Zmc2V0IFBvc2l0aW9uIChtaWxsaXNlY29uZHMpXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuc2V0UG9zaXRpb24gPSBmdW5jdGlvbihuTXNlY09mZnNldCkge1xyXG5cclxuICAgICAgaWYgKG5Nc2VjT2Zmc2V0ID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgbk1zZWNPZmZzZXQgPSAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcG9zaXRpb24sIHBvc2l0aW9uMUssXHJcbiAgICAgICAgICAvLyBVc2UgdGhlIGR1cmF0aW9uIGZyb20gdGhlIGluc3RhbmNlIG9wdGlvbnMsIGlmIHdlIGRvbid0IGhhdmUgYSB0cmFjayBkdXJhdGlvbiB5ZXQuXHJcbiAgICAgICAgICAvLyBwb3NpdGlvbiA+PSAwIGFuZCA8PSBjdXJyZW50IGF2YWlsYWJsZSAobG9hZGVkKSBkdXJhdGlvblxyXG4gICAgICAgICAgb2Zmc2V0ID0gKHMuaXNIVE1MNSA/IE1hdGgubWF4KG5Nc2VjT2Zmc2V0LCAwKSA6IE1hdGgubWluKHMuZHVyYXRpb24gfHwgcy5faU8uZHVyYXRpb24sIE1hdGgubWF4KG5Nc2VjT2Zmc2V0LCAwKSkpO1xyXG5cclxuICAgICAgcy5wb3NpdGlvbiA9IG9mZnNldDtcclxuICAgICAgcG9zaXRpb24xSyA9IHMucG9zaXRpb24vbXNlY1NjYWxlO1xyXG4gICAgICBzLl9yZXNldE9uUG9zaXRpb24ocy5wb3NpdGlvbik7XHJcbiAgICAgIHMuX2lPLnBvc2l0aW9uID0gb2Zmc2V0O1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuXHJcbiAgICAgICAgcG9zaXRpb24gPSAoZlYgPT09IDkgPyBzLnBvc2l0aW9uIDogcG9zaXRpb24xSyk7XHJcblxyXG4gICAgICAgIGlmIChzLnJlYWR5U3RhdGUgJiYgcy5yZWFkeVN0YXRlICE9PSAyKSB7XHJcbiAgICAgICAgICAvLyBpZiBwYXVzZWQgb3Igbm90IHBsYXlpbmcsIHdpbGwgbm90IHJlc3VtZSAoYnkgcGxheWluZylcclxuICAgICAgICAgIGZsYXNoLl9zZXRQb3NpdGlvbihzLmlkLCBwb3NpdGlvbiwgKHMucGF1c2VkIHx8ICFzLnBsYXlTdGF0ZSksIHMuX2lPLm11bHRpU2hvdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChzLl9hKSB7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgcG9zaXRpb24gaW4gdGhlIGNhbnBsYXkgaGFuZGxlciBpZiB0aGUgc291bmQgaXMgbm90IHJlYWR5IHlldFxyXG4gICAgICAgIGlmIChzLl9odG1sNV9jYW5wbGF5KSB7XHJcblxyXG4gICAgICAgICAgaWYgKHMuX2EuY3VycmVudFRpbWUgIT09IHBvc2l0aW9uMUspIHtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBET00vSlMgZXJyb3JzL2V4Y2VwdGlvbnMgdG8gd2F0Y2ggb3V0IGZvcjpcclxuICAgICAgICAgICAgICogaWYgc2VlayBpcyBiZXlvbmQgKGxvYWRlZD8pIHBvc2l0aW9uLCBcIkRPTSBleGNlcHRpb24gMTFcIlxyXG4gICAgICAgICAgICAgKiBcIklOREVYX1NJWkVfRVJSXCI6IERPTSBleGNlcHRpb24gMVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc20yLl93RChzLmlkICsgJzogc2V0UG9zaXRpb24oJytwb3NpdGlvbjFLKycpJyk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIHMuX2EuY3VycmVudFRpbWUgPSBwb3NpdGlvbjFLO1xyXG4gICAgICAgICAgICAgIGlmIChzLnBsYXlTdGF0ZSA9PT0gMCB8fCBzLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gYWxsb3cgc2VlayB3aXRob3V0IGF1dG8tcGxheS9yZXN1bWVcclxuICAgICAgICAgICAgICAgIHMuX2EucGF1c2UoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IHNldFBvc2l0aW9uKCcgKyBwb3NpdGlvbjFLICsgJykgZmFpbGVkOiAnICsgZS5tZXNzYWdlLCAyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChwb3NpdGlvbjFLKSB7XHJcblxyXG4gICAgICAgICAgLy8gd2FybiBvbiBub24temVybyBzZWVrIGF0dGVtcHRzXHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBzZXRQb3NpdGlvbignICsgcG9zaXRpb24xSyArICcpOiBDYW5ub3Qgc2VlayB5ZXQsIHNvdW5kIG5vdCByZWFkeScsIDIpO1xyXG4gICAgICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHMucGF1c2VkKSB7XHJcblxyXG4gICAgICAgICAgLy8gaWYgcGF1c2VkLCByZWZyZXNoIFVJIHJpZ2h0IGF3YXlcclxuICAgICAgICAgIC8vIGZvcmNlIHVwZGF0ZVxyXG4gICAgICAgICAgcy5fb25UaW1lcih0cnVlKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhdXNlcyBzb3VuZCBwbGF5YmFjay5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbihfYkNhbGxGbGFzaCkge1xyXG5cclxuICAgICAgaWYgKHMucGF1c2VkIHx8IChzLnBsYXlTdGF0ZSA9PT0gMCAmJiBzLnJlYWR5U3RhdGUgIT09IDEpKSB7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IHBhdXNlKCknKTtcclxuICAgICAgcy5wYXVzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICBpZiAoX2JDYWxsRmxhc2ggfHwgX2JDYWxsRmxhc2ggPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICAgIGZsYXNoLl9wYXVzZShzLmlkLCBzLl9pTy5tdWx0aVNob3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzLl9zZXR1cF9odG1sNSgpLnBhdXNlKCk7XHJcbiAgICAgICAgc3RvcF9odG1sNV90aW1lcigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocy5faU8ub25wYXVzZSkge1xyXG4gICAgICAgIHMuX2lPLm9ucGF1c2UuYXBwbHkocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXN1bWVzIHNvdW5kIHBsYXliYWNrLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGVuIGF1dG8tbG9hZGVkIHN0cmVhbXMgcGF1c2Ugb24gYnVmZmVyIGZ1bGwgdGhleSBoYXZlIGEgcGxheVN0YXRlIG9mIDAuXHJcbiAgICAgKiBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBwbGF5U3RhdGUgaXMgc2V0IHRvIDEgd2hlbiB0aGVzZSBzdHJlYW1zIFwicmVzdW1lXCIuXHJcbiAgICAgKiBXaGVuIGEgcGF1c2VkIHN0cmVhbSBpcyByZXN1bWVkLCB3ZSBuZWVkIHRvIHRyaWdnZXIgdGhlIG9ucGxheSgpIGNhbGxiYWNrIGlmIGl0XHJcbiAgICAgKiBoYXNuJ3QgYmVlbiBjYWxsZWQgYWxyZWFkeS4gSW4gdGhpcyBjYXNlIHNpbmNlIHRoZSBzb3VuZCBpcyBiZWluZyBwbGF5ZWQgZm9yIHRoZVxyXG4gICAgICogZmlyc3QgdGltZSwgSSB0aGluayBpdCdzIG1vcmUgYXBwcm9wcmlhdGUgdG8gY2FsbCBvbnBsYXkoKSByYXRoZXIgdGhhbiBvbnJlc3VtZSgpLlxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuXHJcbiAgICAgIGlmICghcy5wYXVzZWQpIHtcclxuICAgICAgICByZXR1cm4gcztcclxuICAgICAgfVxyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogcmVzdW1lKCknKTtcclxuICAgICAgcy5wYXVzZWQgPSBmYWxzZTtcclxuICAgICAgcy5wbGF5U3RhdGUgPSAxO1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLmlzTW92aWVTdGFyICYmICFpbnN0YW5jZU9wdGlvbnMuc2VydmVyVVJMKSB7XHJcbiAgICAgICAgICAvLyBCaXphcnJlIFdlYmtpdCBidWcgKENocm9tZSByZXBvcnRlZCB2aWEgOHRyYWNrcy5jb20gZHVkZXMpOiBBQUMgY29udGVudCBwYXVzZWQgZm9yIDMwKyBzZWNvbmRzKD8pIHdpbGwgbm90IHJlc3VtZSB3aXRob3V0IGEgcmVwb3NpdGlvbi5cclxuICAgICAgICAgIHMuc2V0UG9zaXRpb24ocy5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGZsYXNoIG1ldGhvZCBpcyB0b2dnbGUtYmFzZWQgKHBhdXNlL3Jlc3VtZSlcclxuICAgICAgICBmbGFzaC5fcGF1c2Uocy5pZCwgaW5zdGFuY2VPcHRpb25zLm11bHRpU2hvdCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcy5fc2V0dXBfaHRtbDUoKS5wbGF5KCk7XHJcbiAgICAgICAgc3RhcnRfaHRtbDVfdGltZXIoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFvbnBsYXlfY2FsbGVkICYmIGluc3RhbmNlT3B0aW9ucy5vbnBsYXkpIHtcclxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMub25wbGF5LmFwcGx5KHMpO1xyXG4gICAgICAgIG9ucGxheV9jYWxsZWQgPSB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKGluc3RhbmNlT3B0aW9ucy5vbnJlc3VtZSkge1xyXG4gICAgICAgIGluc3RhbmNlT3B0aW9ucy5vbnJlc3VtZS5hcHBseShzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHM7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvZ2dsZXMgc291bmQgcGxheWJhY2suXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnRvZ2dsZVBhdXNlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiB0b2dnbGVQYXVzZSgpJyk7XHJcblxyXG4gICAgICBpZiAocy5wbGF5U3RhdGUgPT09IDApIHtcclxuICAgICAgICBzLnBsYXkoe1xyXG4gICAgICAgICAgcG9zaXRpb246IChmViA9PT0gOSAmJiAhcy5pc0hUTUw1ID8gcy5wb3NpdGlvbiA6IHMucG9zaXRpb24gLyBtc2VjU2NhbGUpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzLnBhdXNlZCkge1xyXG4gICAgICAgIHMucmVzdW1lKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcy5wYXVzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgcGFubmluZyAoTC1SKSBlZmZlY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5QYW4gVGhlIHBhbiB2YWx1ZSAoLTEwMCB0byAxMDApXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuc2V0UGFuID0gZnVuY3Rpb24oblBhbiwgYkluc3RhbmNlT25seSkge1xyXG5cclxuICAgICAgaWYgKG5QYW4gPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICBuUGFuID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGJJbnN0YW5jZU9ubHkgPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgICBiSW5zdGFuY2VPbmx5ID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgZmxhc2guX3NldFBhbihzLmlkLCBuUGFuKTtcclxuICAgICAgfSAvLyBlbHNlIHsgbm8gSFRNTDUgcGFuPyB9XHJcblxyXG4gICAgICBzLl9pTy5wYW4gPSBuUGFuO1xyXG5cclxuICAgICAgaWYgKCFiSW5zdGFuY2VPbmx5KSB7XHJcbiAgICAgICAgcy5wYW4gPSBuUGFuO1xyXG4gICAgICAgIHMub3B0aW9ucy5wYW4gPSBuUGFuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdm9sdW1lLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuVm9sIFRoZSB2b2x1bWUgdmFsdWUgKDAgdG8gMTAwKVxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLnNldFZvbHVtZSA9IGZ1bmN0aW9uKG5Wb2wsIF9iSW5zdGFuY2VPbmx5KSB7XHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogTm90ZTogU2V0dGluZyB2b2x1bWUgaGFzIG5vIGVmZmVjdCBvbiBpT1MgXCJzcGVjaWFsIHNub3dmbGFrZVwiIGRldmljZXMuXHJcbiAgICAgICAqIEhhcmR3YXJlIHZvbHVtZSBjb250cm9sIG92ZXJyaWRlcyBzb2Z0d2FyZSwgYW5kIHZvbHVtZVxyXG4gICAgICAgKiB3aWxsIGFsd2F5cyByZXR1cm4gMSBwZXIgQXBwbGUgZG9jcy4gKGlPUyA0ICsgNS4pXHJcbiAgICAgICAqIGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpL2RvY3VtZW50YXRpb24vQXVkaW9WaWRlby9Db25jZXB0dWFsL0hUTUwtY2FudmFzLWd1aWRlL0FkZGluZ1NvdW5kdG9DYW52YXNBbmltYXRpb25zL0FkZGluZ1NvdW5kdG9DYW52YXNBbmltYXRpb25zLmh0bWxcclxuICAgICAgICovXHJcblxyXG4gICAgICBpZiAoblZvbCA9PT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIG5Wb2wgPSAxMDA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChfYkluc3RhbmNlT25seSA9PT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICAgIF9iSW5zdGFuY2VPbmx5ID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgZmxhc2guX3NldFZvbHVtZShzLmlkLCAoc20yLm11dGVkICYmICFzLm11dGVkKSB8fCBzLm11dGVkPzA6blZvbCk7XHJcbiAgICAgIH0gZWxzZSBpZiAocy5fYSkge1xyXG4gICAgICAgIGlmIChzbTIubXV0ZWQgJiYgIXMubXV0ZWQpIHtcclxuICAgICAgICAgIHMubXV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgcy5fYS5tdXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHZhbGlkIHJhbmdlOiAwLTFcclxuICAgICAgICBzLl9hLnZvbHVtZSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIG5Wb2wvMTAwKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuX2lPLnZvbHVtZSA9IG5Wb2w7XHJcblxyXG4gICAgICBpZiAoIV9iSW5zdGFuY2VPbmx5KSB7XHJcbiAgICAgICAgcy52b2x1bWUgPSBuVm9sO1xyXG4gICAgICAgIHMub3B0aW9ucy52b2x1bWUgPSBuVm9sO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTXV0ZXMgdGhlIHNvdW5kLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5tdXRlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzLm11dGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgZmxhc2guX3NldFZvbHVtZShzLmlkLCAwKTtcclxuICAgICAgfSBlbHNlIGlmIChzLl9hKSB7XHJcbiAgICAgICAgcy5fYS5tdXRlZCA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbm11dGVzIHRoZSBzb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMudW5tdXRlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzLm11dGVkID0gZmFsc2U7XHJcbiAgICAgIHZhciBoYXNJTyA9IChzLl9pTy52b2x1bWUgIT09IF91bmRlZmluZWQpO1xyXG5cclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICBmbGFzaC5fc2V0Vm9sdW1lKHMuaWQsIGhhc0lPP3MuX2lPLnZvbHVtZTpzLm9wdGlvbnMudm9sdW1lKTtcclxuICAgICAgfSBlbHNlIGlmIChzLl9hKSB7XHJcbiAgICAgICAgcy5fYS5tdXRlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG9nZ2xlcyB0aGUgbXV0ZWQgc3RhdGUgb2YgYSBzb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtTTVNvdW5kfSBUaGUgU01Tb3VuZCBvYmplY3RcclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMudG9nZ2xlTXV0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgcmV0dXJuIChzLm11dGVkP3MudW5tdXRlKCk6cy5tdXRlKCkpO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBmaXJlZCB3aGVuIGEgc291bmQgcmVhY2hlcyBhIGdpdmVuIHBvc2l0aW9uIGR1cmluZyBwbGF5YmFjay5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gblBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byB3YXRjaCBmb3JcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9NZXRob2QgVGhlIHJlbGV2YW50IGNhbGxiYWNrIHRvIGZpcmVcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvU2NvcGUgT3B0aW9uYWw6IFRoZSBzY29wZSB0byBhcHBseSB0aGUgY2FsbGJhY2sgdG9cclxuICAgICAqIEByZXR1cm4ge1NNU291bmR9IFRoZSBTTVNvdW5kIG9iamVjdFxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5vblBvc2l0aW9uID0gZnVuY3Rpb24oblBvc2l0aW9uLCBvTWV0aG9kLCBvU2NvcGUpIHtcclxuXHJcbiAgICAgIC8vIFRPRE86IGJhc2ljIGR1cGUgY2hlY2tpbmc/XHJcblxyXG4gICAgICBvblBvc2l0aW9uSXRlbXMucHVzaCh7XHJcbiAgICAgICAgcG9zaXRpb246IHBhcnNlSW50KG5Qb3NpdGlvbiwgMTApLFxyXG4gICAgICAgIG1ldGhvZDogb01ldGhvZCxcclxuICAgICAgICBzY29wZTogKG9TY29wZSAhPT0gX3VuZGVmaW5lZCA/IG9TY29wZSA6IHMpLFxyXG4gICAgICAgIGZpcmVkOiBmYWxzZVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBzO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLy8gbGVnYWN5L2JhY2t3YXJkcy1jb21wYWJpbGl0eTogbG93ZXItY2FzZSBtZXRob2QgbmFtZVxyXG4gICAgdGhpcy5vbnBvc2l0aW9uID0gdGhpcy5vblBvc2l0aW9uO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyByZWdpc3RlcmVkIGNhbGxiYWNrKHMpIGZyb20gYSBzb3VuZCwgYnkgcG9zaXRpb24gYW5kL29yIGNhbGxiYWNrLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBuUG9zaXRpb24gVGhlIHBvc2l0aW9uIHRvIGNsZWFyIGNhbGxiYWNrKHMpIGZvclxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gb01ldGhvZCBPcHRpb25hbDogSWRlbnRpZnkgb25lIGNhbGxiYWNrIHRvIGJlIHJlbW92ZWQgd2hlbiBtdWx0aXBsZSBsaXN0ZW5lcnMgZXhpc3QgZm9yIG9uZSBwb3NpdGlvblxyXG4gICAgICogQHJldHVybiB7U01Tb3VuZH0gVGhlIFNNU291bmQgb2JqZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLmNsZWFyT25Qb3NpdGlvbiA9IGZ1bmN0aW9uKG5Qb3NpdGlvbiwgb01ldGhvZCkge1xyXG5cclxuICAgICAgdmFyIGk7XHJcblxyXG4gICAgICBuUG9zaXRpb24gPSBwYXJzZUludChuUG9zaXRpb24sIDEwKTtcclxuXHJcbiAgICAgIGlmIChpc05hTihuUG9zaXRpb24pKSB7XHJcbiAgICAgICAgLy8gc2FmZXR5IGNoZWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGk9MDsgaSA8IG9uUG9zaXRpb25JdGVtcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICBpZiAoblBvc2l0aW9uID09PSBvblBvc2l0aW9uSXRlbXNbaV0ucG9zaXRpb24pIHtcclxuICAgICAgICAgIC8vIHJlbW92ZSB0aGlzIGl0ZW0gaWYgbm8gbWV0aG9kIHdhcyBzcGVjaWZpZWQsIG9yLCBpZiB0aGUgbWV0aG9kIG1hdGNoZXNcclxuICAgICAgICAgIGlmICghb01ldGhvZCB8fCAob01ldGhvZCA9PT0gb25Qb3NpdGlvbkl0ZW1zW2ldLm1ldGhvZCkpIHtcclxuICAgICAgICAgICAgaWYgKG9uUG9zaXRpb25JdGVtc1tpXS5maXJlZCkge1xyXG4gICAgICAgICAgICAgIC8vIGRlY3JlbWVudCBcImZpcmVkXCIgY291bnRlciwgdG9vXHJcbiAgICAgICAgICAgICAgb25Qb3NpdGlvbkZpcmVkLS07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb25Qb3NpdGlvbkl0ZW1zLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9wcm9jZXNzT25Qb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGksIGl0ZW0sIGogPSBvblBvc2l0aW9uSXRlbXMubGVuZ3RoO1xyXG5cdFx0XHJcbiAgICAgIGlmICghaiB8fCAhcy5wbGF5U3RhdGUgfHwgb25Qb3NpdGlvbkZpcmVkID49IGopIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoaT1qLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgaXRlbSA9IG9uUG9zaXRpb25JdGVtc1tpXTtcclxuICAgICAgICBpZiAoIWl0ZW0uZmlyZWQgJiYgcy5wb3NpdGlvbiA+PSBpdGVtLnBvc2l0aW9uKSB7XHJcbiAgICAgICAgICBpdGVtLmZpcmVkID0gdHJ1ZTtcclxuICAgICAgICAgIG9uUG9zaXRpb25GaXJlZCsrO1xyXG4gICAgICAgICAgaXRlbS5tZXRob2QuYXBwbHkoaXRlbS5zY29wZSwgW2l0ZW0ucG9zaXRpb25dKTtcclxuXHRcdCAgaiA9IG9uUG9zaXRpb25JdGVtcy5sZW5ndGg7IC8vICByZXNldCBqIC0tIG9uUG9zaXRpb25JdGVtcy5sZW5ndGggY2FuIGJlIGNoYW5nZWQgaW4gdGhlIGl0ZW0gY2FsbGJhY2sgYWJvdmUuLi4gb2NjYXNpb25hbGx5IGJyZWFraW5nIHRoZSBsb29wLlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cdFxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX3Jlc2V0T25Qb3NpdGlvbiA9IGZ1bmN0aW9uKG5Qb3NpdGlvbikge1xyXG5cclxuICAgICAgLy8gcmVzZXQgXCJmaXJlZFwiIGZvciBpdGVtcyBpbnRlcmVzdGVkIGluIHRoaXMgcG9zaXRpb25cclxuICAgICAgdmFyIGksIGl0ZW0sIGogPSBvblBvc2l0aW9uSXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKCFqKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGk9ai0xOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIGl0ZW0gPSBvblBvc2l0aW9uSXRlbXNbaV07XHJcbiAgICAgICAgaWYgKGl0ZW0uZmlyZWQgJiYgblBvc2l0aW9uIDw9IGl0ZW0ucG9zaXRpb24pIHtcclxuICAgICAgICAgIGl0ZW0uZmlyZWQgPSBmYWxzZTtcclxuICAgICAgICAgIG9uUG9zaXRpb25GaXJlZC0tO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNNU291bmQoKSBwcml2YXRlIGludGVybmFsc1xyXG4gICAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAqL1xyXG5cclxuICAgIGFwcGx5RnJvbVRvID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gcy5faU8sXHJcbiAgICAgICAgICBmID0gaW5zdGFuY2VPcHRpb25zLmZyb20sXHJcbiAgICAgICAgICB0ID0gaW5zdGFuY2VPcHRpb25zLnRvLFxyXG4gICAgICAgICAgc3RhcnQsIGVuZDtcclxuXHJcbiAgICAgIGVuZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAvLyBlbmQgaGFzIGJlZW4gcmVhY2hlZC5cclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBcIlRvXCIgdGltZSBvZiAnICsgdCArICcgcmVhY2hlZC4nKTtcclxuXHJcbiAgICAgICAgLy8gZGV0YWNoIGxpc3RlbmVyXHJcbiAgICAgICAgcy5jbGVhck9uUG9zaXRpb24odCwgZW5kKTtcclxuXHJcbiAgICAgICAgLy8gc3RvcCBzaG91bGQgY2xlYXIgdGhpcywgdG9vXHJcbiAgICAgICAgcy5zdG9wKCk7XHJcblxyXG4gICAgICB9O1xyXG5cclxuICAgICAgc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgc20yLl93RChzLmlkICsgJzogUGxheWluZyBcImZyb21cIiAnICsgZik7XHJcblxyXG4gICAgICAgIC8vIGFkZCBsaXN0ZW5lciBmb3IgZW5kXHJcbiAgICAgICAgaWYgKHQgIT09IG51bGwgJiYgIWlzTmFOKHQpKSB7XHJcbiAgICAgICAgICBzLm9uUG9zaXRpb24odCwgZW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9O1xyXG5cclxuICAgICAgaWYgKGYgIT09IG51bGwgJiYgIWlzTmFOKGYpKSB7XHJcblxyXG4gICAgICAgIC8vIGFwcGx5IHRvIGluc3RhbmNlIG9wdGlvbnMsIGd1YXJhbnRlZWluZyBjb3JyZWN0IHN0YXJ0IHBvc2l0aW9uLlxyXG4gICAgICAgIGluc3RhbmNlT3B0aW9ucy5wb3NpdGlvbiA9IGY7XHJcblxyXG4gICAgICAgIC8vIG11bHRpU2hvdCB0aW1pbmcgY2FuJ3QgYmUgdHJhY2tlZCwgc28gcHJldmVudCB0aGF0LlxyXG4gICAgICAgIGluc3RhbmNlT3B0aW9ucy5tdWx0aVNob3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgc3RhcnQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJldHVybiB1cGRhdGVkIGluc3RhbmNlT3B0aW9ucyBpbmNsdWRpbmcgc3RhcnRpbmcgcG9zaXRpb25cclxuICAgICAgcmV0dXJuIGluc3RhbmNlT3B0aW9ucztcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIGF0dGFjaE9uUG9zaXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpdGVtLFxyXG4gICAgICAgICAgb3AgPSBzLl9pTy5vbnBvc2l0aW9uO1xyXG5cclxuICAgICAgLy8gYXR0YWNoIG9ucG9zaXRpb24gdGhpbmdzLCBpZiBhbnksIG5vdy5cclxuXHJcbiAgICAgIGlmIChvcCkge1xyXG5cclxuICAgICAgICBmb3IgKGl0ZW0gaW4gb3ApIHtcclxuICAgICAgICAgIGlmIChvcC5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xyXG4gICAgICAgICAgICBzLm9uUG9zaXRpb24ocGFyc2VJbnQoaXRlbSwgMTApLCBvcFtpdGVtXSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgZGV0YWNoT25Qb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGl0ZW0sXHJcbiAgICAgICAgICBvcCA9IHMuX2lPLm9ucG9zaXRpb247XHJcblxyXG4gICAgICAvLyBkZXRhY2ggYW55IG9ucG9zaXRpb24oKS1zdHlsZSBsaXN0ZW5lcnMuXHJcblxyXG4gICAgICBpZiAob3ApIHtcclxuXHJcbiAgICAgICAgZm9yIChpdGVtIGluIG9wKSB7XHJcbiAgICAgICAgICBpZiAob3AuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcclxuICAgICAgICAgICAgcy5jbGVhck9uUG9zaXRpb24ocGFyc2VJbnQoaXRlbSwgMTApKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBzdGFydF9odG1sNV90aW1lciA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHMuaXNIVE1MNSkge1xyXG4gICAgICAgIHN0YXJ0VGltZXIocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHN0b3BfaHRtbDVfdGltZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmIChzLmlzSFRNTDUpIHtcclxuICAgICAgICBzdG9wVGltZXIocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJlc2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uKHJldGFpblBvc2l0aW9uKSB7XHJcblxyXG4gICAgICBpZiAoIXJldGFpblBvc2l0aW9uKSB7XHJcbiAgICAgICAgb25Qb3NpdGlvbkl0ZW1zID0gW107XHJcbiAgICAgICAgb25Qb3NpdGlvbkZpcmVkID0gMDtcclxuICAgICAgfVxyXG5cclxuICAgICAgb25wbGF5X2NhbGxlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgcy5faGFzVGltZXIgPSBudWxsO1xyXG4gICAgICBzLl9hID0gbnVsbDtcclxuICAgICAgcy5faHRtbDVfY2FucGxheSA9IGZhbHNlO1xyXG4gICAgICBzLmJ5dGVzTG9hZGVkID0gbnVsbDtcclxuICAgICAgcy5ieXRlc1RvdGFsID0gbnVsbDtcclxuICAgICAgcy5kdXJhdGlvbiA9IChzLl9pTyAmJiBzLl9pTy5kdXJhdGlvbiA/IHMuX2lPLmR1cmF0aW9uIDogbnVsbCk7XHJcbiAgICAgIHMuZHVyYXRpb25Fc3RpbWF0ZSA9IG51bGw7XHJcbiAgICAgIHMuYnVmZmVyZWQgPSBbXTtcclxuXHJcbiAgICAgIC8vIGxlZ2FjeTogMUQgYXJyYXlcclxuICAgICAgcy5lcURhdGEgPSBbXTtcclxuXHJcbiAgICAgIHMuZXFEYXRhLmxlZnQgPSBbXTtcclxuICAgICAgcy5lcURhdGEucmlnaHQgPSBbXTtcclxuXHJcbiAgICAgIHMuZmFpbHVyZXMgPSAwO1xyXG4gICAgICBzLmlzQnVmZmVyaW5nID0gZmFsc2U7XHJcbiAgICAgIHMuaW5zdGFuY2VPcHRpb25zID0ge307XHJcbiAgICAgIHMuaW5zdGFuY2VDb3VudCA9IDA7XHJcbiAgICAgIHMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAgIHMubWV0YWRhdGEgPSB7fTtcclxuXHJcbiAgICAgIC8vIDAgPSB1bmluaXRpYWxpc2VkLCAxID0gbG9hZGluZywgMiA9IGZhaWxlZC9lcnJvciwgMyA9IGxvYWRlZC9zdWNjZXNzXHJcbiAgICAgIHMucmVhZHlTdGF0ZSA9IDA7XHJcblxyXG4gICAgICBzLm11dGVkID0gZmFsc2U7XHJcbiAgICAgIHMucGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICBzLnBlYWtEYXRhID0ge1xyXG4gICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgcmlnaHQ6IDBcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHMud2F2ZWZvcm1EYXRhID0ge1xyXG4gICAgICAgIGxlZnQ6IFtdLFxyXG4gICAgICAgIHJpZ2h0OiBbXVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgcy5wbGF5U3RhdGUgPSAwO1xyXG4gICAgICBzLnBvc2l0aW9uID0gbnVsbDtcclxuXHJcbiAgICAgIHMuaWQzID0ge307XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXNldFByb3BlcnRpZXMoKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBzZXVkby1wcml2YXRlIFNNU291bmQgaW50ZXJuYWxzXHJcbiAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICovXHJcblxyXG4gICAgdGhpcy5fb25UaW1lciA9IGZ1bmN0aW9uKGJGb3JjZSkge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEhUTUw1LW9ubHkgX3doaWxlcGxheWluZygpIGV0Yy5cclxuICAgICAgICogY2FsbGVkIGZyb20gYm90aCBIVE1MNSBuYXRpdmUgZXZlbnRzLCBhbmQgcG9sbGluZy9pbnRlcnZhbC1iYXNlZCB0aW1lcnNcclxuICAgICAgICogbWltaWNzIGZsYXNoIGFuZCBmaXJlcyBvbmx5IHdoZW4gdGltZS9kdXJhdGlvbiBjaGFuZ2UsIHNvIGFzIHRvIGJlIHBvbGxpbmctZnJpZW5kbHlcclxuICAgICAgICovXHJcblxyXG4gICAgICB2YXIgZHVyYXRpb24sIGlzTmV3ID0gZmFsc2UsIHRpbWUsIHggPSB7fTtcclxuXHJcbiAgICAgIGlmIChzLl9oYXNUaW1lciB8fCBiRm9yY2UpIHtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogTWF5IG5vdCBuZWVkIHRvIHRyYWNrIHJlYWR5U3RhdGUgKDEgPSBsb2FkaW5nKVxyXG5cclxuICAgICAgICBpZiAocy5fYSAmJiAoYkZvcmNlIHx8ICgocy5wbGF5U3RhdGUgPiAwIHx8IHMucmVhZHlTdGF0ZSA9PT0gMSkgJiYgIXMucGF1c2VkKSkpIHtcclxuXHJcbiAgICAgICAgICBkdXJhdGlvbiA9IHMuX2dldF9odG1sNV9kdXJhdGlvbigpO1xyXG5cclxuICAgICAgICAgIGlmIChkdXJhdGlvbiAhPT0gbGFzdEhUTUw1U3RhdGUuZHVyYXRpb24pIHtcclxuXHJcbiAgICAgICAgICAgIGxhc3RIVE1MNVN0YXRlLmR1cmF0aW9uID0gZHVyYXRpb247XHJcbiAgICAgICAgICAgIHMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgICAgaXNOZXcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBUT0RPOiBpbnZlc3RpZ2F0ZSB3aHkgdGhpcyBnb2VzIHdhY2sgaWYgbm90IHNldC9yZS1zZXQgZWFjaCB0aW1lLlxyXG4gICAgICAgICAgcy5kdXJhdGlvbkVzdGltYXRlID0gcy5kdXJhdGlvbjtcclxuXHJcbiAgICAgICAgICB0aW1lID0gKHMuX2EuY3VycmVudFRpbWUgKiBtc2VjU2NhbGUgfHwgMCk7XHJcblxyXG4gICAgICAgICAgaWYgKHRpbWUgIT09IGxhc3RIVE1MNVN0YXRlLnRpbWUpIHtcclxuXHJcbiAgICAgICAgICAgIGxhc3RIVE1MNVN0YXRlLnRpbWUgPSB0aW1lO1xyXG4gICAgICAgICAgICBpc05ldyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChpc05ldyB8fCBiRm9yY2UpIHtcclxuXHJcbiAgICAgICAgICAgIHMuX3doaWxlcGxheWluZyh0aW1lLHgseCx4LHgpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfS8qIGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIHNtMi5fd0QoJ19vblRpbWVyOiBXYXJuIGZvciBcIicrcy5pZCsnXCI6ICcrKCFzLl9hPydDb3VsZCBub3QgZmluZCBlbGVtZW50LiAnOicnKSsocy5wbGF5U3RhdGUgPT09IDA/J3BsYXlTdGF0ZSBiYWQsIDA/JzoncGxheVN0YXRlID0gJytzLnBsYXlTdGF0ZSsnLCBPSycpKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIH0qL1xyXG5cclxuICAgICAgICByZXR1cm4gaXNOZXc7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9nZXRfaHRtbDVfZHVyYXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTyxcclxuICAgICAgICAgIC8vIGlmIGF1ZGlvIG9iamVjdCBleGlzdHMsIHVzZSBpdHMgZHVyYXRpb24gLSBlbHNlLCBpbnN0YW5jZSBvcHRpb24gZHVyYXRpb24gKGlmIHByb3ZpZGVkIC0gaXQncyBhIGhhY2ssIHJlYWxseSwgYW5kIHNob3VsZCBiZSByZXRpcmVkKSBPUiBudWxsXHJcbiAgICAgICAgICBkID0gKHMuX2EgJiYgcy5fYS5kdXJhdGlvbiA/IHMuX2EuZHVyYXRpb24qbXNlY1NjYWxlIDogKGluc3RhbmNlT3B0aW9ucyAmJiBpbnN0YW5jZU9wdGlvbnMuZHVyYXRpb24gPyBpbnN0YW5jZU9wdGlvbnMuZHVyYXRpb24gOiBudWxsKSksXHJcbiAgICAgICAgICByZXN1bHQgPSAoZCAmJiAhaXNOYU4oZCkgJiYgZCAhPT0gSW5maW5pdHkgPyBkIDogbnVsbCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fYXBwbHlfbG9vcCA9IGZ1bmN0aW9uKGEsIG5Mb29wcykge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIGJvb2xlYW4gaW5zdGVhZCBvZiBcImxvb3BcIiwgZm9yIHdlYmtpdD8gLSBzcGVjIHNheXMgc3RyaW5nLiBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sLW1hcmt1cC9hdWRpby5odG1sI2F1ZGlvLmF0dHJzLmxvb3BcclxuICAgICAgICogbm90ZSB0aGF0IGxvb3AgaXMgZWl0aGVyIG9mZiBvciBpbmZpbml0ZSB1bmRlciBIVE1MNSwgdW5saWtlIEZsYXNoIHdoaWNoIGFsbG93cyBhcmJpdHJhcnkgbG9vcCBjb3VudHMgdG8gYmUgc3BlY2lmaWVkLlxyXG4gICAgICAgKi9cclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBpZiAoIWEubG9vcCAmJiBuTG9vcHMgPiAxKSB7XHJcbiAgICAgICAgc20yLl93RCgnTm90ZTogTmF0aXZlIEhUTUw1IGxvb3BpbmcgaXMgaW5maW5pdGUuJywgMSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgYS5sb29wID0gKG5Mb29wcyA+IDEgPyAnbG9vcCcgOiAnJyk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9zZXR1cF9odG1sNSA9IGZ1bmN0aW9uKG9PcHRpb25zKSB7XHJcblxyXG4gICAgICB2YXIgaW5zdGFuY2VPcHRpb25zID0gbWl4aW4ocy5faU8sIG9PcHRpb25zKSxcclxuICAgICAgICAgIGEgPSB1c2VHbG9iYWxIVE1MNUF1ZGlvID8gZ2xvYmFsSFRNTDVBdWRpbyA6IHMuX2EsXHJcbiAgICAgICAgICBkVVJMID0gZGVjb2RlVVJJKGluc3RhbmNlT3B0aW9ucy51cmwpLFxyXG4gICAgICAgICAgc2FtZVVSTDtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBcIkZpcnN0IHRoaW5ncyBmaXJzdCwgSSwgUG9wcGEuLi5cIiAocmVzZXQgdGhlIHByZXZpb3VzIHN0YXRlIG9mIHRoZSBvbGQgc291bmQsIGlmIHBsYXlpbmcpXHJcbiAgICAgICAqIEZpeGVzIGNhc2Ugd2l0aCBkZXZpY2VzIHRoYXQgY2FuIG9ubHkgcGxheSBvbmUgc291bmQgYXQgYSB0aW1lXHJcbiAgICAgICAqIE90aGVyd2lzZSwgb3RoZXIgc291bmRzIGluIG1pZC1wbGF5IHdpbGwgYmUgdGVybWluYXRlZCB3aXRob3V0IHdhcm5pbmcgYW5kIGluIGEgc3R1Y2sgc3RhdGVcclxuICAgICAgICovXHJcblxyXG4gICAgICBpZiAodXNlR2xvYmFsSFRNTDVBdWRpbykge1xyXG5cclxuICAgICAgICBpZiAoZFVSTCA9PT0gZGVjb2RlVVJJKGxhc3RHbG9iYWxIVE1MNVVSTCkpIHtcclxuICAgICAgICAgIC8vIGdsb2JhbCBIVE1MNSBhdWRpbzogcmUtdXNlIG9mIFVSTFxyXG4gICAgICAgICAgc2FtZVVSTCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChkVVJMID09PSBkZWNvZGVVUkkobGFzdFVSTCkpIHtcclxuXHJcbiAgICAgICAgLy8gb3B0aW9ucyBVUkwgaXMgdGhlIHNhbWUgYXMgdGhlIFwibGFzdFwiIFVSTCwgYW5kIHdlIHVzZWQgKGxvYWRlZCkgaXRcclxuICAgICAgICBzYW1lVVJMID0gdHJ1ZTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhKSB7XHJcblxyXG4gICAgICAgIGlmIChhLl9zKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHVzZUdsb2JhbEhUTUw1QXVkaW8pIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhLl9zICYmIGEuX3MucGxheVN0YXRlICYmICFzYW1lVVJMKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIGdsb2JhbCBIVE1MNSBhdWRpbyBjYXNlLCBhbmQgbG9hZGluZyBhIG5ldyBVUkwuIHN0b3AgdGhlIGN1cnJlbnRseS1wbGF5aW5nIG9uZS5cclxuICAgICAgICAgICAgICBhLl9zLnN0b3AoKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCF1c2VHbG9iYWxIVE1MNUF1ZGlvICYmIGRVUkwgPT09IGRlY29kZVVSSShsYXN0VVJMKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gbm9uLWdsb2JhbCBIVE1MNSByZXVzZSBjYXNlOiBzYW1lIHVybCwgaWdub3JlIHJlcXVlc3RcclxuICAgICAgICAgICAgcy5fYXBwbHlfbG9vcChhLCBpbnN0YW5jZU9wdGlvbnMubG9vcHMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGE7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc2FtZVVSTCkge1xyXG5cclxuICAgICAgICAgIC8vIGRvbid0IHJldGFpbiBvblBvc2l0aW9uKCkgc3R1ZmYgd2l0aCBuZXcgVVJMcy5cclxuXHJcbiAgICAgICAgICBpZiAobGFzdFVSTCkge1xyXG4gICAgICAgICAgICByZXNldFByb3BlcnRpZXMoZmFsc2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIGFzc2lnbiBuZXcgSFRNTDUgVVJMXHJcblxyXG4gICAgICAgICAgYS5zcmMgPSBpbnN0YW5jZU9wdGlvbnMudXJsO1xyXG5cclxuICAgICAgICAgIHMudXJsID0gaW5zdGFuY2VPcHRpb25zLnVybDtcclxuXHJcbiAgICAgICAgICBsYXN0VVJMID0gaW5zdGFuY2VPcHRpb25zLnVybDtcclxuXHJcbiAgICAgICAgICBsYXN0R2xvYmFsSFRNTDVVUkwgPSBpbnN0YW5jZU9wdGlvbnMudXJsO1xyXG5cclxuICAgICAgICAgIGEuX2NhbGxlZF9sb2FkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMuYXV0b0xvYWQgfHwgaW5zdGFuY2VPcHRpb25zLmF1dG9QbGF5KSB7XHJcblxyXG4gICAgICAgICAgcy5fYSA9IG5ldyBBdWRpbyhpbnN0YW5jZU9wdGlvbnMudXJsKTtcclxuICAgICAgICAgIHMuX2EubG9hZCgpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIG51bGwgZm9yIHN0dXBpZCBPcGVyYSA5LjY0IGNhc2VcclxuICAgICAgICAgIHMuX2EgPSAoaXNPcGVyYSAmJiBvcGVyYS52ZXJzaW9uKCkgPCAxMCA/IG5ldyBBdWRpbyhudWxsKSA6IG5ldyBBdWRpbygpKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhc3NpZ24gbG9jYWwgcmVmZXJlbmNlXHJcbiAgICAgICAgYSA9IHMuX2E7XHJcblxyXG4gICAgICAgIGEuX2NhbGxlZF9sb2FkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh1c2VHbG9iYWxIVE1MNUF1ZGlvKSB7XHJcblxyXG4gICAgICAgICAgZ2xvYmFsSFRNTDVBdWRpbyA9IGE7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuaXNIVE1MNSA9IHRydWU7XHJcblxyXG4gICAgICAvLyBzdG9yZSBhIHJlZiBvbiB0aGUgdHJhY2tcclxuICAgICAgcy5fYSA9IGE7XHJcblxyXG4gICAgICAvLyBzdG9yZSBhIHJlZiBvbiB0aGUgYXVkaW9cclxuICAgICAgYS5fcyA9IHM7XHJcblxyXG4gICAgICBhZGRfaHRtbDVfZXZlbnRzKCk7XHJcblxyXG4gICAgICBzLl9hcHBseV9sb29wKGEsIGluc3RhbmNlT3B0aW9ucy5sb29wcyk7XHJcblxyXG4gICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLmF1dG9Mb2FkIHx8IGluc3RhbmNlT3B0aW9ucy5hdXRvUGxheSkge1xyXG5cclxuICAgICAgICBzLmxvYWQoKTtcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgIC8vIGVhcmx5IEhUTUw1IGltcGxlbWVudGF0aW9uIChub24tc3RhbmRhcmQpXHJcbiAgICAgICAgYS5hdXRvYnVmZmVyID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIHN0YW5kYXJkICgnbm9uZScgaXMgYWxzbyBhbiBvcHRpb24uKVxyXG4gICAgICAgIGEucHJlbG9hZCA9ICdhdXRvJztcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBhO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgYWRkX2h0bWw1X2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHMuX2EuX2FkZGVkX2V2ZW50cykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGY7XHJcblxyXG4gICAgICBmdW5jdGlvbiBhZGQob0V2dCwgb0ZuLCBiQ2FwdHVyZSkge1xyXG4gICAgICAgIHJldHVybiBzLl9hID8gcy5fYS5hZGRFdmVudExpc3RlbmVyKG9FdnQsIG9GbiwgYkNhcHR1cmV8fGZhbHNlKSA6IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuX2EuX2FkZGVkX2V2ZW50cyA9IHRydWU7XHJcblxyXG4gICAgICBmb3IgKGYgaW4gaHRtbDVfZXZlbnRzKSB7XHJcbiAgICAgICAgaWYgKGh0bWw1X2V2ZW50cy5oYXNPd25Qcm9wZXJ0eShmKSkge1xyXG4gICAgICAgICAgYWRkKGYsIGh0bWw1X2V2ZW50c1tmXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJlbW92ZV9odG1sNV9ldmVudHMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBldmVudCBsaXN0ZW5lcnNcclxuXHJcbiAgICAgIHZhciBmO1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmVtb3ZlKG9FdnQsIG9GbiwgYkNhcHR1cmUpIHtcclxuICAgICAgICByZXR1cm4gKHMuX2EgPyBzLl9hLnJlbW92ZUV2ZW50TGlzdGVuZXIob0V2dCwgb0ZuLCBiQ2FwdHVyZXx8ZmFsc2UpIDogbnVsbCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IFJlbW92aW5nIGV2ZW50IGxpc3RlbmVycycpO1xyXG4gICAgICBzLl9hLl9hZGRlZF9ldmVudHMgPSBmYWxzZTtcclxuXHJcbiAgICAgIGZvciAoZiBpbiBodG1sNV9ldmVudHMpIHtcclxuICAgICAgICBpZiAoaHRtbDVfZXZlbnRzLmhhc093blByb3BlcnR5KGYpKSB7XHJcbiAgICAgICAgICByZW1vdmUoZiwgaHRtbDVfZXZlbnRzW2ZdKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHNldWRvLXByaXZhdGUgZXZlbnQgaW50ZXJuYWxzXHJcbiAgICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAqL1xyXG5cclxuICAgIHRoaXMuX29ubG9hZCA9IGZ1bmN0aW9uKG5TdWNjZXNzKSB7XHJcblxyXG4gICAgICB2YXIgZk4sXHJcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZHVyYXRpb24gdG8gcHJldmVudCBmYWxzZSBwb3NpdGl2ZXMgZnJvbSBmbGFzaCA4IHdoZW4gbG9hZGluZyBmcm9tIGNhY2hlLlxyXG4gICAgICAgICAgbG9hZE9LID0gISFuU3VjY2VzcyB8fCAoIXMuaXNIVE1MNSAmJiBmViA9PT0gOCAmJiBzLmR1cmF0aW9uKTtcclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBmTiA9IHMuaWQgKyAnOiAnO1xyXG4gICAgICBzbTIuX3dEKGZOICsgKGxvYWRPSyA/ICdvbmxvYWQoKScgOiAnRmFpbGVkIHRvIGxvYWQgLyBpbnZhbGlkIHNvdW5kPycgKyAoIXMuZHVyYXRpb24gPyAnIFplcm8tbGVuZ3RoIGR1cmF0aW9uIHJlcG9ydGVkLicgOiAnIC0nKSArICcgKCcgKyBzLnVybCArICcpJyksIChsb2FkT0sgPyAxIDogMikpO1xyXG4gICAgICBpZiAoIWxvYWRPSyAmJiAhcy5pc0hUTUw1KSB7XHJcbiAgICAgICAgaWYgKHNtMi5zYW5kYm94Lm5vUmVtb3RlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKGZOICsgc3RyKCdub05ldCcpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNtMi5zYW5kYm94Lm5vTG9jYWwgPT09IHRydWUpIHtcclxuICAgICAgICAgIHNtMi5fd0QoZk4gKyBzdHIoJ25vTG9jYWwnKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIHMubG9hZGVkID0gbG9hZE9LO1xyXG4gICAgICBzLnJlYWR5U3RhdGUgPSBsb2FkT0s/MzoyO1xyXG4gICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuXHJcbiAgICAgIGlmIChzLl9pTy5vbmxvYWQpIHtcclxuICAgICAgICB3cmFwQ2FsbGJhY2socywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBzLl9pTy5vbmxvYWQuYXBwbHkocywgW2xvYWRPS10pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX29uYnVmZmVyY2hhbmdlID0gZnVuY3Rpb24obklzQnVmZmVyaW5nKSB7XHJcblxyXG4gICAgICBpZiAocy5wbGF5U3RhdGUgPT09IDApIHtcclxuICAgICAgICAvLyBpZ25vcmUgaWYgbm90IHBsYXlpbmdcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgobklzQnVmZmVyaW5nICYmIHMuaXNCdWZmZXJpbmcpIHx8ICghbklzQnVmZmVyaW5nICYmICFzLmlzQnVmZmVyaW5nKSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcy5pc0J1ZmZlcmluZyA9IChuSXNCdWZmZXJpbmcgPT09IDEpO1xyXG4gICAgICBpZiAocy5faU8ub25idWZmZXJjaGFuZ2UpIHtcclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBCdWZmZXIgc3RhdGUgY2hhbmdlOiAnICsgbklzQnVmZmVyaW5nKTtcclxuICAgICAgICBzLl9pTy5vbmJ1ZmZlcmNoYW5nZS5hcHBseShzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBsYXliYWNrIG1heSBoYXZlIHN0b3BwZWQgZHVlIHRvIGJ1ZmZlcmluZywgb3IgcmVsYXRlZCByZWFzb24uXHJcbiAgICAgKiBUaGlzIHN0YXRlIGNhbiBiZSBlbmNvdW50ZXJlZCBvbiBpT1MgPCA2IHdoZW4gYXV0by1wbGF5IGlzIGJsb2NrZWQuXHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLl9vbnN1c3BlbmQgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmIChzLl9pTy5vbnN1c3BlbmQpIHtcclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBQbGF5YmFjayBzdXNwZW5kZWQnKTtcclxuICAgICAgICBzLl9pTy5vbnN1c3BlbmQuYXBwbHkocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmbGFzaCA5L21vdmllU3RhciArIFJUTVAtb25seSBtZXRob2QsIHNob3VsZCBmaXJlIG9ubHkgb25jZSBhdCBtb3N0XHJcbiAgICAgKiBhdCB0aGlzIHBvaW50IHdlIGp1c3QgcmVjcmVhdGUgZmFpbGVkIHNvdW5kcyByYXRoZXIgdGhhbiB0cnlpbmcgdG8gcmVjb25uZWN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB0aGlzLl9vbmZhaWx1cmUgPSBmdW5jdGlvbihtc2csIGxldmVsLCBjb2RlKSB7XHJcblxyXG4gICAgICBzLmZhaWx1cmVzKys7XHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IEZhaWx1cmVzID0gJyArIHMuZmFpbHVyZXMpO1xyXG5cclxuICAgICAgaWYgKHMuX2lPLm9uZmFpbHVyZSAmJiBzLmZhaWx1cmVzID09PSAxKSB7XHJcbiAgICAgICAgcy5faU8ub25mYWlsdXJlKHMsIG1zZywgbGV2ZWwsIGNvZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IElnbm9yaW5nIGZhaWx1cmUnKTtcclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5fb25maW5pc2ggPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIC8vIHN0b3JlIGxvY2FsIGNvcHkgYmVmb3JlIGl0IGdldHMgdHJhc2hlZC4uLlxyXG4gICAgICB2YXIgaW9fb25maW5pc2ggPSBzLl9pTy5vbmZpbmlzaDtcclxuXHJcbiAgICAgIHMuX29uYnVmZmVyY2hhbmdlKDApO1xyXG4gICAgICBzLl9yZXNldE9uUG9zaXRpb24oMCk7XHJcblxyXG4gICAgICAvLyByZXNldCBzb21lIHN0YXRlIGl0ZW1zXHJcbiAgICAgIGlmIChzLmluc3RhbmNlQ291bnQpIHtcclxuXHJcbiAgICAgICAgcy5pbnN0YW5jZUNvdW50LS07XHJcblxyXG4gICAgICAgIGlmICghcy5pbnN0YW5jZUNvdW50KSB7XHJcblxyXG4gICAgICAgICAgLy8gcmVtb3ZlIG9uUG9zaXRpb24gbGlzdGVuZXJzLCBpZiBhbnlcclxuICAgICAgICAgIGRldGFjaE9uUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAvLyByZXNldCBpbnN0YW5jZSBvcHRpb25zXHJcbiAgICAgICAgICBzLnBsYXlTdGF0ZSA9IDA7XHJcbiAgICAgICAgICBzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgcy5pbnN0YW5jZUNvdW50ID0gMDtcclxuICAgICAgICAgIHMuaW5zdGFuY2VPcHRpb25zID0ge307XHJcbiAgICAgICAgICBzLl9pTyA9IHt9O1xyXG4gICAgICAgICAgc3RvcF9odG1sNV90aW1lcigpO1xyXG5cclxuICAgICAgICAgIC8vIHJlc2V0IHBvc2l0aW9uLCB0b29cclxuICAgICAgICAgIGlmIChzLmlzSFRNTDUpIHtcclxuICAgICAgICAgICAgcy5wb3NpdGlvbiA9IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzLmluc3RhbmNlQ291bnQgfHwgcy5faU8ubXVsdGlTaG90RXZlbnRzKSB7XHJcbiAgICAgICAgICAvLyBmaXJlIG9uZmluaXNoIGZvciBsYXN0LCBvciBldmVyeSBpbnN0YW5jZVxyXG4gICAgICAgICAgaWYgKGlvX29uZmluaXNoKSB7XHJcbiAgICAgICAgICAgIHNtMi5fd0Qocy5pZCArICc6IG9uZmluaXNoKCknKTtcclxuICAgICAgICAgICAgd3JhcENhbGxiYWNrKHMsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGlvX29uZmluaXNoLmFwcGx5KHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl93aGlsZWxvYWRpbmcgPSBmdW5jdGlvbihuQnl0ZXNMb2FkZWQsIG5CeXRlc1RvdGFsLCBuRHVyYXRpb24sIG5CdWZmZXJMZW5ndGgpIHtcclxuXHJcbiAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnMgPSBzLl9pTztcclxuXHJcbiAgICAgIHMuYnl0ZXNMb2FkZWQgPSBuQnl0ZXNMb2FkZWQ7XHJcbiAgICAgIHMuYnl0ZXNUb3RhbCA9IG5CeXRlc1RvdGFsO1xyXG4gICAgICBzLmR1cmF0aW9uID0gTWF0aC5mbG9vcihuRHVyYXRpb24pO1xyXG4gICAgICBzLmJ1ZmZlckxlbmd0aCA9IG5CdWZmZXJMZW5ndGg7XHJcblxyXG4gICAgICBpZiAoIXMuaXNIVE1MNSAmJiAhaW5zdGFuY2VPcHRpb25zLmlzTW92aWVTdGFyKSB7XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMuZHVyYXRpb24pIHtcclxuICAgICAgICAgIC8vIHVzZSBkdXJhdGlvbiBmcm9tIG9wdGlvbnMsIGlmIHNwZWNpZmllZCBhbmQgbGFyZ2VyLiBub2JvZHkgc2hvdWxkIGJlIHNwZWNpZnlpbmcgZHVyYXRpb24gaW4gb3B0aW9ucywgYWN0dWFsbHksIGFuZCBpdCBzaG91bGQgYmUgcmV0aXJlZC5cclxuICAgICAgICAgIHMuZHVyYXRpb25Fc3RpbWF0ZSA9IChzLmR1cmF0aW9uID4gaW5zdGFuY2VPcHRpb25zLmR1cmF0aW9uKSA/IHMuZHVyYXRpb24gOiBpbnN0YW5jZU9wdGlvbnMuZHVyYXRpb247XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHMuZHVyYXRpb25Fc3RpbWF0ZSA9IHBhcnNlSW50KChzLmJ5dGVzVG90YWwgLyBzLmJ5dGVzTG9hZGVkKSAqIHMuZHVyYXRpb24sIDEwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICBzLmR1cmF0aW9uRXN0aW1hdGUgPSBzLmR1cmF0aW9uO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZm9yIGZsYXNoLCByZWZsZWN0IHNlcXVlbnRpYWwtbG9hZC1zdHlsZSBidWZmZXJpbmdcclxuICAgICAgaWYgKCFzLmlzSFRNTDUpIHtcclxuICAgICAgICBzLmJ1ZmZlcmVkID0gW3tcclxuICAgICAgICAgICdzdGFydCc6IDAsXHJcbiAgICAgICAgICAnZW5kJzogcy5kdXJhdGlvblxyXG4gICAgICAgIH1dO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhbGxvdyB3aGlsZWxvYWRpbmcgdG8gZmlyZSBldmVuIGlmIFwibG9hZFwiIGZpcmVkIHVuZGVyIEhUTUw1LCBkdWUgdG8gSFRUUCByYW5nZS9wYXJ0aWFsc1xyXG4gICAgICBpZiAoKHMucmVhZHlTdGF0ZSAhPT0gMyB8fCBzLmlzSFRNTDUpICYmIGluc3RhbmNlT3B0aW9ucy53aGlsZWxvYWRpbmcpIHtcclxuICAgICAgICBpbnN0YW5jZU9wdGlvbnMud2hpbGVsb2FkaW5nLmFwcGx5KHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl93aGlsZXBsYXlpbmcgPSBmdW5jdGlvbihuUG9zaXRpb24sIG9QZWFrRGF0YSwgb1dhdmVmb3JtRGF0YUxlZnQsIG9XYXZlZm9ybURhdGFSaWdodCwgb0VRRGF0YSkge1xyXG5cclxuICAgICAgdmFyIGluc3RhbmNlT3B0aW9ucyA9IHMuX2lPLFxyXG4gICAgICAgICAgZXFMZWZ0O1xyXG5cclxuICAgICAgaWYgKGlzTmFOKG5Qb3NpdGlvbikgfHwgblBvc2l0aW9uID09PSBudWxsKSB7XHJcbiAgICAgICAgLy8gZmxhc2ggc2FmZXR5IG5ldFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2FmYXJpIEhUTUw1IHBsYXkoKSBtYXkgcmV0dXJuIHNtYWxsIC12ZSB2YWx1ZXMgd2hlbiBzdGFydGluZyBmcm9tIHBvc2l0aW9uOiAwLCBlZy4gLTUwLjEyMDM5Njg3NS4gVW5leHBlY3RlZC9pbnZhbGlkIHBlciBXMywgSSB0aGluay4gTm9ybWFsaXplIHRvIDAuXHJcbiAgICAgIHMucG9zaXRpb24gPSBNYXRoLm1heCgwLCBuUG9zaXRpb24pO1xyXG5cclxuICAgICAgcy5fcHJvY2Vzc09uUG9zaXRpb24oKTtcclxuXHJcbiAgICAgIGlmICghcy5pc0hUTUw1ICYmIGZWID4gOCkge1xyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnVzZVBlYWtEYXRhICYmIG9QZWFrRGF0YSAhPT0gX3VuZGVmaW5lZCAmJiBvUGVha0RhdGEpIHtcclxuICAgICAgICAgIHMucGVha0RhdGEgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IG9QZWFrRGF0YS5sZWZ0UGVhayxcclxuICAgICAgICAgICAgcmlnaHQ6IG9QZWFrRGF0YS5yaWdodFBlYWtcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5zdGFuY2VPcHRpb25zLnVzZVdhdmVmb3JtRGF0YSAmJiBvV2F2ZWZvcm1EYXRhTGVmdCAhPT0gX3VuZGVmaW5lZCAmJiBvV2F2ZWZvcm1EYXRhTGVmdCkge1xyXG4gICAgICAgICAgcy53YXZlZm9ybURhdGEgPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IG9XYXZlZm9ybURhdGFMZWZ0LnNwbGl0KCcsJyksXHJcbiAgICAgICAgICAgIHJpZ2h0OiBvV2F2ZWZvcm1EYXRhUmlnaHQuc3BsaXQoJywnKVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnN0YW5jZU9wdGlvbnMudXNlRVFEYXRhKSB7XHJcbiAgICAgICAgICBpZiAob0VRRGF0YSAhPT0gX3VuZGVmaW5lZCAmJiBvRVFEYXRhICYmIG9FUURhdGEubGVmdEVRKSB7XHJcbiAgICAgICAgICAgIGVxTGVmdCA9IG9FUURhdGEubGVmdEVRLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgIHMuZXFEYXRhID0gZXFMZWZ0O1xyXG4gICAgICAgICAgICBzLmVxRGF0YS5sZWZ0ID0gZXFMZWZ0O1xyXG4gICAgICAgICAgICBpZiAob0VRRGF0YS5yaWdodEVRICE9PSBfdW5kZWZpbmVkICYmIG9FUURhdGEucmlnaHRFUSkge1xyXG4gICAgICAgICAgICAgIHMuZXFEYXRhLnJpZ2h0ID0gb0VRRGF0YS5yaWdodEVRLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocy5wbGF5U3RhdGUgPT09IDEpIHtcclxuXHJcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlL2hhY2s6IGVuc3VyZSBidWZmZXJpbmcgaXMgZmFsc2UgaWYgbG9hZGluZyBmcm9tIGNhY2hlIChhbmQgbm90IHlldCBzdGFydGVkKVxyXG4gICAgICAgIGlmICghcy5pc0hUTUw1ICYmIGZWID09PSA4ICYmICFzLnBvc2l0aW9uICYmIHMuaXNCdWZmZXJpbmcpIHtcclxuICAgICAgICAgIHMuX29uYnVmZmVyY2hhbmdlKDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluc3RhbmNlT3B0aW9ucy53aGlsZXBsYXlpbmcpIHtcclxuICAgICAgICAgIC8vIGZsYXNoIG1heSBjYWxsIGFmdGVyIGFjdHVhbCBmaW5pc2hcclxuICAgICAgICAgIGluc3RhbmNlT3B0aW9ucy53aGlsZXBsYXlpbmcuYXBwbHkocyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9vbmNhcHRpb25kYXRhID0gZnVuY3Rpb24ob0RhdGEpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBpbnRlcm5hbDogZmxhc2ggOSArIE5ldFN0cmVhbSAoTW92aWVTdGFyL1JUTVAtb25seSkgZmVhdHVyZVxyXG4gICAgICAgKlxyXG4gICAgICAgKiBAcGFyYW0ge29iamVjdH0gb0RhdGFcclxuICAgICAgICovXHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBDYXB0aW9uIGRhdGEgcmVjZWl2ZWQuJyk7XHJcblxyXG4gICAgICBzLmNhcHRpb25kYXRhID0gb0RhdGE7XHJcblxyXG4gICAgICBpZiAocy5faU8ub25jYXB0aW9uZGF0YSkge1xyXG4gICAgICAgIHMuX2lPLm9uY2FwdGlvbmRhdGEuYXBwbHkocywgW29EYXRhXSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuX29ubWV0YWRhdGEgPSBmdW5jdGlvbihvTURQcm9wcywgb01ERGF0YSkge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIGludGVybmFsOiBmbGFzaCA5ICsgTmV0U3RyZWFtIChNb3ZpZVN0YXIvUlRNUC1vbmx5KSBmZWF0dXJlXHJcbiAgICAgICAqIFJUTVAgbWF5IGluY2x1ZGUgc29uZyB0aXRsZSwgTW92aWVTdGFyIGNvbnRlbnQgbWF5IGluY2x1ZGUgZW5jb2RpbmcgaW5mb1xyXG4gICAgICAgKlxyXG4gICAgICAgKiBAcGFyYW0ge2FycmF5fSBvTURQcm9wcyAobmFtZXMpXHJcbiAgICAgICAqIEBwYXJhbSB7YXJyYXl9IG9NRERhdGEgKHZhbHVlcylcclxuICAgICAgICovXHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBNZXRhZGF0YSByZWNlaXZlZC4nKTtcclxuXHJcbiAgICAgIHZhciBvRGF0YSA9IHt9LCBpLCBqO1xyXG5cclxuICAgICAgZm9yIChpID0gMCwgaiA9IG9NRFByb3BzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xyXG4gICAgICAgIG9EYXRhW29NRFByb3BzW2ldXSA9IG9NRERhdGFbaV07XHJcbiAgICAgIH1cclxuICAgICAgcy5tZXRhZGF0YSA9IG9EYXRhO1xyXG5cclxuICAgICAgaWYgKHMuX2lPLm9ubWV0YWRhdGEpIHtcclxuICAgICAgICBzLl9pTy5vbm1ldGFkYXRhLmFwcGx5KHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9vbmlkMyA9IGZ1bmN0aW9uKG9JRDNQcm9wcywgb0lEM0RhdGEpIHtcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBpbnRlcm5hbDogZmxhc2ggOCArIGZsYXNoIDkgSUQzIGZlYXR1cmVcclxuICAgICAgICogbWF5IGluY2x1ZGUgYXJ0aXN0LCBzb25nIHRpdGxlIGV0Yy5cclxuICAgICAgICpcclxuICAgICAgICogQHBhcmFtIHthcnJheX0gb0lEM1Byb3BzIChuYW1lcylcclxuICAgICAgICogQHBhcmFtIHthcnJheX0gb0lEM0RhdGEgKHZhbHVlcylcclxuICAgICAgICovXHJcblxyXG4gICAgICBzbTIuX3dEKHMuaWQgKyAnOiBJRDMgZGF0YSByZWNlaXZlZC4nKTtcclxuXHJcbiAgICAgIHZhciBvRGF0YSA9IFtdLCBpLCBqO1xyXG5cclxuICAgICAgZm9yIChpID0gMCwgaiA9IG9JRDNQcm9wcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcclxuICAgICAgICBvRGF0YVtvSUQzUHJvcHNbaV1dID0gb0lEM0RhdGFbaV07XHJcbiAgICAgIH1cclxuICAgICAgcy5pZDMgPSBtaXhpbihzLmlkMywgb0RhdGEpO1xyXG5cclxuICAgICAgaWYgKHMuX2lPLm9uaWQzKSB7XHJcbiAgICAgICAgcy5faU8ub25pZDMuYXBwbHkocyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIGZsYXNoL1JUTVAtb25seVxyXG5cclxuICAgIHRoaXMuX29uY29ubmVjdCA9IGZ1bmN0aW9uKGJTdWNjZXNzKSB7XHJcblxyXG4gICAgICBiU3VjY2VzcyA9IChiU3VjY2VzcyA9PT0gMSk7XHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6ICcgKyAoYlN1Y2Nlc3MgPyAnQ29ubmVjdGVkLicgOiAnRmFpbGVkIHRvIGNvbm5lY3Q/IC0gJyArIHMudXJsKSwgKGJTdWNjZXNzID8gMSA6IDIpKTtcclxuICAgICAgcy5jb25uZWN0ZWQgPSBiU3VjY2VzcztcclxuXHJcbiAgICAgIGlmIChiU3VjY2Vzcykge1xyXG5cclxuICAgICAgICBzLmZhaWx1cmVzID0gMDtcclxuXHJcbiAgICAgICAgaWYgKGlkQ2hlY2socy5pZCkpIHtcclxuICAgICAgICAgIGlmIChzLmdldEF1dG9QbGF5KCkpIHtcclxuICAgICAgICAgICAgLy8gb25seSB1cGRhdGUgdGhlIHBsYXkgc3RhdGUgaWYgYXV0byBwbGF5aW5nXHJcbiAgICAgICAgICAgIHMucGxheShfdW5kZWZpbmVkLCBzLmdldEF1dG9QbGF5KCkpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChzLl9pTy5hdXRvTG9hZCkge1xyXG4gICAgICAgICAgICBzLmxvYWQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzLl9pTy5vbmNvbm5lY3QpIHtcclxuICAgICAgICAgIHMuX2lPLm9uY29ubmVjdC5hcHBseShzLCBbYlN1Y2Nlc3NdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLl9vbmRhdGFlcnJvciA9IGZ1bmN0aW9uKHNFcnJvcikge1xyXG5cclxuICAgICAgLy8gZmxhc2ggOSB3YXZlL2VxIGRhdGEgaGFuZGxlclxyXG4gICAgICAvLyBoYWNrOiBjYWxsZWQgYXQgc3RhcnQsIGFuZCBlbmQgZnJvbSBmbGFzaCBhdC9hZnRlciBvbmZpbmlzaCgpXHJcbiAgICAgIGlmIChzLnBsYXlTdGF0ZSA+IDApIHtcclxuICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBEYXRhIGVycm9yOiAnICsgc0Vycm9yKTtcclxuICAgICAgICBpZiAocy5faU8ub25kYXRhZXJyb3IpIHtcclxuICAgICAgICAgIHMuX2lPLm9uZGF0YWVycm9yLmFwcGx5KHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgLy8gPGQ+XHJcbiAgICB0aGlzLl9kZWJ1ZygpO1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9OyAvLyBTTVNvdW5kKClcclxuXHJcbiAgLyoqXHJcbiAgICogUHJpdmF0ZSBTb3VuZE1hbmFnZXIgaW50ZXJuYWxzXHJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICovXHJcblxyXG4gIGdldERvY3VtZW50ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgcmV0dXJuIChkb2MuYm9keSB8fCBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpWzBdKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaWQgPSBmdW5jdGlvbihzSUQpIHtcclxuXHJcbiAgICByZXR1cm4gZG9jLmdldEVsZW1lbnRCeUlkKHNJRCk7XHJcblxyXG4gIH07XHJcblxyXG4gIG1peGluID0gZnVuY3Rpb24ob01haW4sIG9BZGQpIHtcclxuXHJcbiAgICAvLyBub24tZGVzdHJ1Y3RpdmUgbWVyZ2VcclxuICAgIHZhciBvMSA9IChvTWFpbiB8fCB7fSksIG8yLCBvO1xyXG5cclxuICAgIC8vIGlmIHVuc3BlY2lmaWVkLCBvMiBpcyB0aGUgZGVmYXVsdCBvcHRpb25zIG9iamVjdFxyXG4gICAgbzIgPSAob0FkZCA9PT0gX3VuZGVmaW5lZCA/IHNtMi5kZWZhdWx0T3B0aW9ucyA6IG9BZGQpO1xyXG5cclxuICAgIGZvciAobyBpbiBvMikge1xyXG5cclxuICAgICAgaWYgKG8yLmhhc093blByb3BlcnR5KG8pICYmIG8xW29dID09PSBfdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgbzJbb10gIT09ICdvYmplY3QnIHx8IG8yW29dID09PSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgLy8gYXNzaWduIGRpcmVjdGx5XHJcbiAgICAgICAgICBvMVtvXSA9IG8yW29dO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIHJlY3Vyc2UgdGhyb3VnaCBvMlxyXG4gICAgICAgICAgbzFbb10gPSBtaXhpbihvMVtvXSwgbzJbb10pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvMTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd3JhcENhbGxiYWNrID0gZnVuY3Rpb24ob1NvdW5kLCBjYWxsYmFjaykge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogMDMvMDMvMjAxMzogRml4IGZvciBGbGFzaCBQbGF5ZXIgMTEuNi42MDIuMTcxICsgRmxhc2ggOCAoZmxhc2hWZXJzaW9uID0gOCkgU1dGIGlzc3VlXHJcbiAgICAgKiBzZXRUaW1lb3V0KCkgZml4IGZvciBjZXJ0YWluIFNNU291bmQgY2FsbGJhY2tzIGxpa2Ugb25sb2FkKCkgYW5kIG9uZmluaXNoKCksIHdoZXJlIHN1YnNlcXVlbnQgY2FsbHMgbGlrZSBwbGF5KCkgYW5kIGxvYWQoKSBmYWlsIHdoZW4gRmxhc2ggUGxheWVyIDExLjYuNjAyLjE3MSBpcyBpbnN0YWxsZWQsIGFuZCB1c2luZyBzb3VuZE1hbmFnZXIgd2l0aCBmbGFzaFZlcnNpb24gPSA4ICh3aGljaCBpcyB0aGUgZGVmYXVsdCkuXHJcbiAgICAgKiBOb3Qgc3VyZSBvZiBleGFjdCBjYXVzZS4gU3VzcGVjdCByYWNlIGNvbmRpdGlvbiBhbmQvb3IgaW52YWxpZCAoTmFOLXN0eWxlKSBwb3NpdGlvbiBhcmd1bWVudCB0cmlja2xpbmcgZG93biB0byB0aGUgbmV4dCBKUyAtPiBGbGFzaCBfc3RhcnQoKSBjYWxsLCBpbiB0aGUgcGxheSgpIGNhc2UuXHJcbiAgICAgKiBGaXg6IHNldFRpbWVvdXQoKSB0byB5aWVsZCwgcGx1cyBzYWZlciBudWxsIC8gTmFOIGNoZWNraW5nIG9uIHBvc2l0aW9uIGFyZ3VtZW50IHByb3ZpZGVkIHRvIEZsYXNoLlxyXG4gICAgICogaHR0cHM6Ly9nZXRzYXRpc2ZhY3Rpb24uY29tL3NjaGlsbG1hbmlhL3RvcGljcy9yZWNlbnRfY2hyb21lX3VwZGF0ZV9zZWVtc190b19oYXZlX2Jyb2tlbl9teV9zbTJfYXVkaW9fcGxheWVyXHJcbiAgICAgKi9cclxuICAgIGlmICghb1NvdW5kLmlzSFRNTDUgJiYgZlYgPT09IDgpIHtcclxuICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY2FsbGJhY2soKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLy8gYWRkaXRpb25hbCBzb3VuZE1hbmFnZXIgcHJvcGVydGllcyB0aGF0IHNvdW5kTWFuYWdlci5zZXR1cCgpIHdpbGwgYWNjZXB0XHJcblxyXG4gIGV4dHJhT3B0aW9ucyA9IHtcclxuICAgICdvbnJlYWR5JzogMSxcclxuICAgICdvbnRpbWVvdXQnOiAxLFxyXG4gICAgJ2RlZmF1bHRPcHRpb25zJzogMSxcclxuICAgICdmbGFzaDlPcHRpb25zJzogMSxcclxuICAgICdtb3ZpZVN0YXJPcHRpb25zJzogMVxyXG4gIH07XHJcblxyXG4gIGFzc2lnbiA9IGZ1bmN0aW9uKG8sIG9QYXJlbnQpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlY3Vyc2l2ZSBhc3NpZ25tZW50IG9mIHByb3BlcnRpZXMsIHNvdW5kTWFuYWdlci5zZXR1cCgpIGhlbHBlclxyXG4gICAgICogYWxsb3dzIHByb3BlcnR5IGFzc2lnbm1lbnQgYmFzZWQgb24gd2hpdGVsaXN0XHJcbiAgICAgKi9cclxuXHJcbiAgICB2YXIgaSxcclxuICAgICAgICByZXN1bHQgPSB0cnVlLFxyXG4gICAgICAgIGhhc1BhcmVudCA9IChvUGFyZW50ICE9PSBfdW5kZWZpbmVkKSxcclxuICAgICAgICBzZXR1cE9wdGlvbnMgPSBzbTIuc2V0dXBPcHRpb25zLFxyXG4gICAgICAgIGJvbnVzT3B0aW9ucyA9IGV4dHJhT3B0aW9ucztcclxuXHJcbiAgICAvLyA8ZD5cclxuXHJcbiAgICAvLyBpZiBzb3VuZE1hbmFnZXIuc2V0dXAoKSBjYWxsZWQsIHNob3cgYWNjZXB0ZWQgcGFyYW1ldGVycy5cclxuXHJcbiAgICBpZiAobyA9PT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICBmb3IgKGkgaW4gc2V0dXBPcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChzZXR1cE9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcclxuICAgICAgICAgIHJlc3VsdC5wdXNoKGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoaSBpbiBib251c09wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKGJvbnVzT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG5cclxuICAgICAgICAgIGlmICh0eXBlb2Ygc20yW2ldID09PSAnb2JqZWN0Jykge1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2goaSsnOiB7Li4ufScpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoc20yW2ldIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGkrJzogZnVuY3Rpb24oKSB7Li4ufScpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQucHVzaChpKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNtMi5fd0Qoc3RyKCdzZXR1cCcsIHJlc3VsdC5qb2luKCcsICcpKSk7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICBmb3IgKGkgaW4gbykge1xyXG5cclxuICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkoaSkpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgbm90IGFuIHtvYmplY3R9IHdlIHdhbnQgdG8gcmVjdXJzZSB0aHJvdWdoLi4uXHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb1tpXSAhPT0gJ29iamVjdCcgfHwgb1tpXSA9PT0gbnVsbCB8fCBvW2ldIGluc3RhbmNlb2YgQXJyYXkgfHwgb1tpXSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG5cclxuICAgICAgICAgIC8vIGNoZWNrIFwiYWxsb3dlZFwiIG9wdGlvbnNcclxuXHJcbiAgICAgICAgICBpZiAoaGFzUGFyZW50ICYmIGJvbnVzT3B0aW9uc1tvUGFyZW50XSAhPT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICAgICAgLy8gdmFsaWQgcmVjdXJzaXZlIC8gbmVzdGVkIG9iamVjdCBvcHRpb24sIGVnLiwgeyBkZWZhdWx0T3B0aW9uczogeyB2b2x1bWU6IDUwIH0gfVxyXG4gICAgICAgICAgICBzbTJbb1BhcmVudF1baV0gPSBvW2ldO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoc2V0dXBPcHRpb25zW2ldICE9PSBfdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IGFzc2lnbiB0byBzZXR1cE9wdGlvbnMgb2JqZWN0LCB3aGljaCBzb3VuZE1hbmFnZXIgcHJvcGVydHkgcmVmZXJlbmNlc1xyXG4gICAgICAgICAgICBzbTIuc2V0dXBPcHRpb25zW2ldID0gb1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFzc2lnbiBkaXJlY3RseSB0byBzb3VuZE1hbmFnZXIsIHRvb1xyXG4gICAgICAgICAgICBzbTJbaV0gPSBvW2ldO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoYm9udXNPcHRpb25zW2ldID09PSBfdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBpbnZhbGlkIG9yIGRpc2FsbG93ZWQgcGFyYW1ldGVyLiBjb21wbGFpbi5cclxuICAgICAgICAgICAgY29tcGxhaW4oc3RyKChzbTJbaV0gPT09IF91bmRlZmluZWQgPyAnc2V0dXBVbmRlZicgOiAnc2V0dXBFcnJvcicpLCBpKSwgMik7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIHZhbGlkIGV4dHJhT3B0aW9ucyAoYm9udXNPcHRpb25zKSBwYXJhbWV0ZXIuXHJcbiAgICAgICAgICAgICAqIGlzIGl0IGEgbWV0aG9kLCBsaWtlIG9ucmVhZHkvb250aW1lb3V0PyBjYWxsIGl0LlxyXG4gICAgICAgICAgICAgKiBtdWx0aXBsZSBwYXJhbWV0ZXJzIHNob3VsZCBiZSBpbiBhbiBhcnJheSwgZWcuIHNvdW5kTWFuYWdlci5zZXR1cCh7b25yZWFkeTogW215SGFuZGxlciwgbXlTY29wZV19KTtcclxuICAgICAgICAgICAgICovXHJcblxyXG4gICAgICAgICAgICBpZiAoc20yW2ldIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgc20yW2ldLmFwcGx5KHNtMiwgKG9baV0gaW5zdGFuY2VvZiBBcnJheT8gb1tpXSA6IFtvW2ldXSkpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gZ29vZCBvbGQtZmFzaGlvbmVkIGRpcmVjdCBhc3NpZ25tZW50XHJcbiAgICAgICAgICAgICAgc20yW2ldID0gb1tpXTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gcmVjdXJzaW9uIGNhc2UsIGVnLiwgeyBkZWZhdWx0T3B0aW9uczogeyAuLi4gfSB9XHJcblxyXG4gICAgICAgICAgaWYgKGJvbnVzT3B0aW9uc1tpXSA9PT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICAgICAgLy8gaW52YWxpZCBvciBkaXNhbGxvd2VkIHBhcmFtZXRlci4gY29tcGxhaW4uXHJcbiAgICAgICAgICAgIGNvbXBsYWluKHN0cigoc20yW2ldID09PSBfdW5kZWZpbmVkID8gJ3NldHVwVW5kZWYnIDogJ3NldHVwRXJyb3InKSwgaSksIDIpO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlY3Vyc2UgdGhyb3VnaCBvYmplY3RcclxuICAgICAgICAgICAgcmV0dXJuIGFzc2lnbihvW2ldLCBpKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgfTtcclxuXHJcbiAgZnVuY3Rpb24gcHJlZmVyRmxhc2hDaGVjayhraW5kKSB7XHJcblxyXG4gICAgLy8gd2hldGhlciBmbGFzaCBzaG91bGQgcGxheSBhIGdpdmVuIHR5cGVcclxuICAgIHJldHVybiAoc20yLnByZWZlckZsYXNoICYmIGhhc0ZsYXNoICYmICFzbTIuaWdub3JlRmxhc2ggJiYgKHNtMi5mbGFzaFtraW5kXSAhPT0gX3VuZGVmaW5lZCAmJiBzbTIuZmxhc2hba2luZF0pKTtcclxuXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnRlcm5hbCBET00yLWxldmVsIGV2ZW50IGhlbHBlcnNcclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKi9cclxuXHJcbiAgZXZlbnQgPSAoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gbm9ybWFsaXplIGV2ZW50IG1ldGhvZHNcclxuICAgIHZhciBvbGQgPSAod2luZG93LmF0dGFjaEV2ZW50KSxcclxuICAgIGV2dCA9IHtcclxuICAgICAgYWRkOiAob2xkPydhdHRhY2hFdmVudCc6J2FkZEV2ZW50TGlzdGVuZXInKSxcclxuICAgICAgcmVtb3ZlOiAob2xkPydkZXRhY2hFdmVudCc6J3JlbW92ZUV2ZW50TGlzdGVuZXInKVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBub3JtYWxpemUgXCJvblwiIGV2ZW50IHByZWZpeCwgb3B0aW9uYWwgY2FwdHVyZSBhcmd1bWVudFxyXG4gICAgZnVuY3Rpb24gZ2V0QXJncyhvQXJncykge1xyXG5cclxuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKG9BcmdzKSxcclxuICAgICAgICAgIGxlbiA9IGFyZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKG9sZCkge1xyXG4gICAgICAgIC8vIHByZWZpeFxyXG4gICAgICAgIGFyZ3NbMV0gPSAnb24nICsgYXJnc1sxXTtcclxuICAgICAgICBpZiAobGVuID4gMykge1xyXG4gICAgICAgICAgLy8gbm8gY2FwdHVyZVxyXG4gICAgICAgICAgYXJncy5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAobGVuID09PSAzKSB7XHJcbiAgICAgICAgYXJncy5wdXNoKGZhbHNlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGFyZ3M7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5KGFyZ3MsIHNUeXBlKSB7XHJcblxyXG4gICAgICAvLyBub3JtYWxpemUgYW5kIGNhbGwgdGhlIGV2ZW50IG1ldGhvZCwgd2l0aCB0aGUgcHJvcGVyIGFyZ3VtZW50c1xyXG4gICAgICB2YXIgZWxlbWVudCA9IGFyZ3Muc2hpZnQoKSxcclxuICAgICAgICAgIG1ldGhvZCA9IFtldnRbc1R5cGVdXTtcclxuXHJcbiAgICAgIGlmIChvbGQpIHtcclxuICAgICAgICAvLyBvbGQgSUUgY2FuJ3QgZG8gYXBwbHkoKS5cclxuICAgICAgICBlbGVtZW50W21ldGhvZF0oYXJnc1swXSwgYXJnc1sxXSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbWVudFttZXRob2RdLmFwcGx5KGVsZW1lbnQsIGFyZ3MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFkZCgpIHtcclxuXHJcbiAgICAgIGFwcGx5KGdldEFyZ3MoYXJndW1lbnRzKSwgJ2FkZCcpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZW1vdmUoKSB7XHJcblxyXG4gICAgICBhcHBseShnZXRBcmdzKGFyZ3VtZW50cyksICdyZW1vdmUnKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgJ2FkZCc6IGFkZCxcclxuICAgICAgJ3JlbW92ZSc6IHJlbW92ZVxyXG4gICAgfTtcclxuXHJcbiAgfSgpKTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW50ZXJuYWwgSFRNTDUgZXZlbnQgaGFuZGxpbmdcclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqL1xyXG5cclxuICBmdW5jdGlvbiBodG1sNV9ldmVudChvRm4pIHtcclxuXHJcbiAgICAvLyB3cmFwIGh0bWw1IGV2ZW50IGhhbmRsZXJzIHNvIHdlIGRvbid0IGNhbGwgdGhlbSBvbiBkZXN0cm95ZWQgYW5kL29yIHVubG9hZGVkIHNvdW5kc1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihlKSB7XHJcblxyXG4gICAgICB2YXIgcyA9IHRoaXMuX3MsXHJcbiAgICAgICAgICByZXN1bHQ7XHJcblxyXG4gICAgICBpZiAoIXMgfHwgIXMuX2EpIHtcclxuICAgICAgICAvLyA8ZD5cclxuICAgICAgICBpZiAocyAmJiBzLmlkKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBJZ25vcmluZyAnICsgZS50eXBlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc20yLl93RChoNSArICdJZ25vcmluZyAnICsgZS50eXBlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gPC9kPlxyXG4gICAgICAgIHJlc3VsdCA9IG51bGw7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gb0ZuLmNhbGwodGhpcywgZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgfVxyXG5cclxuICBodG1sNV9ldmVudHMgPSB7XHJcblxyXG4gICAgLy8gSFRNTDUgZXZlbnQtbmFtZS10by1oYW5kbGVyIG1hcFxyXG5cclxuICAgIGFib3J0OiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IGFib3J0Jyk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgLy8gZW5vdWdoIGhhcyBsb2FkZWQgdG8gcGxheVxyXG5cclxuICAgIGNhbnBsYXk6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHMgPSB0aGlzLl9zLFxyXG4gICAgICAgICAgcG9zaXRpb24xSztcclxuXHJcbiAgICAgIGlmIChzLl9odG1sNV9jYW5wbGF5KSB7XHJcbiAgICAgICAgLy8gdGhpcyBldmVudCBoYXMgYWxyZWFkeSBmaXJlZC4gaWdub3JlLlxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzLl9odG1sNV9jYW5wbGF5ID0gdHJ1ZTtcclxuICAgICAgc20yLl93RChzLmlkICsgJzogY2FucGxheScpO1xyXG4gICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuXHJcbiAgICAgIC8vIHBvc2l0aW9uIGFjY29yZGluZyB0byBpbnN0YW5jZSBvcHRpb25zXHJcbiAgICAgIHBvc2l0aW9uMUsgPSAocy5faU8ucG9zaXRpb24gIT09IF91bmRlZmluZWQgJiYgIWlzTmFOKHMuX2lPLnBvc2l0aW9uKT9zLl9pTy5wb3NpdGlvbi9tc2VjU2NhbGU6bnVsbCk7XHJcblxyXG4gICAgICAvLyBzZXQgdGhlIHBvc2l0aW9uIGlmIHBvc2l0aW9uIHdhcyBzZXQgYmVmb3JlIHRoZSBzb3VuZCBsb2FkZWRcclxuICAgICAgaWYgKHMucG9zaXRpb24gJiYgdGhpcy5jdXJyZW50VGltZSAhPT0gcG9zaXRpb24xSykge1xyXG4gICAgICAgIHNtMi5fd0Qocy5pZCArICc6IGNhbnBsYXk6IFNldHRpbmcgcG9zaXRpb24gdG8gJyArIHBvc2l0aW9uMUspO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmN1cnJlbnRUaW1lID0gcG9zaXRpb24xSztcclxuICAgICAgICB9IGNhdGNoKGVlKSB7XHJcbiAgICAgICAgICBzbTIuX3dEKHMuaWQgKyAnOiBjYW5wbGF5OiBTZXR0aW5nIHBvc2l0aW9uIG9mICcgKyBwb3NpdGlvbjFLICsgJyBmYWlsZWQ6ICcgKyBlZS5tZXNzYWdlLCAyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGhhY2sgZm9yIEhUTUw1IGZyb20vdG8gY2FzZVxyXG4gICAgICBpZiAocy5faU8uX29uY2FucGxheSkge1xyXG4gICAgICAgIHMuX2lPLl9vbmNhbnBsYXkoKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIGNhbnBsYXl0aHJvdWdoOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcztcclxuXHJcbiAgICAgIGlmICghcy5sb2FkZWQpIHtcclxuICAgICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuICAgICAgICBzLl93aGlsZWxvYWRpbmcocy5ieXRlc0xvYWRlZCwgcy5ieXRlc1RvdGFsLCBzLl9nZXRfaHRtbDVfZHVyYXRpb24oKSk7XHJcbiAgICAgICAgcy5fb25sb2FkKHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgLy8gVE9ETzogUmVzZXJ2ZWQgZm9yIHBvdGVudGlhbCB1c2VcclxuICAgIC8qXHJcbiAgICBlbXB0aWVkOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IGVtcHRpZWQnKTtcclxuXHJcbiAgICB9KSxcclxuICAgICovXHJcblxyXG4gICAgZW5kZWQ6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHMgPSB0aGlzLl9zO1xyXG5cclxuICAgICAgc20yLl93RChzLmlkICsgJzogZW5kZWQnKTtcclxuXHJcbiAgICAgIHMuX29uZmluaXNoKCk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgZXJyb3I6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogSFRNTDUgZXJyb3IsIGNvZGUgJyArIHRoaXMuZXJyb3IuY29kZSk7XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBIVE1MNSBlcnJvciBjb2RlcywgcGVyIFczQ1xyXG4gICAgICAgKiBFcnJvciAxOiBDbGllbnQgYWJvcnRlZCBkb3dubG9hZCBhdCB1c2VyJ3MgcmVxdWVzdC5cclxuICAgICAgICogRXJyb3IgMjogTmV0d29yayBlcnJvciBhZnRlciBsb2FkIHN0YXJ0ZWQuXHJcbiAgICAgICAqIEVycm9yIDM6IERlY29kaW5nIGlzc3VlLlxyXG4gICAgICAgKiBFcnJvciA0OiBNZWRpYSAoYXVkaW8gZmlsZSkgbm90IHN1cHBvcnRlZC5cclxuICAgICAgICogUmVmZXJlbmNlOiBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS90aGUtdmlkZW8tZWxlbWVudC5odG1sI2Vycm9yLWNvZGVzXHJcbiAgICAgICAqL1xyXG4gICAgICAvLyBjYWxsIGxvYWQgd2l0aCBlcnJvciBzdGF0ZT9cclxuICAgICAgdGhpcy5fcy5fb25sb2FkKGZhbHNlKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBsb2FkZWRkYXRhOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcztcclxuXHJcbiAgICAgIHNtMi5fd0Qocy5pZCArICc6IGxvYWRlZGRhdGEnKTtcclxuXHJcbiAgICAgIC8vIHNhZmFyaSBzZWVtcyB0byBuaWNlbHkgcmVwb3J0IHByb2dyZXNzIGV2ZW50cywgZXZlbnR1YWxseSB0b3RhbGxpbmcgMTAwJVxyXG4gICAgICBpZiAoIXMuX2xvYWRlZCAmJiAhaXNTYWZhcmkpIHtcclxuICAgICAgICBzLmR1cmF0aW9uID0gcy5fZ2V0X2h0bWw1X2R1cmF0aW9uKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBsb2FkZWRtZXRhZGF0YTogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBsb2FkZWRtZXRhZGF0YScpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIGxvYWRzdGFydDogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBsb2Fkc3RhcnQnKTtcclxuICAgICAgLy8gYXNzdW1lIGJ1ZmZlcmluZyBhdCBmaXJzdFxyXG4gICAgICB0aGlzLl9zLl9vbmJ1ZmZlcmNoYW5nZSgxKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBwbGF5OiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIC8vIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHBsYXkoKScpO1xyXG4gICAgICAvLyBvbmNlIHBsYXkgc3RhcnRzLCBubyBidWZmZXJpbmdcclxuICAgICAgdGhpcy5fcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcblxyXG4gICAgfSksXHJcblxyXG4gICAgcGxheWluZzogaHRtbDVfZXZlbnQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzbTIuX3dEKHRoaXMuX3MuaWQgKyAnOiBwbGF5aW5nJyk7XHJcbiAgICAgIC8vIG9uY2UgcGxheSBzdGFydHMsIG5vIGJ1ZmZlcmluZ1xyXG4gICAgICB0aGlzLl9zLl9vbmJ1ZmZlcmNoYW5nZSgwKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBwcm9ncmVzczogaHRtbDVfZXZlbnQoZnVuY3Rpb24oZSkge1xyXG5cclxuICAgICAgLy8gbm90ZTogY2FuIGZpcmUgcmVwZWF0ZWRseSBhZnRlciBcImxvYWRlZFwiIGV2ZW50LCBkdWUgdG8gdXNlIG9mIEhUVFAgcmFuZ2UvcGFydGlhbHNcclxuXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcyxcclxuICAgICAgICAgIGksIGosIHByb2dTdHIsIGJ1ZmZlcmVkID0gMCxcclxuICAgICAgICAgIGlzUHJvZ3Jlc3MgPSAoZS50eXBlID09PSAncHJvZ3Jlc3MnKSxcclxuICAgICAgICAgIHJhbmdlcyA9IGUudGFyZ2V0LmJ1ZmZlcmVkLFxyXG4gICAgICAgICAgLy8gZmlyZWZveCAzLjYgaW1wbGVtZW50cyBlLmxvYWRlZC90b3RhbCAoYnl0ZXMpXHJcbiAgICAgICAgICBsb2FkZWQgPSAoZS5sb2FkZWR8fDApLFxyXG4gICAgICAgICAgdG90YWwgPSAoZS50b3RhbHx8MSk7XHJcblxyXG4gICAgICAvLyByZXNldCB0aGUgXCJidWZmZXJlZFwiIChsb2FkZWQgYnl0ZSByYW5nZXMpIGFycmF5XHJcbiAgICAgIHMuYnVmZmVyZWQgPSBbXTtcclxuXHJcbiAgICAgIGlmIChyYW5nZXMgJiYgcmFuZ2VzLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAvLyBpZiBsb2FkZWQgaXMgMCwgdHJ5IFRpbWVSYW5nZXMgaW1wbGVtZW50YXRpb24gYXMgJSBvZiBsb2FkXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vRE9NL1RpbWVSYW5nZXNcclxuXHJcbiAgICAgICAgLy8gcmUtYnVpbGQgXCJidWZmZXJlZFwiIGFycmF5XHJcbiAgICAgICAgLy8gSFRNTDUgcmV0dXJucyBzZWNvbmRzLiBTTTIgQVBJIHVzZXMgbXNlYyBmb3Igc2V0UG9zaXRpb24oKSBldGMuLCB3aGV0aGVyIEZsYXNoIG9yIEhUTUw1LlxyXG4gICAgICAgIGZvciAoaT0wLCBqPXJhbmdlcy5sZW5ndGg7IGk8ajsgaSsrKSB7XHJcbiAgICAgICAgICBzLmJ1ZmZlcmVkLnB1c2goe1xyXG4gICAgICAgICAgICAnc3RhcnQnOiByYW5nZXMuc3RhcnQoaSkgKiBtc2VjU2NhbGUsXHJcbiAgICAgICAgICAgICdlbmQnOiByYW5nZXMuZW5kKGkpICogbXNlY1NjYWxlXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHVzZSB0aGUgbGFzdCB2YWx1ZSBsb2NhbGx5XHJcbiAgICAgICAgYnVmZmVyZWQgPSAocmFuZ2VzLmVuZCgwKSAtIHJhbmdlcy5zdGFydCgwKSkgKiBtc2VjU2NhbGU7XHJcblxyXG4gICAgICAgIC8vIGxpbmVhciBjYXNlLCBidWZmZXIgc3VtOyBkb2VzIG5vdCBhY2NvdW50IGZvciBzZWVraW5nIGFuZCBIVFRQIHBhcnRpYWxzIC8gYnl0ZSByYW5nZXNcclxuICAgICAgICBsb2FkZWQgPSBNYXRoLm1pbigxLCBidWZmZXJlZC8oZS50YXJnZXQuZHVyYXRpb24qbXNlY1NjYWxlKSk7XHJcblxyXG4gICAgICAgIC8vIDxkPlxyXG4gICAgICAgIGlmIChpc1Byb2dyZXNzICYmIHJhbmdlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICBwcm9nU3RyID0gW107XHJcbiAgICAgICAgICBqID0gcmFuZ2VzLmxlbmd0aDtcclxuICAgICAgICAgIGZvciAoaT0wOyBpPGo7IGkrKykge1xyXG4gICAgICAgICAgICBwcm9nU3RyLnB1c2goZS50YXJnZXQuYnVmZmVyZWQuc3RhcnQoaSkqbXNlY1NjYWxlICsnLScrIGUudGFyZ2V0LmJ1ZmZlcmVkLmVuZChpKSptc2VjU2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogcHJvZ3Jlc3MsIHRpbWVSYW5nZXM6ICcgKyBwcm9nU3RyLmpvaW4oJywgJykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzUHJvZ3Jlc3MgJiYgIWlzTmFOKGxvYWRlZCkpIHtcclxuICAgICAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHByb2dyZXNzLCAnICsgTWF0aC5mbG9vcihsb2FkZWQqMTAwKSArICclIGxvYWRlZCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIWlzTmFOKGxvYWRlZCkpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgcHJvZ3Jlc3MsIGxpa2VseSBub3QgYnVmZmVyaW5nXHJcbiAgICAgICAgcy5fb25idWZmZXJjaGFuZ2UoMCk7XHJcbiAgICAgICAgLy8gVE9ETzogcHJldmVudCBjYWxscyB3aXRoIGR1cGxpY2F0ZSB2YWx1ZXMuXHJcbiAgICAgICAgcy5fd2hpbGVsb2FkaW5nKGxvYWRlZCwgdG90YWwsIHMuX2dldF9odG1sNV9kdXJhdGlvbigpKTtcclxuICAgICAgICBpZiAobG9hZGVkICYmIHRvdGFsICYmIGxvYWRlZCA9PT0gdG90YWwpIHtcclxuICAgICAgICAgIC8vIGluIGNhc2UgXCJvbmxvYWRcIiBkb2Vzbid0IGZpcmUgKGVnLiBnZWNrbyAxLjkuMilcclxuICAgICAgICAgIGh0bWw1X2V2ZW50cy5jYW5wbGF5dGhyb3VnaC5jYWxsKHRoaXMsIGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICByYXRlY2hhbmdlOiBodG1sNV9ldmVudChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHJhdGVjaGFuZ2UnKTtcclxuXHJcbiAgICB9KSxcclxuXHJcbiAgICBzdXNwZW5kOiBodG1sNV9ldmVudChmdW5jdGlvbihlKSB7XHJcblxyXG4gICAgICAvLyBkb3dubG9hZCBwYXVzZWQvc3RvcHBlZCwgbWF5IGhhdmUgZmluaXNoZWQgKGVnLiBvbmxvYWQpXHJcbiAgICAgIHZhciBzID0gdGhpcy5fcztcclxuXHJcbiAgICAgIHNtMi5fd0QodGhpcy5fcy5pZCArICc6IHN1c3BlbmQnKTtcclxuICAgICAgaHRtbDVfZXZlbnRzLnByb2dyZXNzLmNhbGwodGhpcywgZSk7XHJcbiAgICAgIHMuX29uc3VzcGVuZCgpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIHN0YWxsZWQ6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogc3RhbGxlZCcpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIHRpbWV1cGRhdGU6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fcy5fb25UaW1lcigpO1xyXG5cclxuICAgIH0pLFxyXG5cclxuICAgIHdhaXRpbmc6IGh0bWw1X2V2ZW50KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHMgPSB0aGlzLl9zO1xyXG5cclxuICAgICAgLy8gc2VlIGFsc286IHNlZWtpbmdcclxuICAgICAgc20yLl93RCh0aGlzLl9zLmlkICsgJzogd2FpdGluZycpO1xyXG5cclxuICAgICAgLy8gcGxheWJhY2sgZmFzdGVyIHRoYW4gZG93bmxvYWQgcmF0ZSwgZXRjLlxyXG4gICAgICBzLl9vbmJ1ZmZlcmNoYW5nZSgxKTtcclxuXHJcbiAgICB9KVxyXG5cclxuICB9O1xyXG5cclxuICBodG1sNU9LID0gZnVuY3Rpb24oaU8pIHtcclxuXHJcbiAgICAvLyBwbGF5YWJpbGl0eSB0ZXN0IGJhc2VkIG9uIFVSTCBvciBNSU1FIHR5cGVcclxuXHJcbiAgICB2YXIgcmVzdWx0O1xyXG5cclxuICAgIGlmICghaU8gfHwgKCFpTy50eXBlICYmICFpTy51cmwgJiYgIWlPLnNlcnZlclVSTCkpIHtcclxuXHJcbiAgICAgIC8vIG5vdGhpbmcgdG8gY2hlY2tcclxuICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgfSBlbHNlIGlmIChpTy5zZXJ2ZXJVUkwgfHwgKGlPLnR5cGUgJiYgcHJlZmVyRmxhc2hDaGVjayhpTy50eXBlKSkpIHtcclxuXHJcbiAgICAgIC8vIFJUTVAsIG9yIHByZWZlcnJpbmcgZmxhc2hcclxuICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFVzZSB0eXBlLCBpZiBzcGVjaWZpZWQuIFBhc3MgZGF0YTogVVJJcyB0byBIVE1MNS4gSWYgSFRNTDUtb25seSBtb2RlLCBubyBvdGhlciBvcHRpb25zLCBzbyBqdXN0IGdpdmUgJ2VyXHJcbiAgICAgIHJlc3VsdCA9ICgoaU8udHlwZSA/IGh0bWw1Q2FuUGxheSh7dHlwZTppTy50eXBlfSkgOiBodG1sNUNhblBsYXkoe3VybDppTy51cmx9KSB8fCBzbTIuaHRtbDVPbmx5IHx8IGlPLnVybC5tYXRjaCgvZGF0YVxcOi9pKSkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICBodG1sNVVubG9hZCA9IGZ1bmN0aW9uKG9BdWRpbykge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50ZXJuYWwgbWV0aG9kOiBVbmxvYWQgbWVkaWEsIGFuZCBjYW5jZWwgYW55IGN1cnJlbnQvcGVuZGluZyBuZXR3b3JrIHJlcXVlc3RzLlxyXG4gICAgICogRmlyZWZveCBjYW4gbG9hZCBhbiBlbXB0eSBVUkwsIHdoaWNoIGFsbGVnZWRseSBkZXN0cm95cyB0aGUgZGVjb2RlciBhbmQgc3RvcHMgdGhlIGRvd25sb2FkLlxyXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vVXNpbmdfYXVkaW9fYW5kX3ZpZGVvX2luX0ZpcmVmb3gjU3RvcHBpbmdfdGhlX2Rvd25sb2FkX29mX21lZGlhXHJcbiAgICAgKiBIb3dldmVyLCBGaXJlZm94IGhhcyBiZWVuIHNlZW4gbG9hZGluZyBhIHJlbGF0aXZlIFVSTCBmcm9tICcnIGFuZCB0aHVzIHJlcXVlc3RpbmcgdGhlIGhvc3RpbmcgcGFnZSBvbiB1bmxvYWQuXHJcbiAgICAgKiBPdGhlciBVQSBiZWhhdmlvdXIgaXMgdW5jbGVhciwgc28gZXZlcnlvbmUgZWxzZSBnZXRzIGFuIGFib3V0OmJsYW5rLXN0eWxlIFVSTC5cclxuICAgICAqL1xyXG5cclxuICAgIHZhciB1cmw7XHJcblxyXG4gICAgaWYgKG9BdWRpbykge1xyXG5cclxuICAgICAgLy8gRmlyZWZveCBhbmQgQ2hyb21lIGFjY2VwdCBzaG9ydCBXQVZlIGRhdGE6IFVSSXMuIENob21lIGRpc2xpa2VzIGF1ZGlvL3dhdiwgYnV0IGFjY2VwdHMgYXVkaW8vd2F2IGZvciBkYXRhOiBNSU1FLlxyXG4gICAgICAvLyBEZXNrdG9wIFNhZmFyaSBjb21wbGFpbnMgLyBmYWlscyBvbiBkYXRhOiBVUkksIHNvIGl0IGdldHMgYWJvdXQ6YmxhbmsuXHJcbiAgICAgIHVybCA9IChpc1NhZmFyaSA/IGVtcHR5VVJMIDogKHNtMi5odG1sNS5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2JykgPyBlbXB0eVdBViA6IGVtcHR5VVJMKSk7XHJcblxyXG4gICAgICBvQXVkaW8uc3JjID0gdXJsO1xyXG5cclxuICAgICAgLy8gcmVzZXQgc29tZSBzdGF0ZSwgdG9vXHJcbiAgICAgIGlmIChvQXVkaW8uX2NhbGxlZF91bmxvYWQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG9BdWRpby5fY2FsbGVkX2xvYWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAodXNlR2xvYmFsSFRNTDVBdWRpbykge1xyXG5cclxuICAgICAgLy8gZW5zdXJlIFVSTCBzdGF0ZSBpcyB0cmFzaGVkLCBhbHNvXHJcbiAgICAgIGxhc3RHbG9iYWxIVE1MNVVSTCA9IG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1cmw7XHJcblxyXG4gIH07XHJcblxyXG4gIGh0bWw1Q2FuUGxheSA9IGZ1bmN0aW9uKG8pIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyeSB0byBmaW5kIE1JTUUsIHRlc3QgYW5kIHJldHVybiB0cnV0aGluZXNzXHJcbiAgICAgKiBvID0ge1xyXG4gICAgICogIHVybDogJy9wYXRoL3RvL2FuLm1wMycsXHJcbiAgICAgKiAgdHlwZTogJ2F1ZGlvL21wMydcclxuICAgICAqIH1cclxuICAgICAqL1xyXG5cclxuICAgIGlmICghc20yLnVzZUhUTUw1QXVkaW8gfHwgIXNtMi5oYXNIVE1MNSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHVybCA9IChvLnVybCB8fCBudWxsKSxcclxuICAgICAgICBtaW1lID0gKG8udHlwZSB8fCBudWxsKSxcclxuICAgICAgICBhRiA9IHNtMi5hdWRpb0Zvcm1hdHMsXHJcbiAgICAgICAgcmVzdWx0LFxyXG4gICAgICAgIG9mZnNldCxcclxuICAgICAgICBmaWxlRXh0LFxyXG4gICAgICAgIGl0ZW07XHJcblxyXG4gICAgLy8gYWNjb3VudCBmb3Iga25vd24gY2FzZXMgbGlrZSBhdWRpby9tcDNcclxuXHJcbiAgICBpZiAobWltZSAmJiBzbTIuaHRtbDVbbWltZV0gIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIChzbTIuaHRtbDVbbWltZV0gJiYgIXByZWZlckZsYXNoQ2hlY2sobWltZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghaHRtbDVFeHQpIHtcclxuICAgICAgaHRtbDVFeHQgPSBbXTtcclxuICAgICAgZm9yIChpdGVtIGluIGFGKSB7XHJcbiAgICAgICAgaWYgKGFGLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XHJcbiAgICAgICAgICBodG1sNUV4dC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgaWYgKGFGW2l0ZW1dLnJlbGF0ZWQpIHtcclxuICAgICAgICAgICAgaHRtbDVFeHQgPSBodG1sNUV4dC5jb25jYXQoYUZbaXRlbV0ucmVsYXRlZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGh0bWw1RXh0ID0gbmV3IFJlZ0V4cCgnXFxcXC4oJytodG1sNUV4dC5qb2luKCd8JykrJykoXFxcXD8uKik/JCcsJ2knKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBTdHJpcCBVUkwgcXVlcmllcywgZXRjLlxyXG4gICAgZmlsZUV4dCA9ICh1cmwgPyB1cmwudG9Mb3dlckNhc2UoKS5tYXRjaChodG1sNUV4dCkgOiBudWxsKTtcclxuXHJcbiAgICBpZiAoIWZpbGVFeHQgfHwgIWZpbGVFeHQubGVuZ3RoKSB7XHJcbiAgICAgIGlmICghbWltZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGF1ZGlvL21wMyAtPiBtcDMsIHJlc3VsdCBzaG91bGQgYmUga25vd25cclxuICAgICAgICBvZmZzZXQgPSBtaW1lLmluZGV4T2YoJzsnKTtcclxuICAgICAgICAvLyBzdHJpcCBcImF1ZGlvL1g7IGNvZGVjcy4uLlwiXHJcbiAgICAgICAgZmlsZUV4dCA9IChvZmZzZXQgIT09IC0xP21pbWUuc3Vic3RyKDAsb2Zmc2V0KTptaW1lKS5zdWJzdHIoNik7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIG1hdGNoIHRoZSByYXcgZXh0ZW5zaW9uIG5hbWUgLSBcIm1wM1wiLCBmb3IgZXhhbXBsZVxyXG4gICAgICBmaWxlRXh0ID0gZmlsZUV4dFsxXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZmlsZUV4dCAmJiBzbTIuaHRtbDVbZmlsZUV4dF0gIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgLy8gcmVzdWx0IGtub3duXHJcbiAgICAgIHJlc3VsdCA9IChzbTIuaHRtbDVbZmlsZUV4dF0gJiYgIXByZWZlckZsYXNoQ2hlY2soZmlsZUV4dCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWltZSA9ICdhdWRpby8nK2ZpbGVFeHQ7XHJcbiAgICAgIHJlc3VsdCA9IHNtMi5odG1sNS5jYW5QbGF5VHlwZSh7dHlwZTptaW1lfSk7XHJcbiAgICAgIHNtMi5odG1sNVtmaWxlRXh0XSA9IHJlc3VsdDtcclxuICAgICAgLy8gc20yLl93RCgnY2FuUGxheVR5cGUsIGZvdW5kIHJlc3VsdDogJyArIHJlc3VsdCk7XHJcbiAgICAgIHJlc3VsdCA9IChyZXN1bHQgJiYgc20yLmh0bWw1W21pbWVdICYmICFwcmVmZXJGbGFzaENoZWNrKG1pbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICB0ZXN0SFRNTDUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludGVybmFsOiBJdGVyYXRlcyBvdmVyIGF1ZGlvRm9ybWF0cywgZGV0ZXJtaW5pbmcgc3VwcG9ydCBlZy4gYXVkaW8vbXAzLCBhdWRpby9tcGVnIGFuZCBzbyBvblxyXG4gICAgICogYXNzaWducyByZXN1bHRzIHRvIGh0bWw1W10gYW5kIGZsYXNoW10uXHJcbiAgICAgKi9cclxuXHJcbiAgICBpZiAoIXNtMi51c2VIVE1MNUF1ZGlvIHx8ICFzbTIuaGFzSFRNTDUpIHtcclxuICAgICAgLy8gd2l0aG91dCBIVE1MNSwgd2UgbmVlZCBGbGFzaC5cclxuICAgICAgc20yLmh0bWw1LnVzaW5nRmxhc2ggPSB0cnVlO1xyXG4gICAgICBuZWVkc0ZsYXNoID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvdWJsZS13aGFtbXk6IE9wZXJhIDkuNjQgdGhyb3dzIFdST05HX0FSR1VNRU5UU19FUlIgaWYgbm8gcGFyYW1ldGVyIHBhc3NlZCB0byBBdWRpbygpLCBhbmQgV2Via2l0ICsgaU9TIGhhcHBpbHkgdHJpZXMgdG8gbG9hZCBcIm51bGxcIiBhcyBhIFVSTC4gOi9cclxuICAgIHZhciBhID0gKEF1ZGlvICE9PSBfdW5kZWZpbmVkID8gKGlzT3BlcmEgJiYgb3BlcmEudmVyc2lvbigpIDwgMTAgPyBuZXcgQXVkaW8obnVsbCkgOiBuZXcgQXVkaW8oKSkgOiBudWxsKSxcclxuICAgICAgICBpdGVtLCBsb29rdXAsIHN1cHBvcnQgPSB7fSwgYUYsIGk7XHJcblxyXG4gICAgZnVuY3Rpb24gY3AobSkge1xyXG5cclxuICAgICAgdmFyIGNhblBsYXksIGosXHJcbiAgICAgICAgICByZXN1bHQgPSBmYWxzZSxcclxuICAgICAgICAgIGlzT0sgPSBmYWxzZTtcclxuXHJcbiAgICAgIGlmICghYSB8fCB0eXBlb2YgYS5jYW5QbGF5VHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAvLyBpdGVyYXRlIHRocm91Z2ggYWxsIG1pbWUgdHlwZXMsIHJldHVybiBhbnkgc3VjY2Vzc2VzXHJcbiAgICAgICAgZm9yIChpPTAsIGo9bS5sZW5ndGg7IGk8ajsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoc20yLmh0bWw1W21baV1dIHx8IGEuY2FuUGxheVR5cGUobVtpXSkubWF0Y2goc20yLmh0bWw1VGVzdCkpIHtcclxuICAgICAgICAgICAgaXNPSyA9IHRydWU7XHJcbiAgICAgICAgICAgIHNtMi5odG1sNVttW2ldXSA9IHRydWU7XHJcbiAgICAgICAgICAgIC8vIG5vdGUgZmxhc2ggc3VwcG9ydCwgdG9vXHJcbiAgICAgICAgICAgIHNtMi5mbGFzaFttW2ldXSA9ICEhKG1baV0ubWF0Y2goZmxhc2hNSU1FKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlc3VsdCA9IGlzT0s7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY2FuUGxheSA9IChhICYmIHR5cGVvZiBhLmNhblBsYXlUeXBlID09PSAnZnVuY3Rpb24nID8gYS5jYW5QbGF5VHlwZShtKSA6IGZhbHNlKTtcclxuICAgICAgICByZXN1bHQgPSAhIShjYW5QbGF5ICYmIChjYW5QbGF5Lm1hdGNoKHNtMi5odG1sNVRlc3QpKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHRlc3QgYWxsIHJlZ2lzdGVyZWQgZm9ybWF0cyArIGNvZGVjc1xyXG5cclxuICAgIGFGID0gc20yLmF1ZGlvRm9ybWF0cztcclxuXHJcbiAgICBmb3IgKGl0ZW0gaW4gYUYpIHtcclxuXHJcbiAgICAgIGlmIChhRi5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xyXG5cclxuICAgICAgICBsb29rdXAgPSAnYXVkaW8vJyArIGl0ZW07XHJcblxyXG4gICAgICAgIHN1cHBvcnRbaXRlbV0gPSBjcChhRltpdGVtXS50eXBlKTtcclxuXHJcbiAgICAgICAgLy8gd3JpdGUgYmFjayBnZW5lcmljIHR5cGUgdG9vLCBlZy4gYXVkaW8vbXAzXHJcbiAgICAgICAgc3VwcG9ydFtsb29rdXBdID0gc3VwcG9ydFtpdGVtXTtcclxuXHJcbiAgICAgICAgLy8gYXNzaWduIGZsYXNoXHJcbiAgICAgICAgaWYgKGl0ZW0ubWF0Y2goZmxhc2hNSU1FKSkge1xyXG5cclxuICAgICAgICAgIHNtMi5mbGFzaFtpdGVtXSA9IHRydWU7XHJcbiAgICAgICAgICBzbTIuZmxhc2hbbG9va3VwXSA9IHRydWU7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc20yLmZsYXNoW2l0ZW1dID0gZmFsc2U7XHJcbiAgICAgICAgICBzbTIuZmxhc2hbbG9va3VwXSA9IGZhbHNlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiByZXN1bHQgdG8gcmVsYXRlZCBmb3JtYXRzLCB0b29cclxuXHJcbiAgICAgICAgaWYgKGFGW2l0ZW1dICYmIGFGW2l0ZW1dLnJlbGF0ZWQpIHtcclxuXHJcbiAgICAgICAgICBmb3IgKGk9YUZbaXRlbV0ucmVsYXRlZC5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGVnLiBhdWRpby9tNGFcclxuICAgICAgICAgICAgc3VwcG9ydFsnYXVkaW8vJythRltpdGVtXS5yZWxhdGVkW2ldXSA9IHN1cHBvcnRbaXRlbV07XHJcbiAgICAgICAgICAgIHNtMi5odG1sNVthRltpdGVtXS5yZWxhdGVkW2ldXSA9IHN1cHBvcnRbaXRlbV07XHJcbiAgICAgICAgICAgIHNtMi5mbGFzaFthRltpdGVtXS5yZWxhdGVkW2ldXSA9IHN1cHBvcnRbaXRlbV07XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN1cHBvcnQuY2FuUGxheVR5cGUgPSAoYT9jcDpudWxsKTtcclxuICAgIHNtMi5odG1sNSA9IG1peGluKHNtMi5odG1sNSwgc3VwcG9ydCk7XHJcblxyXG4gICAgc20yLmh0bWw1LnVzaW5nRmxhc2ggPSBmZWF0dXJlQ2hlY2soKTtcclxuICAgIG5lZWRzRmxhc2ggPSBzbTIuaHRtbDUudXNpbmdGbGFzaDtcclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgc3RyaW5ncyA9IHtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIG5vdFJlYWR5OiAnVW5hdmFpbGFibGUgLSB3YWl0IHVudGlsIG9ucmVhZHkoKSBoYXMgZmlyZWQuJyxcclxuICAgIG5vdE9LOiAnQXVkaW8gc3VwcG9ydCBpcyBub3QgYXZhaWxhYmxlLicsXHJcbiAgICBkb21FcnJvcjogc20gKyAnZXhjZXB0aW9uIGNhdWdodCB3aGlsZSBhcHBlbmRpbmcgU1dGIHRvIERPTS4nLFxyXG4gICAgc3BjV21vZGU6ICdSZW1vdmluZyB3bW9kZSwgcHJldmVudGluZyBrbm93biBTV0YgbG9hZGluZyBpc3N1ZShzKScsXHJcbiAgICBzd2Y0MDQ6IHNtYyArICdWZXJpZnkgdGhhdCAlcyBpcyBhIHZhbGlkIHBhdGguJyxcclxuICAgIHRyeURlYnVnOiAnVHJ5ICcgKyBzbSArICcuZGVidWdGbGFzaCA9IHRydWUgZm9yIG1vcmUgc2VjdXJpdHkgZGV0YWlscyAob3V0cHV0IGdvZXMgdG8gU1dGLiknLFxyXG4gICAgY2hlY2tTV0Y6ICdTZWUgU1dGIG91dHB1dCBmb3IgbW9yZSBkZWJ1ZyBpbmZvLicsXHJcbiAgICBsb2NhbEZhaWw6IHNtYyArICdOb24tSFRUUCBwYWdlICgnICsgZG9jLmxvY2F0aW9uLnByb3RvY29sICsgJyBVUkw/KSBSZXZpZXcgRmxhc2ggcGxheWVyIHNlY3VyaXR5IHNldHRpbmdzIGZvciB0aGlzIHNwZWNpYWwgY2FzZTpcXG5odHRwOi8vd3d3Lm1hY3JvbWVkaWEuY29tL3N1cHBvcnQvZG9jdW1lbnRhdGlvbi9lbi9mbGFzaHBsYXllci9oZWxwL3NldHRpbmdzX21hbmFnZXIwNC5odG1sXFxuTWF5IG5lZWQgdG8gYWRkL2FsbG93IHBhdGgsIGVnLiBjOi9zbTIvIG9yIC91c2Vycy9tZS9zbTIvJyxcclxuICAgIHdhaXRGb2N1czogc21jICsgJ1NwZWNpYWwgY2FzZTogV2FpdGluZyBmb3IgU1dGIHRvIGxvYWQgd2l0aCB3aW5kb3cgZm9jdXMuLi4nLFxyXG4gICAgd2FpdEZvcmV2ZXI6IHNtYyArICdXYWl0aW5nIGluZGVmaW5pdGVseSBmb3IgRmxhc2ggKHdpbGwgcmVjb3ZlciBpZiB1bmJsb2NrZWQpLi4uJyxcclxuICAgIHdhaXRTV0Y6IHNtYyArICdXYWl0aW5nIGZvciAxMDAlIFNXRiBsb2FkLi4uJyxcclxuICAgIG5lZWRGdW5jdGlvbjogc21jICsgJ0Z1bmN0aW9uIG9iamVjdCBleHBlY3RlZCBmb3IgJXMnLFxyXG4gICAgYmFkSUQ6ICdTb3VuZCBJRCBcIiVzXCIgc2hvdWxkIGJlIGEgc3RyaW5nLCBzdGFydGluZyB3aXRoIGEgbm9uLW51bWVyaWMgY2hhcmFjdGVyJyxcclxuICAgIGN1cnJlbnRPYmo6IHNtYyArICdfZGVidWcoKTogQ3VycmVudCBzb3VuZCBvYmplY3RzJyxcclxuICAgIHdhaXRPbmxvYWQ6IHNtYyArICdXYWl0aW5nIGZvciB3aW5kb3cub25sb2FkKCknLFxyXG4gICAgZG9jTG9hZGVkOiBzbWMgKyAnRG9jdW1lbnQgYWxyZWFkeSBsb2FkZWQnLFxyXG4gICAgb25sb2FkOiBzbWMgKyAnaW5pdENvbXBsZXRlKCk6IGNhbGxpbmcgc291bmRNYW5hZ2VyLm9ubG9hZCgpJyxcclxuICAgIG9ubG9hZE9LOiBzbSArICcub25sb2FkKCkgY29tcGxldGUnLFxyXG4gICAgZGlkSW5pdDogc21jICsgJ2luaXQoKTogQWxyZWFkeSBjYWxsZWQ/JyxcclxuICAgIHNlY05vdGU6ICdGbGFzaCBzZWN1cml0eSBub3RlOiBOZXR3b3JrL2ludGVybmV0IFVSTHMgd2lsbCBub3QgbG9hZCBkdWUgdG8gc2VjdXJpdHkgcmVzdHJpY3Rpb25zLiBBY2Nlc3MgY2FuIGJlIGNvbmZpZ3VyZWQgdmlhIEZsYXNoIFBsYXllciBHbG9iYWwgU2VjdXJpdHkgU2V0dGluZ3MgUGFnZTogaHR0cDovL3d3dy5tYWNyb21lZGlhLmNvbS9zdXBwb3J0L2RvY3VtZW50YXRpb24vZW4vZmxhc2hwbGF5ZXIvaGVscC9zZXR0aW5nc19tYW5hZ2VyMDQuaHRtbCcsXHJcbiAgICBiYWRSZW1vdmU6IHNtYyArICdGYWlsZWQgdG8gcmVtb3ZlIEZsYXNoIG5vZGUuJyxcclxuICAgIHNodXRkb3duOiBzbSArICcuZGlzYWJsZSgpOiBTaHV0dGluZyBkb3duJyxcclxuICAgIHF1ZXVlOiBzbWMgKyAnUXVldWVpbmcgJXMgaGFuZGxlcicsXHJcbiAgICBzbUVycm9yOiAnU01Tb3VuZC5sb2FkKCk6IEV4Y2VwdGlvbjogSlMtRmxhc2ggY29tbXVuaWNhdGlvbiBmYWlsZWQsIG9yIEpTIGVycm9yLicsXHJcbiAgICBmYlRpbWVvdXQ6ICdObyBmbGFzaCByZXNwb25zZSwgYXBwbHlpbmcgLicrc3dmQ1NTLnN3ZlRpbWVkb3V0KycgQ1NTLi4uJyxcclxuICAgIGZiTG9hZGVkOiAnRmxhc2ggbG9hZGVkJyxcclxuICAgIGZiSGFuZGxlcjogc21jICsgJ2ZsYXNoQmxvY2tIYW5kbGVyKCknLFxyXG4gICAgbWFuVVJMOiAnU01Tb3VuZC5sb2FkKCk6IFVzaW5nIG1hbnVhbGx5LWFzc2lnbmVkIFVSTCcsXHJcbiAgICBvblVSTDogc20gKyAnLmxvYWQoKTogY3VycmVudCBVUkwgYWxyZWFkeSBhc3NpZ25lZC4nLFxyXG4gICAgYmFkRlY6IHNtICsgJy5mbGFzaFZlcnNpb24gbXVzdCBiZSA4IG9yIDkuIFwiJXNcIiBpcyBpbnZhbGlkLiBSZXZlcnRpbmcgdG8gJXMuJyxcclxuICAgIGFzMmxvb3A6ICdOb3RlOiBTZXR0aW5nIHN0cmVhbTpmYWxzZSBzbyBsb29waW5nIGNhbiB3b3JrIChmbGFzaCA4IGxpbWl0YXRpb24pJyxcclxuICAgIG5vTlNMb29wOiAnTm90ZTogTG9vcGluZyBub3QgaW1wbGVtZW50ZWQgZm9yIE1vdmllU3RhciBmb3JtYXRzJyxcclxuICAgIG5lZWRmbDk6ICdOb3RlOiBTd2l0Y2hpbmcgdG8gZmxhc2ggOSwgcmVxdWlyZWQgZm9yIE1QNCBmb3JtYXRzLicsXHJcbiAgICBtZlRpbWVvdXQ6ICdTZXR0aW5nIGZsYXNoTG9hZFRpbWVvdXQgPSAwIChpbmZpbml0ZSkgZm9yIG9mZi1zY3JlZW4sIG1vYmlsZSBmbGFzaCBjYXNlJyxcclxuICAgIG5lZWRGbGFzaDogc21jICsgJ0ZhdGFsIGVycm9yOiBGbGFzaCBpcyBuZWVkZWQgdG8gcGxheSBzb21lIHJlcXVpcmVkIGZvcm1hdHMsIGJ1dCBpcyBub3QgYXZhaWxhYmxlLicsXHJcbiAgICBnb3RGb2N1czogc21jICsgJ0dvdCB3aW5kb3cgZm9jdXMuJyxcclxuICAgIHBvbGljeTogJ0VuYWJsaW5nIHVzZVBvbGljeUZpbGUgZm9yIGRhdGEgYWNjZXNzJyxcclxuICAgIHNldHVwOiBzbSArICcuc2V0dXAoKTogYWxsb3dlZCBwYXJhbWV0ZXJzOiAlcycsXHJcbiAgICBzZXR1cEVycm9yOiBzbSArICcuc2V0dXAoKTogXCIlc1wiIGNhbm5vdCBiZSBhc3NpZ25lZCB3aXRoIHRoaXMgbWV0aG9kLicsXHJcbiAgICBzZXR1cFVuZGVmOiBzbSArICcuc2V0dXAoKTogQ291bGQgbm90IGZpbmQgb3B0aW9uIFwiJXNcIicsXHJcbiAgICBzZXR1cExhdGU6IHNtICsgJy5zZXR1cCgpOiB1cmwsIGZsYXNoVmVyc2lvbiBhbmQgaHRtbDVUZXN0IHByb3BlcnR5IGNoYW5nZXMgd2lsbCBub3QgdGFrZSBlZmZlY3QgdW50aWwgcmVib290KCkuJyxcclxuICAgIG5vVVJMOiBzbWMgKyAnRmxhc2ggVVJMIHJlcXVpcmVkLiBDYWxsIHNvdW5kTWFuYWdlci5zZXR1cCh7dXJsOi4uLn0pIHRvIGdldCBzdGFydGVkLicsXHJcbiAgICBzbTJMb2FkZWQ6ICdTb3VuZE1hbmFnZXIgMjogUmVhZHkuJyxcclxuICAgIHJlc2V0OiBzbSArICcucmVzZXQoKTogUmVtb3ZpbmcgZXZlbnQgY2FsbGJhY2tzJyxcclxuICAgIG1vYmlsZVVBOiAnTW9iaWxlIFVBIGRldGVjdGVkLCBwcmVmZXJyaW5nIEhUTUw1IGJ5IGRlZmF1bHQuJyxcclxuICAgIGdsb2JhbEhUTUw1OiAnVXNpbmcgc2luZ2xldG9uIEhUTUw1IEF1ZGlvKCkgcGF0dGVybiBmb3IgdGhpcyBkZXZpY2UuJ1xyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBzdHIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBpbnRlcm5hbCBzdHJpbmcgcmVwbGFjZSBoZWxwZXIuXHJcbiAgICAvLyBhcmd1bWVudHM6IG8gWyxpdGVtcyB0byByZXBsYWNlXVxyXG4gICAgLy8gPGQ+XHJcblxyXG4gICAgdmFyIGFyZ3MsXHJcbiAgICAgICAgaSwgaiwgbyxcclxuICAgICAgICBzc3RyO1xyXG5cclxuICAgIC8vIHJlYWwgYXJyYXksIHBsZWFzZVxyXG4gICAgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHJcbiAgICAvLyBmaXJzdCBhcmd1bWVudFxyXG4gICAgbyA9IGFyZ3Muc2hpZnQoKTtcclxuXHJcbiAgICBzc3RyID0gKHN0cmluZ3MgJiYgc3RyaW5nc1tvXSA/IHN0cmluZ3Nbb10gOiAnJyk7XHJcblxyXG4gICAgaWYgKHNzdHIgJiYgYXJncyAmJiBhcmdzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKGkgPSAwLCBqID0gYXJncy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcclxuICAgICAgICBzc3RyID0gc3N0ci5yZXBsYWNlKCclcycsIGFyZ3NbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHNzdHI7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gIH07XHJcblxyXG4gIGxvb3BGaXggPSBmdW5jdGlvbihzT3B0KSB7XHJcblxyXG4gICAgLy8gZmxhc2ggOCByZXF1aXJlcyBzdHJlYW0gPSBmYWxzZSBmb3IgbG9vcGluZyB0byB3b3JrXHJcbiAgICBpZiAoZlYgPT09IDggJiYgc09wdC5sb29wcyA+IDEgJiYgc09wdC5zdHJlYW0pIHtcclxuICAgICAgX3dEUygnYXMybG9vcCcpO1xyXG4gICAgICBzT3B0LnN0cmVhbSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzT3B0O1xyXG5cclxuICB9O1xyXG5cclxuICBwb2xpY3lGaXggPSBmdW5jdGlvbihzT3B0LCBzUHJlKSB7XHJcblxyXG4gICAgaWYgKHNPcHQgJiYgIXNPcHQudXNlUG9saWN5RmlsZSAmJiAoc09wdC5vbmlkMyB8fCBzT3B0LnVzZVBlYWtEYXRhIHx8IHNPcHQudXNlV2F2ZWZvcm1EYXRhIHx8IHNPcHQudXNlRVFEYXRhKSkge1xyXG4gICAgICBzbTIuX3dEKChzUHJlIHx8ICcnKSArIHN0cigncG9saWN5JykpO1xyXG4gICAgICBzT3B0LnVzZVBvbGljeUZpbGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzT3B0O1xyXG5cclxuICB9O1xyXG5cclxuICBjb21wbGFpbiA9IGZ1bmN0aW9uKHNNc2cpIHtcclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIGlmIChoYXNDb25zb2xlICYmIGNvbnNvbGUud2FybiAhPT0gX3VuZGVmaW5lZCkge1xyXG4gICAgICBjb25zb2xlLndhcm4oc01zZyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzbTIuX3dEKHNNc2cpO1xyXG4gICAgfVxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBkb05vdGhpbmcgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gIH07XHJcblxyXG4gIGRpc2FibGVPYmplY3QgPSBmdW5jdGlvbihvKSB7XHJcblxyXG4gICAgdmFyIG9Qcm9wO1xyXG5cclxuICAgIGZvciAob1Byb3AgaW4gbykge1xyXG4gICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShvUHJvcCkgJiYgdHlwZW9mIG9bb1Byb3BdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgb1tvUHJvcF0gPSBkb05vdGhpbmc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvUHJvcCA9IG51bGw7XHJcblxyXG4gIH07XHJcblxyXG4gIGZhaWxTYWZlbHkgPSBmdW5jdGlvbihiTm9EaXNhYmxlKSB7XHJcblxyXG4gICAgLy8gZ2VuZXJhbCBmYWlsdXJlIGV4Y2VwdGlvbiBoYW5kbGVyXHJcblxyXG4gICAgaWYgKGJOb0Rpc2FibGUgPT09IF91bmRlZmluZWQpIHtcclxuICAgICAgYk5vRGlzYWJsZSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaXNhYmxlZCB8fCBiTm9EaXNhYmxlKSB7XHJcbiAgICAgIHNtMi5kaXNhYmxlKGJOb0Rpc2FibGUpO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBub3JtYWxpemVNb3ZpZVVSTCA9IGZ1bmN0aW9uKHNtVVJMKSB7XHJcblxyXG4gICAgdmFyIHVybFBhcmFtcyA9IG51bGwsIHVybDtcclxuXHJcbiAgICBpZiAoc21VUkwpIHtcclxuICAgICAgaWYgKHNtVVJMLm1hdGNoKC9cXC5zd2YoXFw/LiopPyQvaSkpIHtcclxuICAgICAgICB1cmxQYXJhbXMgPSBzbVVSTC5zdWJzdHIoc21VUkwudG9Mb3dlckNhc2UoKS5sYXN0SW5kZXhPZignLnN3Zj8nKSArIDQpO1xyXG4gICAgICAgIGlmICh1cmxQYXJhbXMpIHtcclxuICAgICAgICAgIC8vIGFzc3VtZSB1c2VyIGtub3dzIHdoYXQgdGhleSdyZSBkb2luZ1xyXG4gICAgICAgICAgcmV0dXJuIHNtVVJMO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmIChzbVVSTC5sYXN0SW5kZXhPZignLycpICE9PSBzbVVSTC5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgLy8gYXBwZW5kIHRyYWlsaW5nIHNsYXNoLCBpZiBuZWVkZWRcclxuICAgICAgICBzbVVSTCArPSAnLyc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB1cmwgPSAoc21VUkwgJiYgc21VUkwubGFzdEluZGV4T2YoJy8nKSAhPT0gLSAxID8gc21VUkwuc3Vic3RyKDAsIHNtVVJMLmxhc3RJbmRleE9mKCcvJykgKyAxKSA6ICcuLycpICsgc20yLm1vdmllVVJMO1xyXG5cclxuICAgIGlmIChzbTIubm9TV0ZDYWNoZSkge1xyXG4gICAgICB1cmwgKz0gKCc/dHM9JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG5cclxuICB9O1xyXG5cclxuICBzZXRWZXJzaW9uSW5mbyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIHNob3J0LWhhbmQgZm9yIGludGVybmFsIHVzZVxyXG5cclxuICAgIGZWID0gcGFyc2VJbnQoc20yLmZsYXNoVmVyc2lvbiwgMTApO1xyXG5cclxuICAgIGlmIChmViAhPT0gOCAmJiBmViAhPT0gOSkge1xyXG4gICAgICBzbTIuX3dEKHN0cignYmFkRlYnLCBmViwgZGVmYXVsdEZsYXNoVmVyc2lvbikpO1xyXG4gICAgICBzbTIuZmxhc2hWZXJzaW9uID0gZlYgPSBkZWZhdWx0Rmxhc2hWZXJzaW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRlYnVnIGZsYXNoIG1vdmllLCBpZiBhcHBsaWNhYmxlXHJcblxyXG4gICAgdmFyIGlzRGVidWcgPSAoc20yLmRlYnVnTW9kZSB8fCBzbTIuZGVidWdGbGFzaD8nX2RlYnVnLnN3Zic6Jy5zd2YnKTtcclxuXHJcbiAgICBpZiAoc20yLnVzZUhUTUw1QXVkaW8gJiYgIXNtMi5odG1sNU9ubHkgJiYgc20yLmF1ZGlvRm9ybWF0cy5tcDQucmVxdWlyZWQgJiYgZlYgPCA5KSB7XHJcbiAgICAgIHNtMi5fd0Qoc3RyKCduZWVkZmw5JykpO1xyXG4gICAgICBzbTIuZmxhc2hWZXJzaW9uID0gZlYgPSA5O1xyXG4gICAgfVxyXG5cclxuICAgIHNtMi52ZXJzaW9uID0gc20yLnZlcnNpb25OdW1iZXIgKyAoc20yLmh0bWw1T25seT8nIChIVE1MNS1vbmx5IG1vZGUpJzooZlYgPT09IDk/JyAoQVMzL0ZsYXNoIDkpJzonIChBUzIvRmxhc2ggOCknKSk7XHJcblxyXG4gICAgLy8gc2V0IHVwIGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgaWYgKGZWID4gOCkge1xyXG4gICAgICAvLyArZmxhc2ggOSBiYXNlIG9wdGlvbnNcclxuICAgICAgc20yLmRlZmF1bHRPcHRpb25zID0gbWl4aW4oc20yLmRlZmF1bHRPcHRpb25zLCBzbTIuZmxhc2g5T3B0aW9ucyk7XHJcbiAgICAgIHNtMi5mZWF0dXJlcy5idWZmZXJpbmcgPSB0cnVlO1xyXG4gICAgICAvLyArbW92aWVzdGFyIHN1cHBvcnRcclxuICAgICAgc20yLmRlZmF1bHRPcHRpb25zID0gbWl4aW4oc20yLmRlZmF1bHRPcHRpb25zLCBzbTIubW92aWVTdGFyT3B0aW9ucyk7XHJcbiAgICAgIHNtMi5maWxlUGF0dGVybnMuZmxhc2g5ID0gbmV3IFJlZ0V4cCgnXFxcXC4obXAzfCcgKyBuZXRTdHJlYW1UeXBlcy5qb2luKCd8JykgKyAnKShcXFxcPy4qKT8kJywgJ2knKTtcclxuICAgICAgc20yLmZlYXR1cmVzLm1vdmllU3RhciA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzbTIuZmVhdHVyZXMubW92aWVTdGFyID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmVnRXhwIGZvciBmbGFzaCBjYW5QbGF5KCksIGV0Yy5cclxuICAgIHNtMi5maWxlUGF0dGVybiA9IHNtMi5maWxlUGF0dGVybnNbKGZWICE9PSA4PydmbGFzaDknOidmbGFzaDgnKV07XHJcblxyXG4gICAgLy8gaWYgYXBwbGljYWJsZSwgdXNlIF9kZWJ1ZyB2ZXJzaW9ucyBvZiBTV0ZzXHJcbiAgICBzbTIubW92aWVVUkwgPSAoZlYgPT09IDg/J3NvdW5kbWFuYWdlcjIuc3dmJzonc291bmRtYW5hZ2VyMl9mbGFzaDkuc3dmJykucmVwbGFjZSgnLnN3ZicsIGlzRGVidWcpO1xyXG5cclxuICAgIHNtMi5mZWF0dXJlcy5wZWFrRGF0YSA9IHNtMi5mZWF0dXJlcy53YXZlZm9ybURhdGEgPSBzbTIuZmVhdHVyZXMuZXFEYXRhID0gKGZWID4gOCk7XHJcblxyXG4gIH07XHJcblxyXG4gIHNldFBvbGxpbmcgPSBmdW5jdGlvbihiUG9sbGluZywgYkhpZ2hQZXJmb3JtYW5jZSkge1xyXG5cclxuICAgIGlmICghZmxhc2gpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZsYXNoLl9zZXRQb2xsaW5nKGJQb2xsaW5nLCBiSGlnaFBlcmZvcm1hbmNlKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaW5pdERlYnVnID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gc3RhcnRzIGRlYnVnIG1vZGUsIGNyZWF0aW5nIG91dHB1dCA8ZGl2PiBmb3IgVUFzIHdpdGhvdXQgY29uc29sZSBvYmplY3RcclxuXHJcbiAgICAvLyBhbGxvdyBmb3JjZSBvZiBkZWJ1ZyBtb2RlIHZpYSBVUkxcclxuICAgIC8vIDxkPlxyXG4gICAgaWYgKHNtMi5kZWJ1Z1VSTFBhcmFtLnRlc3Qod2wpKSB7XHJcbiAgICAgIHNtMi5kZWJ1Z01vZGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpZChzbTIuZGVidWdJRCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBvRCwgb0RlYnVnLCBvVGFyZ2V0LCBvVG9nZ2xlLCB0bXA7XHJcblxyXG4gICAgaWYgKHNtMi5kZWJ1Z01vZGUgJiYgIWlkKHNtMi5kZWJ1Z0lEKSAmJiAoIWhhc0NvbnNvbGUgfHwgIXNtMi51c2VDb25zb2xlIHx8ICFzbTIuY29uc29sZU9ubHkpKSB7XHJcblxyXG4gICAgICBvRCA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgb0QuaWQgPSBzbTIuZGVidWdJRCArICctdG9nZ2xlJztcclxuXHJcbiAgICAgIG9Ub2dnbGUgPSB7XHJcbiAgICAgICAgJ3Bvc2l0aW9uJzogJ2ZpeGVkJyxcclxuICAgICAgICAnYm90dG9tJzogJzBweCcsXHJcbiAgICAgICAgJ3JpZ2h0JzogJzBweCcsXHJcbiAgICAgICAgJ3dpZHRoJzogJzEuMmVtJyxcclxuICAgICAgICAnaGVpZ2h0JzogJzEuMmVtJyxcclxuICAgICAgICAnbGluZUhlaWdodCc6ICcxLjJlbScsXHJcbiAgICAgICAgJ21hcmdpbic6ICcycHgnLFxyXG4gICAgICAgICd0ZXh0QWxpZ24nOiAnY2VudGVyJyxcclxuICAgICAgICAnYm9yZGVyJzogJzFweCBzb2xpZCAjOTk5JyxcclxuICAgICAgICAnY3Vyc29yJzogJ3BvaW50ZXInLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kJzogJyNmZmYnLFxyXG4gICAgICAgICdjb2xvcic6ICcjMzMzJyxcclxuICAgICAgICAnekluZGV4JzogMTAwMDFcclxuICAgICAgfTtcclxuXHJcbiAgICAgIG9ELmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZSgnLScpKTtcclxuICAgICAgb0Qub25jbGljayA9IHRvZ2dsZURlYnVnO1xyXG4gICAgICBvRC50aXRsZSA9ICdUb2dnbGUgU00yIGRlYnVnIGNvbnNvbGUnO1xyXG5cclxuICAgICAgaWYgKHVhLm1hdGNoKC9tc2llIDYvaSkpIHtcclxuICAgICAgICBvRC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgb0Quc3R5bGUuY3Vyc29yID0gJ2hhbmQnO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKHRtcCBpbiBvVG9nZ2xlKSB7XHJcbiAgICAgICAgaWYgKG9Ub2dnbGUuaGFzT3duUHJvcGVydHkodG1wKSkge1xyXG4gICAgICAgICAgb0Quc3R5bGVbdG1wXSA9IG9Ub2dnbGVbdG1wXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG9EZWJ1ZyA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgb0RlYnVnLmlkID0gc20yLmRlYnVnSUQ7XHJcbiAgICAgIG9EZWJ1Zy5zdHlsZS5kaXNwbGF5ID0gKHNtMi5kZWJ1Z01vZGU/J2Jsb2NrJzonbm9uZScpO1xyXG5cclxuICAgICAgaWYgKHNtMi5kZWJ1Z01vZGUgJiYgIWlkKG9ELmlkKSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBvVGFyZ2V0ID0gZ2V0RG9jdW1lbnQoKTtcclxuICAgICAgICAgIG9UYXJnZXQuYXBwZW5kQ2hpbGQob0QpO1xyXG4gICAgICAgIH0gY2F0Y2goZTIpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIoJ2RvbUVycm9yJykrJyBcXG4nK2UyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvVGFyZ2V0LmFwcGVuZENoaWxkKG9EZWJ1Zyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb1RhcmdldCA9IG51bGw7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gIH07XHJcblxyXG4gIGlkQ2hlY2sgPSB0aGlzLmdldFNvdW5kQnlJZDtcclxuXHJcbiAgLy8gPGQ+XHJcbiAgX3dEUyA9IGZ1bmN0aW9uKG8sIGVycm9yTGV2ZWwpIHtcclxuXHJcbiAgICByZXR1cm4gKCFvID8gJycgOiBzbTIuX3dEKHN0cihvKSwgZXJyb3JMZXZlbCkpO1xyXG5cclxuICB9O1xyXG5cclxuICB0b2dnbGVEZWJ1ZyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBvID0gaWQoc20yLmRlYnVnSUQpLFxyXG4gICAgb1QgPSBpZChzbTIuZGVidWdJRCArICctdG9nZ2xlJyk7XHJcblxyXG4gICAgaWYgKCFvKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGVidWdPcGVuKSB7XHJcbiAgICAgIC8vIG1pbmltaXplXHJcbiAgICAgIG9ULmlubmVySFRNTCA9ICcrJztcclxuICAgICAgby5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgb1QuaW5uZXJIVE1MID0gJy0nO1xyXG4gICAgICBvLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xyXG4gICAgfVxyXG5cclxuICAgIGRlYnVnT3BlbiA9ICFkZWJ1Z09wZW47XHJcblxyXG4gIH07XHJcblxyXG4gIGRlYnVnVFMgPSBmdW5jdGlvbihzRXZlbnRUeXBlLCBiU3VjY2Vzcywgc01lc3NhZ2UpIHtcclxuXHJcbiAgICAvLyB0cm91Ymxlc2hvb3RlciBkZWJ1ZyBob29rc1xyXG5cclxuICAgIGlmICh3aW5kb3cuc20yRGVidWdnZXIgIT09IF91bmRlZmluZWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzbTJEZWJ1Z2dlci5oYW5kbGVFdmVudChzRXZlbnRUeXBlLCBiU3VjY2Vzcywgc01lc3NhZ2UpO1xyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAvLyBvaCB3ZWxsXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcbiAgLy8gPC9kPlxyXG5cclxuICBnZXRTV0ZDU1MgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgY3NzID0gW107XHJcblxyXG4gICAgaWYgKHNtMi5kZWJ1Z01vZGUpIHtcclxuICAgICAgY3NzLnB1c2goc3dmQ1NTLnNtMkRlYnVnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc20yLmRlYnVnRmxhc2gpIHtcclxuICAgICAgY3NzLnB1c2goc3dmQ1NTLmZsYXNoRGVidWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbTIudXNlSGlnaFBlcmZvcm1hbmNlKSB7XHJcbiAgICAgIGNzcy5wdXNoKHN3ZkNTUy5oaWdoUGVyZik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNzcy5qb2luKCcgJyk7XHJcblxyXG4gIH07XHJcblxyXG4gIGZsYXNoQmxvY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gKnBvc3NpYmxlKiBmbGFzaCBibG9jayBzaXR1YXRpb24uXHJcblxyXG4gICAgdmFyIG5hbWUgPSBzdHIoJ2ZiSGFuZGxlcicpLFxyXG4gICAgICAgIHAgPSBzbTIuZ2V0TW92aWVQZXJjZW50KCksXHJcbiAgICAgICAgY3NzID0gc3dmQ1NTLFxyXG4gICAgICAgIGVycm9yID0ge3R5cGU6J0ZMQVNIQkxPQ0snfTtcclxuXHJcbiAgICBpZiAoc20yLmh0bWw1T25seSkge1xyXG4gICAgICAvLyBubyBmbGFzaCwgb3IgdW51c2VkXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNtMi5vaygpKSB7XHJcblxyXG4gICAgICBpZiAobmVlZHNGbGFzaCkge1xyXG4gICAgICAgIC8vIG1ha2UgdGhlIG1vdmllIG1vcmUgdmlzaWJsZSwgc28gdXNlciBjYW4gZml4XHJcbiAgICAgICAgc20yLm9NQy5jbGFzc05hbWUgPSBnZXRTV0ZDU1MoKSArICcgJyArIGNzcy5zd2ZEZWZhdWx0ICsgJyAnICsgKHAgPT09IG51bGw/Y3NzLnN3ZlRpbWVkb3V0OmNzcy5zd2ZFcnJvcik7XHJcbiAgICAgICAgc20yLl93RChuYW1lICsgJzogJyArIHN0cignZmJUaW1lb3V0JykgKyAocCA/ICcgKCcgKyBzdHIoJ2ZiTG9hZGVkJykgKyAnKScgOiAnJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuZGlkRmxhc2hCbG9jayA9IHRydWU7XHJcblxyXG4gICAgICAvLyBmaXJlIG9ucmVhZHkoKSwgY29tcGxhaW4gbGlnaHRseVxyXG4gICAgICBwcm9jZXNzT25FdmVudHMoe3R5cGU6J29udGltZW91dCcsIGlnbm9yZUluaXQ6dHJ1ZSwgZXJyb3I6ZXJyb3J9KTtcclxuICAgICAgY2F0Y2hFcnJvcihlcnJvcik7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIC8vIFNNMiBsb2FkZWQgT0sgKG9yIHJlY292ZXJlZClcclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBpZiAoc20yLmRpZEZsYXNoQmxvY2spIHtcclxuICAgICAgICBzbTIuX3dEKG5hbWUgKyAnOiBVbmJsb2NrZWQnKTtcclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICBpZiAoc20yLm9NQykge1xyXG4gICAgICAgIHNtMi5vTUMuY2xhc3NOYW1lID0gW2dldFNXRkNTUygpLCBjc3Muc3dmRGVmYXVsdCwgY3NzLnN3ZkxvYWRlZCArIChzbTIuZGlkRmxhc2hCbG9jaz8nICcrY3NzLnN3ZlVuYmxvY2tlZDonJyldLmpvaW4oJyAnKTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgYWRkT25FdmVudCA9IGZ1bmN0aW9uKHNUeXBlLCBvTWV0aG9kLCBvU2NvcGUpIHtcclxuXHJcbiAgICBpZiAob25fcXVldWVbc1R5cGVdID09PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIG9uX3F1ZXVlW3NUeXBlXSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIG9uX3F1ZXVlW3NUeXBlXS5wdXNoKHtcclxuICAgICAgJ21ldGhvZCc6IG9NZXRob2QsXHJcbiAgICAgICdzY29wZSc6IChvU2NvcGUgfHwgbnVsbCksXHJcbiAgICAgICdmaXJlZCc6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgcHJvY2Vzc09uRXZlbnRzID0gZnVuY3Rpb24ob09wdGlvbnMpIHtcclxuXHJcbiAgICAvLyBpZiB1bnNwZWNpZmllZCwgYXNzdW1lIE9LL2Vycm9yXHJcblxyXG4gICAgaWYgKCFvT3B0aW9ucykge1xyXG4gICAgICBvT3B0aW9ucyA9IHtcclxuICAgICAgICB0eXBlOiAoc20yLm9rKCkgPyAnb25yZWFkeScgOiAnb250aW1lb3V0JylcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWRpZEluaXQgJiYgb09wdGlvbnMgJiYgIW9PcHRpb25zLmlnbm9yZUluaXQpIHtcclxuICAgICAgLy8gbm90IHJlYWR5IHlldC5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvT3B0aW9ucy50eXBlID09PSAnb250aW1lb3V0JyAmJiAoc20yLm9rKCkgfHwgKGRpc2FibGVkICYmICFvT3B0aW9ucy5pZ25vcmVJbml0KSkpIHtcclxuICAgICAgLy8gaW52YWxpZCBjYXNlXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc3RhdHVzID0ge1xyXG4gICAgICAgICAgc3VjY2VzczogKG9PcHRpb25zICYmIG9PcHRpb25zLmlnbm9yZUluaXQ/c20yLm9rKCk6IWRpc2FibGVkKVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIHF1ZXVlIHNwZWNpZmllZCBieSB0eXBlLCBvciBub25lXHJcbiAgICAgICAgc3JjUXVldWUgPSAob09wdGlvbnMgJiYgb09wdGlvbnMudHlwZT9vbl9xdWV1ZVtvT3B0aW9ucy50eXBlXXx8W106W10pLFxyXG5cclxuICAgICAgICBxdWV1ZSA9IFtdLCBpLCBqLFxyXG4gICAgICAgIGFyZ3MgPSBbc3RhdHVzXSxcclxuICAgICAgICBjYW5SZXRyeSA9IChuZWVkc0ZsYXNoICYmICFzbTIub2soKSk7XHJcblxyXG4gICAgaWYgKG9PcHRpb25zLmVycm9yKSB7XHJcbiAgICAgIGFyZ3NbMF0uZXJyb3IgPSBvT3B0aW9ucy5lcnJvcjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGkgPSAwLCBqID0gc3JjUXVldWUubGVuZ3RoOyBpIDwgajsgaSsrKSB7XHJcbiAgICAgIGlmIChzcmNRdWV1ZVtpXS5maXJlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgIHF1ZXVlLnB1c2goc3JjUXVldWVbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAvLyBzbTIuX3dEKHNtICsgJzogRmlyaW5nICcgKyBxdWV1ZS5sZW5ndGggKyAnICcgKyBvT3B0aW9ucy50eXBlICsgJygpIGl0ZW0nICsgKHF1ZXVlLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnKSk7XHJcbiAgICAgIGZvciAoaSA9IDAsIGogPSBxdWV1ZS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcclxuICAgICAgICBpZiAocXVldWVbaV0uc2NvcGUpIHtcclxuICAgICAgICAgIHF1ZXVlW2ldLm1ldGhvZC5hcHBseShxdWV1ZVtpXS5zY29wZSwgYXJncyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHF1ZXVlW2ldLm1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFjYW5SZXRyeSkge1xyXG4gICAgICAgICAgLy8gdXNlRmxhc2hCbG9jayBhbmQgU1dGIHRpbWVvdXQgY2FzZSBkb2Vzbid0IGNvdW50IGhlcmUuXHJcbiAgICAgICAgICBxdWV1ZVtpXS5maXJlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGluaXRVc2VyT25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAoc20yLnVzZUZsYXNoQmxvY2spIHtcclxuICAgICAgICBmbGFzaEJsb2NrSGFuZGxlcigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwcm9jZXNzT25FdmVudHMoKTtcclxuXHJcbiAgICAgIC8vIGNhbGwgdXNlci1kZWZpbmVkIFwib25sb2FkXCIsIHNjb3BlZCB0byB3aW5kb3dcclxuXHJcbiAgICAgIGlmICh0eXBlb2Ygc20yLm9ubG9hZCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIF93RFMoJ29ubG9hZCcsIDEpO1xyXG4gICAgICAgIHNtMi5vbmxvYWQuYXBwbHkod2luZG93KTtcclxuICAgICAgICBfd0RTKCdvbmxvYWRPSycsIDEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc20yLndhaXRGb3JXaW5kb3dMb2FkKSB7XHJcbiAgICAgICAgZXZlbnQuYWRkKHdpbmRvdywgJ2xvYWQnLCBpbml0VXNlck9ubG9hZCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LDEpO1xyXG5cclxuICB9O1xyXG5cclxuICBkZXRlY3RGbGFzaCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIGhhdCB0aXA6IEZsYXNoIERldGVjdCBsaWJyYXJ5IChCU0QsIChDKSAyMDA3KSBieSBDYXJsIFwiRG9jWWVzXCIgUy4gWWVzdHJhdSAtIGh0dHA6Ly9mZWF0dXJlYmxlbmQuY29tL2phdmFzY3JpcHQtZmxhc2gtZGV0ZWN0aW9uLWxpYnJhcnkuaHRtbCAvIGh0dHA6Ly9mZWF0dXJlYmxlbmQuY29tL2xpY2Vuc2UudHh0XHJcblxyXG4gICAgaWYgKGhhc0ZsYXNoICE9PSBfdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIHRoaXMgd29yayBoYXMgYWxyZWFkeSBiZWVuIGRvbmUuXHJcbiAgICAgIHJldHVybiBoYXNGbGFzaDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaGFzUGx1Z2luID0gZmFsc2UsIG4gPSBuYXZpZ2F0b3IsIG5QID0gbi5wbHVnaW5zLCBvYmosIHR5cGUsIHR5cGVzLCBBWCA9IHdpbmRvdy5BY3RpdmVYT2JqZWN0O1xyXG5cclxuICAgIGlmIChuUCAmJiBuUC5sZW5ndGgpIHtcclxuICAgICAgdHlwZSA9ICdhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaCc7XHJcbiAgICAgIHR5cGVzID0gbi5taW1lVHlwZXM7XHJcbiAgICAgIGlmICh0eXBlcyAmJiB0eXBlc1t0eXBlXSAmJiB0eXBlc1t0eXBlXS5lbmFibGVkUGx1Z2luICYmIHR5cGVzW3R5cGVdLmVuYWJsZWRQbHVnaW4uZGVzY3JpcHRpb24pIHtcclxuICAgICAgICBoYXNQbHVnaW4gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKEFYICE9PSBfdW5kZWZpbmVkICYmICF1YS5tYXRjaCgvTVNBcHBIb3N0L2kpKSB7XHJcbiAgICAgIC8vIFdpbmRvd3MgOCBTdG9yZSBBcHBzIChNU0FwcEhvc3QpIGFyZSB3ZWlyZCAoY29tcGF0aWJpbGl0eT8pIGFuZCB3b24ndCBjb21wbGFpbiBoZXJlLCBidXQgd2lsbCBiYXJmIGlmIEZsYXNoL0FjdGl2ZVggb2JqZWN0IGlzIGFwcGVuZGVkIHRvIHRoZSBET00uXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgb2JqID0gbmV3IEFYKCdTaG9ja3dhdmVGbGFzaC5TaG9ja3dhdmVGbGFzaCcpO1xyXG4gICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAvLyBvaCB3ZWxsXHJcbiAgICAgICAgb2JqID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICBoYXNQbHVnaW4gPSAoISFvYmopO1xyXG4gICAgICAvLyBjbGVhbnVwLCBiZWNhdXNlIGl0IGlzIEFjdGl2ZVggYWZ0ZXIgYWxsXHJcbiAgICAgIG9iaiA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzRmxhc2ggPSBoYXNQbHVnaW47XHJcblxyXG4gICAgcmV0dXJuIGhhc1BsdWdpbjtcclxuXHJcbiAgfTtcclxuXHJcbiAgZmVhdHVyZUNoZWNrID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIGZsYXNoTmVlZGVkLFxyXG4gICAgICAgIGl0ZW0sXHJcbiAgICAgICAgZm9ybWF0cyA9IHNtMi5hdWRpb0Zvcm1hdHMsXHJcbiAgICAgICAgLy8gaVBob25lIDw9IDMuMSBoYXMgYnJva2VuIEhUTUw1IGF1ZGlvKCksIGJ1dCBmaXJtd2FyZSAzLjIgKG9yaWdpbmFsIGlQYWQpICsgaU9TNCB3b3Jrcy5cclxuICAgICAgICBpc1NwZWNpYWwgPSAoaXNfaURldmljZSAmJiAhISh1YS5tYXRjaCgvb3MgKDF8MnwzXzB8M18xKS9pKSkpO1xyXG5cclxuICAgIGlmIChpc1NwZWNpYWwpIHtcclxuXHJcbiAgICAgIC8vIGhhcyBBdWRpbygpLCBidXQgaXMgYnJva2VuOyBsZXQgaXQgbG9hZCBsaW5rcyBkaXJlY3RseS5cclxuICAgICAgc20yLmhhc0hUTUw1ID0gZmFsc2U7XHJcblxyXG4gICAgICAvLyBpZ25vcmUgZmxhc2ggY2FzZSwgaG93ZXZlclxyXG4gICAgICBzbTIuaHRtbDVPbmx5ID0gdHJ1ZTtcclxuXHJcbiAgICAgIC8vIGhpZGUgdGhlIFNXRiwgaWYgcHJlc2VudFxyXG4gICAgICBpZiAoc20yLm9NQykge1xyXG4gICAgICAgIHNtMi5vTUMuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBpZiAoc20yLnVzZUhUTUw1QXVkaW8pIHtcclxuXHJcbiAgICAgICAgaWYgKCFzbTIuaHRtbDUgfHwgIXNtMi5odG1sNS5jYW5QbGF5VHlwZSkge1xyXG4gICAgICAgICAgc20yLl93RCgnU291bmRNYW5hZ2VyOiBObyBIVE1MNSBBdWRpbygpIHN1cHBvcnQgZGV0ZWN0ZWQuJyk7XHJcbiAgICAgICAgICBzbTIuaGFzSFRNTDUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDxkPlxyXG4gICAgICAgIGlmIChpc0JhZFNhZmFyaSkge1xyXG4gICAgICAgICAgc20yLl93RChzbWMgKyAnTm90ZTogQnVnZ3kgSFRNTDUgQXVkaW8gaW4gU2FmYXJpIG9uIHRoaXMgT1MgWCByZWxlYXNlLCBzZWUgaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTMyMTU5IC0gJyArICghaGFzRmxhc2ggPycgd291bGQgdXNlIGZsYXNoIGZhbGxiYWNrIGZvciBNUDMvTVA0LCBidXQgbm9uZSBkZXRlY3RlZC4nIDogJ3dpbGwgdXNlIGZsYXNoIGZhbGxiYWNrIGZvciBNUDMvTVA0LCBpZiBhdmFpbGFibGUnKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDwvZD5cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNtMi51c2VIVE1MNUF1ZGlvICYmIHNtMi5oYXNIVE1MNSkge1xyXG5cclxuICAgICAgLy8gc29ydCBvdXQgd2hldGhlciBmbGFzaCBpcyBvcHRpb25hbCwgcmVxdWlyZWQgb3IgY2FuIGJlIGlnbm9yZWQuXHJcblxyXG4gICAgICAvLyBpbm5vY2VudCB1bnRpbCBwcm92ZW4gZ3VpbHR5LlxyXG4gICAgICBjYW5JZ25vcmVGbGFzaCA9IHRydWU7XHJcblxyXG4gICAgICBmb3IgKGl0ZW0gaW4gZm9ybWF0cykge1xyXG4gICAgICAgIGlmIChmb3JtYXRzLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XHJcbiAgICAgICAgICBpZiAoZm9ybWF0c1tpdGVtXS5yZXF1aXJlZCkge1xyXG4gICAgICAgICAgICBpZiAoIXNtMi5odG1sNS5jYW5QbGF5VHlwZShmb3JtYXRzW2l0ZW1dLnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgLy8gMTAwJSBIVE1MNSBtb2RlIGlzIG5vdCBwb3NzaWJsZS5cclxuICAgICAgICAgICAgICBjYW5JZ25vcmVGbGFzaCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGZsYXNoTmVlZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzbTIucHJlZmVyRmxhc2ggJiYgKHNtMi5mbGFzaFtpdGVtXSB8fCBzbTIuZmxhc2hbZm9ybWF0c1tpdGVtXS50eXBlXSkpIHtcclxuICAgICAgICAgICAgICAvLyBmbGFzaCBtYXkgYmUgcmVxdWlyZWQsIG9yIHByZWZlcnJlZCBmb3IgdGhpcyBmb3JtYXQuXHJcbiAgICAgICAgICAgICAgZmxhc2hOZWVkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNhbml0eSBjaGVjay4uLlxyXG4gICAgaWYgKHNtMi5pZ25vcmVGbGFzaCkge1xyXG4gICAgICBmbGFzaE5lZWRlZCA9IGZhbHNlO1xyXG4gICAgICBjYW5JZ25vcmVGbGFzaCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgc20yLmh0bWw1T25seSA9IChzbTIuaGFzSFRNTDUgJiYgc20yLnVzZUhUTUw1QXVkaW8gJiYgIWZsYXNoTmVlZGVkKTtcclxuXHJcbiAgICByZXR1cm4gKCFzbTIuaHRtbDVPbmx5KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgcGFyc2VVUkwgPSBmdW5jdGlvbih1cmwpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludGVybmFsOiBGaW5kcyBhbmQgcmV0dXJucyB0aGUgZmlyc3QgcGxheWFibGUgVVJMIChvciBmYWlsaW5nIHRoYXQsIHRoZSBmaXJzdCBVUkwuKVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmcgb3IgYXJyYXl9IHVybCBBIHNpbmdsZSBVUkwgc3RyaW5nLCBPUiwgYW4gYXJyYXkgb2YgVVJMIHN0cmluZ3Mgb3Ige3VybDonL3BhdGgvdG8vcmVzb3VyY2UnLCB0eXBlOidhdWRpby9tcDMnfSBvYmplY3RzLlxyXG4gICAgICovXHJcblxyXG4gICAgdmFyIGksIGosIHVybFJlc3VsdCA9IDAsIHJlc3VsdDtcclxuXHJcbiAgICBpZiAodXJsIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHJcbiAgICAgIC8vIGZpbmQgdGhlIGZpcnN0IGdvb2Qgb25lXHJcbiAgICAgIGZvciAoaT0wLCBqPXVybC5sZW5ndGg7IGk8ajsgaSsrKSB7XHJcblxyXG4gICAgICAgIGlmICh1cmxbaV0gaW5zdGFuY2VvZiBPYmplY3QpIHtcclxuICAgICAgICAgIC8vIE1JTUUgY2hlY2tcclxuICAgICAgICAgIGlmIChzbTIuY2FuUGxheU1JTUUodXJsW2ldLnR5cGUpKSB7XHJcbiAgICAgICAgICAgIHVybFJlc3VsdCA9IGk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHNtMi5jYW5QbGF5VVJMKHVybFtpXSkpIHtcclxuICAgICAgICAgIC8vIFVSTCBzdHJpbmcgY2hlY2tcclxuICAgICAgICAgIHVybFJlc3VsdCA9IGk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBub3JtYWxpemUgdG8gc3RyaW5nXHJcbiAgICAgIGlmICh1cmxbdXJsUmVzdWx0XS51cmwpIHtcclxuICAgICAgICB1cmxbdXJsUmVzdWx0XSA9IHVybFt1cmxSZXN1bHRdLnVybDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVzdWx0ID0gdXJsW3VybFJlc3VsdF07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIC8vIHNpbmdsZSBVUkwgY2FzZVxyXG4gICAgICByZXN1bHQgPSB1cmw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gIH07XHJcblxyXG5cclxuICBzdGFydFRpbWVyID0gZnVuY3Rpb24ob1NvdW5kKSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhdHRhY2ggYSB0aW1lciB0byB0aGlzIHNvdW5kLCBhbmQgc3RhcnQgYW4gaW50ZXJ2YWwgaWYgbmVlZGVkXHJcbiAgICAgKi9cclxuXHJcbiAgICBpZiAoIW9Tb3VuZC5faGFzVGltZXIpIHtcclxuXHJcbiAgICAgIG9Tb3VuZC5faGFzVGltZXIgPSB0cnVlO1xyXG5cclxuICAgICAgaWYgKCFtb2JpbGVIVE1MNSAmJiBzbTIuaHRtbDVQb2xsaW5nSW50ZXJ2YWwpIHtcclxuXHJcbiAgICAgICAgaWYgKGg1SW50ZXJ2YWxUaW1lciA9PT0gbnVsbCAmJiBoNVRpbWVyQ291bnQgPT09IDApIHtcclxuXHJcbiAgICAgICAgICBoNUludGVydmFsVGltZXIgPSBzZXRJbnRlcnZhbCh0aW1lckV4ZWN1dGUsIHNtMi5odG1sNVBvbGxpbmdJbnRlcnZhbCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaDVUaW1lckNvdW50Kys7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBzdG9wVGltZXIgPSBmdW5jdGlvbihvU291bmQpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIGRldGFjaCBhIHRpbWVyXHJcbiAgICAgKi9cclxuXHJcbiAgICBpZiAob1NvdW5kLl9oYXNUaW1lcikge1xyXG5cclxuICAgICAgb1NvdW5kLl9oYXNUaW1lciA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKCFtb2JpbGVIVE1MNSAmJiBzbTIuaHRtbDVQb2xsaW5nSW50ZXJ2YWwpIHtcclxuXHJcbiAgICAgICAgLy8gaW50ZXJ2YWwgd2lsbCBzdG9wIGl0c2VsZiBhdCBuZXh0IGV4ZWN1dGlvbi5cclxuXHJcbiAgICAgICAgaDVUaW1lckNvdW50LS07XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICB0aW1lckV4ZWN1dGUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIG1hbnVhbCBwb2xsaW5nIGZvciBIVE1MNSBwcm9ncmVzcyBldmVudHMsIGllLiwgd2hpbGVwbGF5aW5nKCkgKGNhbiBhY2hpZXZlIGdyZWF0ZXIgcHJlY2lzaW9uIHRoYW4gY29uc2VydmF0aXZlIGRlZmF1bHQgSFRNTDUgaW50ZXJ2YWwpXHJcbiAgICAgKi9cclxuXHJcbiAgICB2YXIgaTtcclxuXHJcbiAgICBpZiAoaDVJbnRlcnZhbFRpbWVyICE9PSBudWxsICYmICFoNVRpbWVyQ291bnQpIHtcclxuXHJcbiAgICAgIC8vIG5vIGFjdGl2ZSB0aW1lcnMsIHN0b3AgcG9sbGluZyBpbnRlcnZhbC5cclxuXHJcbiAgICAgIGNsZWFySW50ZXJ2YWwoaDVJbnRlcnZhbFRpbWVyKTtcclxuXHJcbiAgICAgIGg1SW50ZXJ2YWxUaW1lciA9IG51bGw7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNoZWNrIGFsbCBIVE1MNSBzb3VuZHMgd2l0aCB0aW1lcnNcclxuXHJcbiAgICBmb3IgKGkgPSBzbTIuc291bmRJRHMubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcblxyXG4gICAgICBpZiAoc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLmlzSFRNTDUgJiYgc20yLnNvdW5kc1tzbTIuc291bmRJRHNbaV1dLl9oYXNUaW1lcikge1xyXG5cclxuICAgICAgICBzbTIuc291bmRzW3NtMi5zb3VuZElEc1tpXV0uX29uVGltZXIoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGNhdGNoRXJyb3IgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblxyXG4gICAgb3B0aW9ucyA9IChvcHRpb25zICE9PSBfdW5kZWZpbmVkID8gb3B0aW9ucyA6IHt9KTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHNtMi5vbmVycm9yID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHNtMi5vbmVycm9yLmFwcGx5KHdpbmRvdywgW3t0eXBlOihvcHRpb25zLnR5cGUgIT09IF91bmRlZmluZWQgPyBvcHRpb25zLnR5cGUgOiBudWxsKX1dKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5mYXRhbCAhPT0gX3VuZGVmaW5lZCAmJiBvcHRpb25zLmZhdGFsKSB7XHJcbiAgICAgIHNtMi5kaXNhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIGJhZFNhZmFyaUZpeCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIHNwZWNpYWwgY2FzZTogXCJiYWRcIiBTYWZhcmkgKE9TIFggMTAuMyAtIDEwLjcpIG11c3QgZmFsbCBiYWNrIHRvIGZsYXNoIGZvciBNUDMvTVA0XHJcbiAgICBpZiAoIWlzQmFkU2FmYXJpIHx8ICFkZXRlY3RGbGFzaCgpKSB7XHJcbiAgICAgIC8vIGRvZXNuJ3QgYXBwbHlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhRiA9IHNtMi5hdWRpb0Zvcm1hdHMsIGksIGl0ZW07XHJcblxyXG4gICAgZm9yIChpdGVtIGluIGFGKSB7XHJcbiAgICAgIGlmIChhRi5oYXNPd25Qcm9wZXJ0eShpdGVtKSkge1xyXG4gICAgICAgIGlmIChpdGVtID09PSAnbXAzJyB8fCBpdGVtID09PSAnbXA0Jykge1xyXG4gICAgICAgICAgc20yLl93RChzbSArICc6IFVzaW5nIGZsYXNoIGZhbGxiYWNrIGZvciAnICsgaXRlbSArICcgZm9ybWF0Jyk7XHJcbiAgICAgICAgICBzbTIuaHRtbDVbaXRlbV0gPSBmYWxzZTtcclxuICAgICAgICAgIC8vIGFzc2lnbiByZXN1bHQgdG8gcmVsYXRlZCBmb3JtYXRzLCB0b29cclxuICAgICAgICAgIGlmIChhRltpdGVtXSAmJiBhRltpdGVtXS5yZWxhdGVkKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IGFGW2l0ZW1dLnJlbGF0ZWQubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgc20yLmh0bWw1W2FGW2l0ZW1dLnJlbGF0ZWRbaV1dID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUHNldWRvLXByaXZhdGUgZmxhc2gvRXh0ZXJuYWxJbnRlcmZhY2UgbWV0aG9kc1xyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgKi9cclxuXHJcbiAgdGhpcy5fc2V0U2FuZGJveFR5cGUgPSBmdW5jdGlvbihzYW5kYm94VHlwZSkge1xyXG5cclxuICAgIC8vIDxkPlxyXG4gICAgdmFyIHNiID0gc20yLnNhbmRib3g7XHJcblxyXG4gICAgc2IudHlwZSA9IHNhbmRib3hUeXBlO1xyXG4gICAgc2IuZGVzY3JpcHRpb24gPSBzYi50eXBlc1soc2IudHlwZXNbc2FuZGJveFR5cGVdICE9PSBfdW5kZWZpbmVkP3NhbmRib3hUeXBlOid1bmtub3duJyldO1xyXG5cclxuICAgIGlmIChzYi50eXBlID09PSAnbG9jYWxXaXRoRmlsZScpIHtcclxuXHJcbiAgICAgIHNiLm5vUmVtb3RlID0gdHJ1ZTtcclxuICAgICAgc2Iubm9Mb2NhbCA9IGZhbHNlO1xyXG4gICAgICBfd0RTKCdzZWNOb3RlJywgMik7XHJcblxyXG4gICAgfSBlbHNlIGlmIChzYi50eXBlID09PSAnbG9jYWxXaXRoTmV0d29yaycpIHtcclxuXHJcbiAgICAgIHNiLm5vUmVtb3RlID0gZmFsc2U7XHJcbiAgICAgIHNiLm5vTG9jYWwgPSB0cnVlO1xyXG5cclxuICAgIH0gZWxzZSBpZiAoc2IudHlwZSA9PT0gJ2xvY2FsVHJ1c3RlZCcpIHtcclxuXHJcbiAgICAgIHNiLm5vUmVtb3RlID0gZmFsc2U7XHJcbiAgICAgIHNiLm5vTG9jYWwgPSBmYWxzZTtcclxuXHJcbiAgICB9XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gIH07XHJcblxyXG4gIHRoaXMuX2V4dGVybmFsSW50ZXJmYWNlT0sgPSBmdW5jdGlvbihzd2ZWZXJzaW9uKSB7XHJcblxyXG4gICAgLy8gZmxhc2ggY2FsbGJhY2sgY29uZmlybWluZyBmbGFzaCBsb2FkZWQsIEVJIHdvcmtpbmcgZXRjLlxyXG4gICAgLy8gc3dmVmVyc2lvbjogU1dGIGJ1aWxkIHN0cmluZ1xyXG5cclxuICAgIGlmIChzbTIuc3dmTG9hZGVkKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZTtcclxuXHJcbiAgICBkZWJ1Z1RTKCdzd2YnLCB0cnVlKTtcclxuICAgIGRlYnVnVFMoJ2ZsYXNodG9qcycsIHRydWUpO1xyXG4gICAgc20yLnN3ZkxvYWRlZCA9IHRydWU7XHJcbiAgICB0cnlJbml0T25Gb2N1cyA9IGZhbHNlO1xyXG5cclxuICAgIGlmIChpc0JhZFNhZmFyaSkge1xyXG4gICAgICBiYWRTYWZhcmlGaXgoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjb21wbGFpbiBpZiBKUyArIFNXRiBidWlsZC92ZXJzaW9uIHN0cmluZ3MgZG9uJ3QgbWF0Y2gsIGV4Y2x1ZGluZyArREVWIGJ1aWxkc1xyXG4gICAgLy8gPGQ+XHJcbiAgICBpZiAoIXN3ZlZlcnNpb24gfHwgc3dmVmVyc2lvbi5yZXBsYWNlKC9cXCtkZXYvaSwnJykgIT09IHNtMi52ZXJzaW9uTnVtYmVyLnJlcGxhY2UoL1xcK2Rldi9pLCAnJykpIHtcclxuXHJcbiAgICAgIGUgPSBzbSArICc6IEZhdGFsOiBKYXZhU2NyaXB0IGZpbGUgYnVpbGQgXCInICsgc20yLnZlcnNpb25OdW1iZXIgKyAnXCIgZG9lcyBub3QgbWF0Y2ggRmxhc2ggU1dGIGJ1aWxkIFwiJyArIHN3ZlZlcnNpb24gKyAnXCIgYXQgJyArIHNtMi51cmwgKyAnLiBFbnN1cmUgYm90aCBhcmUgdXAtdG8tZGF0ZS4nO1xyXG5cclxuICAgICAgLy8gZXNjYXBlIGZsYXNoIC0+IEpTIHN0YWNrIHNvIHRoaXMgZXJyb3IgZmlyZXMgaW4gd2luZG93LlxyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uIHZlcnNpb25NaXNtYXRjaCgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZSk7XHJcbiAgICAgIH0sIDApO1xyXG5cclxuICAgICAgLy8gZXhpdCwgaW5pdCB3aWxsIGZhaWwgd2l0aCB0aW1lb3V0XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgLy8gSUUgbmVlZHMgYSBsYXJnZXIgdGltZW91dFxyXG4gICAgc2V0VGltZW91dChpbml0LCBpc0lFID8gMTAwIDogMSk7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFByaXZhdGUgaW5pdGlhbGl6YXRpb24gaGVscGVyc1xyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAqL1xyXG5cclxuICBjcmVhdGVNb3ZpZSA9IGZ1bmN0aW9uKHNtSUQsIHNtVVJMKSB7XHJcblxyXG4gICAgaWYgKGRpZEFwcGVuZCAmJiBhcHBlbmRTdWNjZXNzKSB7XHJcbiAgICAgIC8vIGlnbm9yZSBpZiBhbHJlYWR5IHN1Y2NlZWRlZFxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdE1zZygpIHtcclxuXHJcbiAgICAgIC8vIDxkPlxyXG5cclxuICAgICAgdmFyIG9wdGlvbnMgPSBbXSxcclxuICAgICAgICAgIHRpdGxlLFxyXG4gICAgICAgICAgbXNnID0gW10sXHJcbiAgICAgICAgICBkZWxpbWl0ZXIgPSAnICsgJztcclxuXHJcbiAgICAgIHRpdGxlID0gJ1NvdW5kTWFuYWdlciAnICsgc20yLnZlcnNpb24gKyAoIXNtMi5odG1sNU9ubHkgJiYgc20yLnVzZUhUTUw1QXVkaW8gPyAoc20yLmhhc0hUTUw1ID8gJyArIEhUTUw1IGF1ZGlvJyA6ICcsIG5vIEhUTUw1IGF1ZGlvIHN1cHBvcnQnKSA6ICcnKTtcclxuXHJcbiAgICAgIGlmICghc20yLmh0bWw1T25seSkge1xyXG5cclxuICAgICAgICBpZiAoc20yLnByZWZlckZsYXNoKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ3ByZWZlckZsYXNoJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc20yLnVzZUhpZ2hQZXJmb3JtYW5jZSkge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCd1c2VIaWdoUGVyZm9ybWFuY2UnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzbTIuZmxhc2hQb2xsaW5nSW50ZXJ2YWwpIHtcclxuICAgICAgICAgIG9wdGlvbnMucHVzaCgnZmxhc2hQb2xsaW5nSW50ZXJ2YWwgKCcgKyBzbTIuZmxhc2hQb2xsaW5nSW50ZXJ2YWwgKyAnbXMpJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc20yLmh0bWw1UG9sbGluZ0ludGVydmFsKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ2h0bWw1UG9sbGluZ0ludGVydmFsICgnICsgc20yLmh0bWw1UG9sbGluZ0ludGVydmFsICsgJ21zKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNtMi53bW9kZSkge1xyXG4gICAgICAgICAgb3B0aW9ucy5wdXNoKCd3bW9kZSAoJyArIHNtMi53bW9kZSArICcpJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc20yLmRlYnVnRmxhc2gpIHtcclxuICAgICAgICAgIG9wdGlvbnMucHVzaCgnZGVidWdGbGFzaCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNtMi51c2VGbGFzaEJsb2NrKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ2ZsYXNoQmxvY2snKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICBpZiAoc20yLmh0bWw1UG9sbGluZ0ludGVydmFsKSB7XHJcbiAgICAgICAgICBvcHRpb25zLnB1c2goJ2h0bWw1UG9sbGluZ0ludGVydmFsICgnICsgc20yLmh0bWw1UG9sbGluZ0ludGVydmFsICsgJ21zKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvcHRpb25zLmxlbmd0aCkge1xyXG4gICAgICAgIG1zZyA9IG1zZy5jb25jYXQoW29wdGlvbnMuam9pbihkZWxpbWl0ZXIpXSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHNtMi5fd0QodGl0bGUgKyAobXNnLmxlbmd0aCA/IGRlbGltaXRlciArIG1zZy5qb2luKCcsICcpIDogJycpLCAxKTtcclxuXHJcbiAgICAgIHNob3dTdXBwb3J0KCk7XHJcblxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcblxyXG4gICAgICAvLyAxMDAlIEhUTUw1IG1vZGVcclxuICAgICAgc2V0VmVyc2lvbkluZm8oKTtcclxuXHJcbiAgICAgIGluaXRNc2coKTtcclxuICAgICAgc20yLm9NQyA9IGlkKHNtMi5tb3ZpZUlEKTtcclxuICAgICAgaW5pdCgpO1xyXG5cclxuICAgICAgLy8gcHJldmVudCBtdWx0aXBsZSBpbml0IGF0dGVtcHRzXHJcbiAgICAgIGRpZEFwcGVuZCA9IHRydWU7XHJcblxyXG4gICAgICBhcHBlbmRTdWNjZXNzID0gdHJ1ZTtcclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gZmxhc2ggcGF0aFxyXG4gICAgdmFyIHJlbW90ZVVSTCA9IChzbVVSTCB8fCBzbTIudXJsKSxcclxuICAgIGxvY2FsVVJMID0gKHNtMi5hbHRVUkwgfHwgcmVtb3RlVVJMKSxcclxuICAgIHN3ZlRpdGxlID0gJ0pTL0ZsYXNoIGF1ZGlvIGNvbXBvbmVudCAoU291bmRNYW5hZ2VyIDIpJyxcclxuICAgIG9UYXJnZXQgPSBnZXREb2N1bWVudCgpLFxyXG4gICAgZXh0cmFDbGFzcyA9IGdldFNXRkNTUygpLFxyXG4gICAgaXNSVEwgPSBudWxsLFxyXG4gICAgaHRtbCA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaHRtbCcpWzBdLFxyXG4gICAgb0VtYmVkLCBvTW92aWUsIHRtcCwgbW92aWVIVE1MLCBvRWwsIHMsIHgsIHNDbGFzcztcclxuXHJcbiAgICBpc1JUTCA9IChodG1sICYmIGh0bWwuZGlyICYmIGh0bWwuZGlyLm1hdGNoKC9ydGwvaSkpO1xyXG4gICAgc21JRCA9IChzbUlEID09PSBfdW5kZWZpbmVkP3NtMi5pZDpzbUlEKTtcclxuXHJcbiAgICBmdW5jdGlvbiBwYXJhbShuYW1lLCB2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gJzxwYXJhbSBuYW1lPVwiJytuYW1lKydcIiB2YWx1ZT1cIicrdmFsdWUrJ1wiIC8+JztcclxuICAgIH1cclxuXHJcbiAgICAvLyBzYWZldHkgY2hlY2sgZm9yIGxlZ2FjeSAoY2hhbmdlIHRvIEZsYXNoIDkgVVJMKVxyXG4gICAgc2V0VmVyc2lvbkluZm8oKTtcclxuICAgIHNtMi51cmwgPSBub3JtYWxpemVNb3ZpZVVSTChvdmVySFRUUD9yZW1vdGVVUkw6bG9jYWxVUkwpO1xyXG4gICAgc21VUkwgPSBzbTIudXJsO1xyXG5cclxuICAgIHNtMi53bW9kZSA9ICghc20yLndtb2RlICYmIHNtMi51c2VIaWdoUGVyZm9ybWFuY2UgPyAndHJhbnNwYXJlbnQnIDogc20yLndtb2RlKTtcclxuXHJcbiAgICBpZiAoc20yLndtb2RlICE9PSBudWxsICYmICh1YS5tYXRjaCgvbXNpZSA4L2kpIHx8ICghaXNJRSAmJiAhc20yLnVzZUhpZ2hQZXJmb3JtYW5jZSkpICYmIG5hdmlnYXRvci5wbGF0Zm9ybS5tYXRjaCgvd2luMzJ8d2luNjQvaSkpIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIGV4dHJhLXNwZWNpYWwgY2FzZTogbW92aWUgZG9lc24ndCBsb2FkIHVudGlsIHNjcm9sbGVkIGludG8gdmlldyB3aGVuIHVzaW5nIHdtb2RlID0gYW55dGhpbmcgYnV0ICd3aW5kb3cnIGhlcmVcclxuICAgICAgICogZG9lcyBub3QgYXBwbHkgd2hlbiB1c2luZyBoaWdoIHBlcmZvcm1hbmNlIChwb3NpdGlvbjpmaXhlZCBtZWFucyBvbi1zY3JlZW4pLCBPUiBpbmZpbml0ZSBmbGFzaCBsb2FkIHRpbWVvdXRcclxuICAgICAgICogd21vZGUgYnJlYWtzIElFIDggb24gVmlzdGEgKyBXaW43IHRvbyBpbiBzb21lIGNhc2VzLCBhcyBvZiBKYW51YXJ5IDIwMTEgKD8pXHJcbiAgICAgICAqL1xyXG4gICAgICAgbWVzc2FnZXMucHVzaChzdHJpbmdzLnNwY1dtb2RlKTtcclxuICAgICAgc20yLndtb2RlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBvRW1iZWQgPSB7XHJcbiAgICAgICduYW1lJzogc21JRCxcclxuICAgICAgJ2lkJzogc21JRCxcclxuICAgICAgJ3NyYyc6IHNtVVJMLFxyXG4gICAgICAncXVhbGl0eSc6ICdoaWdoJyxcclxuICAgICAgJ2FsbG93U2NyaXB0QWNjZXNzJzogc20yLmFsbG93U2NyaXB0QWNjZXNzLFxyXG4gICAgICAnYmdjb2xvcic6IHNtMi5iZ0NvbG9yLFxyXG4gICAgICAncGx1Z2luc3BhZ2UnOiBodHRwKyd3d3cubWFjcm9tZWRpYS5jb20vZ28vZ2V0Zmxhc2hwbGF5ZXInLFxyXG4gICAgICAndGl0bGUnOiBzd2ZUaXRsZSxcclxuICAgICAgJ3R5cGUnOiAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxyXG4gICAgICAnd21vZGUnOiBzbTIud21vZGUsXHJcbiAgICAgIC8vIGh0dHA6Ly9oZWxwLmFkb2JlLmNvbS9lbl9VUy9hczMvbW9iaWxlL1dTNGJlYmNkNjZhNzQyNzVjMzZjZmI4MTM3MTI0MzE4ZWViYzYtN2ZmZC5odG1sXHJcbiAgICAgICdoYXNQcmlvcml0eSc6ICd0cnVlJ1xyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoc20yLmRlYnVnRmxhc2gpIHtcclxuICAgICAgb0VtYmVkLkZsYXNoVmFycyA9ICdkZWJ1Zz0xJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNtMi53bW9kZSkge1xyXG4gICAgICAvLyBkb24ndCB3cml0ZSBlbXB0eSBhdHRyaWJ1dGVcclxuICAgICAgZGVsZXRlIG9FbWJlZC53bW9kZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNJRSkge1xyXG5cclxuICAgICAgLy8gSUUgaXMgXCJzcGVjaWFsXCIuXHJcbiAgICAgIG9Nb3ZpZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgbW92aWVIVE1MID0gW1xyXG4gICAgICAgICc8b2JqZWN0IGlkPVwiJyArIHNtSUQgKyAnXCIgZGF0YT1cIicgKyBzbVVSTCArICdcIiB0eXBlPVwiJyArIG9FbWJlZC50eXBlICsgJ1wiIHRpdGxlPVwiJyArIG9FbWJlZC50aXRsZSArJ1wiIGNsYXNzaWQ9XCJjbHNpZDpEMjdDREI2RS1BRTZELTExY2YtOTZCOC00NDQ1NTM1NDAwMDBcIiBjb2RlYmFzZT1cIicgKyBodHRwKydkb3dubG9hZC5tYWNyb21lZGlhLmNvbS9wdWIvc2hvY2t3YXZlL2NhYnMvZmxhc2gvc3dmbGFzaC5jYWIjdmVyc2lvbj02LDAsNDAsMFwiPicsXHJcbiAgICAgICAgcGFyYW0oJ21vdmllJywgc21VUkwpLFxyXG4gICAgICAgIHBhcmFtKCdBbGxvd1NjcmlwdEFjY2VzcycsIHNtMi5hbGxvd1NjcmlwdEFjY2VzcyksXHJcbiAgICAgICAgcGFyYW0oJ3F1YWxpdHknLCBvRW1iZWQucXVhbGl0eSksXHJcbiAgICAgICAgKHNtMi53bW9kZT8gcGFyYW0oJ3dtb2RlJywgc20yLndtb2RlKTogJycpLFxyXG4gICAgICAgIHBhcmFtKCdiZ2NvbG9yJywgc20yLmJnQ29sb3IpLFxyXG4gICAgICAgIHBhcmFtKCdoYXNQcmlvcml0eScsICd0cnVlJyksXHJcbiAgICAgICAgKHNtMi5kZWJ1Z0ZsYXNoID8gcGFyYW0oJ0ZsYXNoVmFycycsIG9FbWJlZC5GbGFzaFZhcnMpIDogJycpLFxyXG4gICAgICAgICc8L29iamVjdD4nXHJcbiAgICAgIF0uam9pbignJyk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuXHJcbiAgICAgIG9Nb3ZpZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdlbWJlZCcpO1xyXG4gICAgICBmb3IgKHRtcCBpbiBvRW1iZWQpIHtcclxuICAgICAgICBpZiAob0VtYmVkLmhhc093blByb3BlcnR5KHRtcCkpIHtcclxuICAgICAgICAgIG9Nb3ZpZS5zZXRBdHRyaWJ1dGUodG1wLCBvRW1iZWRbdG1wXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXREZWJ1ZygpO1xyXG4gICAgZXh0cmFDbGFzcyA9IGdldFNXRkNTUygpO1xyXG4gICAgb1RhcmdldCA9IGdldERvY3VtZW50KCk7XHJcblxyXG4gICAgaWYgKG9UYXJnZXQpIHtcclxuXHJcbiAgICAgIHNtMi5vTUMgPSAoaWQoc20yLm1vdmllSUQpIHx8IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKSk7XHJcblxyXG4gICAgICBpZiAoIXNtMi5vTUMuaWQpIHtcclxuXHJcbiAgICAgICAgc20yLm9NQy5pZCA9IHNtMi5tb3ZpZUlEO1xyXG4gICAgICAgIHNtMi5vTUMuY2xhc3NOYW1lID0gc3dmQ1NTLnN3ZkRlZmF1bHQgKyAnICcgKyBleHRyYUNsYXNzO1xyXG4gICAgICAgIHMgPSBudWxsO1xyXG4gICAgICAgIG9FbCA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghc20yLnVzZUZsYXNoQmxvY2spIHtcclxuICAgICAgICAgIGlmIChzbTIudXNlSGlnaFBlcmZvcm1hbmNlKSB7XHJcbiAgICAgICAgICAgIC8vIG9uLXNjcmVlbiBhdCBhbGwgdGltZXNcclxuICAgICAgICAgICAgcyA9IHtcclxuICAgICAgICAgICAgICAncG9zaXRpb24nOiAnZml4ZWQnLFxyXG4gICAgICAgICAgICAgICd3aWR0aCc6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICdoZWlnaHQnOiAnOHB4JyxcclxuICAgICAgICAgICAgICAvLyA+PSA2cHggZm9yIGZsYXNoIHRvIHJ1biBmYXN0LCA+PSA4cHggdG8gc3RhcnQgdXAgdW5kZXIgRmlyZWZveC93aW4zMiBpbiBzb21lIGNhc2VzLiBvZGQ/IHllcy5cclxuICAgICAgICAgICAgICAnYm90dG9tJzogJzBweCcsXHJcbiAgICAgICAgICAgICAgJ2xlZnQnOiAnMHB4JyxcclxuICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gaGlkZSBvZmYtc2NyZWVuLCBsb3dlciBwcmlvcml0eVxyXG4gICAgICAgICAgICBzID0ge1xyXG4gICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgJ3dpZHRoJzogJzZweCcsXHJcbiAgICAgICAgICAgICAgJ2hlaWdodCc6ICc2cHgnLFxyXG4gICAgICAgICAgICAgICd0b3AnOiAnLTk5OTlweCcsXHJcbiAgICAgICAgICAgICAgJ2xlZnQnOiAnLTk5OTlweCdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKGlzUlRMKSB7XHJcbiAgICAgICAgICAgICAgcy5sZWZ0ID0gTWF0aC5hYnMocGFyc2VJbnQocy5sZWZ0LDEwKSkrJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzV2Via2l0KSB7XHJcbiAgICAgICAgICAvLyBzb3VuZGNsb3VkLXJlcG9ydGVkIHJlbmRlci9jcmFzaCBmaXgsIHNhZmFyaSA1XHJcbiAgICAgICAgICBzbTIub01DLnN0eWxlLnpJbmRleCA9IDEwMDAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzbTIuZGVidWdGbGFzaCkge1xyXG4gICAgICAgICAgZm9yICh4IGluIHMpIHtcclxuICAgICAgICAgICAgaWYgKHMuaGFzT3duUHJvcGVydHkoeCkpIHtcclxuICAgICAgICAgICAgICBzbTIub01DLnN0eWxlW3hdID0gc1t4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGlmICghaXNJRSkge1xyXG4gICAgICAgICAgICBzbTIub01DLmFwcGVuZENoaWxkKG9Nb3ZpZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBvVGFyZ2V0LmFwcGVuZENoaWxkKHNtMi5vTUMpO1xyXG4gICAgICAgICAgaWYgKGlzSUUpIHtcclxuICAgICAgICAgICAgb0VsID0gc20yLm9NQy5hcHBlbmRDaGlsZChkb2MuY3JlYXRlRWxlbWVudCgnZGl2JykpO1xyXG4gICAgICAgICAgICBvRWwuY2xhc3NOYW1lID0gc3dmQ1NTLnN3ZkJveDtcclxuICAgICAgICAgICAgb0VsLmlubmVySFRNTCA9IG1vdmllSFRNTDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGFwcGVuZFN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHN0cignZG9tRXJyb3InKSsnIFxcbicrZS50b1N0cmluZygpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBTTTIgY29udGFpbmVyIGlzIGFscmVhZHkgaW4gdGhlIGRvY3VtZW50IChlZy4gZmxhc2hibG9jayB1c2UgY2FzZSlcclxuICAgICAgICBzQ2xhc3MgPSBzbTIub01DLmNsYXNzTmFtZTtcclxuICAgICAgICBzbTIub01DLmNsYXNzTmFtZSA9IChzQ2xhc3M/c0NsYXNzKycgJzpzd2ZDU1Muc3dmRGVmYXVsdCkgKyAoZXh0cmFDbGFzcz8nICcrZXh0cmFDbGFzczonJyk7XHJcbiAgICAgICAgc20yLm9NQy5hcHBlbmRDaGlsZChvTW92aWUpO1xyXG4gICAgICAgIGlmIChpc0lFKSB7XHJcbiAgICAgICAgICBvRWwgPSBzbTIub01DLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKSk7XHJcbiAgICAgICAgICBvRWwuY2xhc3NOYW1lID0gc3dmQ1NTLnN3ZkJveDtcclxuICAgICAgICAgIG9FbC5pbm5lckhUTUwgPSBtb3ZpZUhUTUw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFwcGVuZFN1Y2Nlc3MgPSB0cnVlO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBkaWRBcHBlbmQgPSB0cnVlO1xyXG4gICAgaW5pdE1zZygpO1xyXG4gICAgLy8gc20yLl93RChzbSArICc6IFRyeWluZyB0byBsb2FkICcgKyBzbVVSTCArICghb3ZlckhUVFAgJiYgc20yLmFsdFVSTCA/ICcgKGFsdGVybmF0ZSBVUkwpJyA6ICcnKSwgMSk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGluaXRNb3ZpZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmIChzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgIGNyZWF0ZU1vdmllKCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBhdHRlbXB0IHRvIGdldCwgb3IgY3JlYXRlLCBtb3ZpZSAobWF5IGFscmVhZHkgZXhpc3QpXHJcbiAgICBpZiAoZmxhc2gpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc20yLnVybCkge1xyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFNvbWV0aGluZyBpc24ndCByaWdodCAtIHdlJ3ZlIHJlYWNoZWQgaW5pdCwgYnV0IHRoZSBzb3VuZE1hbmFnZXIgdXJsIHByb3BlcnR5IGhhcyBub3QgYmVlbiBzZXQuXHJcbiAgICAgICAqIFVzZXIgaGFzIG5vdCBjYWxsZWQgc2V0dXAoe3VybDogLi4ufSksIG9yIGhhcyBub3Qgc2V0IHNvdW5kTWFuYWdlci51cmwgKGxlZ2FjeSB1c2UgY2FzZSkgZGlyZWN0bHkgYmVmb3JlIGluaXQgdGltZS5cclxuICAgICAgICogTm90aWZ5IGFuZCBleGl0LiBJZiB1c2VyIGNhbGxzIHNldHVwKCkgd2l0aCBhIHVybDogcHJvcGVydHksIGluaXQgd2lsbCBiZSByZXN0YXJ0ZWQgYXMgaW4gdGhlIGRlZmVycmVkIGxvYWRpbmcgY2FzZS5cclxuICAgICAgICovXHJcblxyXG4gICAgICAgX3dEUygnbm9VUkwnKTtcclxuICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gaW5saW5lIG1hcmt1cCBjYXNlXHJcbiAgICBmbGFzaCA9IHNtMi5nZXRNb3ZpZShzbTIuaWQpO1xyXG5cclxuICAgIGlmICghZmxhc2gpIHtcclxuICAgICAgaWYgKCFvUmVtb3ZlZCkge1xyXG4gICAgICAgIC8vIHRyeSB0byBjcmVhdGVcclxuICAgICAgICBjcmVhdGVNb3ZpZShzbTIuaWQsIHNtMi51cmwpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIHRyeSB0byByZS1hcHBlbmQgcmVtb3ZlZCBtb3ZpZSBhZnRlciByZWJvb3QoKVxyXG4gICAgICAgIGlmICghaXNJRSkge1xyXG4gICAgICAgICAgc20yLm9NQy5hcHBlbmRDaGlsZChvUmVtb3ZlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNtMi5vTUMuaW5uZXJIVE1MID0gb1JlbW92ZWRIVE1MO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvUmVtb3ZlZCA9IG51bGw7XHJcbiAgICAgICAgZGlkQXBwZW5kID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBmbGFzaCA9IHNtMi5nZXRNb3ZpZShzbTIuaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2Ygc20yLm9uaW5pdG1vdmllID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHNldFRpbWVvdXQoc20yLm9uaW5pdG1vdmllLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA8ZD5cclxuICAgIGZsdXNoTWVzc2FnZXMoKTtcclxuICAgIC8vIDwvZD5cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgZGVsYXlXYWl0Rm9yRUkgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBzZXRUaW1lb3V0KHdhaXRGb3JFSSwgMTAwMCk7XHJcblxyXG4gIH07XHJcblxyXG4gIHJlYm9vdEludG9IVE1MNSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIHNwZWNpYWwgY2FzZTogdHJ5IGZvciBhIHJlYm9vdCB3aXRoIHByZWZlckZsYXNoOiBmYWxzZSwgaWYgMTAwJSBIVE1MNSBtb2RlIGlzIHBvc3NpYmxlIGFuZCB1c2VGbGFzaEJsb2NrIGlzIG5vdCBlbmFibGVkLlxyXG5cclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgY29tcGxhaW4oc21jICsgJ3VzZUZsYXNoQmxvY2sgaXMgZmFsc2UsIDEwMCUgSFRNTDUgbW9kZSBpcyBwb3NzaWJsZS4gUmVib290aW5nIHdpdGggcHJlZmVyRmxhc2g6IGZhbHNlLi4uJyk7XHJcblxyXG4gICAgICBzbTIuc2V0dXAoe1xyXG4gICAgICAgIHByZWZlckZsYXNoOiBmYWxzZVxyXG4gICAgICB9KS5yZWJvb3QoKTtcclxuXHJcbiAgICAgIC8vIGlmIGZvciBzb21lIHJlYXNvbiB5b3Ugd2FudCB0byBkZXRlY3QgdGhpcyBjYXNlLCB1c2UgYW4gb250aW1lb3V0KCkgY2FsbGJhY2sgYW5kIGxvb2sgZm9yIGh0bWw1T25seSBhbmQgZGlkRmxhc2hCbG9jayA9PSB0cnVlLlxyXG4gICAgICBzbTIuZGlkRmxhc2hCbG9jayA9IHRydWU7XHJcblxyXG4gICAgICBzbTIuYmVnaW5EZWxheWVkSW5pdCgpO1xyXG5cclxuICAgIH0sIDEpO1xyXG5cclxuICB9O1xyXG5cclxuICB3YWl0Rm9yRUkgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgcCxcclxuICAgICAgICBsb2FkSW5jb21wbGV0ZSA9IGZhbHNlO1xyXG5cclxuICAgIGlmICghc20yLnVybCkge1xyXG4gICAgICAvLyBObyBTV0YgdXJsIHRvIGxvYWQgKG5vVVJMIGNhc2UpIC0gZXhpdCBmb3Igbm93LiBXaWxsIGJlIHJldHJpZWQgd2hlbiB1cmwgaXMgc2V0LlxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHdhaXRpbmdGb3JFSSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgd2FpdGluZ0ZvckVJID0gdHJ1ZTtcclxuICAgIGV2ZW50LnJlbW92ZSh3aW5kb3csICdsb2FkJywgZGVsYXlXYWl0Rm9yRUkpO1xyXG5cclxuICAgIGlmIChoYXNGbGFzaCAmJiB0cnlJbml0T25Gb2N1cyAmJiAhaXNGb2N1c2VkKSB7XHJcbiAgICAgIC8vIFNhZmFyaSB3b24ndCBsb2FkIGZsYXNoIGluIGJhY2tncm91bmQgdGFicywgb25seSB3aGVuIGZvY3VzZWQuXHJcbiAgICAgIF93RFMoJ3dhaXRGb2N1cycpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFkaWRJbml0KSB7XHJcbiAgICAgIHAgPSBzbTIuZ2V0TW92aWVQZXJjZW50KCk7XHJcbiAgICAgIGlmIChwID4gMCAmJiBwIDwgMTAwKSB7XHJcbiAgICAgICAgbG9hZEluY29tcGxldGUgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHAgPSBzbTIuZ2V0TW92aWVQZXJjZW50KCk7XHJcblxyXG4gICAgICBpZiAobG9hZEluY29tcGxldGUpIHtcclxuICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IGlmIG1vdmllICpwYXJ0aWFsbHkqIGxvYWRlZCwgcmV0cnkgdW50aWwgaXQncyAxMDAlIGJlZm9yZSBhc3N1bWluZyBmYWlsdXJlLlxyXG4gICAgICAgIHdhaXRpbmdGb3JFSSA9IGZhbHNlO1xyXG4gICAgICAgIHNtMi5fd0Qoc3RyKCd3YWl0U1dGJykpO1xyXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGRlbGF5V2FpdEZvckVJLCAxKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIDxkPlxyXG4gICAgICBpZiAoIWRpZEluaXQpIHtcclxuXHJcbiAgICAgICAgc20yLl93RChzbSArICc6IE5vIEZsYXNoIHJlc3BvbnNlIHdpdGhpbiBleHBlY3RlZCB0aW1lLiBMaWtlbHkgY2F1c2VzOiAnICsgKHAgPT09IDAgPyAnU1dGIGxvYWQgZmFpbGVkLCAnOicnKSArICdGbGFzaCBibG9ja2VkIG9yIEpTLUZsYXNoIHNlY3VyaXR5IGVycm9yLicgKyAoc20yLmRlYnVnRmxhc2g/JyAnICsgc3RyKCdjaGVja1NXRicpOicnKSwgMik7XHJcblxyXG4gICAgICAgIGlmICghb3ZlckhUVFAgJiYgcCkge1xyXG5cclxuICAgICAgICAgIF93RFMoJ2xvY2FsRmFpbCcsIDIpO1xyXG5cclxuICAgICAgICAgIGlmICghc20yLmRlYnVnRmxhc2gpIHtcclxuICAgICAgICAgICAgX3dEUygndHJ5RGVidWcnLCAyKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocCA9PT0gMCkge1xyXG5cclxuICAgICAgICAgIC8vIGlmIDAgKG5vdCBudWxsKSwgcHJvYmFibHkgYSA0MDQuXHJcbiAgICAgICAgICBzbTIuX3dEKHN0cignc3dmNDA0Jywgc20yLnVybCksIDEpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlYnVnVFMoJ2ZsYXNodG9qcycsIGZhbHNlLCAnOiBUaW1lZCBvdXQnICsgb3ZlckhUVFA/JyAoQ2hlY2sgZmxhc2ggc2VjdXJpdHkgb3IgZmxhc2ggYmxvY2tlcnMpJzonIChObyBwbHVnaW4vbWlzc2luZyBTV0Y/KScpO1xyXG5cclxuICAgICAgfVxyXG4gICAgICAvLyA8L2Q+XHJcblxyXG4gICAgICAvLyBnaXZlIHVwIC8gdGltZS1vdXQsIGRlcGVuZGluZ1xyXG5cclxuICAgICAgaWYgKCFkaWRJbml0ICYmIG9rVG9EaXNhYmxlKSB7XHJcblxyXG4gICAgICAgIGlmIChwID09PSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgLy8gU1dGIGZhaWxlZCB0byByZXBvcnQgbG9hZCBwcm9ncmVzcy4gUG9zc2libHkgYmxvY2tlZC5cclxuXHJcbiAgICAgICAgICBpZiAoc20yLnVzZUZsYXNoQmxvY2sgfHwgc20yLmZsYXNoTG9hZFRpbWVvdXQgPT09IDApIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChzbTIudXNlRmxhc2hCbG9jaykge1xyXG5cclxuICAgICAgICAgICAgICBmbGFzaEJsb2NrSGFuZGxlcigpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgX3dEUygnd2FpdEZvcmV2ZXInKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gbm8gY3VzdG9tIGZsYXNoIGJsb2NrIGhhbmRsaW5nLCBidXQgU1dGIGhhcyB0aW1lZCBvdXQuIFdpbGwgcmVjb3ZlciBpZiB1c2VyIHVuYmxvY2tzIC8gYWxsb3dzIFNXRiBsb2FkLlxyXG5cclxuICAgICAgICAgICAgaWYgKCFzbTIudXNlRmxhc2hCbG9jayAmJiBjYW5JZ25vcmVGbGFzaCkge1xyXG5cclxuICAgICAgICAgICAgICByZWJvb3RJbnRvSFRNTDUoKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIF93RFMoJ3dhaXRGb3JldmVyJyk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIGZpcmUgYW55IHJlZ3VsYXIgcmVnaXN0ZXJlZCBvbnRpbWVvdXQoKSBsaXN0ZW5lcnMuXHJcbiAgICAgICAgICAgICAgcHJvY2Vzc09uRXZlbnRzKHt0eXBlOidvbnRpbWVvdXQnLCBpZ25vcmVJbml0OiB0cnVlLCBlcnJvcjoge3R5cGU6ICdJTklUX0ZMQVNIQkxPQ0snfX0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBTV0YgbG9hZGVkPyBTaG91bGRuJ3QgYmUgYSBibG9ja2luZyBpc3N1ZSwgdGhlbi5cclxuXHJcbiAgICAgICAgICBpZiAoc20yLmZsYXNoTG9hZFRpbWVvdXQgPT09IDApIHtcclxuXHJcbiAgICAgICAgICAgIF93RFMoJ3dhaXRGb3JldmVyJyk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghc20yLnVzZUZsYXNoQmxvY2sgJiYgY2FuSWdub3JlRmxhc2gpIHtcclxuXHJcbiAgICAgICAgICAgICAgcmVib290SW50b0hUTUw1KCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICBmYWlsU2FmZWx5KHRydWUpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sIHNtMi5mbGFzaExvYWRUaW1lb3V0KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaGFuZGxlRm9jdXMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xyXG4gICAgICBldmVudC5yZW1vdmUod2luZG93LCAnZm9jdXMnLCBoYW5kbGVGb2N1cyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzRm9jdXNlZCB8fCAhdHJ5SW5pdE9uRm9jdXMpIHtcclxuICAgICAgLy8gYWxyZWFkeSBmb2N1c2VkLCBvciBub3Qgc3BlY2lhbCBTYWZhcmkgYmFja2dyb3VuZCB0YWIgY2FzZVxyXG4gICAgICBjbGVhbnVwKCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIG9rVG9EaXNhYmxlID0gdHJ1ZTtcclxuICAgIGlzRm9jdXNlZCA9IHRydWU7XHJcbiAgICBfd0RTKCdnb3RGb2N1cycpO1xyXG5cclxuICAgIC8vIGFsbG93IGluaXQgdG8gcmVzdGFydFxyXG4gICAgd2FpdGluZ0ZvckVJID0gZmFsc2U7XHJcblxyXG4gICAgLy8ga2ljayBvZmYgRXh0ZXJuYWxJbnRlcmZhY2UgdGltZW91dCwgbm93IHRoYXQgdGhlIFNXRiBoYXMgc3RhcnRlZFxyXG4gICAgZGVsYXlXYWl0Rm9yRUkoKTtcclxuXHJcbiAgICBjbGVhbnVwKCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgZmx1c2hNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIDxkPlxyXG5cclxuICAgIC8vIFNNMiBwcmUtaW5pdCBkZWJ1ZyBtZXNzYWdlc1xyXG4gICAgaWYgKG1lc3NhZ2VzLmxlbmd0aCkge1xyXG4gICAgICBzbTIuX3dEKCdTb3VuZE1hbmFnZXIgMjogJyArIG1lc3NhZ2VzLmpvaW4oJyAnKSwgMSk7XHJcbiAgICAgIG1lc3NhZ2VzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gPC9kPlxyXG5cclxuICB9O1xyXG5cclxuICBzaG93U3VwcG9ydCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIDxkPlxyXG5cclxuICAgIGZsdXNoTWVzc2FnZXMoKTtcclxuXHJcbiAgICB2YXIgaXRlbSwgdGVzdHMgPSBbXTtcclxuXHJcbiAgICBpZiAoc20yLnVzZUhUTUw1QXVkaW8gJiYgc20yLmhhc0hUTUw1KSB7XHJcbiAgICAgIGZvciAoaXRlbSBpbiBzbTIuYXVkaW9Gb3JtYXRzKSB7XHJcbiAgICAgICAgaWYgKHNtMi5hdWRpb0Zvcm1hdHMuaGFzT3duUHJvcGVydHkoaXRlbSkpIHtcclxuICAgICAgICAgIHRlc3RzLnB1c2goaXRlbSArICcgPSAnICsgc20yLmh0bWw1W2l0ZW1dICsgKCFzbTIuaHRtbDVbaXRlbV0gJiYgbmVlZHNGbGFzaCAmJiBzbTIuZmxhc2hbaXRlbV0gPyAnICh1c2luZyBmbGFzaCknIDogKHNtMi5wcmVmZXJGbGFzaCAmJiBzbTIuZmxhc2hbaXRlbV0gJiYgbmVlZHNGbGFzaCA/ICcgKHByZWZlcnJpbmcgZmxhc2gpJzogKCFzbTIuaHRtbDVbaXRlbV0gPyAnICgnICsgKHNtMi5hdWRpb0Zvcm1hdHNbaXRlbV0ucmVxdWlyZWQgPyAncmVxdWlyZWQsICc6JycpICsgJ2FuZCBubyBmbGFzaCBzdXBwb3J0KScgOiAnJykpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHNtMi5fd0QoJ1NvdW5kTWFuYWdlciAyIEhUTUw1IHN1cHBvcnQ6ICcgKyB0ZXN0cy5qb2luKCcsICcpLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gIH07XHJcblxyXG4gIGluaXRDb21wbGV0ZSA9IGZ1bmN0aW9uKGJOb0Rpc2FibGUpIHtcclxuXHJcbiAgICBpZiAoZGlkSW5pdCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNtMi5odG1sNU9ubHkpIHtcclxuICAgICAgLy8gYWxsIGdvb2QuXHJcbiAgICAgIF93RFMoJ3NtMkxvYWRlZCcpO1xyXG4gICAgICBkaWRJbml0ID0gdHJ1ZTtcclxuICAgICAgaW5pdFVzZXJPbmxvYWQoKTtcclxuICAgICAgZGVidWdUUygnb25sb2FkJywgdHJ1ZSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB3YXNUaW1lb3V0ID0gKHNtMi51c2VGbGFzaEJsb2NrICYmIHNtMi5mbGFzaExvYWRUaW1lb3V0ICYmICFzbTIuZ2V0TW92aWVQZXJjZW50KCkpLFxyXG4gICAgICAgIHJlc3VsdCA9IHRydWUsXHJcbiAgICAgICAgZXJyb3I7XHJcblxyXG4gICAgaWYgKCF3YXNUaW1lb3V0KSB7XHJcbiAgICAgIGRpZEluaXQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGVycm9yID0ge3R5cGU6ICghaGFzRmxhc2ggJiYgbmVlZHNGbGFzaCA/ICdOT19GTEFTSCcgOiAnSU5JVF9USU1FT1VUJyl9O1xyXG5cclxuICAgIHNtMi5fd0QoJ1NvdW5kTWFuYWdlciAyICcgKyAoZGlzYWJsZWQgPyAnZmFpbGVkIHRvIGxvYWQnIDogJ2xvYWRlZCcpICsgJyAoJyArIChkaXNhYmxlZCA/ICdGbGFzaCBzZWN1cml0eS9sb2FkIGVycm9yJyA6ICdPSycpICsgJyknLCBkaXNhYmxlZCA/IDI6IDEpO1xyXG5cclxuICAgIGlmIChkaXNhYmxlZCB8fCBiTm9EaXNhYmxlKSB7XHJcbiAgICAgIGlmIChzbTIudXNlRmxhc2hCbG9jayAmJiBzbTIub01DKSB7XHJcbiAgICAgICAgc20yLm9NQy5jbGFzc05hbWUgPSBnZXRTV0ZDU1MoKSArICcgJyArIChzbTIuZ2V0TW92aWVQZXJjZW50KCkgPT09IG51bGw/c3dmQ1NTLnN3ZlRpbWVkb3V0OnN3ZkNTUy5zd2ZFcnJvcik7XHJcbiAgICAgIH1cclxuICAgICAgcHJvY2Vzc09uRXZlbnRzKHt0eXBlOidvbnRpbWVvdXQnLCBlcnJvcjplcnJvciwgaWdub3JlSW5pdDogdHJ1ZX0pO1xyXG4gICAgICBkZWJ1Z1RTKCdvbmxvYWQnLCBmYWxzZSk7XHJcbiAgICAgIGNhdGNoRXJyb3IoZXJyb3IpO1xyXG4gICAgICByZXN1bHQgPSBmYWxzZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRlYnVnVFMoJ29ubG9hZCcsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghZGlzYWJsZWQpIHtcclxuICAgICAgaWYgKHNtMi53YWl0Rm9yV2luZG93TG9hZCAmJiAhd2luZG93TG9hZGVkKSB7XHJcbiAgICAgICAgX3dEUygnd2FpdE9ubG9hZCcpO1xyXG4gICAgICAgIGV2ZW50LmFkZCh3aW5kb3csICdsb2FkJywgaW5pdFVzZXJPbmxvYWQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIDxkPlxyXG4gICAgICAgIGlmIChzbTIud2FpdEZvcldpbmRvd0xvYWQgJiYgd2luZG93TG9hZGVkKSB7XHJcbiAgICAgICAgICBfd0RTKCdkb2NMb2FkZWQnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gPC9kPlxyXG4gICAgICAgIGluaXRVc2VyT25sb2FkKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBhcHBseSB0b3AtbGV2ZWwgc2V0dXBPcHRpb25zIG9iamVjdCBhcyBsb2NhbCBwcm9wZXJ0aWVzLCBlZy4sIHRoaXMuc2V0dXBPcHRpb25zLmZsYXNoVmVyc2lvbiAtPiB0aGlzLmZsYXNoVmVyc2lvbiAoc291bmRNYW5hZ2VyLmZsYXNoVmVyc2lvbilcclxuICAgKiB0aGlzIG1haW50YWlucyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCBhbmQgYWxsb3dzIHByb3BlcnRpZXMgdG8gYmUgZGVmaW5lZCBzZXBhcmF0ZWx5IGZvciB1c2UgYnkgc291bmRNYW5hZ2VyLnNldHVwKCkuXHJcbiAgICovXHJcblxyXG4gIHNldFByb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB2YXIgaSxcclxuICAgICAgICBvID0gc20yLnNldHVwT3B0aW9ucztcclxuXHJcbiAgICBmb3IgKGkgaW4gbykge1xyXG5cclxuICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkoaSkpIHtcclxuXHJcbiAgICAgICAgLy8gYXNzaWduIGxvY2FsIHByb3BlcnR5IGlmIG5vdCBhbHJlYWR5IGRlZmluZWRcclxuXHJcbiAgICAgICAgaWYgKHNtMltpXSA9PT0gX3VuZGVmaW5lZCkge1xyXG5cclxuICAgICAgICAgIHNtMltpXSA9IG9baV07XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoc20yW2ldICE9PSBvW2ldKSB7XHJcblxyXG4gICAgICAgICAgLy8gbGVnYWN5IHN1cHBvcnQ6IHdyaXRlIG1hbnVhbGx5LWFzc2lnbmVkIHByb3BlcnR5IChlZy4sIHNvdW5kTWFuYWdlci51cmwpIGJhY2sgdG8gc2V0dXBPcHRpb25zIHRvIGtlZXAgdGhpbmdzIGluIHN5bmNcclxuICAgICAgICAgIHNtMi5zZXR1cE9wdGlvbnNbaV0gPSBzbTJbaV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG5cclxuICBpbml0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gY2FsbGVkIGFmdGVyIG9ubG9hZCgpXHJcblxyXG4gICAgaWYgKGRpZEluaXQpIHtcclxuICAgICAgX3dEUygnZGlkSW5pdCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcclxuICAgICAgZXZlbnQucmVtb3ZlKHdpbmRvdywgJ2xvYWQnLCBzbTIuYmVnaW5EZWxheWVkSW5pdCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHNtMi5odG1sNU9ubHkpIHtcclxuICAgICAgaWYgKCFkaWRJbml0KSB7XHJcbiAgICAgICAgLy8gd2UgZG9uJ3QgbmVlZCBubyBzdGVlbmtpbmcgZmxhc2ghXHJcbiAgICAgICAgY2xlYW51cCgpO1xyXG4gICAgICAgIHNtMi5lbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICBpbml0Q29tcGxldGUoKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBmbGFzaCBwYXRoXHJcbiAgICBpbml0TW92aWUoKTtcclxuXHJcbiAgICB0cnkge1xyXG5cclxuICAgICAgLy8gYXR0ZW1wdCB0byB0YWxrIHRvIEZsYXNoXHJcbiAgICAgIGZsYXNoLl9leHRlcm5hbEludGVyZmFjZVRlc3QoZmFsc2UpO1xyXG5cclxuICAgICAgLy8gYXBwbHkgdXNlci1zcGVjaWZpZWQgcG9sbGluZyBpbnRlcnZhbCwgT1IsIGlmIFwiaGlnaCBwZXJmb3JtYW5jZVwiIHNldCwgZmFzdGVyIHZzLiBkZWZhdWx0IHBvbGxpbmdcclxuICAgICAgLy8gKGRldGVybWluZXMgZnJlcXVlbmN5IG9mIHdoaWxlbG9hZGluZy93aGlsZXBsYXlpbmcgY2FsbGJhY2tzLCBlZmZlY3RpdmVseSBkcml2aW5nIFVJIGZyYW1lcmF0ZXMpXHJcbiAgICAgIHNldFBvbGxpbmcodHJ1ZSwgKHNtMi5mbGFzaFBvbGxpbmdJbnRlcnZhbCB8fCAoc20yLnVzZUhpZ2hQZXJmb3JtYW5jZSA/IDEwIDogNTApKSk7XHJcblxyXG4gICAgICBpZiAoIXNtMi5kZWJ1Z01vZGUpIHtcclxuICAgICAgICAvLyBzdG9wIHRoZSBTV0YgZnJvbSBtYWtpbmcgZGVidWcgb3V0cHV0IGNhbGxzIHRvIEpTXHJcbiAgICAgICAgZmxhc2guX2Rpc2FibGVEZWJ1ZygpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzbTIuZW5hYmxlZCA9IHRydWU7XHJcbiAgICAgIGRlYnVnVFMoJ2pzdG9mbGFzaCcsIHRydWUpO1xyXG5cclxuICAgICAgaWYgKCFzbTIuaHRtbDVPbmx5KSB7XHJcbiAgICAgICAgLy8gcHJldmVudCBicm93c2VyIGZyb20gc2hvd2luZyBjYWNoZWQgcGFnZSBzdGF0ZSAob3IgcmF0aGVyLCByZXN0b3JpbmcgXCJzdXNwZW5kZWRcIiBwYWdlIHN0YXRlKSB2aWEgYmFjayBidXR0b24sIGJlY2F1c2UgZmxhc2ggbWF5IGJlIGRlYWRcclxuICAgICAgICAvLyBodHRwOi8vd3d3LndlYmtpdC5vcmcvYmxvZy81MTYvd2Via2l0LXBhZ2UtY2FjaGUtaWktdGhlLXVubG9hZC1ldmVudC9cclxuICAgICAgICBldmVudC5hZGQod2luZG93LCAndW5sb2FkJywgZG9Ob3RoaW5nKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0gY2F0Y2goZSkge1xyXG5cclxuICAgICAgc20yLl93RCgnanMvZmxhc2ggZXhjZXB0aW9uOiAnICsgZS50b1N0cmluZygpKTtcclxuICAgICAgZGVidWdUUygnanN0b2ZsYXNoJywgZmFsc2UpO1xyXG4gICAgICBjYXRjaEVycm9yKHt0eXBlOidKU19UT19GTEFTSF9FWENFUFRJT04nLCBmYXRhbDp0cnVlfSk7XHJcbiAgICAgIC8vIGRvbid0IGRpc2FibGUsIGZvciByZWJvb3QoKVxyXG4gICAgICBmYWlsU2FmZWx5KHRydWUpO1xyXG4gICAgICBpbml0Q29tcGxldGUoKTtcclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdENvbXBsZXRlKCk7XHJcblxyXG4gICAgLy8gZGlzY29ubmVjdCBldmVudHNcclxuICAgIGNsZWFudXAoKTtcclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgZG9tQ29udGVudExvYWRlZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmIChkaWREQ0xvYWRlZCkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZGlkRENMb2FkZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIGFzc2lnbiB0b3AtbGV2ZWwgc291bmRNYW5hZ2VyIHByb3BlcnRpZXMgZWcuIHNvdW5kTWFuYWdlci51cmxcclxuICAgIHNldFByb3BlcnRpZXMoKTtcclxuXHJcbiAgICBpbml0RGVidWcoKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRlbXBvcmFyeSBmZWF0dXJlOiBhbGxvdyBmb3JjZSBvZiBIVE1MNSB2aWEgVVJMIHBhcmFtczogc20yLXVzZWh0bWw1YXVkaW89MCBvciAxXHJcbiAgICAgKiBEaXR0byBmb3Igc20yLXByZWZlckZsYXNoLCB0b28uXHJcbiAgICAgKi9cclxuICAgIC8vIDxkPlxyXG4gICAgKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICB2YXIgYSA9ICdzbTItdXNlaHRtbDVhdWRpbz0nLFxyXG4gICAgICAgICAgYTIgPSAnc20yLXByZWZlcmZsYXNoPScsXHJcbiAgICAgICAgICBiID0gbnVsbCxcclxuICAgICAgICAgIGIyID0gbnVsbCxcclxuICAgICAgICAgIGwgPSB3bC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgaWYgKGwuaW5kZXhPZihhKSAhPT0gLTEpIHtcclxuICAgICAgICBiID0gKGwuY2hhckF0KGwuaW5kZXhPZihhKSthLmxlbmd0aCkgPT09ICcxJyk7XHJcbiAgICAgICAgaWYgKGhhc0NvbnNvbGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKChiPydFbmFibGluZyAnOidEaXNhYmxpbmcgJykrJ3VzZUhUTUw1QXVkaW8gdmlhIFVSTCBwYXJhbWV0ZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc20yLnNldHVwKHtcclxuICAgICAgICAgICd1c2VIVE1MNUF1ZGlvJzogYlxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobC5pbmRleE9mKGEyKSAhPT0gLTEpIHtcclxuICAgICAgICBiMiA9IChsLmNoYXJBdChsLmluZGV4T2YoYTIpK2EyLmxlbmd0aCkgPT09ICcxJyk7XHJcbiAgICAgICAgaWYgKGhhc0NvbnNvbGUpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKChiMj8nRW5hYmxpbmcgJzonRGlzYWJsaW5nICcpKydwcmVmZXJGbGFzaCB2aWEgVVJMIHBhcmFtZXRlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzbTIuc2V0dXAoe1xyXG4gICAgICAgICAgJ3ByZWZlckZsYXNoJzogYjJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH0oKSk7XHJcbiAgICAvLyA8L2Q+XHJcblxyXG4gICAgaWYgKCFoYXNGbGFzaCAmJiBzbTIuaGFzSFRNTDUpIHtcclxuICAgICAgc20yLl93RCgnU291bmRNYW5hZ2VyIDI6IE5vIEZsYXNoIGRldGVjdGVkJyArICghc20yLnVzZUhUTUw1QXVkaW8gPyAnLCBlbmFibGluZyBIVE1MNS4nIDogJy4gVHJ5aW5nIEhUTUw1LW9ubHkgbW9kZS4nKSwgMSk7XHJcbiAgICAgIHNtMi5zZXR1cCh7XHJcbiAgICAgICAgJ3VzZUhUTUw1QXVkaW8nOiB0cnVlLFxyXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBhcmVuJ3QgcHJlZmVycmluZyBmbGFzaCwgZWl0aGVyXHJcbiAgICAgICAgLy8gVE9ETzogcHJlZmVyRmxhc2ggc2hvdWxkIG5vdCBtYXR0ZXIgaWYgZmxhc2ggaXMgbm90IGluc3RhbGxlZC4gQ3VycmVudGx5LCBzdHVmZiBicmVha3Mgd2l0aG91dCB0aGUgYmVsb3cgdHdlYWsuXHJcbiAgICAgICAgJ3ByZWZlckZsYXNoJzogZmFsc2VcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGVzdEhUTUw1KCk7XHJcblxyXG4gICAgaWYgKCFoYXNGbGFzaCAmJiBuZWVkc0ZsYXNoKSB7XHJcbiAgICAgIG1lc3NhZ2VzLnB1c2goc3RyaW5ncy5uZWVkRmxhc2gpO1xyXG4gICAgICAvLyBUT0RPOiBGYXRhbCBoZXJlIHZzLiB0aW1lb3V0IGFwcHJvYWNoLCBldGMuXHJcbiAgICAgIC8vIGhhY2s6IGZhaWwgc29vbmVyLlxyXG4gICAgICBzbTIuc2V0dXAoe1xyXG4gICAgICAgICdmbGFzaExvYWRUaW1lb3V0JzogMVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBkb21Db250ZW50TG9hZGVkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdE1vdmllKCk7XHJcblxyXG4gICAgcmV0dXJuIHRydWU7XHJcblxyXG4gIH07XHJcblxyXG4gIGRvbUNvbnRlbnRMb2FkZWRJRSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmIChkb2MucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xyXG4gICAgICBkb21Db250ZW50TG9hZGVkKCk7XHJcbiAgICAgIGRvYy5kZXRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZG9tQ29udGVudExvYWRlZElFKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgfTtcclxuXHJcbiAgd2luT25Mb2FkID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gY2F0Y2ggZWRnZSBjYXNlIG9mIGluaXRDb21wbGV0ZSgpIGZpcmluZyBhZnRlciB3aW5kb3cubG9hZCgpXHJcbiAgICB3aW5kb3dMb2FkZWQgPSB0cnVlO1xyXG4gICAgZXZlbnQucmVtb3ZlKHdpbmRvdywgJ2xvYWQnLCB3aW5PbkxvYWQpO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBtaXNjZWxsYW5lb3VzIHJ1bi10aW1lLCBwcmUtaW5pdCBzdHVmZlxyXG4gICAqL1xyXG5cclxuICBwcmVJbml0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgaWYgKG1vYmlsZUhUTUw1KSB7XHJcblxyXG4gICAgICAvLyBwcmVmZXIgSFRNTDUgZm9yIG1vYmlsZSArIHRhYmxldC1saWtlIGRldmljZXMsIHByb2JhYmx5IG1vcmUgcmVsaWFibGUgdnMuIGZsYXNoIGF0IHRoaXMgcG9pbnQuXHJcblxyXG4gICAgICAvLyA8ZD5cclxuICAgICAgaWYgKCFzbTIuc2V0dXBPcHRpb25zLnVzZUhUTUw1QXVkaW8gfHwgc20yLnNldHVwT3B0aW9ucy5wcmVmZXJGbGFzaCkge1xyXG4gICAgICAgIC8vIG5vdGlmeSB0aGF0IGRlZmF1bHRzIGFyZSBiZWluZyBjaGFuZ2VkLlxyXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goc3RyaW5ncy5tb2JpbGVVQSk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gPC9kPlxyXG5cclxuICAgICAgc20yLnNldHVwT3B0aW9ucy51c2VIVE1MNUF1ZGlvID0gdHJ1ZTtcclxuICAgICAgc20yLnNldHVwT3B0aW9ucy5wcmVmZXJGbGFzaCA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKGlzX2lEZXZpY2UgfHwgKGlzQW5kcm9pZCAmJiAhdWEubWF0Y2goL2FuZHJvaWRcXHMyXFwuMy9pKSkpIHtcclxuICAgICAgICAvLyBpT1MgYW5kIEFuZHJvaWQgZGV2aWNlcyB0ZW5kIHRvIHdvcmsgYmV0dGVyIHdpdGggYSBzaW5nbGUgYXVkaW8gaW5zdGFuY2UsIHNwZWNpZmljYWxseSBmb3IgY2hhaW5lZCBwbGF5YmFjayBvZiBzb3VuZHMgaW4gc2VxdWVuY2UuXHJcbiAgICAgICAgLy8gY29tbW9uIHVzZSBjYXNlOiBleGl0aW5nIHNvdW5kIG9uZmluaXNoKCkgLT4gY3JlYXRlU291bmQoKSAtPiBwbGF5KClcclxuICAgICAgICAvLyA8ZD5cclxuICAgICAgICBtZXNzYWdlcy5wdXNoKHN0cmluZ3MuZ2xvYmFsSFRNTDUpO1xyXG4gICAgICAgIC8vIDwvZD5cclxuICAgICAgICBpZiAoaXNfaURldmljZSkge1xyXG4gICAgICAgICAgc20yLmlnbm9yZUZsYXNoID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdXNlR2xvYmFsSFRNTDVBdWRpbyA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHByZUluaXQoKTtcclxuXHJcbiAgLy8gc25pZmYgdXAtZnJvbnRcclxuICBkZXRlY3RGbGFzaCgpO1xyXG5cclxuICAvLyBmb2N1cyBhbmQgd2luZG93IGxvYWQsIGluaXQgKHByaW1hcmlseSBmbGFzaC1kcml2ZW4pXHJcbiAgZXZlbnQuYWRkKHdpbmRvdywgJ2ZvY3VzJywgaGFuZGxlRm9jdXMpO1xyXG4gIGV2ZW50LmFkZCh3aW5kb3csICdsb2FkJywgZGVsYXlXYWl0Rm9yRUkpO1xyXG4gIGV2ZW50LmFkZCh3aW5kb3csICdsb2FkJywgd2luT25Mb2FkKTtcclxuXHJcbiAgaWYgKGRvYy5hZGRFdmVudExpc3RlbmVyKSB7XHJcblxyXG4gICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBkb21Db250ZW50TG9hZGVkLCBmYWxzZSk7XHJcblxyXG4gIH0gZWxzZSBpZiAoZG9jLmF0dGFjaEV2ZW50KSB7XHJcblxyXG4gICAgZG9jLmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBkb21Db250ZW50TG9hZGVkSUUpO1xyXG5cclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIG5vIGFkZC9hdHRhY2hldmVudCBzdXBwb3J0IC0gc2FmZSB0byBhc3N1bWUgbm8gSlMgLT4gRmxhc2ggZWl0aGVyXHJcbiAgICBkZWJ1Z1RTKCdvbmxvYWQnLCBmYWxzZSk7XHJcbiAgICBjYXRjaEVycm9yKHt0eXBlOidOT19ET00yX0VWRU5UUycsIGZhdGFsOnRydWV9KTtcclxuXHJcbiAgfVxyXG5cclxufSAvLyBTb3VuZE1hbmFnZXIoKVxyXG5cclxuLy8gU00yX0RFRkVSIGRldGFpbHM6IGh0dHA6Ly93d3cuc2NoaWxsbWFuaWEuY29tL3Byb2plY3RzL3NvdW5kbWFuYWdlcjIvZG9jL2dldHN0YXJ0ZWQvI2xhenktbG9hZGluZ1xyXG5cclxuaWYgKHdpbmRvdy5TTTJfREVGRVIgPT09IHVuZGVmaW5lZCB8fCAhU00yX0RFRkVSKSB7XHJcbiAgc291bmRNYW5hZ2VyID0gbmV3IFNvdW5kTWFuYWdlcigpO1xyXG59XHJcblxyXG4vKipcclxuICogU291bmRNYW5hZ2VyIHB1YmxpYyBpbnRlcmZhY2VzXHJcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKi9cclxuXHJcbndpbmRvdy5Tb3VuZE1hbmFnZXIgPSBTb3VuZE1hbmFnZXI7IC8vIGNvbnN0cnVjdG9yXHJcbndpbmRvdy5zb3VuZE1hbmFnZXIgPSBzb3VuZE1hbmFnZXI7IC8vIHB1YmxpYyBBUEksIGZsYXNoIGNhbGxiYWNrcyBldGMuXHJcblxyXG59KHdpbmRvdykpO1xyXG4iXX0=
