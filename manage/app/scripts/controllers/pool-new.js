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

        var PoolNewController = function($location, $log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, RequestTrackingService, $modal) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = helpers.makeReset($scope);
            $scope.create = function() {
                if ($scope.poolForm.$invalid) {
                    return;
                }
                PoolService.create($scope.pool).then(function(resp) {
                    console.log(resp);
                    var modal;
                    if (resp.status === 202) {
                        RequestTrackingService.add(resp.data.request_id);
                        modal = $modal({
                            title: 'Create Pool Request Submitted',
                            content: 'This may take a few seconds. We\'ll let you know when it\'s done.',
                            container: '.manageApp',
                            show: true,
                            keyboard: false,
                            template: 'views/custom-modal.html'
                        });
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                            $location.path('/pool');
                        };
                    } else {
                        modal = $modal({
                            title: 'Create Pool Request Completed',
                            content: resp.data,
                            container: '.manageApp',
                            show: true,
                            keyboard: false,
                            template: 'views/custom-modal.html'
                        });
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                            $location.path('/pool');
                        };
                    }
                }, function(error) {
                    console.log(error);
                    var data = error.data;
                    $scope.error = true;
                    if (error.status === 403) {
                        data = 'Unauthorized access to API. It looks like your authentication tokens are invalid. Please try logging out and back in again.';
                    }
                    var modal = $modal({
                        title: 'Unexpected Error',
                        content: data,
                        container: '.manageApp',
                        show: true,
                        template: 'views/custom-modal.html'
                    });
                    modal.$scope._hide = function() {
                        console.log('closing');
                        modal.$scope.$hide();
                    };
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
                            osd_count: rule.osd_count
                        };
                    });
                    return {
                        id: set.id,
                        rules: rules,
                        active_sub_rule: 0
                    };
                });
                $scope.crushrulesets = crushruleSets;

                $scope.pool = {
                    name: mergedDefaults.name,
                    size: mergedDefaults.size,
                    crush_ruleset: mergedDefaults.crush_ruleset,
                    pg_num: mergedDefaults.pg_num
                };
                helpers.addWatches($scope);
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
            'RequestTrackingService',
            '$modal',
            PoolNewController];
    });
})();
