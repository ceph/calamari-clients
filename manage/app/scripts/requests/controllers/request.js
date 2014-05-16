/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

        var RequestController = function($timeout, $log, $scope, ClusterResolver, RequestService, RequestTrackingService, $aside) {
            function getPollTimeFn() {
                var delayMs = 1250;
                return function() {
                    if (delayMs < 20000) {
                        delayMs *= 2;
                    }
                    return delayMs;
                };
            }
            ClusterResolver.then(function() {
                var myAside = $aside({
                    'title': 'Requested Tasks',
                    'template': 'views/request.html',
                    'animation': 'am-fade-and-slide-right',
                    'backdropAnimation': 'animation-fade',
                    'show': false,
                    'container': '.RequestManagement'
                });

                function responseParser(response) {
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
                }

                $scope.timeout = false;

                function refresh() {
                    // re-install the timer even if it errors out
                    if ($scope.timeout === false) {
                        return;
                    }
                    RequestService.getList().then(responseParser)['finally'](function() {
                        $timeout(refresh, $scope.pollTimeoutInMs());
                    });
                }

                myAside.$scope.empty = true;
                $scope.show = function() {
                    myAside.$scope.$show();
                    myAside.$scope.$hide = _.wrap(myAside.$scope.$hide, function($hide) {
                        $hide();
                        $scope.timeout = false;
                    });
                    $scope.pollTimeoutInMs = getPollTimeFn();
                    $scope.timeout = true;
                    refresh();
                };
            });
        };
        return ['$timeout', '$log', '$scope', 'ClusterResolver', 'RequestService', 'RequestTrackingService', '$aside', RequestController];
    });
})();
