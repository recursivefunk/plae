
(function(){

  'use strict';

  var Song = function( opts ) {
    this.title    = opts.title;
    this.artist   = opts.artist;
    this.url      = opts.url;
    this.art      = opts.art;
    this.id       = opts.id;
  };

  module.exports = Song;

}());