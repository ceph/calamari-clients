/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var UserService = function(Restangular, ErrorService) {
        var Service = function() {
            this.restangular = Restangular.withConfig(function(RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v2').setErrorInterceptor(ErrorService.errorInterceptor);
            });
            this.restv1 = Restangular.withConfig(function(RestangularConfigurer) {
                RestangularConfigurer.setBaseUrl('/api/v1').setErrorInterceptor(ErrorService.errorInterceptor);
            });
        };
        Service.prototype = _.extend(Service.prototype, {
            get: function(id) {
                return this.restangular.one('user', id).get().then(function(lines) {
                    return lines;
                });
            },
            me: function() {
                return this.get('me').then(function(me) {
                    me.isReadOnly = true;
                    return me;
                });
            },
            logout: function() {
                return this.restv1.one('auth').one('logout').get();
            }
        });
        return new Service();
    };
    return ['Restangular', 'ErrorService', UserService];
});
