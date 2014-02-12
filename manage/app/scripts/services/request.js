/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var RequestService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('request').getList().then(function(keys) {
                    return keys;
                });
            },
            get: function(id) {
                return this.restangular.cluster().one('request', id).get().then(function(key) {
                    return key[0];
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', RequestService];
});
