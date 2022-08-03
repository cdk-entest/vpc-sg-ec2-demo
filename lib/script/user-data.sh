#!/bin/bash
cd ~
mkdir web 
cd web 
aws s3 cp s3://haimtran-workspace/aurora-web-us-east-1.zip . 
unzip aurora-web-us-east-1.zip
sudo python3 -m pip install -r requirements.txt 
sudo python3 app.py