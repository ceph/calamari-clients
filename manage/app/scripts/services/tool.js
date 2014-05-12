/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var ToolService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            log: function() {
                return this.restangular.cluster().one('log').get().then(function(lines) {
                    return lines;
                });
            },
            config: function(key) {
                if (key) {
                    return this.restangular.cluster().one('config').one(key).get().then(function(pair) {
                        return pair;
                    });
                }
                return this.restangular.cluster().all('config').getList().then(function(configs) {
                    return configs;
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', ToolService];
});
