/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers'], function(_, modalHelpers) {

        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService, $modal) {
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
            $scope.clickHandler = function($event) {
                $log.debug('CLICKED!', $event);
                $event.preventDefault();
                $event.stopPropagation();
                return false;
            };
            $scope.scrubFn = makeOSDCommand('Scrub', OSDService.scrub);
            $scope.ddconfig = [{
                    'text': '<i class="fa fa-arrow-circle-down fa-fw fa-lg"></i>&nbsp;DOWN'
                }, {
                    'text': '<i class="fa fa-sign-out fa-fw fa-lg"></i>&nbsp;OUT'
                }
            ];
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
                        result.repairDropdown = _.reduce(result.valid_commands, function(newdropdown, cmd) {
                            if (cmd === 'scrub') {
                                newdropdown.push({
                                    'text': '<i class="fa fa-medkit fa-fw fa-lg"></i>&nbsp;SCRUB',
                                    'id': result.id,
                                    'cmd': cmd
                                });
                            } else if (cmd === 'deep_scrub') {
                                newdropdown.push({
                                    'text': '<i class="fa fa-stethoscope fa-fw fa-lg"></i>&nbsp;DEEP SCRUB',
                                    'id': result.id,
                                    'cmd': cmd
                                });
                            } else if (cmd === 'repair') {
                                newdropdown.push({
                                    'text': '<i class="fa fa-ambulance fa-fw fa-lg"></i>&nbsp;REPAIR',
                                    'id': result.id,
                                    'cmd': cmd
                                });
                            }
                            return newdropdown;
                        }, []);
                        r.osds[index] = _.extend(r.osds[index], result);
                    });
                    $scope.services = {
                        osds: r.osds
                    };
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', OSDHostController];
    });
})();
