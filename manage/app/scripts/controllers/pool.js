/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolController = function($scope, PoolService, ClusterService, $location) {
            $scope.clusterName = ClusterService.clusterModel.name;
            PoolService.getList().then(function(pools) {
                $scope.pools = pools;
            });
            $scope.create = function() {
                $location.path('/pool/new');
            };
        };
        return ['$scope', 'PoolService', 'ClusterService', '$location', PoolController];
    });
})();
