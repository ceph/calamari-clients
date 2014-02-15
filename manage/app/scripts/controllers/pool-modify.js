/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers', 'helpers/modal-helpers'], function(_, poolHelpers, modalHelpers) {

        var PoolModifyController = function($log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, $location, $routeParams, $modal, RequestTrackingService) {
            var self = this;
            $scope.modify = false;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.id = $routeParams.id;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = poolHelpers.makeReset($scope, {
                pgnumReset: false
            });
            var promises = [PoolService.get($scope.id), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

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
                    PoolService.remove(modal.$scope.id).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id);
                            var okmodal = modalHelpers.SuccessfulRequest($modal, {
                                title: 'Delete Request Successful'
                            });
                            okmodal.$scope._hide = function() {
                                okmodal.$scope.$hide();
                                $location.path('/pool');
                            };
                            return;
                        }
                        var umodal = $modal({
                            title: 'Unexpected Response from Server (' + result.status + ')',
                            content: 'We got an unexpected reponse code while deleting this pool.',
                            template: 'views/custom-modal.html'
                        });
                        umodal.$scope._hide = function() {
                            umodal.$scope.$hide();
                            $location.path('/pool');
                        };
                    }, function(result) {
                        $log.error(result);
                        var errModal;
                        if (result.status === 403) {
                            errModal = modalHelpers.UnAuthorized($modal, {
                                container: '.manageApp'
                            });
                            errModal.$scope._hide = function() {
                                errModal.$scope.$hide();
                                $location.path('/pool');
                            };
                            return;
                        }
                        errModal = $modal({
                            title: 'Unexpected Response from Server (' + result.status + ')',
                            content: 'We got an unexpected error code while deleting this pool.',
                            template: 'views/custom-modal.html'
                        });
                        errModal.$scope._hide = function() {
                            errModal.$scope.$hide();
                            $location.path('/pool');
                        };
                    });
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
                    PoolService.patch(id, changes).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id);
                            var okmodal = modalHelpers.SuccessfulRequest($modal, {
                                title: 'Modify Request Successful'
                            });
                            okmodal.$scope._hide = function() {
                                okmodal.$scope.$hide();
                                $location.path('/pool');
                            };
                        }
                    }, function(result) {
                        $log.error(result);
                        var errModal = $modal({
                            title: 'Unexpected Response from Server (' + result.status + ')',
                            content: 'We got an unexpected error code while deleting this pool.',
                            template: 'views/custom-modal.html'
                        });
                        errModal.$scope._hide = function() {
                            errModal.$scope.$hide();
                            $location.path('/pool');
                        };
                    });
                }
            };

            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                $scope.pool = result.shift().value();
                $scope.defaults = _.clone($scope.pool);
                self.crushrulesets = result.shift().value();

                $scope.crushrulesets = poolHelpers.normalizeCrushRulesets(self.crushrulesets);
                //helpers.addWatches($scope);
            });
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', '$modal', 'RequestTrackingService', PoolModifyController];
    });
})();
