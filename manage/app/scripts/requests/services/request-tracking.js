/*global define*/
define(['lodash'], function(_) {
    'use strict';
    /* Bind this service as soon as App is running otherwise it doesn't get
     * invoked until the first time it's needed because of dependency injection defering.
     */
    var RequestTrackingService = function($log, $timeout, RequestService) {
        var Service = function() {
            var self = this;
            this.requests = [];
            $timeout(function checkQueue() {
                if (self.requests.length === 0) {
                    $log.debug('No tasks to track.');
                    return;
                }
                $log.debug('tracking ' + self.requests.length);
                self.complete = RequestService.getComplete().then(function(completedRequests) {
                    self.requests = _.filter(self.requests, function(id) {
                        var found = _.find(completedRequests, function(request) {
                            return request.id === id;
                        });
                        $log.debug('task ' + id + ' is now complete');
                        return found === undefined;
                    });
                    $log.debug('complete ', completedRequests.length);
                });
                $timeout(checkQueue, 10000);
            }, 10000);
        };
        Service.prototype = _.extend(Service.prototype, {
            add: function(id) {
                this.requests.push(id);
                $log.debug('new id ' + id);
            },
            list: function() {
                return _.clone(this.requests);
            }
        });
        var service = new Service();
        return service;
    };
    return ['$log', '$timeout', 'RequestService', RequestTrackingService];
});
