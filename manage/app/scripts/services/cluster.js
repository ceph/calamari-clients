/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var ClusterService = function(Restangular) {
        var restangular = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2');
        });
        var Service = function() {
            this.restangular = restangular;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                var self = this;
                return this.restangular.all('cluster').getList().then(function(clusters) {
                    var cluster = _.first(clusters);
                    self.clusterId = cluster.id;
                    return clusters;
                });
            },
            get: function(id) {
                return this.cluster(id).get().then(function(cluster) {
                    return cluster;
                });
            },
            cluster: function(id) {
                if (id === undefined) {
                    id = this.clusterId;
                }
                return this.restangular.one('cluster', id);
            }
        });
        return new Service();
    };
    return ['Restangular', ClusterService];
});
