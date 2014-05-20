build_calamari_clients:
  cmd.run:
    - name: make rpm
    - user: vagrant
    - cwd: /home/vagrant/clients
    - require:
      - git: git_clone

copy_calamari_clients:
  cmd.run:
    - name: cp rpmbuild/RPMS/x86_64/calamari-clients*.rpm /git/
    - cwd: /home/vagrant
    - require:
      - cmd: build_calamari_clients

