Dashboard
=========

Architecture
------------

State Machine using Events

Structure
---------
App.js - startup and initialization

Application.js - state machine - transitions and view state management

Poller - separation of network code from view code

Request Tracker - tracking long running tasks and notifications

1. BackboneJS & MarionetteJS - Views, Models, Collections and Memory Management
2. RequreJS - code loading and dependency management
3. Noty - notifications and errors
4. Dynagraph - Graph plotting support

Start Up Ordering
-----------------
1. RequireJS loads dependencies for code
2. App.js loads dependencies for application
3. config.json
4. cluster config
5. target= param