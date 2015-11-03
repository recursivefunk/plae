
(function(SwaggPlayer){

  'use strict';

  // for the adaptive background stuff - not related to swagg player
  var adaptOpts      = {
    selector:             '[data-adaptive-background="1"]',
    parent:               'body',
    exclude:              [ 'rgb(0,0,0)', 'rgba(255,255,255)' ],
    normalizeTextColor:   false,
    normalizedTextColors:  {
      light:      "#fff",
      dark:       "#000"
    },
    lumaClasses:  {
      light:      "ab-light",
      dark:       "ab-dark"
    }
  };

  // swagg player specific code starts here
  var player = Plae().init({
    url: '/swf',
    el: document.querySelector( '#plae' ),
    songs: [
      {
        url: 'sound/the-good-life.mp3',
        artist: 'Nancy Wilson',
        title: 'The Good Life',
        art: 'img/nancywilson.jpg'
      },
      {
        url: 'sound/miles-ahead.mp3',
        artist: 'Miles Davis',
        title: 'Miles Ahead',
        art: 'img/miles-davis.jpg'
      },
      {
        url: 'sound/blue-monk.mp3',
        artist: 'Thelonious Monk',
        title: 'Blue Monk',
        art: 'img/thelonious-monk.jpg'
      }
    ],

    onResume: function( songData ) {
      console.log( '------------- song resumed ------------' );
      console.log( songData );
      playButton( 'pause' );
    },

    onPlay: function( songData ) {
      console.log( '------------- song playing ------------' );
      console.log( songData );
      changeMeta( songData );
      playButton( 'pause' );
      setTimeout(function(){
        $.adaptiveBackground.run( adaptOpts );
      }, 700);
    },

    onPause: function( songData ) {
      console.log( '------------- song paused ------------' );
      console.log( songData );
      playButton( 'play' );
    },

    onStop: function( songData ) {
      console.log( '------------- song stopped ------------' );
      console.log( songData );
      playButton( 'play' );
    },

    onFinish: function() {
      playButton( 'play' );
    },

    whilePlaying: function( time, percentComplete ) {
      document.querySelectorAll('.plae-progress-bar__progress')[ 0 ].style.width = percentComplete + '%';
      // document.querySelectorAll('.currMins')[ 0 ].innerHTML = timeFormat( time.current.min );
      // document.querySelectorAll('.currSecs')[ 0 ].innerHTML = timeFormat( time.current.sec );
    }
  })

    .onReady(function(){
      console.log( '-------------------- first track -----------------' );
      // move the playlist cursor to the first position ( 0 by default )
      // and get that track's metadata
      var track = this.cursor( 0 );
      // update the UI
      changeMeta( track );
      // play the first track
      this.play();
    });


  // ------------------------------- helpers

  function playButton( type ) {
    var el = document.querySelectorAll('.play-pause-toggle')[0];
    el.className = 'icon-' + type + ' play-pause-toggle plae-controls__button';

  }

  function timeFormat( time ) {
    var timeStr = time.toString();
    if ( timeStr.length === 1 ) {
      return '0' + timeStr;
    } else {
      return time;
    }
  }

  function changeMeta( data ) {
    document.querySelectorAll('.plae-info__artist')[ 0 ].innerHTML = data.artist;
    document.querySelectorAll('.plae-info__title')[ 0 ].innerHTML = data.title;
    changeCover( data.art );
  }

  function changeCover( url ) {
    document.querySelectorAll('.plae__art')[ 0 ].style.backgroundImage = 'url(' + url  +')';
    document.querySelectorAll('.plae__art')[ 0 ].style.backgroundSize = 'cover';
  }

  function highlightColor( color ) {
    var highlight = tinycolor( color );
    if ( highlight.isLight() ) {
      return highlight.darken( 50 ).toString();
    } else {
      return highlight.lighten( 50 ).toString();
    }
  }

  // ------------------------------- click events

  document
    .querySelectorAll( '.icon-skip' )[ 0 ]
      .addEventListener('click', function(e) {
        player.next();
      });


  document
    .querySelectorAll( '.icon-back' )[ 0 ]
      .addEventListener('click', function(e){
        player.prev();
      });

  document
    .querySelectorAll( '.icon-play' )[ 0 ]
      .addEventListener('click', function(e){
        player.play();
      });

  // when the background color changes, grab an appropripate highlight color for the
  // player's progress bar
  $('.plae__art').on('ab-color-found', function( ev, payload ){
    var color = highlightColor( payload.color );
    document.querySelector( '.plae-progress-bar__progress' ).style.backgroundColor = color;
  });

}( window.Plae ) );




