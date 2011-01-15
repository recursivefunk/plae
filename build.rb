
# strips the lines of a file which have LOGGER. in them as these are
# presumably debugging output
# output: creates jquery-swagg-player-nodebug.js
def stripLog(baseFile, newFile)
  puts "Stripping log statements from " + baseFile
  if File.exists?(newFile)
    File.delete(newFile);
  end
  file = File.new(baseFile, "r")  
  noComment = File.new(newFile, "w")
  while (line = file.gets)
    if (not line =~ /LOGGER\./)
      noComment.puts(line)
    end
  end
  file.close
  noComment.close
end

# finds the beginning of the BrowserDetect as denoted with comments
# and strips them
# output: creates jquery-swagg-player-no-browser-detect.js
def stripBrowserDetect(baseFile, newFile)
  puts "Stripping BrowserDetect from " + baseFile
  if File.exists?(newFile)
    File.delete(newFile);
  end
  flag = false;
  file = File.new(baseFile, "r")  
  noBrowserDetect = File.new(newFile, "w")
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
end

stripLog("js/jquery-swagg-player.js", "js/jquery-swagg-player-nodebug.js")
#stripBrowserDetect("js/jquery-swagg-player.js", "js/jquery-swagg-player-nobrowserdetect.js")
#stripLog("js/jquery-swagg-player-nobrowserdetect.js", "js/jquery-swagg-player-nodebug-nobrowserdetect.js")

# ============================== minifiy =========================================


puts "Compressing Swagg Player"
system "juicer merge -i --force js/jquery-swagg-player.js"

puts "Comporessing Swagg Player (No Logging)"
system "juicer merge -i --force js/jquery-swagg-player-nodebug.js"

#puts "Compressing Swagg Player (No Logging and no BrowserDetect)"
#system "juicer merge -i --force js/jquery-swagg-player-nodebug-nobrowserdetect.js"

puts "Done!"


