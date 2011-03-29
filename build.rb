
require 'fileutils'
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

def optimize(baseFile, newFile)
  puts "Making file gzip ready " + baseFile
  if File.exists?(newFile)
    File.delete(newFile);
  end
  file = File.new(baseFile, "r")  
  php = File.new(newFile, "w")
  php.puts('<?php ob_start ("ob_gzhandler"); header("Content-type: text/javascript; charset: UTF-8"); ?>')
  while (line = file.gets)
      php.puts(line)
  end
  file.close
  php.close
end

stripLog("js/jquery-swagg-player.js", "js/jquery-swagg-player-nodebug.js")

# ============================== minifiy / gzip prep =========================================
puts ""
puts "Compressing Swagg Player"
system "juicer merge -i --force js/jquery-swagg-player.js"

puts ""
puts "Comporessing Swagg Player (No Logging)"
system "juicer merge -i --force js/jquery-swagg-player-nodebug.js"

#puts "Comporessing Swagg Loader"
#system "juicer merge -i --force js/swaggloader.js"

puts ""
puts "enabling gzip for swagg player"
optimize("js/jquery-swagg-player.min.js", "js/gzipready/jquery-swagg-player.min.js.php")

puts ""
puts "enabling gzip for swagg player (no debug)"
optimize("js/jquery-swagg-player-nodebug.min.js", "js/gzipready/jquery-swagg-player-nodebug.min.js.php")

puts ""
puts "moving files"
FileUtils.mv("js/jquery-swagg-player.min.js", "js/min/jquery-swagg-player.min.js")
FileUtils.mv("js/jquery-swagg-player-nodebug.min.js", "js/min/jquery-swagg-player-nodebug.min.js")

puts ""
puts "deploying to server"
system "./deploy.sh"

puts ""
puts "done!"
puts "Done!"


