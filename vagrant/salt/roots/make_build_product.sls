make_build_product:
  cmd.run:
    - user: vagrant
    - name: make build-product
    - cwd: /home/vagrant/clients
    - require:
      - cmd: build_calamari_clients

copyout_build_product:
  cmd.run:
    - user: vagrant
    - name: cp calamari-clients*tar.gz /git/
    - cwd: /home/vagrant
    - require:
      - cmd: make_build_product
