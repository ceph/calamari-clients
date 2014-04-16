build-product:
  cmd.run:
    - user: vagrant
    - name: make build-product
    - cwd: /home/vagrant/clients
    - require:
      - cmd: calamari-clients

copy-output:
  cmd.run:
    - user: vagrant
    - name: cp calamari-clients*tar.gz /git/
    - cwd: /home/vagrant
    - require:
      - cmd: build-product
