/*!
   Swagg Player: Music Player for the web
   --------------------------------------------
   http://johnny-ray.com/blog/?page_id=70

   Copyright (c) 2010, Johnny Austin. All rights reserved.
   Code provided under the MIT License:
   http://www.opensource.org/licenses/mit-license.php

   v0.8.5
   
   Change Log v8.5
   - Support for JSON formatted songs
   - Performance enhancements
   
 */(function($)
{var songs=new Array();var soundObjs=new Array();var globalConfig;var song={id:" ",title:" ",url:" ",artist:" ",thumb:" ",duration:" "};var img=new Array();var curr_song=0;var loading=new Image();loading.src='loading.gif';var interval_id;soundManager.url='swf';$.fn.SwaggPlayer=function(config){var swagg_div=this;if(config.useArt===true){$('#art').attr('src',loading.src);}
swaggOn(swagg_div,config);}
function swaggOn(swagg_div,config){globalConfig=config;if(!config.buttonsDir)
config.buttonsDir='images/';if(config.images)
img=images;loadImages(config);if(!config.data)
config.data='json/songs.json';BrowserDetect.init();var format;if(config.dataFormat)
format=config.dataFormat;else
format="json";$.ajax({type:"GET",url:config.data,dataType:format,success:function(data){if(format==="json"){console.log("Swagg Player::Using JSON...");var size=data.length;for(var i=0;i<size;i++){data[i].image=new Image();data[i].image.src=data[i].thumb;data[i].id=i.toString();}
songs=data;}
else if(format==="text/xml"||format==="xml"){console.log("Swagg Player::Parsing XML. You should think about switching to JSON, it's much faster!");parseXml(data);}
else{console.log("Swagg Player::Couldn't determine data type!");}},error:function(xhr,ajaxOptions,thrownError){console.log("Swagg Player::There was a problem fetching your songs from the server: "+thrownError);}});var initButtons=function(){i=img;var $play=$('#play');var $skip=$('#skip');var $stop=$('#stop');var $back=$('#back');var $playlink=$('#play-link');var $skiplink=$('#skip-link');var $stoplink=$('#stop-link');var $backlink=$('#back-link');$playlink.click(function(){play(curr_song);return false;});$playlink.mouseover(function(){$play.attr('src',i[1].src);});$playlink.mouseout(function(){$play.attr('src',i[0].src);});$skiplink.click(function(){skip();return false;});$skiplink.mouseover(function(){$skip.attr('src',i[5].src);});$skiplink.mouseout(function(){$skip.attr('src',i[4].src);});$stoplink.click(function(){stopMusic(curr_song.toString());return false;});$stoplink.mouseover(function(){$stop.attr('src',i[7].src);});$stoplink.mouseout(function(){$stop.attr('src',i[6].src);});$backlink.click(function(){skipBack();return false;});$backlink.mouseover(function(){$back.attr('src',i[9].src);});$backlink.mouseout(function(){$back.attr('src',i[8].src);});}
if(BrowserDetect.browser!=='Safari'){soundManager.useHTML5Audio=true;}
soundManager.createSongs=function(){if(songs[0]!==undefined){clearInterval(interval_id);var localSoundManager=soundManager;localSoundManager.useFastPolling=true;localSoundManager.useHighPerformance=true;initButtons();var temp;var objs=soundObjs;for(var i=0,end=songs.length;i<end;i++){temp=localSoundManager.createSound({id:i.toString(),url:songs[i].url,onfinish:skip,onplay:buttonPauseState,onpause:buttonPlayState,onstop:buttonPlayState,onresume:buttonPauseState});temp.load();objs[i]=jQuery.extend(true,{},temp);}
if(config.useArt===true){$('#art').attr('src',songs[curr_song].image.src);}
showSongInfo();}}
soundManager.onload=function(){interval_id=setInterval('soundManager.createSongs()',5);}}
function play(track){soundManager.togglePause(track.toString());showSongInfo();}
function buttonPauseState(){var i=img;var $play=$('#play');var $playlink=$('#play-link');$play.attr('src',i[2].src);$playlink.mouseout(function(){$play.attr('src',i[2].src);});$playlink.mouseover(function(){$play.attr('src',i[3].src);});}
function buttonPlayState(){var i=img;var $play=$('#play');var $playlink=$('#play-link');$play.attr('src',i[0].src);$playlink.mouseout(function(){$play.attr('src',i[0].src);});$playlink.mouseover(function(){$play.attr('src',i[1].src);});}

function showSongInfo(){var song_=songs[curr_song];$('#info').html("<p>"+song_.artist+"  </br>"+song_.title+" </p>");}
function skipBack(){var t=curr_song;if(t==0){t=songs.length-1;}
else{t=t-1;}
stopMusic(t);curr_song=t;if(globalConfig.useArt===true){var afterEffect=function(){play(t);showSongInfo();}
switchArt(t,afterEffect);}
else{play(t);buttonPauseState();showSongInfo();}}
function skip(){var t=curr_song;if(t<songs.length){if(t==songs.length-1)
t=0;else
t=t+1;}
stopMusic(t);curr_song=t;if(globalConfig.useArt===true){var afterEffect=function(){play(t);buttonPauseState();showSongInfo();}
switchArt(t,afterEffect);}
else{play(t);buttonPauseState();showSongInfo();}}
function switchArt(track,afterEffect){var $art=$('#art');$art.removeClass('fancy');$art.hide('slide',function(){$art.attr('src',songs[track].image.src);$art.show('slide',afterEffect);});}
function stopMusic(track){var localSoundManager=soundManager;localSoundManager.stopAll();localSoundManager.unload(track.toString());}
function parseXml(xml)
{var local_song=song;var temp;var i=0;if(BrowserDetect.browser==="Explorer"&&BrowserDetect.version!='9'){$(xml).filter("song").each(function()
{local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.image=new Image();local_song.image.src=$(this).attr("thumb");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}
else{$(xml).find("song").each(function()
{local_song.id=$(this).attr("id");local_song.title=$(this).attr("track");local_song.url=$(this).attr("url");local_song.artist=$(this).attr("artist");local_song.image=new Image();local_song.image.src=$(this).attr("thumb");local_song.duration=$(this).attr("duration");songs[i]=jQuery.extend(true,{},local_song);i=i+1;});}}
function loadImages(config){var pathtobutts=config.buttonsDir;img[0]=new Image();img[0].src=pathtobutts+'play.png';img[1]=new Image();img[1].src=pathtobutts+'play-over.png';img[2]=new Image();img[2].src=pathtobutts+'pause.png';img[3]=new Image();img[3].src=pathtobutts+'pause-over.png';img[4]=new Image();img[4].src=pathtobutts+'skip.png';img[5]=new Image();img[5].src=pathtobutts+'skip-over.png';img[6]=new Image();img[6].src=pathtobutts+'stop.png';img[7]=new Image();img[7].src=pathtobutts+'stop-over.png';img[8]=new Image();img[8].src=pathtobutts+'back.png';img[9]=new Image();img[9].src=pathtobutts+'back-over.png';}
var BrowserDetect={init:function(){this.browser=this.searchString(this.dataBrowser)||"An unknown browser";this.version=this.searchVersion(navigator.userAgent)||this.searchVersion(navigator.appVersion)||"an unknown version";this.OS=this.searchString(this.dataOS)||"an unknown OS";},searchString:function(data){for(var i=0;i<data.length;i++){var dataString=data[i].string;var dataProp=data[i].prop;this.versionSearchString=data[i].versionSearch||data[i].identity;if(dataString){if(dataString.indexOf(data[i].subString)!=-1)
return data[i].identity;}
else if(dataProp)
return data[i].identity;}},searchVersion:function(dataString){var index=dataString.indexOf(this.versionSearchString);if(index==-1)return;return parseFloat(dataString.substring(index+this.versionSearchString.length+1));},dataBrowser:[{string:navigator.userAgent,subString:"Chrome",identity:"Chrome"},{string:navigator.userAgent,subString:"OmniWeb",versionSearch:"OmniWeb/",identity:"OmniWeb"},{string:navigator.vendor,subString:"Apple",identity:"Safari",versionSearch:"Version"},{prop:window.opera,identity:"Opera"},{string:navigator.vendor,subString:"iCab",identity:"iCab"},{string:navigator.vendor,subString:"KDE",identity:"Konqueror"},{string:navigator.userAgent,subString:"Firefox",identity:"Firefox"},{string:navigator.vendor,subString:"Camino",identity:"Camino"},{string:navigator.userAgent,subString:"Netscape",identity:"Netscape"},{string:navigator.userAgent,subString:"MSIE",identity:"Explorer",versionSearch:"MSIE"},{string:navigator.userAgent,subString:"Gecko",identity:"Mozilla",versionSearch:"rv"},{string:navigator.userAgent,subString:"Mozilla",identity:"Netscape",versionSearch:"Mozilla"}],dataOS:[{string:navigator.platform,subString:"Win",identity:"Windows"},{string:navigator.platform,subString:"Mac",identity:"Mac"},{string:navigator.userAgent,subString:"iPhone",identity:"iPhone/iPod"},{string:navigator.platform,subString:"Linux",identity:"Linux"}]};})(jQuery);