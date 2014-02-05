/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash'], function(_) {

        var RootController = function($log, $scope, Restangular) {
            var baseClusters = Restangular.setBaseUrl('/api/v2').all('cluster');
            baseClusters.getList().then(function(clusters) {
                $scope.allClusters = clusters;
                var cluster = _.first(clusters);
                $scope.clusterName = cluster.name;
            });
            var baseMinions = Restangular.all('key');
            baseMinions.getList().then(function(minions) {
                $scope.minionsCounts = {
                    total: minions.length
                };
                $scope.minions = _.map(minions, function(minion) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    minion.shortName = shortName;
                    $log.debug(shortName);
                    $log.debug(minion);
                    return minion;
                });
            });
            $scope.tooltip1 = {
                title: 'Hostname: Pina01',
                placement: 'top',
                trigger: 'hover',
                animation: ''
            };
            $scope.tooltip2 = {
                title: 'Hostname: Pina02',
                placement: 'top',
                trigger: 'hover',
            };
            $scope.tooltip3 = {
                title: 'Hostname: Pina03',
                placement: 'top',
                trigger: 'hover',
            };
            $scope.tooltip4 = {
                title: 'Hostname: Pina04',
                placement: 'top',
                trigger: 'hover',
            };
        };
        return ['$log', '$scope', 'Restangular', RootController];
    });
})();
