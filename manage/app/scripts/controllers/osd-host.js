/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers'], function(_, modalHelpers) {

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

        function formatOSDData(osd) {
            var pairs = _.reduce(['uuid', 'up', 'in', 'reweight', 'server', 'pools', 'public_addr', 'cluster_addr'], function(result, key) {
                var value = osd[key];
                if (value || value !== '') {
                    if (key === 'up' || key === 'in') {
                        result.state = result.state || [];
                        var markup = '<div class="label label-danger">DOWN</div>';
                        if (key === 'up') {
                            if (value) {
                                markup = '<div class="label label-success">UP</div>';
                            }
                        } else {
                            if (value) {
                                markup = '<div class="label label-success">IN</div>';
                            } else {
                                markup = '<div class="label label-danger">OUT</div>';
                            }
                        }
                        result.state.push(markup);
                    } else {
                        result[key] = value;
                    }
                }
                return result;
            }, {});
            if (pairs.state) {
                pairs.state = pairs.state.join(' &nbsp; ');
            }
            if (pairs.reweight) {
                pairs.reweight = '' + pairs.reweight;
            }
        }
        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal, $timeout, RequestTrackingService) {
            $scope.fqdn = $routeParams.fqdn;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.displayFn = function(id) {
                OSDService.get(id).then(function(_osd) {
                    var modal = $modal({
                        title: 'OSD ' + _osd.id + ' Info',
                        template: 'views/osd-info-modal.html'
                    });
                    modal.$scope.pairs = formatOSDData(_osd);
                });
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
                        var deferred = $q.defer();
                        RequestTrackingService.add(resp.data.request_id, function() {
                            deferred.resolve();
                        });
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
                                deferred.promise.then(function() {
                                    OSDService.get(id).then(function(_osd) {
                                        // refresh osd state
                                        osd['in'] = _osd['in'];
                                        osd.up = _osd.up;
                                        osd.repairDisabled = !osd.up;
                                        generateConfigDropdown(osd, configClickHandler);
                                    });
                                });
                            }, 1000);
                        }, spindelay);
                    }, modalHelpers.makeOnError(modal));
                    return false;
                };
            }

            var configClickHandler = makeCommandHandler('configText');
            var repairClickHandler = makeCommandHandler('repairText');

            ServerService.get($scope.fqdn).then(function(server) {
                //console.log(server);
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
                        results.promises.push(OSDService.get(osd.id));
                    }
                    return results;
                }, {
                    osds: [],
                    promises: []
                });
                $scope.up = true;
                $q.all(r.promises).then(function(results) {
                    _.each(results, function(result, index) {
                        /* jshint camelcase:false */
                        result.index = index;
                        result.repairText = text.repairText;
                        result.configText = text.configText;
                        if (result.valid_commands.length) {
                            result.repairDropdown = _.reduce(result.valid_commands, function(newdropdown, cmd) {
                                newdropdown.push({
                                    'text': text[cmd],
                                    'id': result.id,
                                    'cmd': cmd,
                                    'index': index,
                                    'handler': repairClickHandler
                                });
                                return newdropdown;
                            }, []);
                        } else {
                            result.repairDisabled = true;
                        }
                        generateConfigDropdown(result, configClickHandler);
                        r.osds[index] = _.extend(r.osds[index], result);
                    });
                    $scope.services = {
                        osds: r.osds
                    };
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', '$timeout', 'RequestTrackingService', OSDHostController];
    });
})();
