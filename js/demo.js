var module = angular.module( "demo", [] );

module.controller("DemoCtrl", function ($scope) {

  $scope.api = null;

  $scope.artist = "Artist";
  $scope.title = "Title";
  $scope.album_art = "blah"

  $scope.time = {
    currentMins: "00",
    currentSecs: "00",
    totalMins: "00",
    totalSecs: "00"
  };

  $scope.songs = 
    [
      {
        url: "sound/1.mp3",
        artist: "Artist1",
        title: "Song1",
        thumb:"images/1.jpg",
        
        custom: "myCustomData1",
        position: 0
      },
      {
        url: "sound/2.mp3",
        artist: "Artist2",
        title: "Song2",
        thumb: "images/2.jpg",
        custom: "myCostomData2",
        position: 1
      }
    ];

    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };    
});

module

  .directive("swaggPlayer", function(){
    return {
      restrict: "A",
      scope: "@",
      link: function(scope, el, attrs) {
        el.SwaggPlayer({
          id: el.attr("id"),
          data: scope.songs, // <----- this is the ONLY required parameter!      
          buttonsDir: 'images/',                
          logging: ['all'],
          url: "/swf",
          whilePlaying: function(time){
            Utils.setTime( scope, time );
          },
          onStop: function(){
            Utils.setTime( scope );
          },
          onSeekPreview: function(event, time) {
            console.log(time.mins + ':' + time.secs)
          },
          onSetupComplete: function(swaggPlayerApiRef, firstSong) {
            scope.api = swaggPlayerApiRef;
            Utils.setCurrentSong( scope, firstSong );
          },
          whileLoading: function(percentLoaded) {
            $('#loadstatus').html(percentLoaded);
          },
          onPlay: function(data) {
            Utils.setCurrentSong( scope, data );
          }
          });        
      }
    };
  })

var Utils = {
  setCurrentSong: function(scope, data) {
    scope.album_art = data.thumb;
    scope.artist = data.artist;
    scope.title = data.title;
    scope.safeApply();    
  },

  setTime: function(scope, time) {
    time = time ||
      {
        currentMins: "00",
        currentSecs: "00",
        totalMins: "00",
        totalSecs: "00"
      };
    scope.time = time;
    scope.safeApply();    
  }
}