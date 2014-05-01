make_build_product:
  cmd.run:
    - user: vagrant
    - name: make build-product
    - cwd: /home/vagrant/clients
    - require:
      - cmd: build_calamari_clients

make_build_dir:
  cmd.run:
    - user: vagrant
    - name: mkdir -p /git/builds/wheezy /git/builds/precise /git/builds/centos
    - cwd: /home/vagrant
    - require:
      - cmd: make_build_product

copyout_build_product:
  cmd.run:
    - user: vagrant
    - name: cp calamari-clients*tar.gz /git/builds/precise
    - cwd: /home/vagrant
    - require:
      - cmd: make_build_dir
