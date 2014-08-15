
'use strict';

var gulp    = require( 'gulp' );
var uglify  = require( 'gulp-uglify' );
var concat  = require( 'gulp-concat' );
var log     = require( 'luvely' );

var config = {
  distDir: './dist',
  distJs: 'all.js',
  swfDir: './dist/swf'
};

gulp.task('build', function() {

  gulp.src( [ './js/soundmanager2.js', './js/swaggplayer.js' ] )
    .pipe(concat( config.distJs ) )
    .pipe( uglify() )
    .pipe( gulp.dest( config.distDir ) );

  gulp
    .src( './swf/soundmanager2.swf' )
    .pipe( gulp.dest( config.swfDir ) );

});