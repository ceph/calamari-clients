/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var CrushService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('crush_rule_set').getList().then(function(pools) {
                    return pools;
                });
            },
            get: function(id) {
                return this.restangular.cluster().one('crush_rule_set', id).get().then(function(pool) {
                    return pool[0];
                });
            },
        });
        return new Service();
    };
    return ['ClusterService', CrushService];
});
