/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var ToolController = function($q, $timeout, $location, $scope, ClusterService, ToolService) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.logui = 'spinner';
            var promises = [ToolService.log()];
            $q.all(promises).then(function(results) {
                (function(logs) {
                    if (logs.length === 0) {
                        $scope.logui = 'empty';
                        return;
                    }
                    var lines = _.filter(logs.lines.split('\n').reverse(), function(line) {
                        return !(line === '' || line === undefined);
                    });
                    $scope.logs = _.map(lines, function(log) {
                        var line = log.split(' ');
                        return {
                            timestamp: moment(line[0] + ' ' + line[1]).format('l HH:MM ZZ'),
                            unit: line[2],
                            address: line[3] + ' ' + line[4],
                            rest: line.slice(6).join(' '),
                        };
                    });
                    $scope.logui = 'logs';
                })(results[0]);
                $scope.up = true;
            });
        };
        return ['$q', '$timeout', '$location', '$scope', 'ClusterService', 'ToolService', ToolController];
    });
})();
