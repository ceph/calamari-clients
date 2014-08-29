/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers', 'helpers/modal-helpers'], function(_, PoolHelpers, ModalHelpers) {
        var poolDefaults = PoolHelpers.defaults();
        // **PoolNewController**
        // Responsible for the new pools view. A lot of the validation logic for this form is in
        // the pool-new.html markup as attributes. We angular form validation to do a lot of the heavy
        // lifting.
        //
        // A fair amount of the custom validation is done in the pool-helper file. It was extracted
        // this way to improve readability and make it easier to test.
        //
        // @see [Angular form validation tutorial](http://scotch.io/tutorials/javascript/angularjs-form-validation)
        var PoolNewController = function($location, $log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, RequestTrackingService, $modal) {
            var self = this;

            // Set up breadcrumbs.
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: '管理 (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    href: '#/pool'
                }, {
                    text: '新建',
                    active: true
                }
            ];

            // re-calculate the pgnum if the replication size changes
            // only in new pool
            // Refer PoolHelpers.addWatches()
            $scope.isEdit = false;

            // **cancel**
            // click event handler to return up a level.
            $scope.cancel = function() {
                $location.path('/pool');
            };

            // **reset**
            // click event handler to reset the form back to defaults.
            $scope.reset = PoolHelpers.makeReset($scope);

            // Angular-strap Tool Tip configuration.
            $scope.ttReset = {
                title: '设为默认'
            };
            $scope.ttCancel = {
                title: '取消'
            };
            $scope.ttCreate = {
                title: '新建 Pool'
            };

            // **create**
            // click event handler for submitting the request
            // to Calamari API.
            $scope.create = function() {
                if ($scope.poolForm.$invalid) {
                    // Do nothing if the form has invalid fields.
                    return;
                }
                // Send the pool attributes to the Server.
                PoolService.create($scope.pool).then(function(resp) {
                    var modal;
                    if (resp.status === 202) {
                        /*jshint camelcase: false */
                        RequestTrackingService.add(resp.data.request_id);
                        modal = ModalHelpers.SuccessfulRequest($modal, {
                            title: '新建 Pool 的请求成功',
                            container: '.manageApp'
                        });
                        modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                            $hide();
                            $location.path('/pool');
                        });
                        return;
                    }
                    $log.error('Unexpected response from PoolService.create', resp);
                }, PoolHelpers.errorOnPoolSave($scope, $modal));
            };

            // Initialize Controller
            var promises = [PoolService.defaults(), CrushService.getList(), ToolService.config('mon_max_pool_pg_num'), PoolService.getList()];

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                // Combine all the default values.
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
                $scope.crushrulesets = PoolHelpers.normalizeCrushRulesets(self.crushrulesets);

                $scope.pool = {
                    name: mergedDefaults.name,
                    size: mergedDefaults.size,
                    crush_ruleset: mergedDefaults.crush_ruleset,
                    pg_num: mergedDefaults.pg_num
                };
                PoolHelpers.addWatches($scope); // Add custom validation rules to form.
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
