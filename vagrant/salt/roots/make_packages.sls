build-repo:
  cmd.run:
    - name: make dpkg
    - cwd: /home/vagrant/clients/
    - require:
      - git: /git/clients

{% for path in ('calamari-clients_*.deb',) %}

cp-artifacts-to-share {{ path }}:
  cmd.run:
    - name: cp {{ path }} /git/
    - cwd: /home/vagrant/

{% endfor %}
