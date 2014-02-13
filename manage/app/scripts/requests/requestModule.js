/* global define */
(function() {
    'use strict';
    define(['angular', 'ApiModule', './controllers/request', './services/request-tracking'], function(angular, APIModule, RequestController, RequestTrackingService) {
        var moduleName = 'requestManagerModule';
        angular.module(moduleName, ['ngSanitize', 'ngRoute', 'ngAnimate', 'mgcrea.ngStrap', APIModule])
            .controller('RequestController', RequestController)
            .factory('RequestTrackingService', RequestTrackingService);
        return moduleName;
    });
})();
