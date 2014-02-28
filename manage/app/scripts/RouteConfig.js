/* global define */
(function() {
    'use strict';
    define([], function() {
        var RouteConfig = function($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: 'views/root.html',
                menuId: 'cluster',
                controller: 'RootController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/osd', {
                templateUrl: 'views/osd.html',
                menuId: 'osd',
                controller: 'OSDController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/osd/server/:fqdn', {
                templateUrl: 'views/osd-host.html',
                menuId: 'osd',
                controller: 'OSDHostController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/osd/id/:id', {
                templateUrl: 'views/osd-modify.html',
                menuId: 'osd',
                controller: 'OSDModifyController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/pool', {
                templateUrl: 'views/pool.html',
                menuId: 'pool',
                controller: 'PoolController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/tools', {
                templateUrl: 'views/tool.html',
                menuId: 'tools',
                controller: 'ToolController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/pool/new', {
                templateUrl: 'views/pool-new.html',
                menuId: 'pool',
                controller: 'PoolNewController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            }).when('/first', {
                templateUrl: 'views/first.html',
                menuId: 'cluster',
                controller: 'FirstTimeController'
            }).when('/pool/modify/:id', {
                templateUrl: 'views/pool-modify.html',
                menuId: 'pool',
                controller: 'PoolModifyController',
                resolve: {
                    'Resolver': 'ClusterResolver'
                }
            })
                .otherwise({
                redirectTo: '/'
            });
        };
        return ['$routeProvider', RouteConfig];
    });
})();
