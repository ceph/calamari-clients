/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var OSDHostController = function($log, $scope, $routeParams, Restangular) {
            $scope.fqdn = $routeParams.fqdn;
            var baseClusters = Restangular.setBaseUrl('/api/v2').all('cluster');
            baseClusters.getList().then(function(clusters) {
                var cluster = _.first(clusters);
                $scope.clusterName = cluster.name;
                var baseServer = Restangular.one('cluster', cluster.id).one('server', $routeParams.fqdn);
                baseServer.get().then(function(server) {
                    //console.log(server);
                    $scope.server = server;
                    var osds = [];
                    _.each(server.services, function(service) {
                        if (service.type === 'osd') {
                            var osd = {
                                id: service.id
                            };
                            osds.push(osd);
                        }
                    });
                    $scope.services = {
                        osds: osds,
                    };
                });
                $scope.up = true;
            });

        };
        return ['$log', '$scope', '$routeParams', 'Restangular', OSDHostController];
    });
})();
