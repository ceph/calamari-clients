/* global define */
(function() {
    'use strict';
    define(['angular'], function() {
        var runBlock = function($rootScope, MenuService, $location, $timeout, $log) {
            // set up route change handler
            $rootScope.$on('$routeChangeSuccess', function(event, to, from) {
                MenuService.setActive(to.menuId);
                $rootScope.menus = MenuService.getMenus();
                $log.debug('from ' + (from && from.loadedTemplateUrl) + ' to ' + (to && to.loadedTemplateUrl), to, from);
                if (from && from.loadedTemplateUrl ==='views/root.html' && $rootScope.keyTimer) {
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = undefined;
                    $log.debug('canceling key timer');
                }
            });
            // add show requests handler for request queue
            $rootScope.showRequests = function() {
                angular.element(document.getElementsByClassName('RequestManagement')[0]).scope().show();
            };
            $rootScope.switchView = function(view) {
                $location.path(view);
            };
        };
        return ['$rootScope', 'MenuService', '$location', '$timeout', '$log', runBlock];
    });
})();
