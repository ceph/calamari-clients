/* global define */
(function() {
    'use strict';
    define(['lodash', 'angular', 'RouteConfig', 'ApiModule', 'requests/requestModule', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'controllers/pool-new', 'controllers/tools', 'controllers/pool-modify', 'navbar/navbarModule', 'services/menu', 'run', 'controllers/first', 'controllers/userdropdown', 'controllers/bell', 'services/configuration', 'services/error', 'git', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(_, angular, RouteConfig, APIModule, RequestModule, RootController, PoolController, OSDController, OSDHostController, PoolNewController, ToolsController, PoolModifyController, NavbarModule, MenuService, PostInitRunBlock, FirstTimeController, UserDropDownController, BellController, ConfigurationService, ErrorService, GitRunBlock) {

        // This file initializes the application node graph.
        //
        // This application contains 3 custom modules:
        //
        //  * The JSON API surface lives in **APIModule**.
        //  * The **RequestModule** contains the Request Controller
        //    and Request Tracker Singleton.
        //  * The **NavbarModule** contains the top menubar
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
        // Controllers are responsible for initial view state.
        // Controllers themselves are meant to be stateless and are
        // designed to re-store the view state every time they are
        // loaded. Treat them as if they are loaded once on page
        // initialization and then not used again.
        //
        // Typically one controllers one view, as this reduces overall
        // complexity. We don't always do that. @see RootController.
            .controller('RootController', RootController)
            .controller('PoolController', PoolController)
            .controller('PoolNewController', PoolNewController)
            .controller('OSDController', OSDController)
            .controller('OSDHostController', OSDHostController)
            .controller('ToolController', ToolsController)
            .controller('PoolModifyController', PoolModifyController)
            .controller('FirstTimeController', FirstTimeController)
            .controller('UserDropDownController', UserDropDownController)
            .controller('BellController', BellController)
        // Services are where a module can store state. They are loaded
        // once at start up and because they're shared module wide, they can
        // be used to maintain state between controllers.
            .service('MenuService', MenuService)
            .service('ConfigurationService', ConfigurationService)
            .service('ErrorService', ErrorService)
        // Run blocks are run once at module startup.
        // This is an ideal place to exec one time tasks.
            .run(PostInitRunBlock)
            .run(GitRunBlock)
        // Service Providers may be individually configured by modules.
            .config(['$logProvider',
            function($logProvider) {
                $logProvider.debugEnabled(false);
            }
        ]).config(RouteConfig);

        console.log(app);

        // We don't use ngapp markup to tell Angular what part of the
        // DOM to run the module against, instead we manually
        // bootstrap it by passing it the element and module.
        //
        // This lets us control the start up order and defer
        // startup till require has loaded all the dependencies.
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
