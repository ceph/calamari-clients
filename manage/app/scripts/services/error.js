/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var ErrorService = function($log, $modal) {
        var once = _.once(function unauthorized() {
            var modal = $modal({
                title: '<i class="text-danger fa fa-exclamation-circle"></i> Unauthorized Access',
                content: 'Your login appears to have expired. Try logging back in again.',
                show: true,
                html: true,
                backdrop: 'static'
            });
            modal.$scope.$hide = function() {
                document.location = '/login/';
            };
        });
        var Service = {
            errorInterceptor: function(response) {
                if (response.status === 403) {
                    once();
                    return false;
                }
                return response;
            }
        };
        return Service;
    };
    return ['$log', '$modal', '$location', ErrorService];
});
