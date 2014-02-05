/* global define */
(function() {
    'use strict';
    define(['angular', 'RouteConfig', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(angular, RouteConfig, RootController, PoolController, OSDController, OSDHostController) {
        angular.module('manageApp', [
                'ngCookies',
                'ngResource',
                'ngSanitize',
                'ngRoute',
                'mgcrea.ngStrap',
                'ngAnimate',
                'restangular'
        ])
            .controller('RootController', RootController)
            .controller('PoolController', PoolController)
            .controller('OSDController', OSDController)
            .controller('OSDHostController', OSDHostController)
            .config(RouteConfig);
        angular.bootstrap(document.getElementsByClassName('manageApp')[0], ['manageApp']);
    });
})();
