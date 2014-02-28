/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var OSDHostController = function($q, $log, $scope, $routeParams, ClusterService, ServerService, $location, OSDService) {
            $scope.fqdn = $routeParams.fqdn;
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.modify = function(id) {
                $location.path('/osd/id/' + id);
            };
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
                        r.osds[index] = _.extend(r.osds[index], result);
                    });
                    $scope.services = {
                        osds: r.osds
                    };
                });
            });

        };
        return ['$q', '$log', '$scope', '$routeParams', 'ClusterService', 'ServerService', '$location', 'OSDService', OSDHostController];
    });
})();
