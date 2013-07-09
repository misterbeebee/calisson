#!/bin/bash

rm -rf ~/Sites/calisson/app
mkdir -p ~/Sites/calisson/app

while true; do
  site=~/Sites/calisson/
  rsync -ra app/ $site/app/
  # Write a signature, so users can detect changes
  tar c app | md5 > $site/app/md5sum
  # cat $site/app/md5sum
  # open "http://localhost/~$USER/calisson/app/"
  sleep 3
done
