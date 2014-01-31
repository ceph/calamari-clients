/* global define */
(function() {
    'use strict';
    define([], function() {

        var PoolController = function($scope) {
            $scope.create = function() {
                window.document.location = '#/pool/new';
            };
        };
        return ['$scope', PoolController];
    });
})();
