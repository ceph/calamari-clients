copyin_build_product:
  cmd.run:
    - name: cp /git/calamari-clients*tar.gz /home/vagrant
    - user: vagrant
    - onlyif: test -e /git/calamari-clients*tar.gz
