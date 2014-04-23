/*global define*/
/*jshint camelcase: false */
define(['lodash', 'idbwrapper', 'moment'], function(_, IDBStore, momentjs) {
    'use strict';
    /* Bind this service as soon as App is running otherwise it doesn't get
     * invoked until the first time it's needed because of dependency injection defering.
     */
    var defaultTimer = 15000; // TODO Make this configurable
    var shortTimer = 5000; // TODO Make this configurable
    var myid = 0;
    var requestTrackingService = function($q, $log, $timeout, RequestService, growl, $modal) {
        var Service = function() {
            this.myid = myid++;
            $log.debug('Creating Request Tracking Service [' + this.myid + ']');
            this.deferred = {};
            var self = this;
            this.requests = new IDBStore({
                dbVersion: 2,
                storeName: 'InktankUserRequest',
                keyPath: 'id',
                autoIncrement: false,
                onStoreReady: function() {
                    $log.info('Inktank User Request Store ready!');
                    this.timeout = $timeout(this.checkWorkToDo, shortTimer);
                },
                onError: function() {
                    $log.error('Your browser may be in incognito or private browsing mode. Request Tracking Disabled');
                    $modal({
                        html: true,
                        title: '<span class="text-warning">Warning</span>',
                        content: '<p>Request Tracking depends on a feature in your browser which only works when you are not in <a href="https://support.mozilla.org/en-US/kb/private-browsing-browse-web-without-saving-info?redirectlocale=en-US&as=u&redirectslug=Private+Browsing&utm_source=inproduct" target="_blank">private</a> or incognito mode (indexdb).</p><p>The application will still function, and you may view requested tasks via the notification <i class="fa fa-bell"></i>.</p><p>Pop up event notifications however, will be disabled until you stop using private browsing.</p>',
                        show: true
                    });
                    self.add = self.remove = function() {};
                    self.getTrackedTasks = function() {
                        return [];
                    };
                    self.getSubmitted = function() {
                        return [];
                    };
                    self.getLength = function() {
                        return 0;
                    };
                }
            });
            _.bindAll(this, 'remove', 'add', 'checkWorkToDo', 'processTasks', 'getTrackedTasks', 'getLength', '_resolvePromise', '_rejectPromise');
        };
        Service.prototype = _.extend(Service.prototype, {
            add: function(id) {
                var d = $q.defer();
                if (id === null || id === undefined) {
                    // resolve empty ids immediately
                    d.resolve();
                } else {
                    // adding promise to queue
                    this.deferred[id] = d;
                    var self = this;
                    this.requests.put({
                        id: id,
                        timestamp: Date.now()
                    }, function(id) {
                        $log.debug('tracking new request ' + id);
                    }, function(error) {
                        $log.error('error inserting request ' + id + ' error ', error);
                        self._rejectPromise(id);
                    });
                    $timeout.cancel(this.timeout);
                    this.timeout = $timeout(this.checkWorkToDo, 0);
                }
                return d.promise;
            },
            showError: function(request) {
                // TODO too tightly coupled use $broadcast
                growl.addErrorMessage('ERRROR: ' + request.headline + ' - ' + request.error_message, {
                    ttl: -1
                });
            },
            showNotification: function(request) {
                // TODO too tightly coupled use $broadcast
                growl.addSuccessMessage(request.headline + ' completed');
            },
            getLength: function() {
                var d = $q.defer();
                this.requests.count(d.resolve, d.reject);
                return d.promise;
            },
            getTrackedTasks: function() {
                var d = $q.defer();
                this.requests.getAll(d.resolve, d.reject);
                return d.promise;
            },
            _resolvePromise: function(ttID) {
                if (this.deferred[ttID]) {
                    this.deferred[ttID].resolve(ttID);
                    delete this.deferred[ttID];
                }
            },
            _rejectPromise: function(ttID, error) {
                if (this.deferred[ttID]) {
                    this.deferred[ttID].reject(ttID, error);
                    delete this.deferred[ttID];
                }
            },
            remove: function(ttID) {
                var d = $q.defer();
                this.requests.remove(ttID, d.resolve, d.reject);
                var self = this;
                d.promise.then(function() {
                    $log.debug('Removed task id ' + ttID);
                    self._resolvePromise(ttID);
                }, function(error) {
                    $log.error('Error removing task id ' + ttID, error);
                    self._rejectPromise(ttID, error);
                });
                return d.promise;
            },
            processTasks: function(runningTasks, trackedTasks) {
                _.each(trackedTasks, function(trackedTask) {
                    var ttID = trackedTask.id;
                    var foundTask = _.find(runningTasks, function(runningTask) {
                        // search for tracked id in submitted tasks
                        return runningTask.id === ttID;
                    });
                    if (foundTask === undefined) {
                        // Task ID No Longer in Submitted List
                        var self = this;
                        RequestService.get(ttID).then(function(request) {
                            $log.debug('Checking task ' + ttID);
                            if (request.error) {
                                self.showError(request);
                                self.remove(ttID);
                            } else {
                                if (request.state === 'complete') {
                                    $log.debug('Task ' + ttID + ' is complete');
                                    self.showNotification(request);
                                    self.remove(ttID);
                                } else {
                                    $log.debug('task ' + ttID + ' is still active.');
                                    if (trackedTask.timestamp) {
                                        var timestamp = momentjs(trackedTask.timestamp);
                                        var now = momentjs();
                                        if (now.diff(timestamp, 'days') >= 1) {
                                            $log.warn('task ' + ttID + ' is older than 24 hours. Reaping old task.');
                                            self.remove(ttID);
                                        }
                                    }
                                }
                            }
                        }, function(resp) {
                            $log.debug('Error ' + resp.status + ' checking task ' + ttID, resp);
                            if (resp.status === 404) {
                                $log.warn('Task ' + ttID + ' NOT FOUND');
                                self.remove(ttID);
                            }
                        });
                    } else {
                        $log.debug('Task ' + ttID + ' is still executing');
                    }
                }, this);
                $log.debug('Server has ' + runningTasks.length + ' running tasks');
                this.timeout = $timeout(this.checkWorkToDo, shortTimer);
            },
            checkWorkToDo: function() {
                var self = this;
                this.getLength().then(function doWork(requestLen) {
                    if (requestLen === 0) {
                        $log.debug('[' + self.myid + ']' + ' No tasks to track. sleeping ' + defaultTimer);
                        self.timeout = $timeout(self.checkWorkToDo, defaultTimer);
                        return;
                    }
                    $log.debug('[' + self.myid + '] tracking ' + requestLen + ' tasks');
                    RequestService.getSubmitted().then(function(runningTasks) {
                        self.getTrackedTasks().then(_.partial(self.processTasks, runningTasks), function(error) {
                            $log.error('Unexpected DB error getting tracked task list ', error);
                        });
                    }, function(error) {
                        $log.error(error);
                        self.timeout = $timeout(self.checkWorkToDo, defaultTimer);
                    });
                }, function(error) {
                    $log.error('Error Counting Request DB ', error);
                    self.timeout = $timeout(self.checkWorkToDo, defaultTimer);
                });
            }
        });
        return new Service();
    };
    var service = null;
    return function RequestTrackingProvider() {
        // This is an App Wide singleton
        this.$get = ['$q', '$log', '$timeout', 'RequestService', 'growl', '$modal',
            function($q, $log, $timeout, RequestService, growl, $modal) {
                if (service === null) {
                    // This truely needs to be a singleton
                    // This *only* works because JS is single threaded
                    service = requestTrackingService($q, $log, $timeout, RequestService, growl, $modal);
                }
                return service;
            }
        ];
    };
});
