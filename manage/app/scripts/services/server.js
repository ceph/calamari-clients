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
                    return server[0];
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', ServerService];
});
