/* global define */
(function() {
    'use strict';
    define([], function() {

        var RootController = function($scope, Restangular) {
            var baseClusters = Restangular.setBaseUrl('/api/v2').all('cluster');
            baseClusters.getList().then(function(clusters) {
                $scope.allClusters = clusters;
            });
            $scope.tooltip1 = {
                title: 'Hostname: Pina01',
                placement: 'top',
                trigger: 'hover',
                animation: ''
            };
            $scope.tooltip2 = {
                title: 'Hostname: Pina02',
                placement: 'top',
                trigger: 'hover',
            };
            $scope.tooltip3 = {
                title: 'Hostname: Pina03',
                placement: 'top',
                trigger: 'hover',
            };
            $scope.tooltip4 = {
                title: 'Hostname: Pina04',
                placement: 'top',
                trigger: 'hover',
            };
        };
        return ['$scope', 'Restangular', RootController];
    });
})();
