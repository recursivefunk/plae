fs = require "fs"
UglifyJS = require "uglify-js"

min = UglifyJS.minify "js/swaggplayer.js"

out = fs.createWriteStream "js/swaggplayer.min.js"

out.write min.code

console.log "Done!"