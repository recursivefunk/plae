/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.7.3
   
   Change Log v0.7.3:
   - Fixes for Safari on Windows: Does not attempt to use HTML5 audio
   - Uses more intelligent browser detection
   - Fixed page jumps when clicking on controls
   
*/(function($)
{var songs=new Array();var albumart=new Array();var soundObjs=new Array();var song={id:" ",title:" ",url:" ",artist:" ",thumb:" ",duration:" "};var images=new Array();var curr_song=0;var soundId=soundManager.sID;var isplaying=new Boolean(false);var loading='loadingAnimation.gif';soundManager.url='swf';$.fn.SwaggPlayer=function(config){var swagg_div=this;swaggOn(swagg_div,config);}
function swaggOn(swagg_div,config){if(!config.buttonsDir)
config.buttonsDir='images/';loadImages(config);document.getElementById('art').setAttribute('src',loading);isplaying=false;if(!config.xml)
config.xml='xml/songs.xml';BrowserDetect.init();$.ajax({type:"GET",url:config.xml,dataType:"text/xml",success:parseXml,error:function(xml){}});if(BrowserDetect.browser!=='Safari'){soundManager.useHTML5Audio=true;}
var play_=document.getElementById('play');var skip_=document.getElementById('skip');var stop_=document.getElementById('stop');var back_=document.getElementById('back');$('#play-link').click(function(){play(curr_song);return false;});$('#play-link').mouseover(function(){play_.setAttribute('src',images[1].src);});$('#play-link').mouseout(function(){play_.setAttribute('src',images[0].src);});$('#skip-link').click(function(){skip();return false;});$('#skip-link').mouseover(function(){skip_.setAttribute('src',images[5].src);});$('#skip-link').mouseout(function(){skip_.setAttribute('src',images[4].src);});$('#stop-link').click(function(){stopMusic(curr_song.toString());return false;});$('#stop-link').mouseover(function(){stop_.setAttribute('src',images[7].src);});$('#stop-link').mouseout(function(){stop_.setAttribute('src',images[6].src);});$('#back-link').click(function(){skipBack();return false;});$('#back-link').mouseover(function(){back_.setAttribute('src',images[9].src);});$('#back-link').mouseout(function(){back_.setAttribute('src',images[8].src);});soundManager.onload=function(){var localSoundManager=soundManager;localSoundManager.useFastPolling=true;localSoundManager.useHighPerformance=true;while(songs==null){}
var temp;for(var i=0;i<songs.length;i++){temp=localSoundManager.createSound({id:i.toString(),url:songs[i].url});soundObjs[i]=jQuery.extend(true,{},temp);soundObjs[i].load();}
showSongInfo();document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);}}
function play(track){togglePlayPauseButton();soundManager.togglePause(track.toString());showSongInfo();}
function togglePlayPauseButton(){if(isplaying==true){buttonPlayState();isplaying=false;}
else{buttonPauseState();isplaying=true;}}
function buttonPauseState(){var play=document.getElementById('play');var play_link=document.getElementById('play-link');play.setAttribute('src',images[2].src);$('#play-link').mouseout(function(){play.setAttribute('src',images[2].src);});$('#play-link').mouseover(function(){play.setAttribute('src',images[3].src);});}
function buttonPlayState(){var play=document.getElementById('play');play.setAttribute('src',images[0].src);$('#play-link').mouseout(function(){play.setAttribute('src',images[0].src);});$('#play-link').mouseover(function(){play.setAttribute('src',images[1].src);});}
function showSongInfo(){document.getElementById('info').innerHTML="<p>"+songs[curr_song].artist+"  ["+songs[curr_song].title+"] </p>";}
function skipBack(){var t=curr_song;if(t==0){t=songs.length-1;}
else{t=t-1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);isplaying=true;buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
function skip(){var t=curr_song;if(t<songs.length){if(t==songs.length-1)
t=0;else
t=t+1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);isplaying=true;buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
function switchArt(track,afterEffect){$('#art').hide('slide',function(){document.getElementById('art').setAttribute('src',songs[track].thumb.src);$('#art').show('slide',afterEffect);});}
function stopMusic(track){var localSoundManager=soundManager;var play=document.getElementById('play');localSoundManager.stopAll();localSoundManager.unload(track.toString());soundObjs[track]=localSoundManager.load(track.toString());isplaying=false;buttonPlayState()}
function parseXml(xml)
{var local_song=song;var i=0;if(BrowserDetect.browser!=="Explorer"){$(xml).find("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}
else{$(xml).filter("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");local_song.duration=$(this).attr("duration");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}}
function loadImages(config){var pathtobutts=config.buttonsDir;images[0]=new Image();images[0].src=pathtobutts+'play.png';images[1]=new Image();images[1].src=pathtobutts+'play-over.png';images[2]=new Image();images[2].src=pathtobutts+'pause.png';images[3]=new Image();images[3].src=pathtobutts+'pause-over.png';images[4]=new Image();images[4].src=pathtobutts+'skip.png';images[5]=new Image();images[5].src=pathtobutts+'skip-over.png';images[6]=new Image();images[6].src=pathtobutts+'stop.png';images[7]=new Image();images[7].src=pathtobutts+'stop-over.png';images[8]=new Image();images[8].src=pathtobutts+'back.png';images[9]=new Image();images[9].src=pathtobutts+'back-over.png';}
function getInternetExplorerVersion()
{var rv=-1;if(navigator.appName=='Microsoft Internet Explorer')
{var ua=navigator.userAgent;var re=new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");if(re.exec(ua)!=null)
rv=parseFloat(RegExp.$1);}
return rv;}
function checkVersion()
{var msg="You're not using Internet Explorer.";var ver=getInternetExplorerVersion();if(ver>-1)
{if(ver>=8.0)
msg="You're using a recent copy of Internet Explorer."
else
msg="You should upgrade your copy of Internet Explorer.";}}
var BrowserDetect={init:function(){this.browser=this.searchString(this.dataBrowser)||"An unknown browser";this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||"an unknown version";this.OS=this.searchString(this.dataOS)||"an unknown OS";},searchString:function(data){for(var i=0;i<data.length;i++){var dataString=data[i].string;var dataProp=data[i].prop;this.versionSearchString=data[i].versionSearch||data[i].identity;if(dataString){if(dataString.indexOf(data[i].subString)!=-1)
return data[i].identity;}
else if(dataProp)
return data[i].identity;}},searchVersion:function(dataString){var index=dataString.indexOf(this.versionSearchString);if(index==-1)return;return parseFloat(dataString.substring(index+this.versionSearchString.length+1));},dataBrowser:[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.userAgent,subString:"OmniWeb",versionSearch:"OmniWeb/",identity:"OmniWeb"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera"},{string:navigator.vendor,subString:"iCab",identity:"iCab"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.vendor,subString:"Camino",identity:"Camino"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],dataOS:[{string:navigator.platform,subString:"Win",identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone/iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}]};})(jQuery);/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.7.3
   
   Change Log v0.7.3:
   - Fixes for Safari on Windows: Does not attempt to use HTML5 audio
   - Uses more intelligent browser detection
   - Fixed page jumps when clicking on controls
   
*/(function($)
{var songs=new Array();var albumart=new Array();var soundObjs=new Array();var song={id:" ",title:" ",url:" ",artist:" ",thumb:" ",duration:" "};var images=new Array();var curr_song=0;var soundId=soundManager.sID;var isplaying=new Boolean(false);var loading='loadingAnimation.gif';soundManager.url='swf';$.fn.SwaggPlayer=function(config){var swagg_div=this;swaggOn(swagg_div,config);}
function swaggOn(swagg_div,config){if(!config.buttonsDir)
config.buttonsDir='images/';loadImages(config);document.getElementById('art').setAttribute('src',loading);isplaying=false;if(!config.xml)
config.xml='xml/songs.xml';BrowserDetect.init();$.ajax({type:"GET",url:config.xml,dataType:"text/xml",success:parseXml,error:function(xml){}});if(BrowserDetect.browser!=='Safari'){soundManager.useHTML5Audio=true;}
var play_=document.getElementById('play');var skip_=document.getElementById('skip');var stop_=document.getElementById('stop');var back_=document.getElementById('back');$('#play-link').click(function(){play(curr_song);return false;});$('#play-link').mouseover(function(){play_.setAttribute('src',images[1].src);});$('#play-link').mouseout(function(){play_.setAttribute('src',images[0].src);});$('#skip-link').click(function(){skip();return false;});$('#skip-link').mouseover(function(){skip_.setAttribute('src',images[5].src);});$('#skip-link').mouseout(function(){skip_.setAttribute('src',images[4].src);});$('#stop-link').click(function(){stopMusic(curr_song.toString());return false;});$('#stop-link').mouseover(function(){stop_.setAttribute('src',images[7].src);});$('#stop-link').mouseout(function(){stop_.setAttribute('src',images[6].src);});$('#back-link').click(function(){skipBack();return false;});$('#back-link').mouseover(function(){back_.setAttribute('src',images[9].src);});$('#back-link').mouseout(function(){back_.setAttribute('src',images[8].src);});soundManager.onload=function(){var localSoundManager=soundManager;localSoundManager.useFastPolling=true;localSoundManager.useHighPerformance=true;while(songs==null){}
var temp;for(var i=0;i<songs.length;i++){temp=localSoundManager.createSound({id:i.toString(),url:songs[i].url});soundObjs[i]=jQuery.extend(true,{},temp);soundObjs[i].load();}
showSongInfo();document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);}}
function play(track){togglePlayPauseButton();soundManager.togglePause(track.toString());showSongInfo();}
function togglePlayPauseButton(){if(isplaying==true){buttonPlayState();isplaying=false;}
else{buttonPauseState();isplaying=true;}}
function buttonPauseState(){var play=document.getElementById('play');var play_link=document.getElementById('play-link');play.setAttribute('src',images[2].src);$('#play-link').mouseout(function(){play.setAttribute('src',images[2].src);});$('#play-link').mouseover(function(){play.setAttribute('src',images[3].src);});}
function buttonPlayState(){var play=document.getElementById('play');play.setAttribute('src',images[0].src);$('#play-link').mouseout(function(){play.setAttribute('src',images[0].src);});$('#play-link').mouseover(function(){play.setAttribute('src',images[1].src);});}
function showSongInfo(){document.getElementById('info').innerHTML="<p>"+songs[curr_song].artist+"  ["+songs[curr_song].title+"] </p>";}
function skipBack(){var t=curr_song;if(t==0){t=songs.length-1;}
else{t=t-1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);isplaying=true;buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
function skip(){var t=curr_song;if(t<songs.length){if(t==songs.length-1)
t=0;else
t=t+1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);isplaying=true;buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
function switchArt(track,afterEffect){$('#art').hide('slide',function(){document.getElementById('art').setAttribute('src',songs[track].thumb.src);$('#art').show('slide',afterEffect);});}
function stopMusic(track){var localSoundManager=soundManager;var play=document.getElementById('play');localSoundManager.stopAll();localSoundManager.unload(track.toString());soundObjs[track]=localSoundManager.load(track.toString());isplaying=false;buttonPlayState()}
function parseXml(xml)
{var local_song=song;var i=0;if(BrowserDetect.browser!=="Explorer"){$(xml).find("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}
else{$(xml).filter("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");local_song.duration=$(this).attr("duration");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}}
function loadImages(config){var pathtobutts=config.buttonsDir;images[0]=new Image();images[0].src=pathtobutts+'play.png';images[1]=new Image();images[1].src=pathtobutts+'play-over.png';images[2]=new Image();images[2].src=pathtobutts+'pause.png';images[3]=new Image();images[3].src=pathtobutts+'pause-over.png';images[4]=new Image();images[4].src=pathtobutts+'skip.png';images[5]=new Image();images[5].src=pathtobutts+'skip-over.png';images[6]=new Image();images[6].src=pathtobutts+'stop.png';images[7]=new Image();images[7].src=pathtobutts+'stop-over.png';images[8]=new Image();images[8].src=pathtobutts+'back.png';images[9]=new Image();images[9].src=pathtobutts+'back-over.png';}
function getInternetExplorerVersion()
{var rv=-1;if(navigator.appName=='Microsoft Internet Explorer')
{var ua=navigator.userAgent;var re=new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");if(re.exec(ua)!=null)
rv=parseFloat(RegExp.$1);}
return rv;}
function checkVersion()
{var msg="You're not using Internet Explorer.";var ver=getInternetExplorerVersion();if(ver>-1)
{if(ver>=8.0)
msg="You're using a recent copy of Internet Explorer."
else
msg="You should upgrade your copy of Internet Explorer.";}}
var BrowserDetect={init:function(){this.browser=this.searchString(this.dataBrowser)||"An unknown browser";this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||"an unknown version";this.OS=this.searchString(this.dataOS)||"an unknown OS";},searchString:function(data){for(var i=0;i<data.length;i++){var dataString=data[i].string;var dataProp=data[i].prop;this.versionSearchString=data[i].versionSearch||data[i].identity;if(dataString){if(dataString.indexOf(data[i].subString)!=-1)
return data[i].identity;}
else if(dataProp)
return data[i].identity;}},searchVersion:function(dataString){var index=dataString.indexOf(this.versionSearchString);if(index==-1)return;return parseFloat(dataString.substring(index+this.versionSearchString.length+1));},dataBrowser:[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.userAgent,subString:"OmniWeb",versionSearch:"OmniWeb/",identity:"OmniWeb"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera"},{string:navigator.vendor,subString:"iCab",identity:"iCab"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.vendor,subString:"Camino",identity:"Camino"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],dataOS:[{string:navigator.platform,subString:"Win",identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone/iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}]};})(jQuery);