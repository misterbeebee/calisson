#!/bin/bash

rm -rf ~/Sites/calisson/app
mkdir -p ~/Sites/calisson/app
rsync -rav app/ ~/Sites/calisson/app/
open "http://localhost/~$USER/calisson/app/"
