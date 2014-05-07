Ceph Manager Clients
===================

This repo is for the client code that uses the Ceph Manager RESTFul API. Rather than a single large Single Page App (SPA), the code is structured as a collection of SPAs which talk to the same RESTful backend.

The concept behind building the calamari UI this way was 2 fold:

  1. Each module can be updated independently of the others; this has advantages in maintainance and allows the possibility of swapping in completely re-written components without disturbing other parts of the UI, including using different versions of component libraries.
  2. This enforces a certain level of discipline on the front and backend components, their contract is the JSON REST API. The backend should not care what the frontend is implemented in, this allows flexibility when adding more clients like Mobile Native.

The modules contained in this repo are:

dashboard
---------

This is the *dashboard* module for the Ceph Manager. It is a JavaScript client which is designed to run in the browser and interact with the Ceph Manager RESTful API.

It is primarily written in plain JavaScript using Backbone.js and Backbone.Marionette.

This is the largest mostly complex SPA thus far. It contains 3 logical parts. Dashboard, Workbench and Graphs. 

 * ***dashboard*** is a read-only view of the general cluster health.
 * ***workbench*** is a simple visualization of the OSDs and Hosts contained within a single cluster. It is currently limited to 256 OSDs at this time.
 * ***graphs*** is a viewer for various metrics collected by the underlying graphite/diamond subsystem.
 
login
-----

Login screen app. Just a simple re-director after getting a successful login response. Written in Backbone.js and Backbone.Marionette.

admin
-----

Administrative tools and tasks e.g. User Management, information about Calamari. Written using Angular 1.X. This module is currently disabled as there wasn't enough functionality for the 1.2 release to justify it's use.

The plan is to re-enable this module when we have user and role management functionality implemented in the backend. It also needs an upgrade to Angular 1.2 and Bootstrap 3.

manage
------

Management of Cluster application. Written in Angular 1.2.X.


