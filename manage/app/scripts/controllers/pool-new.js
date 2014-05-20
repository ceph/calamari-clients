/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers', 'helpers/modal-helpers'], function(_, poolHelpers, modalHelpers) {
        var poolDefaults = poolHelpers.defaults();
        var PoolNewController = function($location, $log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, RequestTrackingService, $modal) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    href: '#/pool'
                }, {
                    text: 'Create',
                    active: true
                }
            ];
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = poolHelpers.makeReset($scope);
            $scope.ttReset = {
                title: 'Reset to Defaults'
            };
            $scope.ttCancel = {
                title: 'Cancel'
            };
            $scope.ttCreate = {
                title: 'Create Pool'
            };
            $scope.create = function() {
                if ($scope.poolForm.$invalid) {
                    return;
                }
                PoolService.create($scope.pool).then(function(resp) {
                    var modal;
                    if (resp.status === 202) {
                        /*jshint camelcase: false */
                        RequestTrackingService.add(resp.data.request_id);
                        modal = modalHelpers.SuccessfulRequest($modal, {
                            title: 'Create Pool Request Successful',
                            container: '.manageApp'
                        });
                        modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                            $hide();
                            $location.path('/pool');
                        });
                        return;
                    }
                    modal = modalHelpers.SuccessfulRequest($modal, {
                        title: 'Create Pool Request Completed',
                        content: resp.data,
                        container: '.manageApp'
                    });
                    modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                        $hide();
                        $location.path('/pool');
                    });
                }, function(error) {
                    $scope.error = true;
                    var modal;
                    if (error.status === 403) {
                        modal = modalHelpers.UnAuthorized($modal, {
                            container: '.manageApp'
                        });
                        modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                            $hide();
                        });
                        return;
                    }
                    modal = modalHelpers.UnexpectedError($modal, {
                        status: error.status,
                        content: error.data,
                        container: '.manageApp',
                    });
                    modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                        $hide();
                    });
                });
            };

            // Initialize Controller
            var promises = [PoolService.defaults(), CrushService.getList(), ToolService.config('mon_max_pool_pg_num'), PoolService.getList()];

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
                var poolNames = _.pluck(result.shift().value(), 'name');

                $scope.poolNames = poolNames;
                $scope.defaults = mergedDefaults;
                $scope.crushrulesets = poolHelpers.normalizeCrushRulesets(self.crushrulesets);

                $scope.pool = {
                    name: mergedDefaults.name,
                    size: mergedDefaults.size,
                    crush_ruleset: mergedDefaults.crush_ruleset,
                    pg_num: mergedDefaults.pg_num
                };
                poolHelpers.addWatches($scope);
                $scope.up = true;
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
