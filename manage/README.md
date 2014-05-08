Manage
======
###General Theory of Operation

The manage application is the only module in calamari clients to modify the state of the Cluster. This is based on the Calamari 1.2 design which uses Salt Stack to manage the Ceph Cluster.

Salt favors an asynchronous communication model which uses 0mq to transmit requests and responses to it's minions.

Synchronous tasks immediately return with a 200 Status Code.
Asynchronous tasks respond with a 202 status code and a request_id in the payload.

The manage client polls the backend looking for pending tasks, if the request_id is still pending it waits 15 seconds. If the request_id is no longer pending it checks it's status and then posts a notification on the UI.


Architecture
------------

![Route Graph](documentation/routes.png)
###Organization

Manage makes extensive use of RequireJS to handle dependencies and code loading. AngularJS apps can quickly become large and hard to manage code bases without some sort of organizational principle. RequireJS provides that infrastructure.

AngularJS uses a dependency injection model for configuring components. RequireJS makes defining those services a uniform and allows the safe side loading of additional JS libraries which Angular does not need to know about on a file by file basis.

The Application is partitioned into 4 AngularJS Modules. 

1. **manageApp** - the is the core of the Manage module itself
2. **APIModule** - Angular Service APIs used to communicate with the backend. This is mostly a thin wrapper around restangular.
3. **RequestModule** - An Angular Service for request id tracking. It consists of a singleton for tracking request_ids and reporting state once completed and a controller to display the current most recent task requests.
4. **NavbarModule** - An Angular controller for top most menu bar used to navigate the overall client application. This was ported from the Dashboard.

###Manage Organization

The URL map is very flat by design. There are no nested applications within Manage. The 4 areas of manage are Cluster, OSD, Pools and Logs.

#####Controllers
Controllers are the core of an AngularJS application. Controllers are stateless and are reloaded everytime you navigate to a route in the application. Each controller is responsible for at least 1 view.

#####Routing
Manage uses a basic ngRoute configuration. We take advantage of the template loading, store some extra keys in the RouteProvider, and make use of resolve, which prevents the page from loading until a promise a been resolved.

#####Configuration Service
Manage tries to follow DRY principles and uses a basic configuration service to store and retrieve basic global values.

#####Error Service
Manage has a special Error service which is used to handle Unauthorized errors globally and display a modal telling the user to log back in.

#####Menu Service
A simple menu service is used to store the state of the submenu which allows navigation to the different submodules like OSD and Pool.

Third Party Modules
--------------------

* Restangular
* Angular Strap

Structure
---------

* Use of promises
* Two Level Routing

Start Up Issues
---------------
* Use of promises to avoid premature routing


Animation
---------
* Basic operation of ng-animate and limitations


Future Work
-----------
* Add Postal.JS to get an event bus

Open Issues
-----------
* Keeping Menus in sync with Dashboard
* Keeping Request Tracker in sync with Dashboard