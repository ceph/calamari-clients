# different set of steps for precise vs non-precise: do the build only
# on precise.  Also, make_ is either deb or rpm.

base:
  'G@oscodename:precise':
      - match: compound
      - full_build_deps
      - git_clone
      - make_deb
      - make_build_product

  'G@os_family:debian and not G@oscodename:precise':
      - match: compound
      - deb_repackage_deps
      - git_clone
      - copyin_build_product
      - make_deb

  'G@os_family:RedHat':
      - match: compound
      - rh_repackage_deps
      - install_lsb
      - git_clone
      - copyin_build_product
      - make_rpm
