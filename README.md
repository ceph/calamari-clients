Ceph Manager Clients
===================

This repo is for the client code that uses the Ceph Manager RESTFul API. Rather than a single large Single Page App (SPA), the code is structured as a collection of SPAs which talk to the same RESTful backend.

The concept behind building the calamari UI this way was 2 fold:

  1. Each module can be updated independently of the others; this has advantages in maintainance and allows the possibility of swapping in completely re-written components without disturbing other parts of the UI, including using different versions of component libraries.
  2. This enforces a certain level of discipline on the front and backend components, their contract is the JSON REST API. The backend should not care what the frontend is implemented in, this allows flexibility when adding more clients like Mobile Native.


Assumptions
-----------

* **Modification Operations sent to the backend *may* be asynchronously completed**. The UI treats requests that return a request handler as pending and tracks them to completion or timeout.
  * We use indexDB to share the pending requests between the dashboard and manage modules
* **Privileged Operations require the use of Cross Site Request Forgery (CRSF) tokens**. This value is unique for the session id. Right now it is of limited protection because we don't enforce HTTPS on the cookies or the session.
* **Values from the server responses should be Escaped whenever possible**. This is prevent inline scripting attacks.Sometimes this isn't possible, but every effort is made to avoid this kind of problem.
  * On the backbone side this requires the use of _.template and the <%- %> token replacement method.
  * On the Angular side, we automatically include angular-sanitize which does some escaping by default but mostly just **try to avoid using ng-bind-html**, preferring ng-bind wherever possible.
* **No effort is expended to support Browsers which are not standards compliant.** The Calamari team is too small to fight with IE. The primary supported platforms are Firefox and Chrome/Chromium.
* **The majority of Calamari Client is written in JavaScript ECMA5, in strict mode, checked with jshint and formatted using JSBeautify**. While other transpiled languages could be supported, the primary developers would prefer that plain old Javascript were the primary implementation language. To support scaling this, we make extensive use of RequireJS and the JS Module pattern.
* **The project is built primarily using GruntJS and make.**
* **The JavaScript running the browser assumes it owns the inktank.* namespace.** Because this is primarily used for debugging, it could be changed in the future if this conflicts with another well known project.
* **The BackboneJS code makes extensive use of ItemView objects.** This could be componentized in the future once the Web Components standards are finalized.
* **SASS is the CSS pre-processor of Choice.** We make use of Compass, so this is a requirement.
* **Font Awesome is used liberally around the project.** While it would be possible to add other icon sets, this would require a fair amount of work.
* **I18N/L10N is partially implemented.** The dashboard module has been mostly converted to use Mozilla's L20N project. The other modules need to be modified to support this.
* **We've only built the clients on Unix like systems**. We have no support for building on Windows, though patches would be welcomed so long as they're not too intrusive.
* **We depend on nodejs to build.**

---------------------------------------------------------

How to Build Clients
============

1. install **nodejs**, a recent version like 0.10.
2. install **npm**
3. install `grunt-cli` globally via `npm` and `compass` via `gem` and make sure your system has a recent gnu compatible `make` binary
4. checkout the code `git clone git@github.com:inktankstorage/clients.git`
5. cd into `clients`
6. to build: `make dist`

This will build all the modules.

How to Rebuild a module
============================

Assuming you have already done the previous step, e.g.

    cd dashboard
    grunt build
    
This will create a directory called `dist/` which contains a deployable module which when copied into the correct location on the server will run that part of the app. Due to the tight coupling of the server to the client it is complicated to run the client code without having a server running.

---------------------------------------------------------


MODULES
=======

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
