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
                    myAside.$scope.$show();
                    RequestService.getList().then(function(response) {
                        response = _.map(response, function(request) {
                            /* jshint camelcase: false */
                            var time = request.state === 'complete' ? request.completed_at : request.requested_at;
                            var headline = request.headline;
                            var state = request.state;
                            if (request.error) {
                                state = 'error';
                            }
                            return {
                                headline: headline,
                                state: state,
                                reltime: moment(time).fromNow(),
                                time: moment(time).format(),
                                error_message: request.error_message
                            };
                        });
                        myAside.$scope.tasks = response;
                        myAside.$scope.empty = response.length === 0;
                        myAside.$scope._hide = function() {
                            myAside.$scope.$hide();
                        };
                    });
                };
            });
        };
        return ['$log', '$scope', 'ClusterResolver', 'RequestService', 'RequestTrackingService', '$aside', RequestController];
    });
})();
