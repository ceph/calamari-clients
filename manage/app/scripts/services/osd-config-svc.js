/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var OSDService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            get: function() {
                return this.restangular.cluster().one('osd_config').get().then(function(config) {
                    return config;
                });
            },
            patch: function(config) {
                return this.restangular.clusterFull().one('osd_config').patch(config);
            }
        });
        return new Service();
    };
    return ['ClusterService', OSDService];
});
