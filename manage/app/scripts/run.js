/* global define */
(function() {
    'use strict';
    define(['angular'], function() {
        /* Setup Broadcast Service With Correct Root Scopes */
        var runBlock = function($rootScope, MenuService) {
            $rootScope.$on('$routeChangeSuccess', function(event, to) {
                MenuService.setActive(to.menuId);
                $rootScope.menus = MenuService.getMenus();
            });
        };
        return ['$rootScope', 'MenuService', runBlock];
    });
})();
