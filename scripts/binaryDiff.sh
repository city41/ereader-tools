#!/bin/bash -x

xxd $1 > /tmp/$1.hex
xxd $2 > /tmp/$2.hex

vimdiff /tmp/$1.hex /tmp/$2.hex

