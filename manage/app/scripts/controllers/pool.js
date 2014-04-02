/* global define */
(function() {
    'use strict';
    define(['helpers/modal-helpers'], function(modalHelpers) {

        var PoolController = function($log, $scope, PoolService, ClusterService, $location, $modal, RequestTrackingService, $rootScope, $timeout) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }

            function refreshPools() {
                if ($rootScope.keyTimer) {
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = undefined;
                }
                PoolService.getList().then(function(pools) {
                    $scope.pools = pools;
                });
                $rootScope.keyTimer = $timeout(refreshPools, 20000);
            }
            $scope.ttEdit = {
                title: 'Edit Pool'
            };
            $scope.ttDelete = {
                title: 'Delete Pool'
            };
            $scope.ttCreate = {
                title: 'Create Pool'
            };
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    active: true
                }
            ];
            $scope.up = false;
            PoolService.getList().then(function(pools) {
                $scope.pools = pools;
                $scope.up = true;
                $rootScope.keyTimer = $timeout(refreshPools, 20000);
            });
            $scope.create = function() {
                $location.path('/pool/new');
            };
            $scope.modify = function(id) {
                $location.path('/pool/modify/' + id);
            };

            $scope.remove = function(pool) {
                $log.debug('deleting ' + pool.id);
                var modal = $modal({
                    title: 'This will DELETE the \'' + pool.name + '\' Pool. Are you sure?',
                    content: 'There is no way to undo this operation. Please be sure this is what you are trying to do.',
                    template: 'views/delete-modal.html'
                });
                modal.$scope.id = pool.id;
                modal.$scope.cancel = function() {
                    modal.$scope.$hide();
                };
                modal.$scope.confirm = function() {
                    modal.$scope.$hide();
                    PoolService.remove(modal.$scope.id).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id).then(refreshPools);
                            var okmodal = modalHelpers.SuccessfulRequest($modal, {
                                title: 'Delete Request Successful'
                            });
                            okmodal.$scope._hide = function() {
                                okmodal.$scope.$hide();
                                $location.path('/pool');
                            };
                            return;
                        }
                        var umodal = modalHelpers.SuccessfulRequest($modal, {
                            title: 'Delete Pool Request Completed',
                            content: result.data
                        });
                        umodal.$scope._hide = function() {
                            umodal.$scope.$hide();
                            $location.path('/pool');
                        };
                    }, function(error) {
                        $log.error(error);
                        var errModal;
                        if (error.status === 403) {
                            errModal = modalHelpers.UnAuthorized($modal, {});
                            errModal.$scope._hide = function() {
                                errModal.$scope.$hide();
                                $location.path('/pool');
                            };
                            return;
                        }
                        errModal = modalHelpers.UnexpectedError($modal, {
                            status: error.status,
                            content: error.data
                        });
                        errModal.$scope._hide = function() {
                            modal.$scope.$hide();
                            $location.path('/pool');
                        };
                    });
                };
            };
        };
        return ['$log', '$scope', 'PoolService', 'ClusterService', '$location', '$modal', 'RequestTrackingService', '$rootScope', '$timeout', PoolController];
    });
})();
