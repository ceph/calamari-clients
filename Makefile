SHELL=bash
SRC := $(shell pwd)

# set these only if not set with ?=
VERSION ?= $(shell $(SRC)/get-versions.sh VERSION)
REVISION ?= $(shell $(SRC)/get-versions.sh REVISION)
RPM_REVISION ?= $(shell $(SRC)/get-versions.sh -r REVISION)
DIST ?= unstable
BPTAG ?= ""
DEBEMAIL ?= dan.mick@inktank.com
ARCH ?= x86_64

DISTNAMEVER=calamari-clients_$(VERSION)
PKGDIR=calamari-clients-$(VERSION)
TARNAME = ../$(DISTNAMEVER).tar.gz

INSTALL=/usr/bin/install

UI_BASEDIR = $(DESTDIR)/opt/calamari/webapp/content
UI_SUBDIRS = manage admin login dashboard
CONFIG_JSON = dashboard/dist/scripts/config.json

FINDCMD =find . \
        -name .git -prune \
        -o -name node_modules -prune \
        -o -name .tmp -prune \
        -o -name .sass-cache -prune \
        -o -name debian -prune \
        -o -print0

default: build

DATESTR=$(shell /bin/echo -n "built on "; date)
set_deb_version:
	DEBEMAIL=$(DEBEMAIL) dch \
		--newversion $(VERSION)-$(REVISION)$(BPTAG) \
		-D $(DIST) --force-bad-version --force-distribution "$(DATESTR)"

build: build-ui $(CONFIG_JSON)

build-ui:
	@echo "building ui"
	set -e ;\
	for d in $(UI_SUBDIRS); do \
		echo $$d; cd $$d; $(MAKE) build; cd .. ; \
	done

clean:
	for d in $(UI_SUBDIRS); do \
		echo $$d; cd $$d; $(MAKE) clean; cd .. ; \
	done

# for right now, this contains two useful things that should be set
# when running against a live cluster.  We could preinstall it in the
# package or do it in a postinstall; it has more visibility here

$(CONFIG_JSON): build-ui
	echo '{ "offline": false, "graphite-host": "/graphite" }' \
		> $(CONFIG_JSON)


# NB we do not build source packages
dpkg:
	dpkg-buildpackage -b -us -uc

install: build
	@echo "install"
	for d in $(UI_SUBDIRS); do \
		instdir=$$(basename $$d); \
		$(INSTALL) -d $(UI_BASEDIR)/$$instdir; \
		cp -rp $$d/dist/* $(UI_BASEDIR)/$$instdir; \
	done


dist:
	@echo "making dist tarball in $(TARNAME)"
	for d in $(UI_SUBDIRS); do \
		echo $$d; \
		(cd $$d;  \
		npm install --silent; \
		grunt --no-color saveRevision) \
	done
	@rm -rf $(PKGDIR)
	@$(FINDCMD) | cpio --null -p -d $(PKGDIR)
	@tar -zcf $(TARNAME) $(PKGDIR)
	@rm -rf $(PKGDIR)
	@echo "tar file made in $(TARNAME)"

.PHONY: dist clean build dpkg install
