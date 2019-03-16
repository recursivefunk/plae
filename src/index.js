
import soundManager from 'soundmanager2/script/soundmanager2-nodebug-jsmin'
import Song from './lib/song'
import Logger from './lib/log'
import {
  shouldResume,
  formId,
  determineBytesLoaded,
  determineByteProgress,
  determineTimeProgress,
  volumeUp,
  volumeDown
} from './lib/utils'

class Plae {
  constructor (opts = {}) {
    this._data = {}
    this._data.swfUrl = opts.swf || '/swf'
    this._data.songs = []
    this._data.currentTrack = 0
    this._sm = soundManager
    this._sm.setup({
      url: this._data.swfUrl,
      useHighPerformance: true,
      useFastPolling: true,
      onready: () => this._load(opts)
    })
    this._log = Logger(opts)
    this._readyCb = typeof opts.onReady === 'function' ? opts.onReady : () => {}
    if (this._sm) {
      destroySMWindowInstance()
    }
  }

  /**
   * Create soundmanager objects for each song, initialize the first track and
   * call the user-defined onReady function
   *
   */
  _load (opts) {
    this._data.songs = opts.songs.map((rawSongData, i) => {
      const song = this._createRawSong(rawSongData, i, opts)
      if (i === 0) {
        this._data.firstTrack = song
      }
      return song
    })
    this._onReady()
  }

  /**
   * Proxy for the user-defined onReady callback function
   *
   */
  _onReady () {
    if (this._readyCb) {
      const invoke = this._readyCb.bind(this)
      invoke(this._data.firstTrack)
    }
  }

  /**
   * Creates a sound manager sound instance and configures
   * all of it's options and registers callbacks
   *
   */
  _createRawSong (songData, position, opts = {}) {
    const self = this
    const meta = {
      artist: songData.artist,
      title: songData.title,
      art: songData.art,
      url: songData.url,
      id: formId(position)
    }

    // Registering callbacks for key events for each track
    const raw = this._sm.createSound({
      id: meta.id,
      url: meta.url,
      autoPlay: false,
      autoLoad: true,
      onload () {
        self._log.debug(`Loaded: "${songData.title}"`)
      },
      onplay () {
        if (opts.onPlay) {
          opts.onPlay(meta)
        }
      },
      onresume () {
        if (opts.onResume) {
          opts.onResume(meta)
        }
      },
      onpause () {
        if (opts.onPause) {
          opts.onPause(meta)
        }
      },
      onstop () {
        if (opts.onStop) {
          opts.onStop(meta)
        }
      },
      onfinish () {
        if (opts.onFinish) {
          opts.onFinish()
        }
        if (!self.isLastTrack()) {
          self.next()
        }
      },
      /**
       * While the track is loading, update the client on the progress
       */
      whileloading () {
        if (opts.whileLoading) {
          const amntLoaded = determineBytesLoaded(this)
          opts.whileLoading(amntLoaded)
        }
      },
      /**
       * Provide information about the track's duration and play progress
       */
      whileplaying () {
        if (opts.whilePlaying) {
          const timeProgress = determineTimeProgress(this)
          var percentComplete = determineByteProgress(this)
          opts.whilePlaying(timeProgress, percentComplete)
        }
      }
    })
    songData.raw = raw
    return new Song(position, meta, raw)
  } // end createNewSong

  /**
   * Play the track at the given position. Positions start at 0. If no position
   * is specified, play the track at the current cursor position
   *
   */
  async play (index) {
    if (Number.isInteger(index) && index > -1) {
      this._data.currentTrack = index
    } else {
      index = this._data.currentTrack
    }

    const sound = this._data.songs[index]

    // Check if we're in a paused state. If not, play from the beginning.
    // If we are, then resume play at the current position.
    if (sound && !shouldResume(sound)) {
      this.stop()
      sound.raw.play()
    } else {
      const up = 1
      const down = -1
      if (!sound.raw.paused) {
        await this.fadeVolume(sound.raw, down)
        sound.raw.pause()
      } else {
        sound.raw.resume()
        await this.fadeVolume(sound.raw, up)
      }
    }
    return this
  }

  async fadeVolume (sound, direction = 1) {
    if (direction === 1) {
      while (sound.volume < 100) {
        await this.volumeUp(sound)
      }
    } else if (direction === -1) {
      while (sound.volume > 0) {
        await this.volumeDown(sound)
      }
    } else {
      this._log.error(`Invalid direction parameter: ${direction}. Need 1 or -1`)
    }
  }

  async volumeUp (sound) {
    if (!sound) {
      sound = this._data.songs[this._data.currentTrack].raw
    }
    return volumeUp(sound)
  }

  async volumeDown (sound) {
    if (!sound) {
      sound = this._data.songs[this._data.currentTrack].raw
    }
    return volumeDown(sound)
  }

  /**
   * Hault playback
   */
  stop () {
    this._sm.stopAll()
    return this
  }

  /**
   * Pause playback
   */
  pause () {
    const currentTrack = this._data.songs[this._data.currentTrack]
    console.log(currentTrack)
    this._sm.pauseAll()
    return this
  }

  /**
   * Set the current track to the next track. If the we're on the last track
   * in the list, set the current track to the beginning of the list. Then,
   * play whatever song at which we're pointing.
   *
   */
  next () {
    this.stop()
    this._resetSound(this._data.currentTrack)
    this._data.currentTrack = this._data.currentTrack + 1
    if (this._data.currentTrack > (this._data.songs.length - 1)) {
      this._data.currentTrack = 0
    }
    return this.play(this._data.currentTrack)
  }

  /**
   * Set the current track to the previous track. If the we're on the first
   * track in the list, set the current track to the end of the list. Then,
   * play whatever song at which we're pointing.
   *
   */
  prev () {
    this.stop()
    this._resetSound(this._data.currentTrack)
    this._data.currentTrack -= 1
    if (this._data.currentTrack < 0) {
      const song = this._data.songs[this._data.songs.length - 1]
      this._data.currentTrack = song.position
    }
    return this.play()
  }

  /**
   * Is the current track the last one in the list?
   *
   */
  isLastTrack () {
    return (this._data.currentTrack === (this._data.songs.length - 1))
  }

  setData (songPosition, attr, item) {
    const song = this._data.songs[songPosition]
    const changedItems = {}

    if (song) {
      song[ attr ] = item
      changedItems[ attr ] = item
      this._newDataCb(song, changedItems)
    }
  }

  setCursor (position) {
    const index = (position > 0 && position < (this._data.songs.length - 1)) ? position : 0
    this._data.currentTrack = index
    const song = this._data.songs[index]
    return {
      title: song.title,
      art: song.art,
      id: song.id,
      artist: song.artist
    }
  }

  // resets the current position for a song to 0
  _resetSound (index) {
    const id = this._data.songs[index].id
    this._sm.getSoundById(id).position = 0
  }
}

function destroySMWindowInstance () {
  if (window && window.soundManager) {
    let interval = setInterval(() => {
      if (window && window.soundManager) {
        delete window.soundManager
        clearInterval(interval)
      }
    }, 10)
  }
}

if (typeof window !== 'undefined') {
  window.Plae = Plae
}

export default Plae
