/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash', 'helpers/grain-helpers'], function(_, grainHelpers) {


        function makeFunctions($scope, $rootScope, $log, $timeout, ServerService, KeyService, $modal) {
            function normalizeMinions(minions) {
                return _.reduce(_.sortBy(minions, function(m) {
                    return m.id;
                }), function(results, minion) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    results[minion.id] = {
                        id: minion.id,
                        status: minion.status,
                        shortName: shortName,
                        label: 'ACCEPT'
                    };
                    return results;
                }, {});
            }

            function classifyMinions(all, extract) {
                return _.reduce(_.flatten(all), function(result, minion) {
                    var entry = result.add[minion.id];
                    if (entry) {
                        // key exists still
                        delete result.add[minion.id];
                        if (entry.status !== minion.status) {
                            // minion key has changed status
                            minion.status = entry.status;
                            result.change[minion.id] = minion;
                        }
                    } else {
                        // key has been removed
                        result.remove[minion.id] = true;
                    }
                    return result;
                }, {
                    add: extract,
                    change: {},
                    remove: {}
                });
            }

            function removeDeletedMinions(all, remove) {
                if (!_.isEmpty(remove)) {
                    // remove hosts
                    return _.map(all, function(col) {
                        return _.filter(col, function(minion) {
                            return !(remove[minion.id]);
                        });
                    });
                }
                return all;
            }

            function updateChangedMinions(all, change) {
                if (!_.isEmpty(change)) {
                    return _.map(all, function(col) {
                        return _.map(col, function(minion) {
                            if (change[minion.id]) {
                                return change[minion.id];
                            }
                            return minion;
                        });
                    });
                }
                return all;
            }

            function addNewMinions(all, addCollection) {
                // convert map to array
                var adds = _.map(addCollection, function(value) {
                    return value;
                });
                _.each(adds, function(add) {
                    // find shortest column
                    var col = _.reduce(_.rest(all), function(curColumn, nextColumn) {
                        if (curColumn.length <= nextColumn.length) {
                            return curColumn;
                        } else {
                            return nextColumn;
                        }
                    }, _.first(all));
                    // append new minion
                    col.push(add);
                });
                return all;
            }

            function processMinionChanges(minions) {
                $scope.minionsCounts = {
                    total: minions.length
                };
                var extract = normalizeMinions(minions);
                var all = $scope.cols;

                var collection = classifyMinions(all, extract);
                all = removeDeletedMinions(all, collection.remove);
                all = updateChangedMinions(all, collection.change);
                all = addNewMinions(all, collection.add);
                return all;
            }

            function refreshKeys() {
                $log.debug('refreshing keys');
                KeyService.getList().then(processMinionChanges).then(function(all) {
                    $scope.cols = all;
                });
                $rootScope.keyTimer = $timeout(refreshKeys, 20000);
            }

            function acceptMinion(colnum, minion) {
                minion.label = '<i class="fa fa-spinner fa-spin"></i>';
                KeyService.accept([minion.id]).then(function( /*resp*/ ) {
                    /* Do nothing - refresh code will handle UI updates */
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
            }

            function detailView(id) {
                var modal = $modal({
                    title: id,
                    template: 'views/detail-grains-modal.html',
                    show: true
                });
                // TODO need a special path for the calamari server itself using /grains
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
            }
            /* servers --- end */
            return {
                refreshKeys: refreshKeys,
                detailView: detailView,
                acceptMinion: acceptMinion
            };
        }
        return {
            makeFunctions: makeFunctions
        };
    });
})();
