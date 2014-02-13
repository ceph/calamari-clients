/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var RequestController = function($log, $scope, ClusterResolver, RequestService, RequestTrackingService, $aside) {
            ClusterResolver.then(function() {
                var myAside = $aside({
                    'title': 'Requested Tasks',
                    'template': 'views/request.html',
                    'container': 'body',
                    'animation': 'am-fade-and-slide-left',
                    'backdropAnimation': 'animation-fade',
                    'show': false
                });
                myAside.$scope.empty = true;
                $scope.show = function() {
                    RequestService.getList().then(function(response) {
                        myAside.show();
                        response = _.map(response.reverse(), function(request) {
                            /* jshint camelcase: false */
                            var time = request.state === 'complete' ? request.completed_at : request.requested_at;
                            return {
                                headline: request.headline,
                                state: request.state,
                                time: moment(time).fromNow()
                            };
                        });
                        myAside.$scope.tasks = response;
                        myAside.$scope.empty = response.length === 0;
                    });
                };
            });
        };
        return ['$log', '$scope', 'ClusterResolver', 'RequestService', 'RequestTrackingService', '$aside', RequestController];
    });
})();
