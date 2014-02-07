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

        var PoolNewController = function($location, $log, $q, $scope, PoolService, ClusterService, CrushService, ToolService) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = function() {
                $scope.name = '';
                $scope.size = this.defaults.size;
                $scope.crush_ruleset = this.defaults.crush_ruleset;
                var osdcount = this.crushrulesets[this.defaults.crush_ruleset].osd_count;
                $scope.pg_num = helpers.calculatePGNum(osdcount, $scope.size, this.mon_max_pool_pg_num);
            };

            var promises = [PoolService.defaults(), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                self.defaults = result.shift().value();
                self.crushrulesets = result.shift().value();
                self.mon_max_pool_pg_num = parseInt(result.shift().value().value, 10);
                var pool = _.extend(poolDefaults, {
                    size: self.defaults.size,
                    crush_ruleset: self.defaults.crush_ruleset,
                });

                $scope.defaults = self.defaults;
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

                $scope.name = pool.name;
                $scope.size = pool.size;
                $scope.crush_ruleset = pool.crush_ruleset;
                $scope.pg_num = pool.pg_num;


                $scope.$watch('size', function(newValue /*, oldValue*/ ) {
                    var ruleset = crushruleSets[$scope.crush_ruleset];
                    var limits = _.reduce(ruleset.rules, function(result, rule) {
                        var active_rule = result.active_rule;
                        if (newValue >= rule.min_size && newValue <= rule.max_size) {
                            active_rule = rule.id;
                        }
                        return {
                            min_size: Math.min(rule.min_size, result.min_size),
                            max_size: Math.max(rule.max_size, result.max_size),
                            active_rule: active_rule
                        };
                    }, {
                        min_size: self.mon_max_pool_pg_num,
                        max_size: 1,
                        active_rule: 0
                    });
                    $scope.limits = limits;
                    if (helpers.validateMaxMin.call($scope, 'size', newValue, limits.min_size, limits.max_size)) {
                        var osdcount = self.crushrulesets[$scope.crush_ruleset].rules[limits.active_rule].osd_count;
                        var pgnum = helpers.calculatePGNum(osdcount, newValue, self.mon_max_pool_pg_num);
                        $scope.pg_num = pgnum;
                        $scope.crushrulesets[$scope.crush_ruleset].active_sub_rule = limits.active_rule;
                    }
                });
                $scope.$watch('pg_num', function(newValue /*, oldValue*/ ) {
                    helpers.validateMaxMin.call($scope, 'pg_num', newValue, 1, self.mon_max_pool_pg_num);
                });
                $scope.$watch('crush_ruleset', function(newValue, oldValue) {
                    $scope.size = 2;
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
