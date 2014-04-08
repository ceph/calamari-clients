/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers', 'helpers/osd-helpers'], function(_, modalHelpers, osdHelpers) {

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

        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal, $timeout, RequestTrackingService, PoolService) {
            function transformOSDToUI(osd) {
                osd.reweight = Math.min(osd.reweight * 100, 100);
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
                $log.debug('reweight: ' + osd.reweight);
                if (osd.reweight === '' || osd.reweight === void 0) {
                    osd.hasError = true;
                    return;
                }
                if (_.isNumber(osd.reweight) && (osd.reweight > 100 || osd.reweight < 0)) {
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
                    OSDService.patch(osd.id, {
                        reweight: osd.reweight / 100
                    }).then(function(resp) {
                        /* jshint camelcase: false */
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var end = Date.now();
                        var timer = end - start;
                        timer = timer > 1000 ? 0 : 1000 - timer;
                        $timeout(function() {
                            osd.saved = true;
                            promise.then(function() {
                                osd._reweight = angular.copy(osd.reweight);
                                osd.editing = false;
                                osd.saved = false;
                            });
                        }, timer);
                    }, modalHelpers.makeOnError(modal));

                    $timeout(function() {
                        osd.saved = true;
                        osd.editing = false;
                        $timeout(function() {
                            osd.saved = false;
                        }, 1000);
                    }, 1000);
                }, 3000);
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
                transformOSDToUI(osd);
            }

            function makeCommandHandler(buttonLabel) {
                return function($event, id, cmd, index) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $log.debug('CLICKED osd ' + id + ' command ' + cmd);
                    var osd = $scope.services.osds[index];
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
                    OSDService[cmd].call(OSDService, id).then(function success(resp) {
                        /* jshint camelcase: false */
                        var promise = RequestTrackingService.add(resp.data.request_id);
                        var spindelay = 1000;
                        var end = Date.now();
                        spindelay = ((end - start) > 1000) ? 0 : spindelay - (end - start);
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
                                        transformOSDToUI(_osd);
                                        _.extend(osd, _osd);
                                        osd.repairDisabled = !osd.up;
                                        osd.editDisabled = !osd.up || !osd. in ;
                                        generateConfigDropdown(osd, configClickHandler);
                                    });
                                });
                            }, 1000);
                        }, spindelay);
                    }, modalHelpers.makeOnError(modal, function cleanup() {
                        osd[buttonLabel] = text[buttonLabel];
                        osd.disabled = false;
                    }));
                    return false;
                };
            }

            var configClickHandler = makeCommandHandler('configText');
            var repairClickHandler = makeCommandHandler('repairText');

            ServerService.get($scope.fqdn).then(function(server) {
                $scope.server = server;
                var r = _.reduce(_.sortBy(server.services, function(service) {
                    var id = parseInt(service.id, 10);
                    return _.isNaN(id) ? 0 : id;
                }), function(results, service) {
                    if (service.type === 'osd') {
                        var osd = {
                            id: service.id,
                            running: true
                        };
                        results.osds.push(osd);
                        results.ids.push(osd.id);
                    }
                    return results;
                }, {
                    osds: [],
                    ids: []
                });
                $q.all(OSDService.getSet(r.ids)).then(function(results) {
                    _.each(results, function(result, index) {
                        addUIMetadataToOSDData(result, index);
                        r.osds[index] = _.extend(r.osds[index], result);
                    });
                    $scope.services = {
                        osds: r.osds
                    };
                    $scope.up = true;
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', '$timeout', 'RequestTrackingService', 'PoolService', OSDHostController];
    });
})();
