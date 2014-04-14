/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash'], function(_) {
        function makeFunctions($scope, $timeout, osdConfigKeys) {
            function bucketMinions(minions) {
                $scope.up = true;
                $scope.minionsCounts = {
                    total: minions.length
                };
                var m = _.reduce(_.sortBy(minions, function(m) {
                    return m.id;
                }), function(results, minion, index) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    minion.shortName = shortName;
                    results[index % 4].push({
                        id: minion.id,
                        status: minion.status,
                        shortName: shortName,
                        label: 'ACCEPT'
                    });
                    return results;
                }, [
                    [],
                    [],
                    [],
                    []
                ]);
                $scope.cols = m;
            }

            function processConfigs(config) {
                $timeout(function() {
                    var sortedConfig = config.sort(function(a, b) {
                        if (a.key === b.key) {
                            return 0;
                        }
                        if (a.key < b.key) {
                            return -1;
                        }
                        return 1;
                    });
                    $scope.configs = _.map(sortedConfig, function(config) {
                        return {
                            key: config.key,
                            value: config.value
                        };
                    });
                }, 500);
            }

            function osdConfigsInit(config) {
                $scope.osdconfigs = _.reduce(osdConfigKeys, function(result, key) {
                    result[key] = config[key];
                    return result;
                }, {});
                $scope.osdconfigsdefaults = angular.copy($scope.osdconfigs);
            }

            function makeBreadcrumbs(name) {
                return {
                    'servers': [{
                            text: 'Manage (' + name + ')'
                        }, {
                            text: 'Cluster',
                            active: true
                        }, {
                            text: 'Hosts',
                            active: true
                        }
                    ],
                    'osdmap': [{
                            text: 'Manage (' + name + ')'
                        }, {
                            text: 'Cluster',
                            active: true
                        }, {
                            text: 'Cluster Settings',
                            active: true
                        }
                    ],
                    'viewer': [{
                            text: 'Manage (' + name + ')'
                        }, {
                            text: 'Cluster',
                            active: true
                        }, {
                            text: 'Config Viewer',
                            active: true
                        }
                    ]
                };
            }

            return {
                bucketMinions: bucketMinions,
                processConfigs: processConfigs,
                osdConfigsInit: osdConfigsInit,
                makeBreadcrumbs: makeBreadcrumbs
            };
        }
        return {
            makeFunctions: makeFunctions
        };
    });
})();
