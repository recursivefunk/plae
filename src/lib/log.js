
export default (opts) => {
  const verbose = opts.verbose

  return Object.freeze({
    info (msg) {
      console.log(`[play::info] ${msg}`)
    },
    debug (msg) {
      if (verbose) {
        console.log(`[play::debug] ${msg}`)
      }
    },
    error (msg) {
      console.error(msg)
    }
  })
}
