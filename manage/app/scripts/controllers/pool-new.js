/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolNewController = function($scope, PoolService, ClusterService, CrushService) {
            $scope.clusterName = ClusterService.clusterModel.name;
            PoolService.defaults().then(function(defaults) {
                $scope.defaults = defaults;
            });
            CrushService.getList().then(function(crushrulesets) {
                $scope.crushrulesets = crushrulesets;
            });
        };
        return ['$scope', 'PoolService', 'ClusterService', 'CrushService', PoolNewController];
    });
})();
