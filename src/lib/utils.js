
const formId = index => `track-${index}`

const shouldResume = song => song.raw.position > 0

const timeString = str => {
  const tmp = parseInt(str, 10)
  const t = tmp > 9 ? str : `0${str}`
  return t !== '60' ? t : '00'
}

const millsToTime = duration => {
  let seconds = Math.floor(duration / 1000)
  let minutes = 0

  if (seconds > 60) {
    minutes = Math.floor(seconds / 60)
    seconds = Math.round(seconds % 60)
  }

  if (seconds === 60) {
    minutes += 1
    seconds = 0
  }

  return {
    mins: parseInt(timeString(minutes)),
    secs: parseInt(timeString(seconds))
  }
}

// determine the current song's position in time mm:ss / mm:ss
const determineTimeProgress = sound => {
  const duration = sound.loaded === true ? sound.duration : sound.durationEstimate
  const curr = millsToTime(sound.position)
  const total = millsToTime(duration)
  const time = {
    current: {
      min: curr.mins,
      sec: curr.secs
    },
    total: {
      min: total.mins,
      sec: total.secs
    }
  }
  return time
}

// determine how far along a song is in terms of how many bytes
// have been played in relation to the total bytes
const determineByteProgress = sound => {
  // get current position of currently playing song
  const pos = sound.position
  // const loadedRatio = sound.bytesLoaded / sound.bytesTotal
  let duration = 0

  if (sound.loaded === false) {
    duration = sound.durationEstimate
  } else {
    duration = sound.duration
  }

  // ratio of (current position / total duration of song)
  const positionRatio = pos / duration

  return (positionRatio.toFixed(2) * 100).toFixed(0)
}

const determineBytesLoaded = sound => {
  // get current position of currently playing song
  return sound.bytesLoaded / sound.bytesTotal
}

const volumeDown = async (sound, howMuch = 2) => (
  new Promise(resolve => {
    const targetVol = sound.volume > 1 ? sound.volume - howMuch : 0
    setTimeout(() => {
      sound.setVolume(targetVol)
      resolve(targetVol)
    }, 0)
  })
)

const volumeUp = async (sound, howMuch = 2) => (
  new Promise(resolve => {
    const targetVol = sound.volume < 99 ? sound.volume + howMuch : 0
    setTimeout(() => {
      sound.setVolume(targetVol)
      resolve(targetVol)
    }, 0)
  })
)

export {
  formId,
  shouldResume,
  timeString,
  determineTimeProgress,
  determineBytesLoaded,
  determineByteProgress,
  millsToTime,
  volumeUp,
  volumeDown
}
