# GoGo

Play go with your friends in a LAN. This repository contains the server side application (written entirely with Django), the front-end of the web application (written with React.js) and the mobile application code for both Android and iOS (written with React-Native).

**Tested with Ubuntu 18.04**

## Server setup

Install MySQL and Redis:
```
sudo apt-get install mysql-server
sudo apt-get install python3-dev libmysqlclient-dev default-libmysqlclient-dev
sudo sudo add-apt-repository ppa:chris-lea/redis-server
sudo apt-get update
sudo apt-get install redis-server
```

Install django (a virtual environment is suggested):

```
cd gogo
python3 -m venv env
source env/bin/activate
pip3 install --upgrade pip
pip3 install -r requirements.txt
```

Create MySQL Database and User according to *gogo/gogo/settings.py*:

```
sudo mysql -u root
CREATE DATABASE gogo;
CREATE USER 'testuser'@'%' IDENTIFIED WITH mysql_native_password BY 'testpassword';
GRANT ALL ON gogo.* TO 'testuser'@'%';
FLUSH PRIVILEGES;
EXIT;
```

In order to make other devices from the same LAN to connect to the server manually change the IP variable at files *gogoapp/static/js/welcome.js* and *gogoapp/static/js/game.js* with your server IP.


Migrate database and run server on LAN:
```
python3 manage.py migrate
python3 manage.py runserver <IP>:8000
```

## Mobile App (Android Build)

Install java, nodejs and npx package:

```
cd ..
curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install default-jre default-jdk
```

Download and install Android Studio from official website (or via snap).

Adjust number of watchers:

```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

Create react-native application
```
npx react-native init GogoApp
```

Copy content of *mobileapp* folder to *GogoApp*:

```
yes | cp -rf mobileapp/* GogoApp/
cd GogoApp
```

Install node_modules dependencies:

```
chmod +x node_modules_install.sh
./node_modules_install.sh
```

Again, change the hardcoded IPs at *pages/*.js*

Build Android App:

```
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

Then use Android Studio to open App on virtual device or create APK for your Android device

