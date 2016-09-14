#!/bin/bash

if test $(id -u) != 0 ; then
    SUDO=sudo
fi
export LC_ALL=C # the following is vulnerable to i18n

if test -f /etc/redhat-release ; then
    $SUDO yum install -y redhat-lsb-core
fi

if which apt-get > /dev/null ; then
    $SUDO apt-get install -y lsb-release
fi

case $(lsb_release -si) in
Ubuntu|Debian|Devuan)
    $SUDO apt-get install -y git npm nodejs-legacy ruby ruby-dev
    ;;
CentOS|Fedora|SUSE*|RedHatEnterpriseServer)
    $SUDO yum install -y git npm rubygems ruby-devel
    ;;
esac

$SUDO npm install --global --force grunt-cli bower
$SUDO gem install compass
