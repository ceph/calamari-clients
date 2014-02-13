/* global define */
(function() {
    'use strict';
    define(['angular', 'ApiModule', './controllers/request', './services/request-tracking', 'angular-sanitize', 'angular-route', 'angular-animate', 'angular-strap', 'angular-growl'], function(angular, APIModule, RequestController, RequestTrackingService) {
        var moduleName = 'requestManagerModule';
        angular.module(moduleName, ['ngSanitize', 'ngRoute', 'ngAnimate', 'mgcrea.ngStrap', 'angular-growl', APIModule])
            .controller('RequestController', RequestController)
            .provider('RequestTrackingService', RequestTrackingService)
            .config(['growlProvider',
            function(growlProvider) {
                growlProvider.globalTimeToLive(5000);
            }
        ]);
        return moduleName;
    });
})();
