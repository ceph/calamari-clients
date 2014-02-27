/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;

    define(['lodash', 'helpers/grainHelpers'], function(_, grainHelpers) {


        var RootController = function($q, $log, $timeout, $rootScope, $location, $scope, KeyService, ClusterService, ToolService, ServerService, $modal) {
            if (ClusterService.id === null) {
                $location.path('/first');
                return;
            }

            function refreshKeys() {
                $log.debug('refreshing keys');
                KeyService.getList().then(function(minions) {
                    $scope.minionsCounts = {
                        total: minions.length
                    };
                    var extract = _.reduce(_.sortBy(minions, function(m) {
                        return m.id;
                    }), function(results, minion) {
                        var shortName = _.first(__split.call(minion.id, '.'));
                        results[minion.id] = {
                            id: minion.id,
                            status: minion.status,
                            shortName: shortName
                        };
                        return results;
                    }, {});
                    var left = $scope.leftminions;
                    var right = $scope.rightminions;
                    var newMinions = _.reduce(left.concat(right), function(result, minion) {
                        delete result[minion.id];
                        return result;
                    }, extract);
                    newMinions = _.map(newMinions, function(n) {
                        return n;
                    });
                    _.each(newMinions, function(noo) {
                        if ($scope.leftminions.length <= $scope.rightminions.length) {
                            $scope.leftminions.push(noo);
                        } else {
                            $scope.rightminions.push(noo);
                        }
                    });
                });
                $rootScope.keyTimer = $timeout(refreshKeys, 20000);
            }

            $scope.acceptMinion = function acceptMinion(side, id) {
                KeyService.accept([id]).then(function(resp) {
                    if (resp.status === 204) {
                        var minions = side === 'l' ? $scope.leftminions : $scope.rightminions;
                        minions = _.filter(minions, function(minion) {
                            if (minion.id === id) {
                                return false;
                            }
                            return true;
                        });
                        if (side === 'l') {
                            $scope.leftminions = minions;
                        } else {
                            $scope.rightminions = minions;
                        }
                    }
                }, function(resp) {
                    var modal = $modal({
                        template: 'views/custom-modal.html',
                        html: true
                    });
                    modal.$scope._hide = function() {
                        modal.$scope.$hide();
                    };
                    if (resp.status === 403) {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unauthorized Access';
                        modal.$scope.content = 'Error ' + resp.status + '. Please try reloading the page and logging in again.</p>';
                    } else {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unexpected Error';
                        modal.$scope.content = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Error ' + resp.status + '. Please try reloading the page and logging in again.</p><h4>Raw Response</h4><p><pre>' + resp.data + '</pre></p>';
                    }
                });
            };
            $scope.detailView = function detailView(id) {
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
                    var m = _.reduce(_.sortBy(minions, function(m) {
                        return m.id;
                    }), function(results, minion, index) {
                        var shortName = _.first(__split.call(minion.id, '.'));
                        minion.shortName = shortName;
                        results[index % 2].push({
                            id: minion.id,
                            status: minion.status,
                            shortName: shortName
                        });
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

                $rootScope.keyTimer = $timeout(refreshKeys, 20000);
            });
        };
        return ['$q', '$log', '$timeout', '$rootScope', '$location', '$scope', 'KeyService', 'ClusterService', 'ToolService', 'ServerService', '$modal', RootController];
    });
})();
