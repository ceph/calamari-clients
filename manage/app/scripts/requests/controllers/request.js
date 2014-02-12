/* global define */
(function() {
    'use strict';
    define(['lodash', 'moment'], function(_, moment) {

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
                        response = _.map(response, function(request) {
                            /* jshint camelcase: false */
                            var time = request.state === 'complete' ? request.completed_at : request.requested_at;
                            return {
                                headline: request.headline,
                                state: request.state,
                                time: moment(time).fromNow()
                            };
                        });
                        myAside.$scope.tasks = response;
                    });
                };
            });
        };
        return ['$log', '$scope', 'ClusterResolver', 'RequestService', '$aside', RequestController];
    });
})();
