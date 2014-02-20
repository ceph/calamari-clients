/* global define */
(function() {
    'use strict';
    define(['angular', './controllers/appbar', './services/broadcast', 'angular-sanitize', 'angular-route', 'angular-animate'], function(angular, AppBarController, BroadcastService) {
        var moduleName = 'appbarModule';
        angular.module(moduleName, ['ngSanitize', 'ngRoute', 'ngAnimate'])
            .provider('BroadcastService', BroadcastService)
            .controller('AppBarController', AppBarController);
        return moduleName;
    });
})();
