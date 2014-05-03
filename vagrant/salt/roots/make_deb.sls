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
    {% if grains['os'] == 'Ubuntu' -%}
    - name: cp calamari-clients*.deb /git/builds/precise
    {% else -%}
    - name: cp calamari-clients*.deb /git/builds/wheezy
    {% endif -%}
    - cwd: /home/vagrant
    - require:
      - cmd: build_calamari_clients
