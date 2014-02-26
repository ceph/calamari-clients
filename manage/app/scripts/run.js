/* global define */
(function() {
    'use strict';
    define(['angular'], function() {
        var runBlock = function($rootScope, MenuService, $location) {
            // set up route change handler
            $rootScope.$on('$routeChangeSuccess', function(event, to) {
                MenuService.setActive(to.menuId);
                $rootScope.menus = MenuService.getMenus();
            });
            // add show requests handler for request queue
            $rootScope.showRequests = function() {
                angular.element(document.getElementsByClassName('RequestManagement')[0]).scope().show();
            };
            $rootScope.switchView = function(view) {
                $location.path(view);
            };
        };
        return ['$rootScope', 'MenuService', '$location', runBlock];
    });
})();
