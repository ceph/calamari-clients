/* global define */
define(['angular', 'RouteConfig', 'controllers/root', 'controllers/pool', 'controllers/osd', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate'], function(angular, RouteConfig, RootController, PoolController, OSDController) {
    'use strict';
    angular.module('manageApp', [
            'ngCookies',
            'ngResource',
            'ngSanitize',
            'ngRoute',
            'mgcrea.ngStrap',
            'ngAnimate'
    ])
        .controller('RootController', RootController)
        .controller('PoolController', PoolController)
        .controller('OSDController', OSDController)
        .config(RouteConfig);
    angular.bootstrap(document.getElementsByClassName('manageApp')[0], ['manageApp']);
});
