'use strict';

var generalController = function($rootScope, $scope) {
        $scope.title = $rootScope.pageTitle;
        $scope.dashboard = $rootScope.dashboard;
        $rootScope.activeTab = 'general';
        $scope.loading = false;
        $scope.general = {
            version: '1.1',
            git: window.inktank.commit
        };
    };
angular.module('adminApp').controller('GeneralCtrl', ['$rootScope', '$scope', '$http', generalController]);
