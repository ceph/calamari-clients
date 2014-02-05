/* global define */
(function() {
    'use strict';
    define([], function() {
        var RouteConfig = function($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: 'views/main.html',
                controller: 'RootController'
            }).when('/osd', {
                templateUrl: 'views/osd.html',
                controller: 'OSDController'
            }).when('/osd/:fqdn', {
                templateUrl: 'views/osd-host.html',
                controller: 'OSDHostController'
            }).when('/pool', {
                templateUrl: 'views/pool.html',
                controller: 'PoolController'
            }).when('/pool', {
                templateUrl: 'views/pool.html',
                controller: 'PoolController'
            }).when('/pool/new', {
                templateUrl: 'views/pool-new.html',
                controller: 'PoolController'
            })
                .otherwise({
                redirectTo: '/'
            });
        };
        return RouteConfig;
    });
})();
