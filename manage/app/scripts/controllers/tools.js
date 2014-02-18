/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var ToolController = function($q, $scope, ClusterService, ToolService) {
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.logui = 'spinner';
            var promises = [ToolService.log(), ToolService.config()];
                    $scope.up = true;
            $q.all(promises).then(function(results) {
                (function(logs) {
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
                })(results[0]);
                (function(config) {
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
                })(results[1]);
            });
        };
        return ['$q', '$scope', 'ClusterService', 'ToolService', ToolController];
    });
})();
