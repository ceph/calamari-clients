/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/osd-helpers'], function(_, osdHelpers) {

        // **OSDController**
        // Top-level OSD view. Displays an overview of OSDs by host. At a glance
        // it's possible to tell which OSDs need attention.
        var OSDController = function($scope, ClusterService, ServerService, $location, OSDService, $modal, PoolService, $timeout, config) {
            if (ClusterService.clusterId === null) {
                // Cluster has not been configured. Redirect to first view.
                $location.path(config.getFirstViewPath());
                return;
            }
            // Set up breadcrumb navigation.
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.breadcrumbs = [{
                    text: 'Manage (' + $scope.clusterName + ')'
                }, {
                    text: 'OSD',
                    active: true
                }
            ];
            // **displayOSD**
            // OSD Detail Modal helper. Pops up an angular-strap modal containing
            // a more detailed tabular view of the OSD.
            $scope.displayOSD = function(id) {
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

            var start = Date.now();
            // Request the list of hosts in this cluster so we can
            // request OSD metadata in bulk.
            ServerService.getList().then(function(servers) {
                var elapsed = Date.now() - start;
                var timeout = elapsed < 500 ? 500 - elapsed : 0;
                // Display it after a delay to allow time for the animations to play.
                $timeout(function() {
                    // Take the list of servers and request the OSD metadata associated
                    // with those servers.
                    var _servers = _.reduce(servers, function(results, server) {
                        // Parse the services metadata and keep the OSD IDs.
                        var services = _.reduce(server.services, function(serviceResults, service) {
                            if (service.type === 'osd') {
                                serviceResults.osdCount += 1;
                                serviceResults.osdID.push(service.id);
                            }
                            return serviceResults;
                        }, {
                            osdCount: 0,
                            osdID: []
                        });
                        // Sort OSD IDs numerically for presentation.
                        services.osdID = _.sortBy(services.osdID, function(id) {
                            return parseInt(id, 10);
                        });
                        // Get detailed metadata about each OSD and post process
                        // it for simplified UI rendering.
                        OSDService.getSet(services.osdID).then(function(osds) {
                            // **state** is used to set the color of the OSD based
                            // on it's daemon state.
                            //  * 0 - green
                            //  * 1 - yellow
                            //  * 2 - yellow
                            services.state = _.reduce(osds, function(result, osd) {
                                var state = 2;
                                if (!osd.up && !osd['in']) {
                                    state = 0;
                                } else if (!osd.up || !osd['in']) {
                                    state = 1;
                                }
                                result.push(state);
                                return result;
                            }, []);
                        });
                        results.push({
                            hostname: server.hostname,
                            fqdn: server.fqdn,
                            services: services
                        });
                        return results;
                    }, []);
                    // Sort servers for presentation.
                    $scope.servers = _.sortBy(_servers, function(server) {
                        return server.fqdn;
                    });
                }, timeout);
                $scope.up = true;
            });
            // **hostClickHandler**
            // Click event handler. Route user to osd-host view.
            $scope.hostClickHandler = function(fqdn) {
                $location.path('/osd/server/' + fqdn);
            };
        };
        return ['$scope', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', 'PoolService', '$timeout', 'ConfigurationService', OSDController];
    });
})();
