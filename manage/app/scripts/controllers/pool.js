/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var PoolController = function($scope, Restangular) {
            var baseClusters = Restangular.setBaseUrl('/api/v2').all('cluster');
            baseClusters.getList().then(function(clusters) {
                $scope.allClusters = clusters;
                var cluster = _.first(clusters);
                $scope.clusterName = cluster.name;
                var basePools = Restangular.one('cluster', cluster.id).all('pool');
                basePools.getList().then(function(pools) {
                    $scope.pools = pools;
                });
            });
            $scope.create = function() {
                window.document.location = '#/pool/new';
            };
        };
        return ['$scope', 'Restangular', PoolController];
    });
})();
