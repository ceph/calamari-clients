/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash'], function(_) {

        var RootController = function($log, $scope, KeyService, ClusterService) {
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            KeyService.getList().then(function(minions) {
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
            });
        };
        return ['$log', '$scope', 'KeyService', 'ClusterService', RootController];
    });
})();
