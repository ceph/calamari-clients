/* global define */
(function() {
    'use strict';
    define(['angular', './controllers/navbar', 'angular-sanitize', 'angular-route', 'angular-animate'], function(angular, navbarController) {
        var moduleName = 'navbarModule';
        angular.module(moduleName, ['ngSanitize', 'ngRoute', 'ngAnimate'])
            .controller('NavbarController', navbarController);
        return moduleName;
    });
})();
