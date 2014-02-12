/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var ToolController = function($scope, ClusterService, ToolService) {
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.logui = 'spinner';
            ToolService.log().then(function(logs) {
                var lines = logs.lines.split('\n');
                $scope.logs = _.map(lines, function(log) {
                    var line = log.split(' ');
                    return {
                        timestamp: moment(line[0] + ' ' + line[1]).fromNow(),
                        unit: line[2],
                        address: line[3] + ' ' + line[4],
                        rest: line.slice(6).join(' '),
                    };
                });
                $scope.logui = 'logs';
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
