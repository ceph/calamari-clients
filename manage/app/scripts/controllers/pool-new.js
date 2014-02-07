/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers'], function(_, helpers) {

        var PoolNewController = function($log, $q, $scope, PoolService, ClusterService, CrushService, ToolService) {
            var pool = {
                /* jshint camelcase:false */
                name: '',
                size: 0,
                crush_ruleset: 0,
                pg_num: 100
            };
            $scope.pool = pool;
            $scope.clusterName = ClusterService.clusterModel.name;
            var self = this;
            $q.all([PoolService.defaults(), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')]).then(function(promises) {
                self.defaults = promises[0];
                self.crushrulesets = promises[1];
                self.mon_max_pool_pg_num = parseInt(promises[2].value, 10);
                /* jshint camelcase:false */
                pool = _.extend(pool, {
                    size: self.defaults.size,
                    crush_ruleset: self.defaults.crush_ruleset,
                });

                $scope.defaults = self.defaults;
                $scope.crushrulesets = self.crushrulesets;

                $scope.$watch('pool.size', function(newValue /*, oldValue*/ ) {
                    var ruleset = self.crushrulesets[pool.crush_ruleset];
                    var limits = _.reduce(ruleset.rules, function(result, rule) {
                        return {
                            min: Math.min(rule.min_size, result.min),
                            max: Math.max(rule.max_size, result.max)
                        };
                    }, {
                        min: 10000,
                        max: 1
                    });
                    if (helpers.validateMaxMin.call(pool, 'size', newValue, limits.min, limits.max)) {
                        var osdcount = self.crushrulesets[self.defaults.crush_ruleset].osd_count;
                        var pgnum = helpers.calculatePGNum(osdcount, newValue, 65536);
                        pool.pg_num = pgnum;
                    }
                });
                $scope.$watch('pool.pg_num', function(newValue /*, oldValue*/ ) {
                    helpers.validateMaxMin.call(pool, 'pg_num', newValue, 1, self.mon_max_pool_pg_num);
                });
            });
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', PoolNewController];
    });
})();
