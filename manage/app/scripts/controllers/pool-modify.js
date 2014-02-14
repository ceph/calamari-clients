/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers'], function(_, helpers) {

        var PoolModifyController = function($q, $scope, PoolService, ClusterService, CrushService, ToolService, $location, $routeParams) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.id = $routeParams.id;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = helpers.makeReset($scope, { pgnumReset: false });
            var promises = [PoolService.get($scope.id), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                $scope.pool = result.shift().value();
                $scope.defaults = _.clone($scope.pool);
                self.crushrulesets = result.shift().value();

                $scope.crushrulesets = helpers.normalizeCrushRulesets(self.crushrulesets);

                //helpers.addWatches($scope);
            });
        };
        return ['$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', PoolModifyController];
    });
})();
