ifndef VERSION
    VERSION=$(shell ./get-versions.sh VERSION)
endif
ifndef REVISION
    REVISION=$(shell ./get-versions.sh REVISION)
endif
ifndef DIST
    DIST=unstable
endif
ifndef BPTAG
    BPTAG=""
endif
ifndef DEBEMAIL
    DEBEMAIL=dan.mick@inktank.com
endif

DISTNAMEVER=calamari-clients_$(VERSION)
PKGDIR=calamari-clients-$(VERSION)
TARNAME = ../$(DISTNAMEVER).tar.gz
SRC := $(shell pwd)

INSTALL=/usr/bin/install

UI_BASEDIR = $(DESTDIR)/opt/calamari/webapp/content
UI_SUBDIRS = admin login dashboard
CONFIG_JSON = dashboard/dist/scripts/config.json

FINDCMD =find . \
        -name .git -prune \
        -o -name node_modules -prune \
        -o -name .tmp -prune \
        -o -name .sass-cache -prune \
        -o -name debian -prune \
        -o -print0

# add in just the debian files we want
DEBFILES = \
	changelog \
	compat \
	control \
	copyright \
	rules \
	source/format

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
		echo $$d; \
		(cd $$d; \
		npm install --loglevel warn && \
		bower --allow-root install && \
		grunt --no-color saveRevision && \
		grunt --no-color build; ) \
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

clean:
	for d in $(UI_SUBDIRS); do \
		echo $$d; \
		(cd $$d; \
		if [ -d node_modules ] ; then grunt --no-color clean; fi) \
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
