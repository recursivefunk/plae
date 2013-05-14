fs = require "fs"
UglifyJS = require "uglify-js"

min = UglifyJS.minify "js/jquery.swaggplayer.js"

out = fs.createWriteStream "js/jquery.swaggplayer.min.js"

out.write min.code

console.log "Done!"