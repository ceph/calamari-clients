/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/pool-helpers'], function(_, helpers) {

        var PoolModifyController = function($log, $q, $scope, PoolService, ClusterService, CrushService, ToolService, $location, $routeParams, $modal, RequestTrackingService) {
            var self = this;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.id = $routeParams.id;
            $scope.cancel = function() {
                $location.path('/pool');
            };
            $scope.reset = helpers.makeReset($scope, {
                pgnumReset: false
            });
            var promises = [PoolService.get($scope.id), CrushService.getList(), ToolService.config('mon_max_pool_pg_num')];

            $scope.remove = function(id) {
                $log.debug('deleting ' + id);
                var modal = $modal({
                    title: 'This will DELETE the \'' + $scope.pool.name + '\' Pool. Are you sure?',
                    content: 'There is no way to undo this operation. Please be very sure this is what you want to do.',
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
                            var okmodal = $modal({
                                title: 'Delete sent successfully',
                                content: 'This may take a little while. We\'ll let you know when it\'s done.',
                                template: 'views/custom-modal.html'
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
                    });
                };
            };
            $q.all(promises).then(function(results) {
                /* jshint camelcase:false */
                var result = _.chain(results);
                $scope.pool = result.shift().value();
                $scope.defaults = _.clone($scope.pool);
                self.crushrulesets = result.shift().value();

                $scope.crushrulesets = helpers.normalizeCrushRulesets(self.crushrulesets);

                //helpers.addWatches($scope);
            });
        };
        return ['$log', '$q', '$scope', 'PoolService', 'ClusterService', 'CrushService', 'ToolService', '$location', '$routeParams', '$modal', 'RequestTrackingService', PoolModifyController];
    });
})();
