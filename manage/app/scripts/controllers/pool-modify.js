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
                    text: '管理 (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    href: '#/pool'
                }, {
                    text: '编辑',
                    active: true
                }
            ];
            $scope.id = $routeParams.id;

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
                'title': '返回'
            };
            $scope.ttReset = {
                'title': '设为默认'
            };
            $scope.ttSave = {
                'title': '保存'
            };
            $scope.ttDelete = {
                'title': '删除 Pool'
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
                    title: '确定要删除 \'' + $scope.pool.name + '\' Pool?',
                    content: '这个操作是不可撤销的，请确认要删除.',
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
                                title: '删除请求成功'
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
                                title: '修改请求成功'
                            });
                            okmodal.$scope.$hide = _.wrap(okmodal.$scope.$hide, function($hide) {
                                $hide();
                                $location.path('/pool');
                            });
                            return;
                        }
                        $log.error('Unexpected response from PoolService.patch', result);
                    }, ModalHelpers.makeOnError($modal({
                        show: false
                    }), function() {
                        $location.path('/pool');
                    }));
                }
            };

            var promises = [PoolService.get($scope.id), CrushService.getList()];

            // Set up page.
            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                $scope.pool = results[0];
                $scope.defaults = angular.copy($scope.pool);
                this.crushrulesets = results[1];

                $scope.crushrulesets = PoolHelpers.normalizeCrushRulesets(this.crushrulesets);
                $scope.up = true;
                //helpers.addWatches($scope);
            }.bind(this));
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', '$modal', 'RequestTrackingService', PoolModifyController];
    });
})();
