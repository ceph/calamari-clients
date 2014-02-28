/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var OSDModifyController = function($scope, ClusterService, OSDService, $location, $routeParams, $window) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            $scope.cancelFn = function() {
                $window.history.back();
            };
            $scope.tooltip = {
                title: 'Use Advanced Operations to change this'
            };
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.gotoServer = function(fqdn) {
                $location.path('/osd/server/' + fqdn);
            };
            OSDService.get($routeParams.id).then(function(osd) {
                $scope.osd = osd;
                $scope.keys = ['uuid', 'up', 'in', 'reweight', 'server', 'pools'];
                $scope.up = true;
            });
        };
        return ['$scope', 'ClusterService', 'OSDService', '$location', '$routeParams', '$window', OSDModifyController];
    });
})();
