#
# spec file for package calamari-clients
#
# Copyright (c) 2014 SUSE LINUX Products GmbH, Nuernberg, Germany.
#
# All modifications and additions to the file contributed by third parties
# remain the property of their copyright owners, unless otherwise agreed
# upon. The license for this file, and modifications and additions to the
# file, is the same license as for the pristine package itself (unless the
# license for the pristine package is not an Open Source License, in which
# case the license is the MIT License). An "Open Source License" is a
# license that conforms to the Open Source Definition (Version 1.9)
# published by the Open Source Initiative.

# Please submit bugfixes or comments via http://bugs.opensuse.org/
#


# Note that the SUSE build for calamari-clients requires that someone has
# already generated a suitable tarball from the source tree by invoking
# `make suse-tarball`.  This will result in a tarball named similar to
# calamari-clients-X.Y+git.TIMESTAMP.COMMIT.tar.gz.  Don't bother with
# `make rpm`, just use build.opensuse.org with this spec file and the
# appropriate tarball.
#
# NOTE: You will have to edit the Version tag in this spec file to match
# your tarball, once you've checked them in to the build service.

Name:           calamari-clients
Version:        1.2+git.TIMESTAMP.COMMIT
Release:        0
Summary:        Calamari GUI front-end components
License:        MIT
Group:          System/Filesystems
Url:            http://ceph.com/
Source0:        %{name}-%{version}.tar.gz
# Need BuildRequires calamari-server to avoid rpmlint warning about no package
# owning /srv/www/calamari (other than that it serves no actual purpose at build
# time).
BuildRequires:  calamari-server
BuildRequires:  fdupes
Requires:       calamari-server
BuildArch:      noarch

%description
Contains the JavaScript GUI content for the Calamari frontend components
 (dashboard, login screens, administration screens)

%prep
%setup -q %{name}-%{version}

%build
# Nothing to do here, this relies on a prebuilt tarball

%install
cp -a srv %{buildroot}/
%fdupes %{buildroot}/srv/www/calamari/content

%files -n calamari-clients
%defattr(-,root,root,-)
/srv/www/calamari/content

%changelog
