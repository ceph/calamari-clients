/*global define*/
/*jshint camelcase: false */
define(['lodash', 'idbwrapper'], function(_, IDBStore) {
    'use strict';
    /* Bind this service as soon as App is running otherwise it doesn't get
     * invoked until the first time it's needed because of dependency injection defering.
     */
    var defaultTimer = 15000; // TODO Make this configurable
    var shortTimer = 5000; // TODO Make this configurable
    var myid = 0;
    var requestTrackingService = function($q, $log, $timeout, RequestService, growl) {
        var Service = function() {
            this.myid = myid++;
            $log.debug(this.myid + ' Creating Request Tracking Service');
            this.deferred = {};
            this.requests = new IDBStore({
                dbVersion: 1,
                storeName: 'InktankUserRequest',
                keyPath: 'id',
                autoIncrement: false,
                onStoreReady: function() {
                    $log.info('Inktank User Request Store ready!');
                }
            });
            _.bindAll(this, 'checkCompleted');
            this.timeout = $timeout(this.checkCompleted, shortTimer);
        };
        Service.prototype = _.extend(Service.prototype, {
            add: function(id) {
                var d = $q.defer();
                this.deferred[id] = d;
                this.requests.put({
                    id: id
                }, function(id) {
                    $log.debug('tracking new request ' + id);
                }, function(error) {
                    $log.error('error inserting request ' + id + ' error ', error);
                });
                $timeout.cancel(this.timeout);
                this.timeout = $timeout(this.checkCompleted, 0);
                return d.promise;
            },
            list: function() {
                return _.clone(this.requests);
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
            checkCompleted: function() {
                var countDeferred = $q.defer();
                this.requests.count(function(count) {
                    countDeferred.resolve(count);
                }, function(error) {
                    countDeferred.reject(error);
                });
                var self = this;
                countDeferred.promise.then(function(requestLen) {
                    if (requestLen === 0) {
                        $log.debug(self.myid + ' No tasks to track. sleeping ' + defaultTimer);
                        self.timeout = $timeout(self.checkCompleted, defaultTimer);
                        return;
                    }
                    $log.debug(self.myid + ' tracking ' + requestLen);
                    RequestService.getSubmitted().then(function(submittedRequests) {

                        var d = $q.defer();
                        self.requests.getAll(function(requests) {
                            d.resolve(requests);
                        }, function(error) {
                            d.reject(error);
                        });
                        d.promise.then(function(requests) {
                            _.filter(requests, function(tracked) {
                                var foundTask = _.find(submittedRequests, function(request) {
                                    // search for tracked id in submitted tasks
                                    return request.id === tracked.id;
                                });
                                if (foundTask === undefined) {
                                    // Task may be completed Verify
                                    RequestService.get(tracked.id).then(function(request) {
                                        $log.debug('task ' + tracked.id + ' is probably complete');
                                        if (request.error) {
                                            self.showError(request);
                                        } else {
                                            if (request.state === 'complete') {
                                                $log.debug('task ' + tracked.id + ' is complete');
                                                self.showNotification(request);
                                                self.requests.remove(tracked.id, function() {
                                                    $log.debug('removed task ' + tracked.id);
                                                    if (self.deferred[tracked.id]) {
                                                        self.deferred[tracked.id].resolve(tracked.id);
                                                        delete self.deferred[tracked.id];
                                                    }
                                                }, function(error) {
                                                    $log.error('Error removing id ' + tracked.id, error);
                                                    if (self.deferred[tracked.id]) {
                                                        self.deferred[tracked.id].reject(tracked.id, error);
                                                        delete self.deferred[tracked.id];
                                                    }
                                                });
                                            } else {
                                                $log.debug('task ' + tracked.id + ' is still active. Re-adding.');
                                                self.add(tracked.id, tracked.callback);
                                            }
                                        }
                                    });
                                } else {
                                    $log.debug('task ' + tracked.id + ' is still active');
                                }
                                return foundTask !== undefined;
                            });
                            $log.debug('processed ' + submittedRequests.length + ' tasks');
                            self.timeout = $timeout(self.checkCompleted, shortTimer);
                        });
                    }, function() {
                        self.timeout = $timeout(self.checkCompleted, defaultTimer);
                    });
                }, function(error) {
                    $log.error('Error Counting Request DB ', error);
                });
            }
        });
        return new Service();
    };
    var service = null;
    return function RequestTrackingProvider() {
        // This is an App Wide singleton
        this.$get = ['$q', '$log', '$timeout', 'RequestService', 'growl',
            function($q, $log, $timeout, RequestService, growl) {
                if (service === null) {
                    // This truely needs to be a singleton
                    // This *only* works because JS is single threaded
                    service = requestTrackingService($q, $log, $timeout, RequestService, growl);
                }
                return service;
            }
        ];
    };
});
