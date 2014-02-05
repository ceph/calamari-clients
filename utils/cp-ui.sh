for unit in dashboard admin login manage
do
  rsync -av /clients.git/${unit}/dist/ /home/vagrant/calamari/webapp/content/${unit}
done
