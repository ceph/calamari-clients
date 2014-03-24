/*global define*/
/*jshint camelcase: false */
define(['lodash'], function(_) {
    'use strict';
    /* Bind this service as soon as App is running otherwise it doesn't get
     * invoked until the first time it's needed because of dependency injection defering.
     */
    var defaultTimer = 10000; // TODO Make this configurable
    var shortTimer = 1000; // TODO Make this configurable
    var myid = 0;
    var requestTrackingService = function($log, $timeout, RequestService, growl) {
        var Service = function() {
            this.myid = myid++;
            $log.debug(this.myid + ' Creating Request Tracking Service');
            this.requests = [];
            _.bindAll(this, 'checkCompleted');
            this.timeout = $timeout(this.checkCompleted, shortTimer);
        };
        Service.prototype = _.extend(Service.prototype, {
            add: function(id, callback) {
                this.requests.push({
                    id: id,
                    callback: callback
                });
                $timeout.cancel(this.timeout);
                this.timeout = $timeout(this.checkCompleted, 0);
                $log.debug('tracking new request ' + id);
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
                if (this.requests.length === 0) {
                    $log.debug(this.myid + ' No tasks to track. sleeping ' + defaultTimer);
                    this.timeout = $timeout(this.checkCompleted, defaultTimer);
                    return;
                }
                $log.debug(this.myid + ' tracking ' + this.requests.length);
                var self = this;
                RequestService.getSubmitted().then(function(submittedRequests) {
                    self.requests = _.filter(self.requests, function(tracked) {
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
                                        if (tracked.callback) {
                                            tracked.callback.call(tracked);
                                        }
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
                    $log.debug('complete ', submittedRequests.length);
                    self.timeout = $timeout(self.checkCompleted, shortTimer);
                }, function() {
                    self.timeout = $timeout(self.checkCompleted, defaultTimer);
                });
            }
        });
        return new Service();
    };
    var service = null;
    return function RequestTrackingProvider() {
        // This is an App Wide singleton
        this.$get = ['$log', '$timeout', 'RequestService', 'growl',
            function($log, $timeout, RequestService, growl) {
                if (service === null) {
                    // This truely needs to be a singleton
                    // This *only* works because JS is single threaded
                    service = requestTrackingService($log, $timeout, RequestService, growl);
                }
                return service;
            }
        ];
    };
});
