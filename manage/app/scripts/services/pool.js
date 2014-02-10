/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var PoolService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('pool').getList().then(function(pools) {
                    return pools;
                });
            },
            get: function(id) {
                return this.restangular.cluster().one('pool', id).get().then(function(pool) {
                    return pool[0];
                });
            },
            create: function(pool) {
                return this.restangular.clusterFull().all('pool').post(pool);
            },
            defaults: function() {
                return this.restangular.cluster().one('pool').get({ defaults: '' });
            }
        });
        return new Service();
    };
    return ['ClusterService', PoolService];
});
