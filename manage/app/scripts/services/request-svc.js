/*global define*/
define(['lodash'], function(_) {
    'use strict';
    // Default number of results in a request.
    var pageSize = 32;
    // Wraps the **/api/v2/cluster/&lt;fsid&gt;/request** API end-point.
    // This API is our interface in the User Request queue managed by
    // Calamari. When a request returns a 202 success code and a
    // request id.
    //
    // This request id is cached locally using indexdb and then we
    // periodically check the submitted queue to see if it still
    // running.
    //
    var RequestService = function(ClusterService) {

        // **constructor**
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            // **getList**
            // **@returns** a promise with most recent *pageSize* requests.
            getList: function() {
                /* jshint camelcase: false */
                return this.restangular.cluster().customGETLIST('request', {
                    page_size: pageSize
                }).then(function(requests) {
                    return requests;
                });
            },
            // **get**
            // **@returns** a promise with a single request by it's ID.
            get: function(id) {
                return this.restangular.clusterFull().one('request', id).get().then(function(resp) {
                    return resp.data;
                });
            },
            // **getComplete**
            // **@returns** a promise with most recent *pageSize* completed requests.
            getComplete: function() {
                /* jshint camelcase: false */
                return this.restangular.cluster().customGETLIST('request', {
                    state: 'complete',
                    page_size: pageSize
                });
            },
            // **getComplete**
            // **@returns** a promise with most recent *pageSize* submitted requests.
            getSubmitted: function() {
                /* jshint camelcase: false */
                return this.restangular.cluster().customGETLIST('request', {
                    state: 'submitted',
                    page_size: pageSize
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', RequestService];
});
