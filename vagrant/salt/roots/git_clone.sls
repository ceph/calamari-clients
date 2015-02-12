{% import 'setvars' as vars with context %}
{% if vars.username == 'vagrant' %}
git_clone:
  git:
    - latest
    - user: vagrant
    - target: /home/vagrant/clients
    - name: /git/calamari-clients
{% endif %}
