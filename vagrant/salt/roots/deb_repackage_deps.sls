deb_repackage_deps:
  pkg.installed:
    - pkgs:
      - make
      - git
      - debhelper
      - build-essential
      - devscripts
