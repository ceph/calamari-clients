#
# SUSE spec file for package calamari-clients
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
#

Name:           calamari-clients
Version:        1.2+git.TIMESTAMP.COMMIT
Release:        0
License:        MIT
Summary:        Calamari GUI front-end components
Url:            http://ceph.com/
Group:          System/Filesystems
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
