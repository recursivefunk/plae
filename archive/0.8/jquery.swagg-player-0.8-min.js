/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8
   
   Change Log v8
   - Automatic skipping by default
   - Event driven button state changes/toggles
   - Unexpected delays in sound loading no longer blocks UI thread
   - Refactored for better performance and error handling   
*/(function($)
{var songs=new Array();var albumart=new Array();var soundObjs=new Array();var song={id:" ",title:" ",url:" ",artist:" ",thumb:" ",duration:" "};var img=new Array();var curr_song=0;var soundId=soundManager.sID;var loading=new Image();loading.src='loading.gif';var interval_id;soundManager.url='swf';$.fn.SwaggPlayer=function(config){var swagg_div=this;swaggOn(swagg_div,config);}
function swaggOn(swagg_div,config){if(!config.buttonsDir)
config.buttonsDir='images/';if(config.images)
img=images;loadImages(config);document.getElementById('art').setAttribute('src',loading.src);if(!config.xml)
config.xml='xml/songs.xml';BrowserDetect.init();$.ajax({type:"GET",url:config.xml,dataType:"text/xml",success:parseXml,error:function(xml){}});var initButtons=function(){var play_=document.getElementById('play');var skip_=document.getElementById('skip');var stop_=document.getElementById('stop');var back_=document.getElementById('back');$('#play-link').click(function(){play(curr_song);return false;});$('#play-link').mouseover(function(){play_.setAttribute('src',img[1].src);});$('#play-link').mouseout(function(){play_.setAttribute('src',img[0].src);});$('#skip-link').click(function(){skip();return false;});$('#skip-link').mouseover(function(){skip_.setAttribute('src',img[5].src);});$('#skip-link').mouseout(function(){skip_.setAttribute('src',img[4].src);});$('#stop-link').click(function(){stopMusic(curr_song.toString());return false;});$('#stop-link').mouseover(function(){stop_.setAttribute('src',img[7].src);});$('#stop-link').mouseout(function(){stop_.setAttribute('src',img[6].src);});$('#back-link').click(function(){skipBack();return false;});$('#back-link').mouseover(function(){back_.setAttribute('src',img[9].src);});$('#back-link').mouseout(function(){back_.setAttribute('src',img[8].src);});}
if(BrowserDetect.browser!=='Safari'){soundManager.useHTML5Audio=true;}
soundManager.createSongs=function(){if(songs[0]!==undefined){clearInterval(interval_id);var localSoundManager=soundManager;localSoundManager.useFastPolling=true;localSoundManager.useHighPerformance=true;var temp;for(var i=0;i<songs.length;i++){temp=localSoundManager.createSound({id:i.toString(),url:songs[i].url,onfinish:skip,onplay:buttonPauseState,onpause:buttonPlayState,onstop:buttonPlayState,onresume:buttonPauseState});temp.load();soundObjs[i]=jQuery.extend(true,{},temp);}
initButtons();showSongInfo();document.getElementById('art').setAttribute('src',songs[curr_song].thumb.src);}}
soundManager.onload=function(){interval_id=setInterval('soundManager.createSongs()',5);}}
function play(track){soundManager.togglePause(track.toString());showSongInfo();}
function buttonPauseState(){var play=document.getElementById('play');var play_link=document.getElementById('play-link');play.setAttribute('src',img[2].src);$('#play-link').mouseout(function(){play.setAttribute('src',img[2].src);});$('#play-link').mouseover(function(){play.setAttribute('src',img[3].src);});}
function buttonPlayState(){var play=document.getElementById('play');play.setAttribute('src',img[0].src);$('#play-link').mouseout(function(){play.setAttribute('src',img[0].src);});$('#play-link').mouseover(function(){play.setAttribute('src',img[1].src);});}
function showSongInfo(){document.getElementById('info').innerHTML="<p>"+songs[curr_song].artist+"  </br>"+songs[curr_song].title+" </p>";}
function skipBack(){var t=curr_song;if(t==0){t=songs.length-1;}
else{t=t-1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);showSongInfo();}
switchArt(t,afterEffect);}
function skip(){var t=curr_song;if(t<songs.length){if(t==songs.length-1)
t=0;else
t=t+1;}
stopMusic(t);curr_song=t;var afterEffect=function(){play(t);buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
function switchArt(track,afterEffect){$('#art').hide('slide',function(){document.getElementById('art').setAttribute('src',songs[track].thumb.src);$('#art').show('slide',afterEffect);});}
function stopMusic(track){var localSoundManager=soundManager;var play=document.getElementById('play');localSoundManager.stopAll();localSoundManager.unload(track.toString());soundObjs[track]=localSoundManager.load(track.toString());}
function parseXml(xml)
{var local_song=song;var i=0;if(BrowserDetect.browser!=="Explorer"){$(xml).find("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}
else{$(xml).filter("song").each(function()
{var temp;local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.thumb=new Image();local_song.thumb.src=$(this).attr("thumb");local_song.duration=$(this).attr("duration");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}}
function loadImages(config){var pathtobutts=config.buttonsDir;img[0]=new Image();img[0].src=pathtobutts+'play.png';img[1]=new Image();img[1].src=pathtobutts+'play-over.png';img[2]=new Image();img[2].src=pathtobutts+'pause.png';img[3]=new Image();img[3].src=pathtobutts+'pause-over.png';img[4]=new Image();img[4].src=pathtobutts+'skip.png';img[5]=new Image();img[5].src=pathtobutts+'skip-over.png';img[6]=new Image();img[6].src=pathtobutts+'stop.png';img[7]=new Image();img[7].src=pathtobutts+'stop-over.png';img[8]=new Image();img[8].src=pathtobutts+'back.png';img[9]=new Image();img[9].src=pathtobutts+'back-over.png';}
var BrowserDetect={init:function(){this.browser=this.searchString(this.dataBrowser)||"An unknown browser";this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||"an unknown version";this.OS=this.searchString(this.dataOS)||"an unknown OS";},searchString:function(data){for(var i=0;i<data.length;i++){var dataString=data[i].string;var dataProp=data[i].prop;this.versionSearchString=data[i].versionSearch||data[i].identity;if(dataString){if(dataString.indexOf(data[i].subString)!=-1)
return data[i].identity;}
else if(dataProp)
return data[i].identity;}},searchVersion:function(dataString){var index=dataString.indexOf(this.versionSearchString);if(index==-1)return;return parseFloat(dataString.substring(index+this.versionSearchString.length+1));},dataBrowser:[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.userAgent,subString:"OmniWeb",versionSearch:"OmniWeb/",identity:"OmniWeb"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera"},{string:navigator.vendor,subString:"iCab",identity:"iCab"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.vendor,subString:"Camino",identity:"Camino"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],dataOS:[{string:navigator.platform,subString:"Win",identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone/iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}]};})(jQuery);