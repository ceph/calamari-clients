/*global define*/
define(['lodash'], function(_) {
    'use strict';
    // Wraps the /api/v2/key Calamari API with a Service.
    var KeyService = function(Restangular, ErrorService) {
        // Basic Restangular instance.
        var restangular = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setErrorInterceptor(ErrorService.errorInterceptor);
        });
        // Full Response Restangular instance wth status codes.
        var restangularFull = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setFullResponse(true).setErrorInterceptor(ErrorService.errorInterceptor);
        });
        // Constructor
        var Service = function() {
            this.restangular = restangular;
            this.restangularFull = restangularFull;
        };
        Service.prototype = _.extend(Service.prototype, {
            // **getList**
            // Return all Minion Keys this calamari server has registered.
            getList: function() {
                return this.restangular.all('key').getList().then(function(keys) {
                    return keys;
                });
            },
            // **get**
            // Return a specific Minion Key.
            get: function(id) {
                return this.restangular.one('key', id).get().then(function(key) {
                    return key[0];
                });
            },
            // **accept**
            // Request that the array of ids be set to accepted state.
            // Used to accept new salt minions into Calamari.
            accept: function(ids) {
                var accepted = _.map(ids, function(id) {
                    return {
                        id: id,
                        status: 'accepted'
                    };
                });
                return this.restangularFull.all('key').patch(accepted);
            }
        });
        return new Service();
    };
    return ['Restangular', 'ErrorService', KeyService];
});
