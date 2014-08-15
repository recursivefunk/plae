
(function(SwaggPlayer){

  'use strict';


  var player = SwaggPlayer().init({
    url: '/swf',
    el: document.querySelector( '#swagg-player' ),
    songs: [
      {
        url: 'sound/3.mp3',
        artist: 'Artist 3',
        title: 'Song 3',
        thumb: 'images/3.jpg'
      },
      {
        url: 'sound/1.mp3',
        artist: 'Artist 1',
        title: 'Song 1',
        thumb: 'images/1.jpg'
      },
      {
        url: 'sound/2.mp3',
        artist: 'Artist 2',
        title: 'Song 2',
        thumb: 'images/2.jpg'
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
      playButton( 'pause' );
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
      document.querySelectorAll('.sprogress')[0].style.width = percentComplete + '%';
      // console.log( percentComplete );
      // console.log( time );
    }
  })

    .onReady(function(){
      var self = this;
      this.play();
    });

  function playButton( type ) {
    document.querySelectorAll('.swagg-player-play-button')[0].src = 'images/' + type + '.png';
  }

  document
    .querySelectorAll( '.swagg-player-skip-button' )[ 0 ]
    .addEventListener('click', function(e) {
      player.next();
    });


  document
    .querySelectorAll( '.swagg-player-back-button' )[ 0 ]
    .addEventListener('click', function(e){
      player.prev();
    });

  document
    .querySelectorAll( '.swagg-player-play-button' )[ 0 ]
    .addEventListener('click', function(e){
      player.play();
    });

}(window.SwaggPlayer));




