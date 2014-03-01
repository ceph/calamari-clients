/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var OSDService = function(ClusterService) {
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            getList: function() {
                return this.restangular.cluster().all('osd').getList().then(function(pools) {
                    return pools;
                });
            },
            get: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.cluster().one('osd', id).get().then(function(pool) {
                    return pool;
                });
            },
            patch: function(id, update) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).patch(update);
            },
            scrub: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('scrub').post({});
            },
            deepScrub: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('deep_scrub').post({});
            },
            repair: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('repair').post({});
            }
        });
        return new Service();
    };
    return ['ClusterService', OSDService];
});
