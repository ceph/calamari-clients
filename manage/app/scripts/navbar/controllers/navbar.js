/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {
        var NavbarController = function($log, $scope) {
            $scope.navbarTemplate = 'views/breadcrumb.html';
            $scope.title = {
                dashboard: '仪表板',
                bench: '工作台',
                chart: '图表',
                manage: '管理'
            };
            $scope.dashboard = function() {
                document.location = '/dashboard/';
            };
            $scope.workbench = function() {
                document.location = '/dashboard/?target=workbench';
            };
            $scope.graph = function() {
                document.location = '/dashboard/?target=graph';
            };
        };
        return ['$log', '$scope', NavbarController];
    });

})();
