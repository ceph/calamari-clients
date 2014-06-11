/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers', 'helpers/modal-helpers', 'helpers/error-helpers'], function(_, PoolHelpers, ModalHelpers, ErrorHelpers) {

        var PoolModifyController = function($log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, $location, $routeParams, $modal, RequestTrackingService) {
            var errorHelpers = ErrorHelpers.makeFunctions($q, $log);
            var self = this;
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
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = PoolHelpers.makeReset($scope, {
                pgnumReset: false
            });
            var promises = [PoolService.get($scope.id), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

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
            $scope.remove = function(id) {
                $log.debug('deleting ' + id);
                var modal = $modal({
                    title: 'This will DELETE the \'' + $scope.pool.name + '\' Pool. Are you sure?',
                    content: 'There is no way to undo this operation. Please be sure this is what you are trying to do.',
                    template: 'views/delete-modal.html'
                });
                modal.$scope.id = id;
                modal.$scope.cancel = function() {
                    modal.$scope.$hide();
                };
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

            $scope.modify = function(id) {
                $log.debug(id);
                $log.debug('form is dirty ' + $scope.poolForm.$dirty);
                if ($scope.poolForm.$invalid) {
                    return;
                }
                var changes = _.reduce(['name', 'size', 'pg_num', 'crush_ruleset'], function(result, key) {
                    if ($scope.poolForm[key].$dirty) {
                        result[key] = $scope.poolForm[key].$modelValue;
                    }
                    return result;
                }, {});
                $log.debug(changes);
                if (!_.isEmpty(changes)) {
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
                    }, ModalHelpers.makeOnError($modal({
                        show: false
                    }), function() {
                        $location.path('/pool');
                    }));
                }
            };

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                $scope.pool = result.shift().value();
                $scope.defaults = _.clone($scope.pool);
                self.crushrulesets = result.shift().value();

                $scope.crushrulesets = PoolHelpers.normalizeCrushRulesets(self.crushrulesets);
                $scope.up = true;
                //helpers.addWatches($scope);
            });
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', '$modal', 'RequestTrackingService', PoolModifyController];
    });
})();
