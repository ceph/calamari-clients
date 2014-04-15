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

    define(['lodash', 'helpers/server-helpers', 'helpers/cluster-settings-helpers', 'helpers/cluster-response-helpers'], function(_, serverHelpers, clusterSettingsHelpers, responseHelpers) {


        var RootController = function($q, $log, $timeout, $rootScope, $location, $scope, KeyService, ClusterService, ToolService, ServerService, $modal, OSDConfigService, RequestTrackingService) {
            if (ClusterService.id === null) {
                $location.path('/first');
                return;
            }

            $scope.clusterName = ClusterService.clusterModel.name;

            var server = serverHelpers.makeFunctions($scope, $rootScope, $log, $timeout, ServerService, KeyService, $modal);
            $scope.acceptMinion = server.acceptMinion;
            $scope.detailView = server.detailView;

            var response = responseHelpers.makeFunctions($q, $timeout, osdConfigKeys);
            var breadcrumbs = response.makeBreadcrumbs($scope.clusterName);
            $scope.breadcrumbs = breadcrumbs.servers;

            clusterSettingsHelpers.makeFunctions($log, $scope, $timeout, $q, breadcrumbs, OSDConfigService, $modal, osdConfigKeys, RequestTrackingService).initialize().then(function(cluster) {
                $scope.helpInfo = cluster.helpInfo;
                $scope.reset = cluster.reset;
                $scope.updateSettings = cluster.updateSettings;
            });

            var promises = [KeyService.getList(), ToolService.config(), OSDConfigService.get()];
            $q.all(promises).then(function(results) {
                $rootScope.keyTimer = $timeout(server.refreshKeys, 20000);
                $scope.up = true;
                $scope.cols = response.bucketMinions(results[0]);
                response.processConfigs(results[1]).then(function(configs) {
                    $scope.configs = configs;
                });
                response.osdConfigsInit(results[2]).then(function(osdConfigs) {
                    $scope.osdconfigs = osdConfigs;
                    $scope.osdconfigsdefaults = angular.copy(osdConfigs);
                });
            });
        };
        return ['$q', '$log', '$timeout', '$rootScope', '$location', '$scope', 'KeyService', 'ClusterService', 'ToolService', 'ServerService', '$modal', 'OSDConfigService', 'RequestTrackingService', RootController];
    });
})();
