/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers'], function(_, helpers) {
        var poolDefaults = {
            /* jshint camelcase:false */
            name: '',
            size: 2,
            crush_ruleset: 0,
            pg_num: 100
        };

        function getActiveRule(ruleset, maxPoolPgNum, size) {
            /* jshint camelcase: false */
            return _.reduce(ruleset.rules, function(result, rule) {
                var active_rule = result.active_rule;
                var osd_count = result.osd_count;
                if (size >= rule.min_size && size <= rule.max_size) {
                    active_rule = rule.id;
                    osd_count = rule.osd_count;
                }
                return {
                    min_size: Math.min(rule.min_size, result.min_size),
                    max_size: Math.max(rule.max_size, result.max_size),
                    active_rule: active_rule,
                    osd_count: osd_count
                };
            }, {
                min_size: maxPoolPgNum,
                max_size: 1,
                active_rule: 0,
                osd_count: 0
            });
        }

        var PoolNewController = function($location, $log, $q, $scope, PoolService, ClusterService, CrushService, ToolService) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = function() {
                var defaults = this.defaults;
                $scope.name = '';
                $scope.size = defaults.size;
                $scope.crush_ruleset = defaults.crush_ruleset;
                var ruleset = this.crushrulesets[defaults.crush_ruleset];
                var limits = getActiveRule(ruleset, defaults.mon_max_pool_pg_num, $scope.size);
                var pgnum = helpers.calculatePGNum(limits.osd_count, $scope.size, defaults.mon_max_pool_pg_num);
                if ($scope.pg_num !== pgnum) {
                    // Only reset pg num if it's different from calculated default
                    // This catches where size isn't change but pg has been
                    $scope.pg_num = pgnum;
                }
            };
            $scope.create = function() {
                var pool = {
                    name: $scope.name,
                    size: $scope.size,
                    pg_num: $scope.pg_num,
                    crush_ruleset: $scope.crush_ruleset
                };
                PoolService.create(pool).then(function(resp) {
                    console.log(resp);
                }, function(error) {
                    console.log(error);
                });
            };

            // Initialize Controller
            var promises = [PoolService.defaults(), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                var cephDefaults = result.shift().value();
                self.crushrulesets = result.shift().value();
                var mergedDefaults = _.extend(poolDefaults, {
                    size: cephDefaults.size,
                    crush_ruleset: cephDefaults.crush_ruleset,
                    mon_max_pool_pg_num: parseInt(result.shift().value().value, 10)
                });

                $scope.defaults = mergedDefaults;
                $scope.crushraw = self.crushrulesets;
                var crushruleSets = _.map(self.crushrulesets, function(set) {
                    var rules = _.map(set.rules, function(rule, index) {
                        return {
                            id: index,
                            name: rule.name,
                            min_size: rule.min_size,
                            max_size: rule.max_size,
                            osd_count: set.osd_count
                        };
                    });
                    return {
                        id: set.id,
                        rules: rules,
                        active_sub_rule: 0
                    };
                });
                $scope.crushrulesets = crushruleSets;

                $scope.name = mergedDefaults.name;
                $scope.size = mergedDefaults.size;
                $scope.crush_ruleset = mergedDefaults.crush_ruleset;
                $scope.pg_num = mergedDefaults.pg_num;

                $scope.$watch('size', function(newValue /*, oldValue*/ ) {
                    var ruleset = crushruleSets[$scope.crush_ruleset];
                    var limits = getActiveRule(ruleset, self.mon_max_pool_pg_num, newValue);
                    $scope.limits = limits;
                    if (helpers.validateMaxMin.call($scope, 'size', newValue, limits.min_size, limits.max_size)) {
                        $scope.pg_num = helpers.calculatePGNum(limits.osd_count, newValue, self.mon_max_pool_pg_num);
                        $scope.crushrulesets[$scope.crush_ruleset].active_sub_rule = limits.active_rule;
                    }
                });
                $scope.$watch('pg_num', function(newValue /*, oldValue*/ ) {
                    helpers.validateMaxMin.call($scope, 'pg_num', newValue, 1, self.mon_max_pool_pg_num);
                });
                $scope.$watch('crush_ruleset', function(newValue, oldValue) {
                    $scope.size = mergedDefaults.size;
                    crushruleSets[newValue].active_sub_rule = 0;
                    crushruleSets[oldValue].active_sub_rule = 0;
                });
            });
        };
        return [
            '$location',
            '$log',
            '$q',
            '$scope',
            'PoolService',
            'ClusterService',
            'CrushService',
            'ToolService',
            PoolNewController];
    });
})();
