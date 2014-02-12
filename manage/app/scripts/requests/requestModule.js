/* global define */
(function() {
    'use strict';
    define(['angular', 'ApiModule', './controllers/request'], function(angular, APIModule, RequestController) {
        var moduleName = 'requestManagerModule';
        angular.module(moduleName, ['ngSanitize', 'ngRoute', 'ngAnimate', 'mgcrea.ngStrap', APIModule])
            .controller('RequestController', RequestController);
        return moduleName;
    });
})();
