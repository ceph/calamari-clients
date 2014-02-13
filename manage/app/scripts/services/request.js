/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var RequestService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('request').getList().then(function(requests) {
                    return requests;
                });
            },
            get: function(id) {
                return this.restangular.cluster().one('request', id).get().then(function(request) {
                    return request[0];
                });
            },
            getComplete: function() {
                return this.restangular.cluster().customGETLIST('request', {
                    state: 'complete'
                }).then(function(requests) {
                    return requests;
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', RequestService];
});
