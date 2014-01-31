/* global define */
(function() {
    'use strict';
    define([], function() {

        var RootController = function($scope) {
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
        return ['$scope', RootController];
    });
})();
