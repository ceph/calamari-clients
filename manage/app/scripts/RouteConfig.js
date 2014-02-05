/* global define */
(function() {
    'use strict';
    define([], function() {
        var RouteConfig = function($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: 'views/main.html',
                controller: 'RootController',
                resolve: { 'Resolver': 'ClusterResolver' }
            }).when('/osd', {
                templateUrl: 'views/osd.html',
                controller: 'OSDController',
                resolve: { 'Resolver': 'ClusterResolver' }
            }).when('/osd/:fqdn', {
                templateUrl: 'views/osd-host.html',
                controller: 'OSDHostController',
                resolve: { 'Resolver': 'ClusterResolver' }
            }).when('/pool', {
                templateUrl: 'views/pool.html',
                controller: 'PoolController',
                resolve: { 'Resolver': 'ClusterResolver' }
            }).when('/pool/new', {
                templateUrl: 'views/pool-new.html',
                controller: 'PoolController',
                resolve: { 'Resolver': 'ClusterResolver' }
            })
                .otherwise({
                redirectTo: '/'
            });
        };
        return [ '$routeProvider', RouteConfig ];
    });
})();