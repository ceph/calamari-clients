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
                $scope.minionsCounts = {
                    total: minions.length
                };
                $scope.minions = _.zip(_.reduce(minions, function(results, minion, index) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    minion.shortName = shortName;
                    results[index % 2].push(minion);
                    return results;
                }, [
                    [],
                    []
                ]));
            });
        };
        return ['$log', '$scope', 'KeyService', 'ClusterService', RootController];
    });
})();
