#Building/installing UI content:

**Your mileage will vary, based on what platform  you are on. These instructions are broadly applicable to most modern Linux systems. **

* `git clone github.com/inktankstorage/clients`

* Download a current node.js (only for building).  One option: get source
and build from http://nodejs.org/dist/v0.10.18/node-v0.10.18.tar.gz
This includes npm.  We track 0.10.X, 0.11.X is not currently supported.

* `sudo npm install -g bower`

* `sudo npm install -g grunt-cli`

* Install ruby - we need it for sass and compass support.

* Install rubygems (Debian) or perhaps gem update --system on non-Debian?

* `make targets`:
	dpkg to build Debian package
	DESTDIR=<abs path> fakeroot make install to make install image
	dist only copies what it believes is actual source, not buildable.
