/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var pageSize = 32;
    var RequestService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                /* jshint camelcase: false */
                return this.restangular.cluster().customGETLIST('request', {
                    page_size: pageSize
                }).then(function(requests) {
                    return requests;
                });
            },
            get: function(id) {
                return this.restangular.clusterFull().one('request', id).get().then(function(resp) {
                    return resp.data;
                });
            },
            getComplete: function() {
                /* jshint camelcase: false */
                return this.restangular.cluster().customGETLIST('request', {
                    state: 'complete',
                    page_size: pageSize
                });
            },
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
