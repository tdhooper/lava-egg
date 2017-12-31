
#!/bin/sh

# From http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html

# Usage:
# ./makegif.sh "img%02d.png" output.gif

palette="/tmp/palette.png"

filters="scale=600:-1:flags=lanczos"

ffmpeg -thread_queue_size 16 -v warning -start_number 0 -i $1 -vf "$filters,palettegen=stats_mode=diff:max_colors=128" -y $palette
ffmpeg -thread_queue_size 16 -v warning -start_number 0 -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse=dither=sierra2_4a" -y $2