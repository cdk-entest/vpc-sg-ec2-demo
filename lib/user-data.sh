cd ~
wget https://github.com/cdk-entest/vpc-sg-ec2-demo/archive/refs/heads/main.zip
unzip main.zip
cd vpc-sg-ec2-demo-main
cd web
python3 -m pip install --user -r requirements.txt
python3 -m app
