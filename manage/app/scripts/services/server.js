/*global define*/
define(['lodash'], function(_) {
    'use strict';
    // Wraps the /api/v2/cluster/<fsid>/server API.
    var ServerService = function(ClusterService) {
        // **Constructor**
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            // **getList**
            // Return all servers this Ceph Cluster has discovered.
            getList: function() {
                return this.restangular.cluster().all('server').getList().then(function(servers) {
                    return servers;
                });
            },
            // **get**
            // Return a specific server's metadata.
            get: function(id) {
                return this.restangular.cluster().one('server', id).get().then(function(server) {
                    return server;
                });
            },
            // **getGrains**
            // Return the metadata, key value pairs associated with this specific server,
            // aka grains in Salt Stack parlance.
            // @see http://docs.saltstack.com/en/latest/topics/targeting/grains.html
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
