/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var ServerService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('server').getList().then(function(servers) {
                    return servers;
                });
            },
            get: function(id) {
                return this.restangular.cluster().one('server', id).get().then(function(server) {
                    return server;
                });
            },
            getGrains: function(id) {
                return this.restangular.base().one('server', id).one('grains').get().then(function(server) {
                    return server;
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', ServerService];
});
