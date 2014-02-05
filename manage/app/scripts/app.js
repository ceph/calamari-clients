/* global define */
(function() {
    'use strict';
    define(['angular', 'RouteConfig', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'services/cluster', 'services/pool', 'services/server', 'services/key', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(angular, RouteConfig, RootController, PoolController, OSDController, OSDHostController, ClusterService, PoolService, ServerService, KeyService) {
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
            .factory('ClusterService', ClusterService)
            .factory('PoolService', PoolService)
            .factory('ServerService', ServerService)
            .factory('KeyService', KeyService)
            .config(RouteConfig);
        angular.bootstrap(document.getElementsByClassName('manageApp')[0], ['manageApp']);
    });
})();
