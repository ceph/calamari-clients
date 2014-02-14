/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolModifyController = function($scope, PoolService, ClusterService, $location, $routeParams) {
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.id = $routeParams.id;
            PoolService.getList().then(function(pools) {
                $scope.pools = pools;
                $scope.pool = pools[$scope.id];
            });
            $scope.cancel = function() {
                $location.path('/pool');
            };
        };
        return ['$scope', 'PoolService', 'ClusterService', '$location', '$routeParams', PoolModifyController];
    });
})();
