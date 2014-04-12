git_clone:
  git:
    - latest
    - user: vagrant
    - target: /home/vagrant/clients
    - name: /git/clients
    - require:
      - pkg: build_deps
