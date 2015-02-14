{% import 'setvars' as vars with context %}

copyin_build_product:
  cmd.run:
    - name: cp {{vars.pkgdest}}/calamari-clients*tar.gz {{vars.builddir}}/{{vars.gitname}}
    - user: {{vars.username}}
