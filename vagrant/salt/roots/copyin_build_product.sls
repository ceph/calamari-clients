copyin_build_product:
  cmd.run:
    - name: cp /git/builds/precise/calamari-clients*tar.gz /home/vagrant
    - user: vagrant
    - onlyif: test -e /git/builds/precise/calamari-clients*tar.gz
