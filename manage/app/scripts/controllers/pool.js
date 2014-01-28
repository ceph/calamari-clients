'use strict';

angular.module('manageApp')
    .controller('PoolCtrl', function($scope) {
          $scope.create = function($scope) {
        window.document.location = '#/pool/new';
    };
});
