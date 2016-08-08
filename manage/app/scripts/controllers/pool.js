/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers', 'helpers/error-helpers'], function(_, ModalHelpers, ErrorHelpers) {

        // **PoolController**
        // Responsible for the initial pool overview. A tabular overview of which pools have been defined
        // on this cluster. This screen lets you add, edit, and delete pools.
        var PoolController = function($q, $log, $scope, PoolService, ClusterService, UserService, $location, $modal, RequestTrackingService, $rootScope, $timeout, config) {
            if (ClusterService.clusterId === null) {
                // Redirect back to first view if no clusters are active
                // on this Calamari instance.
                $location.path(config.getFirstViewPath());
                return;
            

            // Fetch the user permissions
            // Actions needs to be disabled for read-only user
            UserService.me().then(function(user) {
                $scope.isReadOnly = user.isReadOnly;
            });

            var errorHelper = ErrorHelpers.makeFunctions($q, $log);

            // **copyPools**
            // @param **pools** metadata from the API request.
            // 
            // Return a copy of the pools metadata and the fields we are interested in.

            function copyPools(pools) {
                /* jshint camelcase: false */
                return _.reduce(pools, function(_pools, pool) {
                    _pools.push({
                        name: pool.name,
                        id: pool.id,
                        size: pool.size,
                        pg_num: pool.pg_num
                    });
                    return _pools;
                }, []);
            }

            // **updatePools**
            // @param **newValue** value to update from
            // @param **oldValue** value we current have

            function updatePools(newValue, oldValue) {
                // create a look up index from server response
                var lookup = _.reduce(newValue, function(index, pool) {
                    index[pool.id] = pool;
                    return index;
                }, {});
                // Remove all pool.ids that have been removed.
                var newList = _.filter(oldValue, function(pool) {
                    return lookup[pool.id] !== undefined;
                });
                // Update all existing values.
                newList = _.each(newList, function(pool) {
                    _.extend(pool, lookup[pool.id]);
                    delete lookup[pool.id];
                });
                // Append all the new values to the list.
                return newList.concat(_.values(lookup));
            }

            // **refreshPools**
            // Poll the API endpoint for changes in the pool metadata.

            function refreshPools() {
                $log.debug('refreshing pools');
                if ($rootScope.keyTimer) {
                    // Cancel any existing timer that may be running.
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = undefined;
                }
                // Refresh pools metadata from API.
                PoolService.getList().then(function(pools) {
                    $scope.pools = updatePools(copyPools(pools), $scope.pools);
                });
                // Re-install poll function for next cycle.
                $rootScope.keyTimer = $timeout(refreshPools, config.getPollTimeoutMs());
            }

            // Tool Tip Metadata. Used by Angular-strap directives.
            $scope.ttEdit = {
                title: 'Edit Pool'
            };
            $scope.ttDelete = {
                title: 'Delete Pool'
            };
            $scope.ttCreate = {
                title: 'Create Pool'
            };

            // Breadcrumb metadata. Used by Angular-strap directives.
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'Pools',
                    active: true
                }
            ];

            // Don't render page yet.
            $scope.up = false;

            var start = Date.now();
            PoolService.getList().then(function(pools) {
                // Pool metadata received. Process and render page.
                var elapsed = Date.now() - start;
                var timeout = elapsed < 500 ? 500 - elapsed : 0;
                $timeout(function() {
                    // Defer pool metadata processing to give animations
                    // time to run.
                    $scope.pools = copyPools(pools);
                }, timeout);
                // Install initial refreshPools polling handler.
                $rootScope.keyTimer = $timeout(refreshPools, config.getPollTimeoutMs());
                $scope.up = true;
            });

            // Add click event handlers for New and Modify Views
            // **create**
            $scope.create = function() {
                $location.path('/pool/new');
            };
            // **modify**
            // @param id - id of pool we are changing passed as a parameter.
            $scope.modify = function(id) {
                $location.path('/pool/modify/' + id);
            };

            // **remove**
            // Delete pool click event handler.
            $scope.remove = function(pool) {
                $log.debug('deleting ' + pool.id);
                // Build modal warning user about impending delete consequences.
                var modal = $modal({
                    title: 'This will DELETE the \'' + pool.name + '\' Pool. Are you sure?',
                    content: 'There is no way to undo this operation. Please be sure this is what you are trying to do.',
                    template: 'views/delete-modal.html'
                });
                modal.$scope.id = pool.id;
                modal.$scope.confirm = function() {
                    modal.$scope.$hide();
                    errorHelper.intercept304Error(PoolService.remove(modal.$scope.id)).then(function(result) {
                        if (result.status === 202) {
                            /* jshint camelcase: false */
                            RequestTrackingService.add(result.data.request_id).then(refreshPools);
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
        };
        return ['$q', '$log', '$scope', 'PoolService', 'ClusterService', 'UserService', '$location', '$modal', 'RequestTrackingService', '$rootScope', '$timeout', 'ConfigurationService', PoolController];
    });
})();
