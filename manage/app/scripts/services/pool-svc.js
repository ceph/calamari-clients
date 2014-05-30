/*global define*/
define(['lodash'], function(_) {
    'use strict';
    // Wraps the **api/v2/cluster/&lt;fsid&gt;/pool** API end-point.
    // 
    var PoolService = function(ClusterService) {

        // **Constructor**
        var Service = function() {
            this.restangular = ClusterService;
        };

        Service.prototype = _.extend(Service.prototype, {
            // **getList**
            // **@returns** a promise which has the list of all the
            // pools being managed by this Cluster.
            getList: function() {
                return this.restangular.cluster().all('pool').getList().then(function(pools) {
                    return pools;
                });
            },
            // **get**
            // **@param** id - id of the pool you wish to retrieve
            // **@returns** a promise with the meta data associated with this pool.
            get: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.cluster().one('pool', id).get().then(function(pool) {
                    return pool;
                });
            },
            // **remove**
            // **@param** id - id of pool you wish to remove.
            // This is a **destructive** operation and will delete
            // any data on this pool.
            // **@returns** a promise with the request id for the operation.
            remove: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('pool', id).remove();
            },
            // **patch**
            // **@param** id - id of pool you are trying to patch.
            // **@param** update - object with key value pairs you are changing.
            // **@returns** a promise with the request id for the operation.
            patch: function(id, update) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('pool', id).patch(update);
            },
            // **create**
            // **@param** pool - object with key value pairs used to configure a new pool.
            // **@returns** a promise which returns a request id to track the task.
            create: function(pool) {
                return this.restangular.clusterFull().all('pool').post(pool);
            },
            // **defaults**
            // **@returns** the cluster pool default values.
            // We're mostly interesting in size and crush_ruleset at this time.
            defaults: function() {
                return this.restangular.cluster().one('pool').get({
                    defaults: ''
                });
            }
        });
        return new Service();
    };
    return ['ClusterService', PoolService];
});
