/*
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/swaggplayer

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5.6.5
   
   Change Log v0.8.5.6.5
   - Major code refactoring
   - Option to use literal JSON object for song data as opposed to remote .json file
*/
(function ($){
		/*global soundManager: false, setInterval: false, console: false, BrowserDetect: false, $: false */
		
		// logging utility
		var SwaggLog = {
			error: function(errMsg){
				if (Data.config.debug === true) {
					console.log( new Date().formatMMDDYYYY() + ' Swagg Player::Error::' + errMsg);
				}
			},
			info: function(info){
				if (Data.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Info::' + info);	
				}
			},
			warn: function(warning) {
				if (Data.config.debug === true) {
					console.log(new Date().formatMMDDYYYY() + ' Swagg Player::Warning::' + warning);	
				}
			},	
			formatDate : function(){
				Date.prototype.formatMMDDYYYY = function()
				{
					var amPm = '';
					var month = parseInt(this.getMonth()) + 1;
					var minutes = function(mns){
						if (mns < 10) {
							return '0' + mns;	
						}
						else {
							return mns;	
						}
					}
					var hours = function(hrs){
						if (hrs > 12) {
							amPm = 'PM';
							return hrs - 12;	
						} 
						else {
							amPm = 'AM';
							return hrs;	
						}
					};
					return this.getFullYear() + "-" + month + "-" +  this.getDate()  + " " + hours(this.getHours()) + ":" + minutes(this.getMinutes()) + amPm;
				};
			}
		};
		
		// swagg player data and configuration
		var Data = {
			songs:{},
			song:{},
			curr_song:0,
			config:{},
			vol_interval:5,
			interval_id:-1,
			processSongs: function(data){
				SwaggLog.info('Successfully fetched songs from the server.');
				var size = data.length;
				var _data_ = Data;
				// preload song album  and append an IDs to the songs - make configurable in the future
				// to avoid having to loop through JSON array
				for (var i = 0; i < size; i++) {
					if (_data_.config.useArt === true) {
						data[i].image = new Image();
						data[i].image.src = data[i].thumb;
					}
					data[i].id = i.toString();
				}
				Data.songs = data;				
			},
			
			getSongs: function() {				
				var theData = (Data.config.data !== undefined) ? Data.config.data : 'json/songs.json';
				
				// Check if dataString points to a json file if so, fetch it.
				// if not, assume string is a literal JSON object
				if (typeof theData === 'string') {
					$.ajax({
						type: "GET",
						url: theData,
						dataType: 'json',
						success: function(data){
							Data.processSongs(data);
						},
						error: function(xhr, ajaxOptions, thrownError){
							SwaggLog.error('There was a problem fetching your songs from the server: ' + thrownError);
						}
					});	
				} // end if
				else {
					Data.processSongs(theData);
				}
			}
		};
		
		// UI elements (divs)
		var Html = {
			player: $('#swagg-player'),
			playlist: $('#swagg-player-list'),
			art: $('#swagg-player-art'),
			progress_wrapper: $('#swagg-player-progress-wrapper'),
			bar: $('#swagg-player-bar'),
			loaded: $('#swagg-player-loaded'),
			song_info: $('#swagg-player-song-info'),
			controls_div: $('#swagg-player-controls'),
			bridge_data: null			
		};
		
		// encapsulate controlls
		var Controls = {
			play:	$('#swagg-player-play-button'),
			pause:	$('#swagg-player-pause-button'),
			skip:	$('#swagg-player-skip-button'),
			back:	$('#swagg-player-back-button'),
			stop:	$('#swagg-player-stop-button') ,			
		};
		
		var Events = {
			bindControllerEvents: function(){
				SwaggLog.info('Binding controller button events');
				var inst = Data;
				var _images = ImageLoader.imagesLoaded;
				var i = inst.img;
				
				Controls.play.bind({
					click: function() {
						 Controller.play('playlink click', Data.curr_song);
						 return false;
					},
					mouseover: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.playOver.src);	
						}
					},
					mouseout: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.play.src);	
						}
					}
				});
				
				Controls.skip.bind({
					click: function() {
						Controller.skip(1);
						return false;
					},
					mouseover: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.skipOver.src);
						}
					},
					mouseout: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.skip.src);	
						}
					}
				});
	
				Controls.stop.bind({
					click: function() {
						Controller.stopMusic(Data.curr_song);
						return false;
					},
					mouseover: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.stopOver.src);
						}
					},
					mouseout: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.stop.src);
						}
					}
				});
	
				Controls.back.bind({
					click: function() {
						Controller.skip(0);
						return false;
					},
					mouseover: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.backOver.src);
						}
					},
					mouseout: function() {
						if (_images === true) {
							$(this).attr('src', ImageLoader.back.src);
						}
					}
				});				
			},
			
			bindMediaKeyEvents: function() {
				SwaggLog.info('Binding media key events');			
				$(document).keydown(function(e) {
	
					if (!e) e = window.event;
				
						switch(e.which) {
						  case 179:
							Controller.play('Media key event switch',Data.curr_song);
							return false;
					
						  case 178:
							Controller.stopMusic(Data.curr_song);
							return false;
					
						  case 176:
							Controller.skip(1);
							return false;
					
						  case 177:
							Controller.skip(0);
							return false;
							
						case 175:
							Controller.volume(Data.curr_song, 1);
							return false;
					
						case 174:
							Controller.volume(Data.curr_song, 0);
							return false;
					}
				});				
			}
		};
		
		// images for button controls
		var ImageLoader = {
			play:null,
			playOver:null,
			pauseOver:null,
			pause:null,
			stop:null,
			stopOver:null,
			back:null,
			backOver:null,
			skip:null,
			skipOver:null,
			imagesLoaded:false,
			
			loadButtonImages: function(imagesDir) {
				SwaggLog.info('Loading images for controls...');
				this.play = new Image();
				this.play.src = imagesDir + 'play.png';
				
				this.playOver = new Image();
				this.playOver.src = imagesDir + 'play-over.png';
				
				this.pause = new Image();
				this.pause.src = imagesDir + 'pause.png';
				
				this.pauseOver = new Image();
				this.pauseOver.src = imagesDir + 'pause-over.png';
				
				this.skip = new Image();
				this.skip.src = imagesDir + 'skip.png';
				
				this.skipOver = new Image();
				this.skipOver.src = imagesDir + 'skip-over.png';
				
				this.back = new Image();
				this.back.src = imagesDir + 'back.png';
				
				this.backOver = new Image();
				this.backOver.src = imagesDir + 'back-over.png';
				
				this.stop = new Image();
				this.stop.src = imagesDir + 'stop.png';
				
				this.stopOver = new Image();
				this.stopOver.src = imagesDir + 'stop-over.png';
				
				this.imagesLoaded = true;
			}
		};
		
		// controller for the main functionality (play, pause etc)
		var Controller = {
			init : function(config) {
				Data.config = config;
				
				// format date for log messages
				SwaggLog.formatDate();
				
				// get songs from server via XHR
				Data.getSongs();
				
				// create invisible element which will hold user accessible data
				Html.player.append('<div id="swagg-player-data"></div>');
				$('#swagg-player-data').css('display','none').data('time',Time).data('seekPreviewEvent',seekPreviewEvent);
				Html.bridge_data = $('#swagg-player-data');
				
				$('.swagg-player-button').css('cursor', 'pointer');
				
				// Sometimes, IE doesn't like the console object so, for now there is no debugging in IE
				if (BrowserDetect.browser === 'Explorer' && config.debug === true){
					config.debug = false; 
				}
				if (!soundManager.supported()) {
					SwaggLog.warn("Support for SM2 was not found immediately! A reboot will probably occur. We shall see what happense after that.");
				}
				else {
					SwaggLog.info("SM2 support was found! It SHOULD be smooth sailing from here but hey, you never know - this web development stuff is tricky!");
				}
					
				// check if we're using button images. if so, preload them. if not, ignore.
				if (config.buttonsDir !== undefined) {
					ImageLoader.loadButtonImages(config.buttonsDir);	
				}
				
				if (Data.config.html5Audio === true && BrowserDetect.browser !== 'Safari') { // Safari HTML5 audio bug. ignore HTML5 audio if Safari
					soundManager.useHTML5Audio = true;
				}
				
				// configure soundManager, create song objects, and hook event listener actions
				soundManager.createSongs = function() {
					SwaggLog.info('createSongs()');
					if(Data.songs[0] !== undefined) {
						clearInterval(Data.interval_id);
						var songs_ = Data.songs;
						var localSoundManager = soundManager;

						Events.bindControllerEvents();
						Events.bindMediaKeyEvents();
						var temp;
						for (var i = 0, end = songs_.length; i < end; i++) {
							temp = localSoundManager.createSound({	// create sound objects to hook event handlers
								id: 'song-' + i.toString(),			// to button states
								url: songs_[i].url,
								autoLoad: true,
								onfinish: function(){
									Controller.skip(1);
								},
								onplay: function(){
									Controller.millsToTime(this.duration, 0);	
									Controller.playPauseButtonState(0);
									if(Data.config.onPlay !== undefined && jQuery.isFunction(Data.config.onPlay)){
										Data.config.onPlay();
									}
								},
								onpause: function(){
									Controller.playPauseButtonState(1); 
									if(Data.config.onPause !== undefined && jQuery.isFunction(Data.config.onPause)){
										Data.config.onPause();
									}
								},
								onstop: function(){
									Controller.playPauseButtonState(1); 
									if(Data.config.onStop !== undefined && jQuery.isFunction(Data.config.onStop)){
										Data.config.onStop();
									}
								},
								onresume: function(){
									Controller.playPauseButtonState(0); 
									if(Data.config.onResume !== undefined && jQuery.isFunction(Data.config.onResume)){
										Data.config.onResume();
									}
								},
								whileplaying: function(){
									Controller.progress(this);
									Controller.millsToTime(this.position, 1);
									if(Data.config.whilePlaying !== undefined && jQuery.isFunction(Data.config.whilePlaying)){
										Data.config.whilePlaying();
									}
								}
							});
							temp.id = 'song-' + i.toString();
							if (Data.config.playList !== undefined && Data.config.playList === true) {
								Controller.createElement(temp);
							}
						} // end for
						if (config.useArt === true) {
							// initialize first song album 
							Html.art.attr('src',songs_[Data.curr_song].image.src); 
						}
						Controller.setupSeek();
						Controller.showSongInfo();
						SwaggLog.info("Swagg Player ready!");
					}
				};
			
				// init soundManager
				soundManager.onload =  function() {
					Data.interval_id = setInterval('soundManager.createSongs()', 5); // try to init sound manager every 5 milliseconds in case songs AJAX callback
																						// has not completed execution	

				}; // end soundManager onload function	
				
				// if there's an error loading sound manager, try a reboot
				soundManager.onerror = function() {
				  SwaggLog.error('An error has occured with loading Sound Manager! Rebooting.');
				  soundManager.flashLoadTimeout = 0;
				  clearInterval(Data.interval_id);
				  soundManager.url = 'swf';
				  setTimeout(soundManager.reboot,20);
				  setTimeout(function() {
					if (!soundManager.supported()) {
					  SwaggLog.error('Something went wrong with loading Sound Manager. No tunes for you!');
					}
				  },1500);
				}
			},
			
			// get the duration of a song in milliseconds
			getDuration : function(soundobj) {
				var duration;
				if (!soundobj.loaded === true)
					uration = soundobj.durationEstimate;
				else {
					duration = soundobj.duration;
				}
				return duration;
			},
			
			// sets up the seek functionality 
			setupSeek : function() {
				// seek to a position in the song
				Html.loaded.css('cursor', 'pointer').bind({
					click : function(e) {
						var id = 'song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						soundobj.setPosition(seekTo);
					}
				});
				
				// seek preview data
				Html.loaded.bind( 'mouseover hover mousemove', 
					function(e){
						var id = 'song-' + Data.curr_song;
						var soundobj = soundManager.getSoundById(id);
						var x = e.pageX - this.offsetLeft;
						
						var duration = Controller.getDuration(soundobj);
						
						// obtain the position clicked by the user
						var newPosPercent = x / parseFloat(Html.progress_wrapper.css('width')); 
						
						// find the position within the song the location clicked correspondes to
						var seekTo = Math.round(newPosPercent * duration);

						Controller.millsToTime(seekTo, -1);
						// fire off onSeekPreview event
						if (Data.config.onSeekPreview !== undefined && $.isFunction(Data.config.onSeekPreview)) {
							seekPreviewEvent.event_ref = e;
							Data.config.onSeekPreview();	
						}				
					}
				);
			},
			
			// Plays a song based on the ID
			play : function(caller, track){
				var sound_id = 'song-' + track
				SwaggLog.info('Playing track: ' + sound_id + '. Oh and ' + caller + ' called me!');
				var target = soundManager.getSoundById(sound_id);
				
				if (target.paused === true) { // if current track is paused, unpause
					SwaggLog.info('Unpausing song');
					target.resume();
				}
				else { // track is not paused
					if (target.playState === 1) {// if track is already playing, pause it
						SwaggLog.info('Pausing current track');
						target.pause();
					}
					else { // track is is not playing (it's in a stopped or uninitialized stated, play it
						SwaggLog.info('Playing current track from beginning');
						target.play();
					}
				}
				Controller.showSongInfo();
			},
			
			// Dynamically creates playlist items as songs are loaded
			createElement : function(soundobj){
				SwaggLog.info('createElement()');
				var song = Data.songs[parseInt(soundobj.id.split('-')[1])];
				var id = 'item-' + song.id;
				var listItem = $('<li></li>');
				listItem.attr('id',id);
				listItem.addClass('swagg-player-playlist-item');
				listItem.html(song.title + ' - ' + song.artist);
				listItem.css('cursor','pointer');
							
				listItem.data('song', song);
				listItem.bind({
					click: function(){
						var track = parseInt($(this).data('song').id);
						Controller.stopMusic(Data.curr_song);
						var afterEffect = function() {
							Controller.showSongInfo();
							Controller.play('switchArt() - by way of createElement',track);
						}			
						Data.curr_song = track;
						if (Data.config.useArt === true) {
							Controller.switchArt(track, afterEffect);
						}
						else {
							Controller.showSongInfo();
							Controller.play('switchArt() - by way of createElement',track);	
						}
						return false;
					}
				});
				Html.playlist.append(listItem);
			},
			
			// toggles the play/pause button to the play state
			playPauseButtonState : function(state){
				SwaggLog.info('PlayButtonState() state: ' + state);
				var inst = Data;
				var i = inst.img;
				var imagesLoaded = ImageLoader.imagesLoaded;
				var out, over;
				var play = Controls.play;
				
				
				if (state === 1 ) { // play state
					if (imagesLoaded === false) {
						play.html('play ');
					}
					else {
						out = ImageLoader.play.src;
						over = ImageLoader.playOver.src;
					}

				}
				else if (state === 0) { // pause state
					if (imagesLoaded === false) {
						play.html('pause ');
					}
					else {
						out = ImageLoader.pause.src; 
						over = ImageLoader.pauseOver.src;
					}

				}
				else { // invalid state
					SwaggLog.error('Invalid button state! : ' + state);	
					return false;
				};
				if (imagesLoaded === true) {
					play.attr('src', out);

					play.bind({
						mouseout: function(){
							play.attr('src', out);
						},
						mouseover: function(){
							play.attr('src', over);
						}	
					});
				}
			},
		
			// Skips to the next song. If the currently playing song is the last song in the list
			// it goes back to the first song
			skip : function(direction){
				SwaggLog.info('skip()');
				var inst = Data;
				//var songs_ = inst.songs;	
				var t = inst.curr_song;
				
				if (direction === 1) { // skip forward
					if (t < inst.songs.length){
						if (t == inst.songs.length - 1)
							t = 0;
						else
							t = t+1;
					}
				}
				else if (direction === 0) { // skip back
					if (t === 0){
						t = inst.songs.length - 1;	
					}
					else{
						t = t - 1;	
					}
				}
				else { // invalid flag
					SwaggLog.error('Invalid skip direction flag: ' + direction);
					return false;	
				}
				Controller.stopMusic(t);
				inst.curr_song = t;
				// if using album , use  transition
				if (inst.config.useArt === true) {
					var afterEffect = function() {
						Controller.showSongInfo();
						Controller.play('skip',t);
					}
					Controller.switchArt(t, afterEffect);
				} // end if
				// if not using album , just go to the next song
				else {
						Controller.showSongInfo();
						Controller.play('skip',t);
				} // end else	
			},
			
			// Resets the progress bar back to the beginning
			resetProgressBar : function(){
				$('#swagg-player-bar').css('width', 0);
				$('#swagg-player-loaded').css('width', 0);
			},	
			
			// resets the track time
			resetTrackTime : function() {
				var bridge = Html.bridge_data;
				if (bridge !== undefined){
					SwaggLog.info('Resetting track time');
					bridge.data('time').totalMinutes = 0;
					bridge.data('time').totalSeconds = 0;
					bridge.data('time').currMinutes = 0;
					bridge.data('time').currSeconds = 0;
				}			
			},
			
			// Stops the specified song
			stopMusic : function(track) {
				SwaggLog.info('stopMusic()');
				soundManager.stopAll();
				Controller.resetProgressBar();
				Controller.resetTrackTime();
			},
			
			// Increases the volume of the specified song
			volume : function(track, flag) {
				var sound_id = 'song-' + track
				var sound = soundManager.getSoundById(sound_id);
				
				var curr_vol = sound.volume;

				if (flag === 1) {
					SwaggLog.info('Vol up');
					soundManager.setVolume(sound_id, curr_vol + Data.vol_interval);
				}
				else if (flag === 0) {
					SwaggLog.info('Vol down');
					soundManager.setVolume(sound_id, curr_vol - Data.vol_interval);
				}
				else {
					SwaggLog.info('Invalid volume flag!');	
				}
			},
			
			// switches to the currently playing song's album  using fancy jquery slide effect
			switchArt : function(track, afterEffect) {
				SwaggLog.info('Will show  for song at index: ' + track);
				var sound_id = 'song-' + track
				var art = Html.art;

				art.hide('slide', function() {
					$(this).attr('src',Data.songs[track].image.src);
					$(this).show('slide', afterEffect); 
				});	
			},
			
			// fills in song metadata based on ID3 tags
			// not being used for now, flash ID3 is too buggy
			id3Fill : function(soundobj) {
				var song = Data.songs[parseInt(soundobj.id.split('-')[1])];
				if (typeof soundobj.id3.TIT2 !== undefined) {
					song.title = soundobj.id3.TIT2;	
				}
				else if(typeof soundobj.id3.songname !== undefined) {
					song.title = soundobj.id3.songname;	
				}
				else{}
				
				if(typeof soundobj.id3.TPE2 !== undefined) {
					song.artist = soundobj.id3.TPE2;	
				}
				else if (typeof soundobj.id3.artist !== undefined) {
					song.artist = soundobj.id3.artist;	
				}
				else{}
			},
			
			// updates the UI progress bar
			progress : function(soundobj) {
				// get current position of currently playing song
				var pos = soundobj.position; 
				var loaded_ratio = soundobj.bytesLoaded / soundobj.bytesTotal;
				
				if (soundobj.loaded === false) {
					var duration = soundobj.durationEstimate;
					Controller.millsToTime(duration, 0);
				}
				else {
					var duration = soundobj.duration;
				}
				
				// ratio of (current position / total duration of song)
				var pos_ratio = pos/duration; 
				
				// width of progress bar
				var wrapper_width = parseFloat(Html.progress_wrapper.css('width'));
				
				var loaded = wrapper_width * loaded_ratio;
				
				// set width of inner progress bar equal to the width equivelant of the
				// current position
				var t = wrapper_width*pos_ratio;
				Html.bar.css('width', t);
				Html.loaded.css('width', loaded);
					
			},
			
			// calculates the total duration of a sound in terms of minutes
			// and seconds based on the total duration in milliseconds.
			// flag 0 - says we're calculating the total duration of the song
			// flag 1 - says we're calculating the current potition of the song
			// flag -1 = says we're calculating the arbitrary position of a song (seek preview)
			millsToTime : function(duration, flag) {
					var bridge = Html.bridge_data;
					var seconds = Math.floor(duration / 1000);
					var minutes = 0;
					if (seconds > 60) {
						minutes = Math.floor(seconds / 60);
						seconds = Math.round(seconds % 60);		
					}
					
					// total duration
					if (flag === 0) { 
						bridge.data('time').totalMinutes = minutes
						bridge.data('time').totalSeconds = seconds
					}
					// current position
					else if (flag === 1) { 
						bridge.data('time').currMinutes = minutes;
						bridge.data('time').currSeconds = seconds;
					}
					else if(flag === -1){
						bridge.data('time').snapShot.minutes = minutes;
						bridge.data('time').snapShot.seconds = seconds;
					}
					else {
						SwaggLog.error('Invalid flag passed to millsToTime()');	
					}
			},
			
			// displays ist and song title
			showSongInfo : function() {
				var loc_inst = Data;
				var song_ = loc_inst.songs[loc_inst.curr_song];
				$('#swagg-player-song-info').html( "<p>" + song_.artist + "  <br/>" + song_.title + " </p>" );	
			}
		};
		
		/*
			BROWSER DETECT SCRIPT FROM: http://www.quirksmode.org/js/detect.html
		*/		
		var BrowserDetect = {
			
			init: function () {
				this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
				this.version = this.searchVersion(navigator.userAgent)
					|| this.searchVersion(navigator.appVersion)
					|| "an unknown version";
				this.OS = this.searchString(this.dataOS) || "an unknown OS";
			},
			searchString: function (data) {
				for (var i=0;i<data.length;i++)	{
					var dataString = data[i].string;
					var dataProp = data[i].prop;
					this.versionSearchString = data[i].versionSearch || data[i].identity;

					if (dataString) {
						if (dataString.indexOf(data[i].subString) != -1)
							return data[i].identity;
					}
					else if (dataProp)
						return data[i].identity;
				}
			},
			searchVersion: function (dataString) {
				var index = dataString.indexOf(this.versionSearchString);
				if (index == -1) return;
				return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
			},
		
			dataBrowser: [
					{
						string: navigator.userAgent,
						subString: "GoogleTV",
						identity: "GoogleTV"
					},
					{
						string: navigator.userAgent,
						subString: "Chrome",
						identity: "Chrome"
					},
					{ 	string: navigator.userAgent,
						subString: "OmniWeb",
						versionSearch: "OmniWeb/",
						identity: "OmniWeb"
					},
					{
						string: navigator.vendor,
						subString: "Apple",
						identity: "Safari",
						versionSearch: "Version"
					},
					{
						prop: window.opera,
						identity: "Opera"
					},
					{
						string: navigator.vendor,
						subString: "iCab",
						identity: "iCab"
					},
					{
						string: navigator.vendor,
						subString: "KDE",
						identity: "Konqueror"
					},
					{
						string: navigator.userAgent,
						subString: "Firefox",
						identity: "Firefox"
					},
					{
						string: navigator.vendor,
						subString: "Camino",
						identity: "Camino"
					},
					{		// for newer Netscapes (6+)
						string: navigator.userAgent,
						subString: "Netscape",
						identity: "Netscape"
					},
					{
						string: navigator.userAgent,
						subString: "MSIE",
						identity: "Explorer",
						versionSearch: "MSIE"
					},
					{
						string: navigator.userAgent,
						subString: "Gecko",
						identity: "Mozilla",
						versionSearch: "rv"
					},
					{ 		// for older Netscapes (4-)
						string: navigator.userAgent,
						subString: "Mozilla",
						identity: "Netscape",
						versionSearch: "Mozilla"
					}
				],
				dataOS : [
					{
						string: navigator.platform,
						subString: "Win",
						identity: "Windows"
					},
					{
						string: navigator.platform,
						subString: "Mac",
						identity: "Mac"
					},
					{
						   string: navigator.userAgent,
						   subString: "iPhone",
						   identity: "iPhone/iPod"
					},
					{
						string: navigator.platform,
						subString: "Linux",
						identity: "Linux"
					}
				]
		};
		
		// track time data
		var Time = {
			totalMinutes:null,
			totalSeconds:null,
			currMinutes:null,
			currSeconds:null,
			currTimeAsString: function(){
				var currMin = (this.currMinutes > 9) ? this.currMinutes : '0' + 
					this.currMinutes.toString();
				var currSec = (this.currSeconds > 9) ? this.currSeconds : '0' + 
					this.currSeconds.toString();	
				return currMin + ':' + currSec;
			},
			totalTimeAsString: function() {
				var totalMin = (this.totalMinutes > 9) ? this.totalMinutes : '0' + 
					this.totalMinutes.toString();
				var totalSec = (this.totalSeconds > 9) ? this.totalSeconds : '0' + 
					this.totalSeconds.toString();	
				return totalMin + ':' + totalSec;	
			},
			snapShot:{
				seconds:null,
				minutes:null,
				asString: function(){
					var mins = (this.minutes > 9) ? this.minutes : '0' + 
						this.minutes.toString();
					var secs = (this.seconds > 9) ? this.seconds : '0' + 
						this.seconds.toString();	
					return mins + ':' + secs;							
				}
			}		
		};
		
		var seekPreviewEvent = {
			event_ref:null,
		}
		
		// initialize and configure SM2
		var initializeSoundManager = function() {
			SwaggLog.info('Initializing SoundManager2');
			window.soundManager = new SoundManager();
    		soundManager.beginDelayedInit();
			soundManager.wmode = 'transparent'
			soundManager.url = 'swf';
			soundManager.useFastPolling = true;
			soundManager.useHighPerformance = true;
			soundManager.allowPolling = true;
			soundManager.flashLoadTimeout = 1000;			
		};
						
		$.fn.SwaggPlayer = function(options) {
			initializeSoundManager();
			Controller.init(options);
		};
})(jQuery);