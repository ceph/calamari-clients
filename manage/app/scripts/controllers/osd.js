/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var OSDController = function($scope, ClusterService, ServerService, $location) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            ServerService.getList().then(function(servers) {
                $scope.up = true;
                $scope.servers = _.sortBy(servers, function(server) {
                    return server.hostname;
                });
            });
            $scope.hostClickHandler = function(fqdn) {
                $location.path('/osd/server/' + fqdn);
            };
        };
        return ['$scope', 'ClusterService', 'ServerService', '$location', OSDController];
    });
})();
