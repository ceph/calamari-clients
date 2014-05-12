/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers', 'helpers/osd-helpers', 'helpers/error-helpers'], function(_, modalHelpers, osdHelpers, errorHelpers) {

        var disableRepair = true;
        var text = {
            'down': '<i class="fa fa-arrow-circle-down fa-fw fa-lg"></i>&nbsp;DOWN',
            'in': '<i class="fa fa-sign-in fa-fw fa-lg"></i>&nbsp;IN',
            'out': '<i class="fa fa-sign-out fa-fw fa-lg"></i>&nbsp;OUT',
            'scrub': '<i class="fa fa-medkit fa-fw fa-lg"></i>&nbsp;SCRUB',
            'deep_scrub': '<i class="fa fa-stethoscope fa-fw fa-lg"></i>&nbsp;DEEP SCRUB',
            'repair': '<i class="fa fa-ambulance fa-fw fa-lg"></i>&nbsp;REPAIR',
            'repairText': '<i class="fa fa-medkit fa-fw fa-lg"></i>',
            'configText': '<i class="fa fa-gear fa-fw fa-lg"></i>',
            'spinner': '<i class="fa fa-spinner fa-spin fa-fw fa-lg"></i>',
            'success': '<i class="fa fa-check-circle-o fa-fw fa-lg"></i>'
        };

        var maxReweight = 100;
        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal, $timeout, RequestTrackingService, PoolService, config, $rootScope) {

            var errHelpers = errorHelpers.makeFunctions($q, $log);

            function formatOSDForUI(osd) {
                osd.reweight = Math.min(osd.reweight * maxReweight, maxReweight);
                osd.reweight = Math.max(osd.reweight, 0);
                osd.reweight = Math.round(osd.reweight);
                osd._reweight = angular.copy(osd.reweight);
            }
            $scope.fqdn = $routeParams.fqdn;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')',
                }, {
                    text: 'OSD',
                    href: '#/osd'
                }, {
                    text: 'Host (' + $scope.fqdn + ')',
                    active: true
                }
            ];
            $scope.displayFn = function(id) {
                OSDService.get(id).then(function(_osd) {
                    var modal = $modal({
                        title: 'OSD ' + _osd.id + ' Info',
                        template: 'views/osd-info-modal.html'
                    });
                    PoolService.getList().then(function(pools) {
                        modal.$scope.pairs = osdHelpers.formatOSDData(_osd, pools);
                    });
                });
            };
            $scope.changedFn = function(osd) {
                $log.debug('changed ' + osd.id);
                if (osd.timeout) {
                    $timeout.cancel(osd.timeout);
                    osd.timeout = undefined;
                }
                if ($rootScope.keyTimer) {
                    // reset polling timeout when editing
                    // reweight otherwise it'll overwrite your changes
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                }
                $log.debug('reweight: ' + osd.reweight);
                if (osd.reweight === '' || osd.reweight === void 0) {
                    osd.hasError = true;
                    return;
                }
                if (_.isNumber(osd.reweight) && (osd.reweight > maxReweight || osd.reweight < 0)) {
                    osd.reweight = angular.copy(osd._reweight);
                    return;
                }
                if (_.isNaN(osd.reweight)) {
                    osd.hasError = true;
                    return;
                }
                osd.hasError = false;
                if (osd.reweight === osd._reweight) {
                    return;
                }
                osd.timeout = $timeout(function() {
                    osd.editing = true;
                    var start = Date.now();
                    var modal = $modal({
                        html: true,
                        title: '',
                        backdrop: 'static',
                        template: 'views/osd-cmd-modal.html',
                        show: false
                    });
                    errHelpers.intercept304Error(OSDService.patch(osd.id, {
                        reweight: osd.reweight / maxReweight
                    })).then(function(resp) {
                        /* jshint camelcase: false */
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var elapsed = Date.now() - start;
                        var remaining = elapsed < config.getAnimationTimeoutMs() ? config.getAnimationTimeoutMs() - elapsed : 0;
                        $timeout(function() {
                            osd.saved = true;
                            promise.then(function() {
                                osd._reweight = angular.copy(osd.reweight);
                                osd.editing = false;
                                osd.saved = false;
                            }, function() {
                                // reset ui on error
                                osd.editing = false;
                                osd.saved = false;
                            });
                        }, remaining);
                    }, modalHelpers.makeOnError(modal));

                    $timeout(function() {
                        osd.saved = true;
                        osd.editing = false;
                        $timeout(function() {
                            osd.saved = false;
                        }, config.getAnimationTimeoutMs());
                    }, config.getAnimationTimeoutMs());
                }, config.getEditDebounceMs());
            };

            function generateConfigDropdown(result, handler) {
                result.configDropdown = [];
                if (result.up) {
                    // One can only set an OSD down. The Cluster automatically promotes the OSD
                    // to Up unless the noup flag is set on the cluster
                    result.configDropdown.push({
                        'text': text.down,
                        'id': result.id,
                        'cmd': 'down',
                        'index': result.index,
                        'handler': handler
                    });
                }
                if (result['in']) {
                    result.configDropdown.push({
                        'text': text.out,
                        'id': result.id,
                        'cmd': 'out',
                        'index': result.index,
                        'handler': handler
                    });
                } else {
                    result.configDropdown.push({
                        'text': text['in'],
                        'id': result.id,
                        'cmd': 'in',
                        'index': result.index,
                        'handler': handler
                    });
                }
            }

            function addUIMetadataToOSDData(osd, index) {
                /* jshint camelcase:false */
                _.extend(osd, {
                    index: index,
                    repairText: text.repairText,
                    configText: text.configText,
                    hasError: false,
                    editing: false,
                    saved: false,
                    editDisabled: false
                });
                if (osd.valid_commands.length) {
                    if (disableRepair) {
                        osd.valid_commands = _.filter(osd.valid_commands, function(command) {
                            return command !== 'repair';
                        });
                    }
                    osd.repairDropdown = _.reduce(osd.valid_commands, function(newdropdown, cmd) {
                        newdropdown.push({
                            'text': text[cmd],
                            'id': osd.id,
                            'cmd': cmd,
                            'index': index,
                            'handler': repairClickHandler
                        });
                        return newdropdown;
                    }, []);
                } else {
                    osd.repairDisabled = true;
                }
                generateConfigDropdown(osd, configClickHandler);
                formatOSDForUI(osd);
            }

            function requestRepairPermission(repairFn) {
                return function($event, id, cmd, index) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    if (cmd === 'repair') {
                        var modal = $modal({
                            html: true,
                            title: '<i class="fa fa-fw fa-lg text-danger fa-exclamation-triangle"></i> Repair OSD ' + id + '?',
                            backdrop: 'static',
                            template: 'views/osd-repair-warn-modal.html',
                            content: 'Please ensure you have checked the cluster logs for scrub output marked <strong class="text-info">Error</strong> to determine if this is the correct OSD to run the repair on. Failure to do so may result in the <span class="text-danger">permanent loss of data</span>.',
                            show: true
                        });
                        modal.$scope.acceptFn = function() {
                            modal.$scope.$hide();
                            repairFn($event, id, cmd, index);
                        };
                    } else {
                        repairFn($event, id, cmd, index);
                    }
                };
            }


            function makeCommandHandler(buttonLabel) {
                return function($event, id, cmd, index) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $log.debug('CLICKED osd ' + id + ' command ' + cmd);
                    var osd = $scope.osds[index];
                    osd.disabled = true;
                    osd[buttonLabel] = text.spinner;
                    var start = Date.now();
                    var modal = $modal({
                        html: true,
                        title: '',
                        backdrop: 'static',
                        template: 'views/osd-cmd-modal.html',
                        show: false
                    });
                    errHelpers.intercept304Error(OSDService[cmd].call(OSDService, id)).then(function success(resp) {
                        /* jshint camelcase: false */
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var elapsed = Date.now() - start;
                        var remaining = (elapsed < config.getAnimationTimeoutMs()) ? config.getAnimationTimeoutMs() - elapsed : 0;
                        modal.$scope.disableClose = true;
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                        };
                        $timeout(function() {
                            osd[buttonLabel] = text.success;
                            $timeout(function() {
                                osd[buttonLabel] = text[buttonLabel];
                                osd.disabled = false;
                                promise.then(function() {
                                    OSDService.get(id).then(function(_osd) {
                                        // refresh osd state
                                        formatOSDForUI(_osd);
                                        _.extend(osd, _osd);
                                        osd.repairDisabled = !osd.up;
                                        osd.editDisabled = !osd.up || !osd['in'];
                                        generateConfigDropdown(osd, configClickHandler);
                                    });
                                });
                            }, config.getAnimationTimeoutMs());
                        }, remaining);
                    }, modalHelpers.makeOnError(modal, function cleanup() {
                        osd[buttonLabel] = text[buttonLabel];
                        osd.disabled = false;
                    }));
                    return false;
                };
            }

            var configClickHandler = makeCommandHandler('configText');
            var repairClickHandler = requestRepairPermission(makeCommandHandler('repairText'));

            function refreshOSDModels() {
                $log.debug('polling host ' + $scope.fqdn);
                ServerService.get($scope.fqdn).then(function(server) {
                    var r = _.reduce(server.services, function(results, service) {
                        if (service.type === 'osd') {
                            var osd = {
                                id: service.id,
                                running: service.running
                            };
                            results.osds[osd.id] = osd;
                            results.ids.push(osd.id);
                        }
                        return results;
                    }, {
                        osds: {},
                        ids: []
                    });
                    var osds = $scope.osds;
                    OSDService.getSet(r.ids).then(function(newOsds, index) {
                        osds = _.filter(osds, function(osd) {
                            // delete osds that have been removed from host
                            return newOsds[osd.id] !== undefined;
                        });
                        _.each(newOsds, function(nOsd) {
                            if (osds[nOsd.id] === undefined) {
                                // add new osds
                                addUIMetadataToOSDData(nOsd, index);
                                osds[nOsd.id] = {};
                            }
                            nOsd.repairDisabled = !nOsd.up;
                            nOsd.editDisabled = !nOsd.up || !nOsd['in'];
                            formatOSDForUI(nOsd);
                            generateConfigDropdown(nOsd, configClickHandler);
                            _.extend(osds[nOsd.id], nOsd);
                        });
                    });
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                });
            }

            ServerService.get($scope.fqdn).then(function(server) {
                $scope.server = server;
                var r = _.reduce(server.services, function(results, service) {
                    if (service.type === 'osd') {
                        var osd = {
                            id: service.id,
                            running: service.running
                        };
                        results.osds[osd.id] = osd;
                        results.ids.push(osd.id);
                    }
                    return results;
                }, {
                    osds: {},
                    ids: []
                });
                OSDService.getSet(r.ids).then(function(osds) {
                    _.each(osds, function(osd, index) {
                        addUIMetadataToOSDData(osd, index);
                        osd.repairDisabled = !osd.up;
                        osd.editDisabled = !osd.up || !osd['in'];
                        _.extend(r.osds[osd.id], osd);
                    });
                    $scope.osds = _.sortBy(_.values(r.osds), function(osd) {
                        return osd.id;
                    });
                    $scope.up = true;
                    $rootScope.keyTimer = $timeout(refreshOSDModels, config.getPollTimeoutMs());
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', '$timeout', 'RequestTrackingService', 'PoolService', 'ConfigurationService', '$rootScope', OSDHostController];
    });
})();
