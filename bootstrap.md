Bootstrap a Mac for UI work
===========================

Your *user* needs *sudo* privileges.

1. Install Xcode from app store and start
1. Download and install Xcode CLI tools from preferences
1. Install zsh and oh-my-zsh

	```
    chsh -s /bin/zsh [username]
    curl -L https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh | sh
	```

1. Install homebrew

	```
    ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/go)"
	```

1. Install macvim node using homebrew

	```
	brew install macvim node
	```

1. Test node: ```node --version```
1. Install npm:

	```
   curl https://npmjs.org/install.sh | sh
	```

1. Generate ssh-keys, I recommend you use a password and let keychain manage it for you: ```ssh-keygen```
1. Upload ssh public key to your github account
1. Install dropbox - good place to keep config files like ```.vimrc``` and ```.gitconfig```
1. setup your ```.gitconfig```, user at the very least
1. Install compass - needed for sass - ```sudo gem install compass```
1. Install httpie - better curl

	```
	sudo easy_install pip
	sudo pip install httpie
	```

1. Install yeoman, coffee-script, jsonlint, uglify-js and bower

	```
    npm install -g yo grunt-cli coffee-script jsonlint uglify-js bower
	```

1. Install generators:

	```
	npm install generator-webapp
	```
	
1. Test yeoman install: ```yo webapp```

1. Test generated project: ```grunt server```
