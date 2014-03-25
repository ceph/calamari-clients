/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/osd-helpers'], function(_, osdHelpers) {

        var OSDController = function($scope, ClusterService, ServerService, $location, OSDService, $modal) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            $scope.displayOSD = function(id) {
                OSDService.get(id).then(function(_osd) {
                    var modal = $modal({
                        title: 'OSD ' + _osd.id + ' Info',
                        template: 'views/osd-info-modal.html'
                    });
                    modal.$scope.pairs = osdHelpers.formatOSDData(_osd);
                });
            };
            ServerService.getList().then(function(servers) {
                $scope.up = true;
                var _servers = _.reduce(servers, function(results, server) {
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
                    services.osdID = _.sortBy(services.osdID, function(id) {
                        return parseInt(id, 10);
                    });
                    results.push({
                        hostname: server.hostname,
                        fqdn: server.fqdn,
                        services: services
                    });
                    return results;
                }, []);
                $scope.servers = _.sortBy(_servers, function(server) {
                    return server.fqdn;
                });
            });
            $scope.hostClickHandler = function(fqdn) {
                $location.path('/osd/server/' + fqdn);
            };
        };
        return ['$scope', 'ClusterService', 'ServerService', '$location', 'OSDService', '$modal', OSDController];
    });
})();
