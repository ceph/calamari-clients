/* global define */
(function() {
    'use strict';
    define(['angular'], function() {
        /* Setup Broadcast Service With Correct Root Scopes */
        var runBlock = function($log, BroadcastService, $rootScope, $location) {
            var source = angular.element(document.getElementsByClassName('appbar')[0]).injector().get('$rootScope');
            BroadcastService.addSource(source);
            BroadcastService.addSink($rootScope);
            BroadcastService.on('route', function(target, dest) {
                $log.debug(target, dest);
                $rootScope.$apply(function() {
                    $location.path('/' + dest);
                });
            });
        };
        return ['$log', 'BroadcastService', '$rootScope', '$location', runBlock];
    });
})();
