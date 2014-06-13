
UI build vagrant config
=======================

This is a Vagrant+salt configuration to build the Calamari UI.

Usage
-----

::

    vagrant up
    ...
    vagrant ssh
    vagrant@precise64:~$ cd /git/calamari-clients
    vagrant@precise64:~$ make dpkg

The .deb file will come out in the parent of your git repo on the host
machine (writing to the parent folder is a dpkg-ism).

Tips
----

The build dependencies are specified in salt/roots/build_deps.sls

If it doesn't seem to have the deps after boot, run ``salt-call state.highstate``
inside the VM to look for errors.

If it seems to be taking a long time to come up, tail ``/var/log/salt/minion``
to see what's going on.

If it's fails with some godawful mysterious npm error, try running it again,
npm sometimes randomly fails.

