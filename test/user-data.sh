#!/bin/bash
cd ~
wget https://github.com/entest-hai/vpc-sg-ec2-demo/archive/refs/heads/main.zip
unzip main.zip
cd vpc-sg-ec2-demo
cd web
python3 -m pip install -r requirements.txt
python3 -m app