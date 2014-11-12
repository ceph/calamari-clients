/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        // ToolController.
        // Displays the most recent log entries.
        // Should really be renamed to Log Controller.
        var ToolController = function($q, $timeout, $location, $scope, ClusterService, ToolService, config) {
            if (ClusterService.clusterId === null) {
                // Redirect to first view if cluster hasn't been defined.
                $location.path(config.getFirstViewPath());
                return;
            }
            // Set up breadcrumb navigation.
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'Logs',
                    active: true
                }
            ];
            $scope.logui = 'spinner';
            var promises = [ToolService.log()];
            $q.all(promises).then(function(results) {
                (function(logs) {
                    // Logs are empty show the appropriate message.
                    if (logs.length === 0) {
                        $scope.logui = 'empty';
                        return;
                    }
                    // There are only a limited number of log entries, split the text on
                    // CR and process them in reverse order.
                    var lines = _.filter(logs.lines.split('\n').reverse(), function(line) {
                        return !(line === '' || line === undefined);
                    });
                    // Do a light amount of post processing to make them more readable.
                    $scope.logs = _.map(lines, function(log) {
                        var line = log.split(' ');
                        return {
                            timestamp: moment(line[0] + ' ' + line[1]).format('l HH:mm:SS ZZ'),
                            unit: line[2],
                            address: line[3] + ' ' + line[4],
                            rest: line.slice(6).join(' '),
                        };
                    });
                    // Configure UI for displaying logs.
                    $scope.logui = 'logs';
                })(results[0]);
                $scope.up = true;
            });
        };
        return ['$q', '$timeout', '$location', '$scope', 'ClusterService', 'ToolService', 'ConfigurationService', ToolController];
    });
})();
