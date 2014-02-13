/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var RequestController = function($log, $scope, ClusterResolver, RequestService, RequestTrackingService, $aside) {
            ClusterResolver.then(function() {
                var myAside = $aside({
                    'title': 'Requested Tasks',
                    'template': 'views/request.html',
                    'animation': 'am-fade-and-slide-right',
                    'backdropAnimation': 'animation-fade',
                    'show': false,
                    'container': '.RequestManagement'
                });
                myAside.$scope.empty = true;
                $scope.show = function() {
                    RequestService.getList().then(function(response) {
                        myAside.show();
                        response = _.map(response.reverse(), function(request) {
                            /* jshint camelcase: false */
                            var time = request.state === 'complete' ? request.completed_at : request.requested_at;
                            var headline = request.headline;
                            var state = request.state;
                            if (request.error) {
                                headline += ' ' + request.error_message;
                                state = 'error';
                            }
                            return {
                                headline: request.headline,
                                state: state,
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
