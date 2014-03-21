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
            'repairButton': '<i class="fa fa-medkit fa-fw fa-lg"></i>',
            'configButton': '<i class="fa fa-gear fa-fw fa-lg"></i>',
            'spinner': '<i class="fa fa-spinner fa-spin fa-fw fa-lg"></i>',
            'success': '<i class="fa fa-check-circle-o fa-fw fa-lg"></i>'
        };
        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal, $timeout) {
            $scope.fqdn = $routeParams.fqdn;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.modifyFn = function(id) {
                $location.path('/osd/id/' + id);
            };

            function makeOSDCommand(prefix, callback) {
                return function(id) {
                    var modal = $modal({
                        html: true,
                        title: '<i class="fa fa-spinner fa-spin"></i> Sending ' + prefix + ' Request',
                        backdrop: 'static',
                        template: 'views/osd-cmd-modal.html'
                    });
                    modal.$scope.disableClose = true;
                    modal.$scope._hide = function() {
                        modal.$scope.$hide();
                    };
                    callback.call(OSDService, id).then(function() {
                        modal.$scope.title = '<i class="text-success fa fa-check-circle"></i> Successfully Sent ' + prefix + ' to OSD ' + id;
                        modal.$scope.content = 'This may take quite a while. Use the dashboard to monitor progress.';
                        modal.$scope.disableClose = false;
                    }, modalHelpers.makeOnError(modal));
                };
            }
            $scope.clickHandler = function($event, id, cmd, index) {
                $event.preventDefault();
                $event.stopPropagation();
                $log.debug('CLICKED osd ' + id + ' command ' + cmd);
                var osd = $scope.services.osds[index];
                osd.disabled = true;
                if (cmd === 'down' || cmd === 'out' || cmd === 'in') {
                    osd.configText = text.spinner;
                } else {
                    osd.repairText = text.spinner;
                }
                $timeout(function() {
                    osd.disabled = false;
                    if (cmd === 'down' || cmd === 'out' || cmd === 'in') {
                        osd.configText = text.success;
                    } else {
                        osd.repairText = text.success;
                    }
                    $timeout(function() {
                        if (cmd === 'down' || cmd === 'out' || cmd === 'in') {
                            osd.configText = text.configButton;
                        } else {
                            osd.repairText = text.repairButton;
                        }
                    }, 1000);
                }, 1000);
                return false;
            };
            $scope.scrubFn = makeOSDCommand('Scrub', OSDService.scrub);
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
                        result.repairText = text.repairButton;
                        result.configText = text.configButton;
                        result.repairDropdown = _.reduce(result.valid_commands, function(newdropdown, cmd) {
                            newdropdown.push({
                                'text': text[cmd],
                                'id': result.id,
                                'cmd': cmd,
                                'index': index
                            });
                            return newdropdown;
                        }, []);
                        result.configDropdown = [];
                        if (result.up) {
                            // One can only set an OSD down. The Cluster automatically promotes the OSD
                            // to Up unless the noup flag is set on the cluster
                            result.configDropdown.push({
                                'text': text.down,
                                'id': result.id,
                                'cmd': 'down',
                                'index': index
                            });
                        }
                        if (result['in']) {
                            result.configDropdown.push({
                                'text': text.out,
                                'id': result.id,
                                'cmd': 'out',
                                'index': index
                            });
                        } else {
                            result.configDropdown.push({
                                'text': text['in'],
                                'id': result.id,
                                'cmd': 'in',
                                'index': index
                            });
                        }
                        r.osds[index] = _.extend(r.osds[index], result);
                    });
                    $scope.services = {
                        osds: r.osds
                    };
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', '$timeout', OSDHostController];
    });
})();
