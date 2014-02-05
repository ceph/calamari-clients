/* global define */
(function() {
    'use strict';
    define([], function() {

        var OSDController = function($scope, ClusterService, ServerService, $location) {
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            ServerService.getList().then(function(servers) {
                $scope.servers = servers;
            });
            $scope.hostClickHandler = function(fqdn) {
                $location.path('/osd/' + fqdn);
            };
        };
        return ['$scope', 'ClusterService', 'ServerService', '$location', OSDController];
    });
})();
