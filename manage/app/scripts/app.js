/* global define */
(function() {
    'use strict';
    define(['angular', 'RouteConfig', 'ApiModule', 'requests/requestModule', 'controllers/root', 'controllers/pool', 'controllers/osd', 'controllers/osd-host', 'controllers/pool-new', 'controllers/tools', 'controllers/pool-modify', 'angular-cookies', 'angular-resource', 'angular-sanitize', 'angular-route', 'angular-strap', 'angular-animate', 'restangular'], function(angular, RouteConfig, APIModule, RequestModule, RootController, PoolController, OSDController, OSDHostController, PoolNewController, ToolsController, PoolModifyController) {
        var app = angular.module('manageApp', [
                'ngAnimate',
                APIModule,
                RequestModule,
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
            .config(RouteConfig);
        console.log(app);
        angular.element(document).ready(function() {
            angular.bootstrap(document.getElementsByClassName('manageApp')[0], ['manageApp']);
            angular.bootstrap(document.getElementsByClassName('RequestManagement')[0], [RequestModule]);
        });
    });
})();
