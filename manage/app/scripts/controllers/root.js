/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;

    define(['lodash', 'helpers/grainHelpers'], function(_, grainHelpers) {

        var RootController = function($q, $log, $timeout, $location, $scope, KeyService, ClusterService, ToolService, ServerService, $modal) {
            if (ClusterService.id === null) {
                $location.path('/first');
                return;
            }
            $scope.detailView = function(id) {
                var modal = $modal({
                    title: id,
                    template: 'views/detail-grains-modal.html',
                    show: true
                });
                ServerService.getGrains(id).then(function(data) {
                    /* jshint camelcase: false */
                    data.cpu_flags = grainHelpers.formatCpuFlags(data.cpu_flags);
                    data.ipv4 = grainHelpers.formatIPAddresses(data.ipv4);
                    data.ipv6 = grainHelpers.formatIPAddresses(data.ipv6);
                    data.ip_interfaces = grainHelpers.formatInterfaces(data.ip_interfaces);
                    var pairs = _.map([
                            'lsb_distrib_description',
                            'osarch',
                            'kernelrelease',
                            'saltversion',
                            'cpu_model',
                            'num_cpus',
                            'cpu_flags',
                            'mem_total',
                            'ip_interfaces',
                            'ipv4',
                            'ipv6'
                    ], function(key) {
                        return {
                            key: key,
                            value: data[key] || 'Unknown'
                        };
                    });
                    modal.$scope.pairs = pairs;
                });
            };
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

                (function(config) {
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
                        $scope.configs = sortedConfig;
                    }, 500);
                })(results[2]);

            });
        };
        return ['$q', '$log', '$timeout', '$location', '$scope', 'KeyService', 'ClusterService', 'ToolService', 'ServerService', '$modal', RootController];
    });
})();
