/*global define*/
define(['lodash'], function(_) {
    'use strict';
    /* Bind this service as soon as App is running otherwise it doesn't get
     * invoked until the first time it's needed because of dependency injection defering.
     */
    var RequestTrackingService = function($log, $timeout) {
        var Service = function() {
            var self = this;
            this.requests = [];
            $timeout(function checkQueue() {
                $log.debug('tracking ' + self.requests.length);
                $timeout(checkQueue, 1000);
            }, 1000);
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
    return ['$log', '$timeout', RequestTrackingService];
});
