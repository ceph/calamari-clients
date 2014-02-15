/*global define*/
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
            add: function(id) {
                this.requests.push(id);
                $timeout.cancel(this.timeout);
                this.timeout = $timeout(this.checkCompleted, 0);
                $log.debug('tracking new request ' + id);
            },
            list: function() {
                return _.clone(this.requests);
            },
            checkCompleted: function() {
                if (this.requests.length === 0) {
                    $log.debug(this.myid + ' No tasks to track. sleeping ' + defaultTimer);
                    this.timeout = $timeout(this.checkCompleted, defaultTimer);
                    return;
                }
                $log.debug(this.myid + ' tracking ' + this.requests.length);
                var self = this;
                RequestService.getComplete().then(function(completedRequests) {
                    self.requests = _.filter(self.requests, function(id) {
                        var found = _.find(completedRequests, function(request) {
                            return request.id === id;
                        });
                        if (found !== undefined) {
                            $log.debug('task ' + id + ' is now complete');
                            if (found.error) {
                                /*jshint camelcase: false */
                                // TODO too tightly coupled use $broadcast
                                growl.addErrorMessage('ERRROR: ' + found.headline + ' - ' + found.error_message, {
                                    ttl: -1
                                });
                            } else {
                                // TODO too tightly coupled use $broadcast
                                growl.addSuccessMessage(found.headline + ' completed');
                            }
                        } else {
                           $log.debug('task ' + id + ' is still active');
                        }
                        return found === undefined;
                    });
                    $log.debug('complete ', completedRequests.length);
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
