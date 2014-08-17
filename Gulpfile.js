
'use strict';

var gulp    = require( 'gulp' );
var uglify  = require( 'gulp-uglify' );
var browserify = require( 'gulp-browserify' );
var clean      = require( 'gulp-clean' );
var rename     = require( 'gulp-rename' );
var watch      = require( 'gulp-watch' );

var config = {
  dist: './dist',
  distJs: './dist/swaggplayer.min.js',
  swfDir: './dist/swf'
};

gulp.task('build', function() {

  gulp
    .src( [ config.dist, './web/*.js' ] )
    .pipe( clean() );

  gulp
    .src( 'lib/swaggplayer.js' )
    .pipe(browserify({
      debug : !gulp.env.production
    }))
    .pipe( gulp.dest('./web/') )
    .pipe( gulp.dest( config.dist ) )
    .pipe( uglify() )
    .pipe( rename( { suffix: '.min' }) )
    .pipe( gulp.dest( './dist' ) );

});