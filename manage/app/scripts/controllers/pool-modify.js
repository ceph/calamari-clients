/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers', 'helpers/modal-helpers', 'helpers/error-helpers'], function(_, PoolHelpers, ModalHelpers, ErrorHelpers) {

        // **PoolModifyController**
        // Responsible for editing existing Pools.
        var PoolModifyController = function($log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, $location, $routeParams, $modal, RequestTrackingService) {
            var errorHelpers = ErrorHelpers.makeFunctions($q, $log);

            // Init Breadcrumbs
            $scope.modify = false;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    href: '#/pool'
                }, {
                    text: 'Edit',
                    active: true
                }
            ];
            $scope.id = $routeParams.id;

            $scope.isUpdateAllowed = false;
            $scope.isDeleteAllowed = false;

            // re-calculate the pgnum if the replication size changes
            // only in new pool
            // Refer PoolHelpers.addWatches()
            $scope.isEdit = true;

            // **cancel**
            // Take us back to pool level.
            $scope.cancel = function() {
                $location.path('/pool');
            };

            // **reset**
            // Reset the Modified Pool back to it's previous values.
            $scope.reset = PoolHelpers.makeReset($scope, {
                pgnumReset: false
            });

            // Set up angular-strap Tooltips.
            $scope.ttBack = {
                'title': 'Back'
            };
            $scope.ttReset = {
                'title': 'Reset to Default'
            };
            $scope.ttSave = {
                'title': 'Save Changes'
            };
            $scope.ttDelete = {
                'title': 'Delete Pool'
            };

            // **remove**
            // Remove a Pool.
            // TODO merge this function with the pool.js version. Probably
            // move it to a helper.
            //
            // @param id - id of pool to remove
            $scope.remove = function(id) {
                $log.debug('deleting ' + id);
                var modal = $modal({
                    title: 'This will DELETE the \'' + $scope.pool.name + '\' Pool. Are you sure?',
                    content: 'There is no way to undo this operation. Please be sure this is what you are trying to do.',
                    template: 'views/delete-modal.html'
                });
                modal.$scope.id = id;
                modal.$scope.confirm = function() {
                    modal.$scope.$hide();
                    errorHelpers.intercept304Error(PoolService.remove(modal.$scope.id)).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id);
                            var okmodal = ModalHelpers.SuccessfulRequest($modal, {
                                title: 'Delete Request Successful'
                            });
                            okmodal.$scope.$hide = _.wrap(okmodal.$scope.$hide, function($hide) {
                                $hide();
                                $location.path('/pool');
                            });
                            return;
                        }
                        $log.error('Unexpected response from PoolService.remove', result);
                    }, ModalHelpers.makeOnError($modal({
                        show: false
                    }), function() {
                        $location.path('/pool');
                    }));
                };
            };

            // **modify**
            // Modify a pool's attributes.
            //
            // @param id - id of pool to patch
            $scope.modify = function(id) {
                $log.debug('pool ' + id + ', form is dirty ' + $scope.poolForm.$dirty);
                if ($scope.poolForm.$invalid) {
                    // Nothing to do - errors exist.
                    return;
                }
                // Read the fields we want out of the form.
                var changes = _.reduce(['name', 'size', 'pg_num', 'crush_ruleset'], function(result, key) {
                    if ($scope.poolForm[key].$dirty) {
                        result[key] = $scope.poolForm[key].$modelValue;
                    }
                    return result;
                }, {});
                $log.debug(changes);
                if (!_.isEmpty(changes)) {
                    // Send the changed fields up to the server.
                    errorHelpers.intercept304Error(PoolService.patch(id, changes)).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id);
                            var okmodal = ModalHelpers.SuccessfulRequest($modal, {
                                title: 'Modify Request Successful'
                            });
                            okmodal.$scope.$hide = _.wrap(okmodal.$scope.$hide, function($hide) {
                                $hide();
                                $location.path('/pool');
                            });
                            return;
                        }
                        $log.error('Unexpected response from PoolService.patch', result);
                    }, PoolHelpers.errorOnPoolSave($scope, $modal));
                }
            };

            var promises = [PoolService.getFull($scope.id), CrushService.getList()];

            // Set up page.
            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                $scope.pool = results[0].data;
                var headers = results[0].headers('Allow');
                $scope.isUpdateAllowed = headers && headers.indexOf('PATCH') > 0;
                $scope.isDeleteAllowed = headers && headers.indexOf('DELETE') > 0;

                $scope.defaults = angular.copy($scope.pool);
                this.crushrulesets = results[1];

                $scope.crushrulesets = PoolHelpers.normalizeCrushRulesets(this.crushrulesets);
                $scope.up = true;
                PoolHelpers.addWatches($scope);
            }.bind(this));
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', '$modal', 'RequestTrackingService', PoolModifyController];
    });
})();
