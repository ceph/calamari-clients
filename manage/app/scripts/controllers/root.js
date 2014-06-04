/* global define */
(function() {
    'use strict';
    var osdConfigKeys = [
            'noin',
            'noout',
            'noup',
            'nodown',
            'pause',
            'noscrub',
            'nodeep-scrub',
            'nobackfill',
            'norecover'
    ];
    var SPINNER_ICON = '<i class="fa fa-fw fa-lg fa-spinner fa-spin"></i>';
    var CHECK_CIRCLE_ICON = '<i class="fa fa-fw fa-lg fa-check-circle-o"></i>';

    define(['lodash', 'helpers/server-helpers', 'helpers/cluster-settings-helpers', 'helpers/cluster-response-helpers', 'helpers/modal-helpers'], function(_, serverHelpers, clusterSettingsHelpers, responseHelpers, modalHelpers) {


        // root.js is the default view you load when accessing the manage module.
        // For usability reasons, product management requested we combine three functions into the
        // same view. This can make maintaining a single controller more complex
        // and is probably an ideal use case for a nested view router like Angular-ui-router.
        //
        // To keep things somewhat manageable, the 3 separate functions were split into 3 helpers
        // that have their runtime dependencies injected when we initialize the controller
        // by using closures and having the helpers return functions.
        //
        var RootController = function($q, $log, $timeout, $rootScope, $location, $scope, KeyService, ClusterService, ToolService, ServerService, $modal, OSDConfigService, RequestTrackingService, config) {

            // If the cluster hasn't been initialized - redirect to first view.
            // TODO there's probably a way to get rid of this boilerplate by listening to change route
            // events in the $rootscope.
            if (ClusterService.id === null) {
                $location.path(config.getFirstViewPath());
                return;
            }

            // We use this for the bootstrap breadcrumb ui element.
            $scope.clusterName = ClusterService.clusterModel.name;

            // Inject dependencies into server helper.
            var server = serverHelpers.makeFunctions($q, $scope, $rootScope, $log, $timeout, ServerService, KeyService, $modal);

            // Add handlers to $scope from server heper
            $scope.acceptMinion = server.acceptMinion;
            $scope.detailView = function(id) {
                var modal = $modal({
                    title: id,
                    template: 'views/detail-grains-modal.html',
                    show: true
                });
                server.detailView(id).then(function(pairs) {
                    modal.$scope.pairs = pairs;
                });
            };

            // **refreshKeys**
            // Used to refresh /api/v2/keys list at regular intervals.
            function refreshKeys() {
                $log.debug('refreshing keys');
                KeyService.getList().then(server.processMinionChanges).then(function(all) {
                    // List of accepted minions.
                    $scope.cols = all.accepted;
                    // List of unaccepted minions.
                    $scope.pcols = all.pre;
                    // Boolean flag to hide the unaccepted minions if the list is empty.
                    $scope.hidePre = all.hidePre;
                });
                // Re-install poller $timeout process into $rootScope so we can clean it
                // up in a single place as we switch routes.
                $rootScope.keyTimer = $timeout(refreshKeys, config.getPollTimeoutMs());
            }

            // **approveAll**
            // Approve all click event handler.
            function approveAll() {
                var minions = _.flatten($scope.pcols);
                // Disable the approve all button until we are done or an error occurs.
                $scope.approveAllDisabled = true;
                // Change the minions UI elements to have spinners while we wait for approval.
                minions = _.map(minions, function(minion) {
                    minion.label = SPINNER_ICON;
                    minion.disabled = true;
                    return minion.id;
                });
                var start = Date.now();
                // Send the accept request to Calamari API.
                KeyService.accept(minions).then(function( /*resp*/ ) {
                    var elapsed = Date.now() - start;
                    var timeout = elapsed < 1000 ? 1000 - elapsed : 0;
                    // Let the spinners run for at 1 second
                    $timeout(function() {
                        minions = _.each(_.flatten($scope.pcols), function(minion) {
                            // Change the label to a tick mark.
                            minion.label = CHECK_CIRCLE_ICON;
                        });
                    }, timeout);
                    // We don't remove them because server.processMinionChanges will
                    // automatically update the UI and remove them the next
                    // time it runs.
                }, modalHelpers.makeOnError($modal({
                    show: false,
                    html: true,
                    template: 'views/custom-modal.html',
                    backdrop: 'static'
                })));
            }

            $scope.approveAll = approveAll;

            // Initialize the bootstrap breadcrumb UI.
            var response = responseHelpers.makeFunctions($q, $timeout, osdConfigKeys);
            var breadcrumbs = response.makeBreadcrumbs($scope.clusterName);
            $scope.breadcrumbs = breadcrumbs.servers;

            // Set up Cluster Settings Sub-View
            // Inject dependencies into ClusterSettingsHelper.
            clusterSettingsHelpers.makeFunctions($log, $scope, $timeout, $q, breadcrumbs, OSDConfigService, $modal, osdConfigKeys, RequestTrackingService).initialize().then(function(cluster) {
                $scope.helpInfo = cluster.helpInfo;
                $scope.reset = cluster.reset;
                $scope.updateSettings = cluster.updateSettings;
            });

            var promises = [KeyService.getList(), ToolService.config(), OSDConfigService.get()];
            // Bootstrap the view after we the above API calls complete.
            var start = Date.now();
            $q.all(promises).then(function(results) {
                // Install the refreshKeys polling function.
                $rootScope.keyTimer = $timeout(refreshKeys, config.getPollTimeoutMs());

                // Show the UI now.
                $scope.up = true;
                var elapsed = Date.now() - start;

                // Make the UI wait for at least 600ms to get a pleasing fade
                // in effect for the cluster hosts. It becomes visible if you have
                // a fast network or the responses are coming from cache.
                // We do no want to delay the UI longer than this, otherwise
                // it will be perceived as slow.
                var timeout = elapsed < 600 ? 600 - elapsed : 0;

                // By default don't show unaccepted hosts.
                $scope.hidePre = true;

                // Initialize the $scope data structures.
                $timeout(function() {
                    // Sort minions into buckets, unaccepted and accepted. Ignore blocked.
                    var minions = _.reduce(results[0], function(accumulator, minion) {
                        if (minion.status === 'pre') {
                            accumulator.pre.push(minion);
                        } else {
                            accumulator.accept.push(minion);
                        }
                        return accumulator;
                    }, {
                        accept: [],
                        pre: []
                    });
                    // Add them to their respective UI lists.
                    $scope.pcols = response.bucketMinions(minions.pre);
                    $scope.cols = response.bucketMinions(minions.accept);
                    $scope.hidePre = _.flatten(minions.pre).length === 0;
                }, timeout);
                // Initialize the browser config UI data.
                response.processConfigs(results[1]).then(function(configs) {
                    $scope.configs = configs;
                });
                // Initialize the Cluster Wide Settings Config Data.
                response.osdConfigsInit(results[2]).then(function(osdConfigs) {
                    $scope.osdconfigs = osdConfigs;
                    $scope.osdconfigsdefaults = angular.copy(osdConfigs);
                });
            });
        };
        return ['$q', '$log', '$timeout', '$rootScope', '$location', '$scope', 'KeyService', 'ClusterService', 'ToolService', 'ServerService', '$modal', 'OSDConfigService', 'RequestTrackingService', 'ConfigurationService', RootController];
    });
})();
