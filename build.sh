#!/bin/bash

rm -rf ~/Sites/calisson/app
mkdir -p ~/Sites/calisson/app

while true; do
  rsync -ra app/ ~/Sites/calisson/app/
  # open "http://localhost/~$USER/calisson/app/"
  sleep 3
done
