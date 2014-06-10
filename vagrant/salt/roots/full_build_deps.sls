full_build_deps:
  pkg.installed:
    - pkgs:
      - ruby
      - rubygems
      - python-software-properties
      - g++
      - make
      - git
      - debhelper
      - build-essential
      - devscripts

install_node:
  pkgrepo.managed:
    - humanname: node.js PPA
    - name: deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main
    - dist: precise
    - file: /etc/apt/sources.list.d/node.list
    - keyid: B9316A7BC7917B12
    - keyserver: keyserver.ubuntu.com
  pkg.latest:
    - name: nodejs
    - refresh: True

bower:
    cmd.run:
        - name: npm install -g bower@1.2.8
    require:
        - pkg: install_node

grunt-cli:
    cmd.run:
        - name: npm install -g grunt-cli
    require:
        - pkg: install_node

compass:
    cmd.run:
        - name: gem install compass
    require:
        - pkg: full_build_deps

fix_mode:
    cmd.run:
        - name: chown -R vagrant:vagrant /home/vagrant
        - user: root
