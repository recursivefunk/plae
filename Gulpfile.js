
'use strict';

var gulp       = require( 'gulp' );
var uglify     = require( 'gulp-uglify' );
var browserify = require( 'gulp-browserify' );
var clean      = require( 'gulp-clean' );
var rename     = require( 'gulp-rename' );
var livereload = require( 'gulp-livereload' );

var config = {
  dist: './dist',
  distJs: './dist/swaggplayer.min.js',
  swfDir: './dist/swf'
};

// browserify it
// copy it to web for use in the demo
// copy it dist
// create a minified version
// copy minified version to dist
// profit
function buildSrc() {
  gulp
    .src( 'lib/swaggplayer.js' )
    .pipe(browserify({
      debug : !gulp.env.production
    }))
    .pipe( gulp.dest('./web/js') )
    .pipe( gulp.dest( config.dist ) )
    .pipe( uglify() )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( gulp.dest( './dist' ) );

  gulp
    .src( 'swf/*.swf' )
    .pipe( gulp.dest( config.swfDir ) );
}

gulp.task( 'build', buildSrc );

gulp.task('clean', function(){
  gulp
    .src( [ config.swfDir, config.dist, './web/js/swaggplayer.js' ] )
    .pipe( clean() );
});

gulp.task('watch', function(){
  gulp.watch( 'lib/swaggplayer.js', [ 'build' ] );
});

gulp.task( 'default', [ 'clean', 'build' ] );
