
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