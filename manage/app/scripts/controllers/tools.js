/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var ToolController = function($scope, ClusterService, ToolService) {
            $scope.clusterName = ClusterService.clusterModel.name;
            ToolService.log().then(function(logs) {
                $scope.logs = logs.lines.split('\n');
            });
            ToolService.config().then(function(config) {
                var sortedConfig = config.sort(function(a, b) {
                    if (a.key === b.key) {
                        return 0;
                    }
                    if (a.key < b.key) {
                        return -1;
                    }
                    return 1;
                });
                $scope.configs = sortedConfig;
            });
        };
        return ['$scope', 'ClusterService', 'ToolService', ToolController];
    });
})();
