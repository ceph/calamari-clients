/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolController = function($scope, PoolService, $location) {
            PoolService.getList().then(function(pools) {
                $scope.pools = pools;
            });
            $scope.create = function() {
                $location.path('/pool/new');
            };
        };
        return ['$scope', 'PoolService', '$location', PoolController];
    });
})();
