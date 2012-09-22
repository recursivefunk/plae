
```
### Basic Usage
```
$(document).ready(function(){
  var api;
  var mysongs = [
    {
      "url": "sound/1.mp3",
      "artist": "Artist1",
      "title": "Song1",
      "thumb":"images/1.jpg",
      "custom": "myCustomData1"  
    }
    ,
    {
      "url": "sound/2.mp3",
      "artist": "Artist2",
      "title": "Song2",
      "thumb": "images/2.jpg",
      "custom": "myCostomData2"
    }
  ];

  $('#swagg-player').SwaggPlayer({
    data: mysongs
  });
});
```