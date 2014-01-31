/* global define */
define([], function() {
    'use strict';

    var PoolController = function($scope) {
        $scope.create = function() {
            window.document.location = '#/pool/new';
        };
    };
    return ['$scope', PoolController];
});
