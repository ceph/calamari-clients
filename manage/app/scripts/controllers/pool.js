/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolController = function($log, $scope, PoolService, ClusterService, $location) {
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.up = false;
            PoolService.getList().then(function(pools) {
                $scope.pools = pools;
                $scope.up=true;
            });
            $scope.create = function() {
                $location.path('/pool/new');
            };
            $scope.modify = function(id) {
                $location.path('/pool/modify/' + id);
            };
        };
        return ['$log', '$scope', 'PoolService', 'ClusterService', '$location', PoolController];
    });
})();
