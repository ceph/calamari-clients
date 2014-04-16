# this builds only on precise, and populates the build tree by magic
# on other distros

calamari-clients:
  cmd.run:
    - user: vagrant
    - name: make dpkg
    - cwd: /home/vagrant/clients
    - require:
      - git: git_clone

copy-package:
  cmd.run:
    - name: cp calamari-clients*.deb /git/
    - cwd: /home/vagrant
    - require:
      - cmd: calamari-clients
