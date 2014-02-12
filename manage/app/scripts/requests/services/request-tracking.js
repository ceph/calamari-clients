/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var RequestTrackingService = function() {
        var Service = function() {
            this.requests = [];
        };
        Service.prototype = _.extend(Service.prototype, {
            add: function(id) {
                this.requests.push(id);
            },
            list: function() {
                return _.clone(this.requests);
            }
        });
        var service = new Service();
        return service;
    };
    return [RequestTrackingService];
});
