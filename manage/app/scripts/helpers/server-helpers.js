/* global define */
(function() {
    'use strict';
    var __split = String.prototype.split;
    define(['lodash', 'helpers/grain-helpers'], function(_, grainHelpers) {

        // **makeFunctions**
        //
        // A list of functions we need to run these helper functtions. Provided
        // by instantiater.
        //
        // @returns a dependency injected instance of the helpers.
        //
        function makeFunctions($q, $scope, $rootScope, $log, $timeout, ServerService, KeyService, $modal) {

            // **normalizeMinions**
            //
            // Take the server provided minion metadata and pre-process it
            // for the UI.
            //
            // @param **minions** - list of minions to enhance
            //
            // @returns enhanced 2 collections of minions indexed by minon id
            // according to their minion key status {pre|accepted}. We ignore
            // blocked.
            function normalizeMinions(minions) {
                var o;
                return _.reduce(_.sortBy(minions, function(m) {
                    return m.id;
                }), function(results, minion) {
                    var shortName = _.first(__split.call(minion.id, '.'));
                    o = {
                        id: minion.id,
                        status: minion.status,
                        shortName: shortName,
                        label: '<i class="fa fa-lg fa-fw fa-plus-circle"></i>'
                    };
                    if (minion.status === 'pre') {
                        results.pre[minion.id] = o;
                    } else {
                        results.accepted[minion.id] = o;
                    }
                    return results;
                }, {
                    pre: {},
                    accepted: {}
                });
            }

            // **classifyMinions**
            //
            // Compares 2 lists of minions. Using the 2nd set, it sorts the
            // original list into 3 buckets of add, changed or removed, ignoring those
            // entries that have not changed.
            //
            // @param **all** - original set to classify
            //
            // @param **extract** - new set to compare it against
            //
            // @returns 3 sets of minions: added, changed, or removed
            //
            // Does not modify the original set 'all'.
            //
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

            // **removeDeletedMinions**
            //
            // @param **all** - original set of minions
            //
            // @param **extract ** - set of minions to remove from all
            //
            // @returns new set without the removed set of minions.
            //
            // Does not modify the original set 'all'.
            //
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

            // **updateChangedMinions**
            //
            // @param **all** - original set of minions
            //
            // @param **change** -- set of changed minions
            //
            // Replaces all changed minions in original list with updated versions.
            //
            // Does not modify the original set 'all'.
            //
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

            // **addNewMinions**
            //
            // For presentation purposes, we have 4 logical columns of hosts on the cluster page.
            // To avoid having uneven column presentation, we round robin new hosts being added
            // to a cluster into one of those 4 columns. Whichever column has the fewest entries
            // gets the next minion to display.
            //
            // all is an array of arrays. e.g `[ [],[],[],[] ]`
            //
            // @param **all** - original set of minions
            //
            // @param *addCollection** - new minions to add to UI
            //
            // @returns original data structure, with new members evenly distributed among arrays.
            //
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

            // **processMinionChanges**
            //
            // Take the updated minions list and split into new pre-accepted and currently accepted groups.
            // Apply the pre-accepted and accepted lists to the existing models we have loaded into
            // scope.
            //
            // AngularJS takes care of the rendering and updating of the UI.
            //
            // @param **minions** - updated minons list
            //
            function processMinionChanges(minions) {
                $scope.minionsCounts = {
                    total: minions.length
                };
                var extract = normalizeMinions(minions);
                var accepted = $scope.cols;
                var pre = $scope.pcols;

                var newAccepted = classifyMinions(accepted, extract.accepted);
                accepted = removeDeletedMinions(accepted, newAccepted.remove);
                accepted = updateChangedMinions(accepted, newAccepted.change);
                accepted = addNewMinions(accepted, newAccepted.add);

                var newPre = classifyMinions(pre, extract.pre);
                pre = removeDeletedMinions(pre, newPre.remove);
                pre = addNewMinions(pre, newPre.add);
                return {
                    pre: pre,
                    accepted: accepted,
                    hidePre: _.flatten(pre).length === 0
                };
            }

            // **acceptMinion**
            //
            // Click event handler for accepting a minion.
            //
            // Sends a list of minion ids to the server with the status changed to accepted.
            // This tells Calamari that we want this minion to join. We do not have any
            // extra metadata at this time to know which cluster this minion is destined for.
            // This is expected in a future Calamari API revision.
            //
            // @param minion - metadata about minion
            //
            // TODO use modal helpers to simplfy error case.
            // For example we should probably just rely on the key
            // service error interceptor to catch 403.
            function acceptMinion(minion) {
                minion.label = '<i class="fa fa-spinner fa-spin"></i>';
                KeyService.accept([minion.id]).then(function( /*resp*/ ) {
                    /* Do nothing */
                }, function(resp) {
                    var modal = $modal({
                        template: 'views/custom-modal.html',
                        html: true
                    });
                    modal.$scope.$hide = _.wrap(modal.$scope.$hide, function($hide) {
                        $hide();
                    });
                    if (resp.status === 403) {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unauthorized Access';
                        modal.$scope.content = 'Error ' + resp.status + '. Please try reloading the page and logging in again.</p>';
                    } else {
                        modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Unexpected Error';
                        modal.$scope.content = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Error ' + resp.status + '. Please try reloading the page and logging in again.</p><h4>Raw Response</h4><p><pre>' + resp.data + '</pre></p>';
                    }
                });
            }

            // **detailView**
            //
            // Used by a modal which contains a table view of the metadata (grain data)
            // associated with a particular minion id.
            //
            // @param **id** id of the minion we are requesting
            //
            // @returns an object containing key values pairs associated with the
            // specified minion id.
            //
            function detailView(id) {
                // TODO need a special path for the calamari server itself using /grains
                var promises = [ServerService.getGrains(id), ServerService.get(id)];
                return $q.all(promises).then(function(results) {
                    return (function(data) {
                        /* jshint camelcase: false */
                        // Massage the raw data into something for people.
                        data.cpu_flags = grainHelpers.formatCpuFlags(data.cpu_flags);
                        data.ipv4 = grainHelpers.formatIPAddresses(data.ipv4);
                        data.ipv6 = grainHelpers.formatIPAddresses(data.ipv6);
                        data.ip_interfaces = grainHelpers.formatInterfaces(data.ip_interfaces);
                        data.ceph_version = results[1].ceph_version;
                        // Filter the keys, preserving the most relevant ones.
                        return _.map([
                                'ceph_version',
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
                    })(results[0]);
                });
            }
            // Exported instance functions
            return {
                processMinionChanges: processMinionChanges,
                detailView: detailView,
                acceptMinion: acceptMinion
            };
        }
        // Exported function maker
        return {
            makeFunctions: makeFunctions
        };
    });
})();
