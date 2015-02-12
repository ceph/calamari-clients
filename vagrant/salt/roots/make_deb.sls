{% import 'setvars' as vars with context %}
devscripts:
  pkg.installed

build_calamari_clients:
  cmd.run:
    - user: {{vars.username}}
    - name: make dpkg
    - cwd: {{vars.builddir}}/{{vars.gitname}}
    - require:
{%- if vars.username == 'vagrant' %}
      - git: git_clone
{%- endif %}
      - pkg: devscripts

{% if vars.username == 'vagrant' %}
copy_calamari_clients:
  cmd.run:
    - name: cp calamari-clients*.deb {{vars.pkgdest}}
    - cwd: {{vars.builddir}}
    - require:
      - cmd: build_calamari_clients
{% endif %}
