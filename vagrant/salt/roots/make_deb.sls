devscripts:
  pkg.installed

build_calamari_clients:
  cmd.run:
    - user: vagrant
    - name: make dpkg
    - cwd: /home/vagrant/clients
    - require:
      - git: git_clone
      - pkg: devscripts

copy_calamari_clients:
  cmd.run:
    - name: cp calamari-clients*.deb /git/
    - cwd: /home/vagrant
    - require:
      - cmd: build_calamari_clients
