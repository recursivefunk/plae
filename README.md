

### Basic Usage
```javascript

  // swagg player specific code starts here
  var player = SwaggPlayer().init({
    url: '/swf',
    songs: [
      {
        url: 'sound/the-good-life.mp3',
        artist: 'Nancy Wilson',
        title: 'The Good Life',
        art: 'img/nancywilson.jpg'
      }
    ]
  })
  .onReady(function(){
    this.play();
  });

```

### SoundManager2 Dependency
SoundManager2 comes packaged. If you want flash fallback, you'll need to have the soundManager2.swf
file publicly available. If you place it anywhere other than the /swf folder, then configure that location
via the url parameter.

### Params

| **Param**     | **Type**         | **default**     | **Description** |
| :------------ | :--------------  | :-------------- | :-------------- |
| songs         | Array            | n/a            | Song configuration |
| whilePlaying  | function         | null           | Fires at a regular interval while a sound is playing |
| onStop        | function         | null           | Fires when the music is stopeed |
| onPlay        | function         | null           | Fires when a song starts playing |
| onPause       | function         | null           | Fires when a song is paused |
| onResume      | function         | null           | Fires when a song is resumed after a pause |
| url           | string           | '/swf'         | Location of your swf files for soundManager2

### Methods
| **Method**    | **Description** | **Parameters** | **Returns**
| :------------ | :--------------  | :-------------- | :-------------- |
| stop()        | Stops the music  | n/a            | n/a
| play()        | Plays music      | Index of the track to play (default 0) | n/a
| pause()       | Pauses music     | n/a | n/a
| next()        | Plays the next track | n/a | n/a
| prev()        | Plays the previous track | n/a | n/a
| cursor()      | Makes the current the specified one without actually playing the track | Index of the target track | The track metadata (artist, title, art)

See a working demo at http://jrayaustin.github.io/swaggplayer

The code for the demo is in the web/ folder



