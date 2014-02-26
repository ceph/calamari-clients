sudo apt-get update
sudo apt-get -y install vim tmux zsh ruby1.9.3 git curl htop
mkdir -p ~/.tmuxinator
cp -av /clients.git/utils/tmuxinator/session.yml ~/.tmuxinator
wget --no-check-certificate https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O - | sh
sudo salt-call state.highstate
echo <<EOF
Now you need install tmuxinator

  sudo -s 
  export REALLY_GEM_UPDATE_SYSTEM=true
  gem update --system
  gem install tmuxinator
  exit

  tmuxinator

EOF
