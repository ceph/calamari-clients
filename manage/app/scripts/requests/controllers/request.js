/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var RequestController = function($log, $scope, ClusterResolver, RequestService, $aside) {
            ClusterResolver.then(function() {
                var myAside = $aside({
                    'title': 'Requested Tasks',
                    'template': 'views/request.html',
                    'show': false
                });
                $scope.show = function() {
                    RequestService.getList().then(function(response) {
                        myAside.show();
                        myAside.$scope.tasks = response;
                    });
                };
            });
        };
        return ['$log', '$scope', 'ClusterResolver', 'RequestService', '$aside', RequestController];
    });
})();
