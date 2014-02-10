sudo apt-get -y install vim tmux zsh ruby1.9.3
mkdir -p ~/.tmuxinator
cp -av /clients.git/utils/tmuxinator/session.yml ~/.tmuxinator
wget --no-check-certificate https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O - | sh
sudo salt-call state.highstate

