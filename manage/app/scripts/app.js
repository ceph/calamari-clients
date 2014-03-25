/* global define */
(function() {
    'use strict';
    define(['lodash', 'angular', 'RouteConfig', 'ApiModule', 'requests/requestModule', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'controllers/pool-new', 'controllers/tools', 'controllers/pool-modify', 'navbar/navbarModule', 'services/menu', 'run', 'controllers/first', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(_, angular, RouteConfig, APIModule, RequestModule, RootController, PoolController, OSDController, OSDHostController, PoolNewController, ToolsController, PoolModifyController, NavbarModule, MenuService, PostInitRunBlock, FirstTimeController) {
        var app = angular.module('manageApp', [
                'ngAnimate',
            APIModule,
            RequestModule,
            NavbarModule,
                'ngCookies',
                'ngResource',
                'ngSanitize',
                'ngRoute',
                'mgcrea.ngStrap'
        ])
            .controller('RootController', RootController)
            .controller('PoolController', PoolController)
            .controller('PoolNewController', PoolNewController)
            .controller('OSDController', OSDController)
            .controller('OSDHostController', OSDHostController)
            .controller('ToolController', ToolsController)
            .controller('PoolModifyController', PoolModifyController)
            .controller('FirstTimeController', FirstTimeController)
            .service('MenuService', MenuService)
            .run(PostInitRunBlock)
            .config(RouteConfig);

        console.log(app);
        angular.element(document).ready(function() {
            _.each([{
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
