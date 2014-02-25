/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var ClusterService = function(Restangular, $location) {
        var djangoPaginationResponseExtractor = function(response /*, operation, what, url */ ) {
            if (response.count !== undefined && response.results !== undefined) {
                var newResponse = response.results;
                newResponse.pagnation = {
                    next: response.next,
                    previous: response.previous,
                    count: response.count
                };
                return newResponse;
            }
            return response;
        };
        var restangular = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setResponseExtractor(djangoPaginationResponseExtractor);
        });
        var restangularFull = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setFullResponse(true).setResponseExtractor(djangoPaginationResponseExtractor);
        });
        var Service = function() {
            this.restangular = restangular;
            this.restangularFull = restangularFull;
        };
        Service.prototype = _.extend(Service.prototype, {
            initialize: function() {
                var self = this;
                return this.getList().then(function(clusters) {
                    if (clusters.length) {
                        var cluster = _.first(clusters);
                        self.clusterId = cluster.id;
                        self.clusterModel = cluster;
                        return;
                    }
                    self.clusterId = null;
                    self.clusterModel = null;
                    $location.path('/first');
                });
            },
            getList: function() {
                return this.restangular.all('cluster').getList().then(function(clusters) {
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
            },
            clusterFull: function(id) {
                if (id === undefined) {
                    id = this.clusterId;
                }
                return this.restangularFull.one('cluster', id);
            }
        });
        var service = new Service();
        return service;
    };
    return ['Restangular', '$location', ClusterService];
});
