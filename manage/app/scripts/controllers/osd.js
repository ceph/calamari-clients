/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var OSDController = function($scope, Restangular, $location) {
            var baseClusters = Restangular.setBaseUrl('/api/v2').all('cluster');
            baseClusters.getList().then(function(clusters) {
                $scope.allClusters = clusters;
                var cluster = _.first(clusters);
                $scope.clusterName = cluster.name;
                var basePools = Restangular.one('cluster', cluster.id).all('server');
                basePools.getList().then(function(servers) {
                    $scope.servers = servers;
                });
            });
            $scope.hostClickHandler = function(fqdn) {
                $location.path('/osd/' + fqdn);
            };
        };
        return ['$scope', 'Restangular', '$location', OSDController];
    });
})();
