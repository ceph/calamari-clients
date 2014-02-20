/* global define */
(function() {
    'use strict';
    define(['lodash', 'angular', 'RouteConfig', 'ApiModule', 'requests/requestModule', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'controllers/pool-new', 'controllers/tools', 'controllers/pool-modify', 'navbar/navbarModule', 'appbar/appbarModule', 'run', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(_, angular, RouteConfig, APIModule, RequestModule, RootController, PoolController, OSDController, OSDHostController, PoolNewController, ToolsController, PoolModifyController, NavbarModule, AppBarModule, PostInitRunBlock) {
        var app = angular.module('manageApp', [
                'ngAnimate',
            APIModule,
            RequestModule,
            NavbarModule,
            AppBarModule,
                'ngCookies',
                'ngResource',
                'ngSanitize',
                'ngRoute',
                'mgcrea.ngStrap',
        ])
            .controller('RootController', RootController)
            .controller('PoolController', PoolController)
            .controller('PoolNewController', PoolNewController)
            .controller('OSDController', OSDController)
            .controller('OSDHostController', OSDHostController)
            .controller('ToolController', ToolsController)
            .controller('PoolModifyController', PoolModifyController)
            .run(PostInitRunBlock)
            .config(RouteConfig);

        console.log(app);
        angular.element(document).ready(function() {
            _.each([{
                    clazz: 'RequestManagement',
                    module: [RequestModule]
                }, {
                    clazz: 'appbar',
                    module: [AppBarModule]
                }, {
                    clazz: 'inknav',
                    module: [NavbarModule]
                }, {
                    clazz: 'manageApp',
                    module: ['manageApp']
                }
            ], function(selector) {
                try {
                    angular.bootstrap(document.getElementsByClassName(selector.clazz)[0], selector.module);
                } catch (e) {
                    console.error('Failed to init ' + selector.module, e);
                }
            });
        });
    });
})();
