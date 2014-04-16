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
RPM_BUILDROOT_DIR=$(PKGDIR)-$(RPM_REVISION).$(ARCH)
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

build:
	if [[ $$(lsb_release -is) == "Ubuntu" ]] ; then \
		$(MAKE) build-real; \
	fi

build-real: build-ui $(CONFIG_JSON)

build-ui:
	@echo "building ui"
	set -e ;\
	for d in $(UI_SUBDIRS); do \
		echo $$d; cd $$d; $(MAKE) build; cd .. ; \
	done

# for right now, this contains two useful things that should be set
# when running against a live cluster.  We could preinstall it in the
# package or do it in a postinstall; it has more visibility here

$(CONFIG_JSON): build-ui
	echo '{ "offline": false, "graphite-host": "/graphite" }' \
		> $(CONFIG_JSON)

clean:
	if [[ $$(lsb_release -is) == "Ubuntu" ]] ; then \
		$(MAKE) clean-real; \
	fi

clean-real:
	for d in $(UI_SUBDIRS); do \
		echo $$d; cd $$d; $(MAKE) clean; cd .. ; \
	done ;
	rm -f $(BUILD_PRODUCT_TGZ)

# NB we do not build source packages
dpkg: set_deb_version
	dpkg-buildpackage -b -us -uc

BUILD_PRODUCT_TGZ=$(SRC)/../calamari-clients-build-output.tar.gz
build-product:
	if [[ $$(lsb_release -is) == "Ubuntu" ]] ; then \
		( \
		cd debian/calamari-clients; \
		tar cvfz $(BUILD_PRODUCT_TGZ) opt ; \
		) \
	fi

RPMBUILD=$(SRC)/rpmbuild
rpm:
	# assume build/install have already happened on precise
	mkdir -p $(RPMBUILD)/{SPECS,RPMS,BUILDROOT}
	cp clients.spec $(RPMBUILD)/SPECS
	( \
		mkdir -p $(RPMBUILD)/BUILDROOT/$(RPM_BUILDROOT_DIR) ; \
		cd $(RPMBUILD)/BUILDROOT/$(RPM_BUILDROOT_DIR); \
		tar xvfz $(BUILD_PRODUCT_TGZ); \
		cd $(RPMBUILD); \
		rpmbuild -bb --define "_topdir $(RPMBUILD)" --define "version $(VERSION)" --define "revision $(RPM_REVISION)" SPECS/clients.spec; \
	)

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
