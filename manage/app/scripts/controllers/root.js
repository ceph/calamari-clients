/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash'], function(_) {

        var RootController = function($q, $log, $timeout, $scope, KeyService, ClusterService, ToolService) {
            var promises = [ClusterService.get(), KeyService.getList(), ToolService.config()];
            $q.all(promises).then(function(results) {

                (function(cluster) {
                    $scope.clusterName = cluster.name;
                })(results[0]);

                (function(minions) {
                    $scope.up = true;
                    $scope.minionsCounts = {
                        total: minions.length
                    };
                    var m = _.reduce(minions, function(results, minion, index) {
                        var shortName = _.first(__split.call(minion.id, '.'));
                        minion.shortName = shortName;
                        results[index % 2].push(minion);
                        return results;
                    }, [
                        [],
                        []
                    ]);
                    $scope.leftminions = m[0];
                    $scope.rightminions = m[1];
                })(results[1]);

                $timeout(function() {
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
                    })(results[2]);
                }, 250);

            });
        };
        return ['$q', '$log', '$timeout', '$scope', 'KeyService', 'ClusterService', 'ToolService', RootController];
    });
})();
