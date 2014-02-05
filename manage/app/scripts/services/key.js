/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var KeyService = function(Restangular) {
        var restangular = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2');
        });
        var Service = function() {
            this.restangular = restangular;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.all('key').getList().then(function(keys) {
                    return keys;
                });
            },
            get: function(id) {
                return this.restangular.one('key', id).get().then(function(key) {
                    return key[0];
                });
            }
        });
        return new Service();
    };
    return ['Restangular', KeyService];
});
