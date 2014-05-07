Ceph Manager Clients
===================

This repo is for the client code that uses the Ceph Manager RESTFul API. Rather than a single large Single Page App (SPA), the code is structured as a collection of SPAs which talk to the same RESTful backend.

The concept behind building the calamari UI this way was 2 fold:

  1. Each module can be updated independently of the others; this has advantages in maintainance and allows the possibility of swapping in completely re-written components without disturbing other parts of the UI, including using different versions of component libraries.
  2. This enforces a certain level of discipline on the front and backend components, their contract is the JSON REST API. The backend should not care what the frontend is implemented in, this allows flexibility when adding more clients like Mobile Native.

The modules contained in this repo are:

Assumptions
-----------

* **Modification Operations sent to the backend *may* be asynchronously completed**. The UI treats requests that return a request handler as pending and tracks them to completion or timeout.
  * We use indexDB to share the pending requests between the dashboard and manage modules
* **Privileged Operations require the use of Cross Site Request Forgery (CRSF) tokens**. This value is unique for the session id. Right now it is of limited protection because we don't enforce HTTPS on the cookies or the session.
* **Escape values from the server responses should be made when possible**. This is prevent inline scripting attacks.Sometimes this isn't possible, but every effort is made to avoid this kind of problem.
  * On the backbone side this requires the use of _.template and the <%- %> token replacement method.
  * On the Angular side, we automatically include angular-sanitize which does some escaping by default but mostly just **try to avoid using ng-bind-html**, preferring ng-bind wherever possible.


dashboard
---------

This is the *dashboard* module for the Ceph Manager. It is a JavaScript client which is designed to run in the browser and interact with the Ceph Manager RESTful API.

It is primarily written in plain JavaScript using Backbone.js and Backbone.Marionette.

This is the largest mostly complex SPA thus far. It contains 3 logical parts. Dashboard, Workbench and Graphs. 

 * **dashboard** is a read-only view of the general cluster health.
 * **workbench** is a simple visualization of the OSDs and Hosts contained within a single cluster. It is currently limited to 256 OSDs at this time.
 * **graphs** is a viewer for various metrics collected by the underlying graphite/diamond subsystem.
 
**This app owns all the content underneath the /dashboard URL prefix.**
 
login
-----

Login screen app. Just a simple re-director after getting a successful login response. Written in Backbone.js and Backbone.Marionette.

**This app owns all the content underneath the /login URL prefix.**

admin
-----

Administrative tools and tasks e.g. User Management, information about Calamari. Written using Angular 1.X. This module is currently disabled as there wasn't enough functionality for the Calamari 1.2 release to justify it's use.

The plan is to re-enable this module when we have user and role management functionality implemented in the backend. It also needs an upgrade to Angular 1.2 and Bootstrap 3.

**This app owns all the content underneath the /admin URL prefix.**

manage
------

Management of Cluster application. Written in Angular 1.2.X and Bootstrap 3.

The Manage application is the first module which actively tries to change the state of the cluster. It has 4 main tasks:

 * **Cluster Host Management** 
   * Adding and Viewing Hosts to the Cluster. Deletion is not currently implemented.
   * Setting common Cluster wide values.
   * Viewing Cluster configuration settings
 * **OSD Management**
   * OSD to Host relationships
   * Simple OSD management tasks (up/down/weighting)
   * Simple OSD Repair tasks
 * **Pool Management**
   * Creating, Modifying, Deleting
 * **Simple Log Viewing**

**This app owns all the content underneath the /manage URL prefix.**
