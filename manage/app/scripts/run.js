/* global define */
(function() {
    'use strict';
    // This run block is used to attach some handlers to the RootScope.
    // Specifically we remove polling handlers from specific views
    // when we navigate away from a view.
    //
    // We also a click handler for the User Request UI to show it.
    // 
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
                    $log.debug('canceling root key timer');
                }
                if (from && from.loadedTemplateUrl ==='views/pool.html' && $rootScope.keyTimer) {
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = undefined;
                    $log.debug('canceling pool key timer');
                }
                if (from && from.loadedTemplateUrl ==='views/osd-host.html' && $rootScope.keyTimer) {
                    $timeout.cancel($rootScope.keyTimer);
                    $rootScope.keyTimer = undefined;
                    $log.debug('canceling osd host key timer');
                }
            });
            // add show requests handler for request queue
            $rootScope.showRequests = function() {
                angular.element(document.getElementsByClassName('RequestManagement')[0]).scope().show();
            };
            // Used by in app menu bar to switch routes
            // e.g. Cluster|OSD|Pools|Logs
            $rootScope.switchView = function(view) {
                $location.path(view);
            };
        };
        return ['$rootScope', 'MenuService', '$location', '$timeout', '$log', runBlock];
    });
})();
