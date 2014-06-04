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

    define(['lodash', 'helpers/server-helpers', 'helpers/cluster-settings-helpers', 'helpers/cluster-response-helpers', 'helpers/modal-helpers'], function(_, ServerHelpers, ClusterSettingsHelpers, ResponseHelpers, ModalHelpers) {


        var RootController = function($q, $log, $timeout, $rootScope, $location, $scope, KeyService, ClusterService, ToolService, ServerService, $modal, OSDConfigService, RequestTrackingService, config) {
            if (ClusterService.id === null) {
                $location.path(config.getFirstViewPath());
                return;
            }

            $scope.clusterName = ClusterService.clusterModel.name;

            // Inject dependencies into server helper.
            var serverHelpers = ServerHelpers.makeFunctions($q, $scope, $rootScope, $log, $timeout, ServerService, KeyService, $modal);

            // Add handlers to $scope from server heper
            $scope.acceptMinion = serverHelpers.acceptMinion;
            $scope.detailView = function(id) {
                var modal = $modal({
                    title: id,
                    template: 'views/detail-grains-modal.html',
                    show: true
                });
                serverHelpers.detailView(id).then(function(pairs) {
                    modal.$scope.pairs = pairs;
                });
            };

            function refreshKeys() {
                $log.debug('refreshing keys');
                KeyService.getList().then(serverHelpers.processMinionChanges).then(function(all) {
                    // List of accepted minions.
                    $scope.cols = all.accepted;
                    $scope.pcols = all.pre;
                    $scope.hidePre = all.hidePre;
                });
                $rootScope.keyTimer = $timeout(refreshKeys, config.getPollTimeoutMs());
            }

            function approveAll() {
                var minions = _.flatten($scope.pcols);
                $scope.approveAllDisabled = true;
                minions = _.map(minions, function(minion) {
                    minion.label = SPINNER_ICON;
                    minion.disabled = true;
                    return minion.id;
                });
                var start = Date.now();
                KeyService.accept(minions).then(function( /*resp*/ ) {
                    var elapsed = Date.now() - start;
                    var timeout = elapsed < 1000 ? 1000 - elapsed : 0;
                    $timeout(function() {
                        minions = _.each(_.flatten($scope.pcols), function(minion) {
                            minion.label = CHECK_CIRCLE_ICON;
                        });
                    }, timeout);
                    // We don't remove them because serverHelpers.processMinionChanges will
                    // automatically update the UI and remove them the next
                    // time it runs.
                }, ModalHelpers.makeOnError($modal({
                    show: false,
                    html: true,
                    template: 'views/custom-modal.html',
                    backdrop: 'static'
                })));
            }

            $scope.approveAll = approveAll;

            // Initialize the bootstrap breadcrumb UI.
            var responseHelpers = ResponseHelpers.makeFunctions($q, $timeout, osdConfigKeys);
            var breadcrumbs = responseHelpers.makeBreadcrumbs($scope.clusterName);
            $scope.breadcrumbs = breadcrumbs.servers;

            // Set up Cluster Settings Sub-View
            // Inject dependencies into ClusterSettingsHelper.
            ClusterSettingsHelpers.makeFunctions($log, $scope, $timeout, $q, breadcrumbs, OSDConfigService, $modal, osdConfigKeys, RequestTrackingService).initialize().then(function(cluster) {
                $scope.helpInfo = cluster.helpInfo;
                $scope.reset = cluster.reset;
                $scope.updateSettings = cluster.updateSettings;
            });

            var promises = [KeyService.getList(), ToolService.config(), OSDConfigService.get()];
            var start = Date.now();
            $q.all(promises).then(function(results) {
                $rootScope.keyTimer = $timeout(refreshKeys, config.getPollTimeoutMs());
                $scope.up = true;
                var elapsed = Date.now() - start;
                var timeout = elapsed < 600 ? 600 - elapsed : 0;
                $scope.hidePre = true;
                $timeout(function() {
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
                    $scope.pcols = responseHelpers.bucketMinions(minions.pre);
                    $scope.cols = responseHelpers.bucketMinions(minions.accept);
                    $scope.hidePre = _.flatten(minions.pre).length === 0;
                }, timeout);
                // Initialize the browser config UI data.
                responseHelpers.processConfigs(results[1]).then(function(configs) {
                    $scope.configs = configs;
                });
                // Initialize the Cluster Wide Settings Config Data.
                responseHelpers.osdConfigsInit(results[2]).then(function(osdConfigs) {
                    $scope.osdconfigs = osdConfigs;
                    $scope.osdconfigsdefaults = angular.copy(osdConfigs);
                });
            });
        };
        return ['$q', '$log', '$timeout', '$rootScope', '$location', '$scope', 'KeyService', 'ClusterService', 'ToolService', 'ServerService', '$modal', 'OSDConfigService', 'RequestTrackingService', 'ConfigurationService', RootController];
    });
})();
