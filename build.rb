
# ======================== strip logging create ==============================
# creates jquery-swagg-player-nodebug.js
if File.exists?("js/jquery-swagg-player-nodebug.js")
	File.delete("js/jquery-swagg-player-nodebug.js");
end
file = File.new("js/jquery-swagg-player.js", "r")  
noComment = File.new("js/jquery-swagg-player-nodebug.js", "w")
while (line = file.gets)
	if (not line =~ /LOGGER\./)
		noComment.puts(line)
	end
end
file.close
noComment.close

# ======================== strip browser detect ========================
# creates jquery-swagg-player-no-browser-detect.js
if File.exists?("js/jquery-swagg-player-nobrowserdetect.js")
	File.delete("js/jquery-swagg-player-nobrowserdetect.js");
end
flag = false;
file = File.new("js/jquery-swagg-player.js", "r")  
noBrowserDetect = File.new("js/jquery-swagg-player-nobrowserdetect.js", "w")
while (line = file.gets)
	if (flag == false)
		if (line =~ /BEGIN BROWSER DETECT/)
			flag = true
		end
		if (flag == false) 
			noBrowserDetect.puts(line)
		end
	end
	if (line =~ /END BROWSER DETECT/)
		flag = false
	end
end
file.close
noBrowserDetect.close

# ============================= strip logging from no browser version ===========
# creates jquery-swagg-player-nodebug-no-browserdetect.js
if File.exists?("js/jquery-swagg-player-nodebug-nobrowserdetect.js")
	File.delete("js/jquery-swagg-player-nodebug-nobrowserdetect.js");
end
file = File.new("js/jquery-swagg-player-nobrowserdetect.js", "r")  
noDebugNoBrowser = File.new("js/jquery-swagg-player-nodebug-nobrowserdetect.js", "w")
while (line = file.gets)
	if (not line =~ /LOGGER\./)
		noDebugNoBrowser.puts(line)
	end
end


# ============================== minifiy =========================================

file.close
noDebugNoBrowser.close

puts "Compressing Swagg Player"
system "juicer merge -i --force js/jquery-swagg-player.js"

puts "Comporessing Swagg Player (No Logging)"
system "juicer merge -i --force js/jquery-swagg-player-nodebug.js"

puts "Compressing Swagg Player (No Logging and no BrowserDetect)"
system "juicer merge -i --force js/jquery-swagg-player-nodebug-nobrowserdetect.js"

puts "Done!"