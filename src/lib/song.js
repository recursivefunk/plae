
const Song = function (position, meta, raw) {
  const {
    title, artist, url, art, id
  } = meta

  return Object.freeze({
    position,
    title,
    artist,
    url,
    art,
    id,
    raw
  })
}

export default Song
