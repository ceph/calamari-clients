Ceph Manager Clients
===================

This repo is for code that uses the Ceph Manager RESTFul API.

dashboard
---------

This is the *dashboard* module for the Ceph Manager. It is a JavaScript client which is designed to run in the browser and interact with the Ceph Manager RESTful API.

It is primarily written in plain JavaScript using Backbone.js and Backbone.Marionette.

config.json
-----------

Things that can be configured in config.json, and their defaults:

	'offline': false,
	'delta-osd-api': false,
	'graphite-host': '/graphite',
	'api-request-timeout-ms': 10000,
	'long-polling-interval-ms': 20000,
	'disable-network-checks': false,
	'graphite-request-delay-ms': 50,
	'enable-demo-mode': false
