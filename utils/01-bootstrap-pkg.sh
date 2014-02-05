sudo apt-get -y install vim tmux zsh
wget --no-check-certificate https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O - | sh
sudo salt-call state.highstate

