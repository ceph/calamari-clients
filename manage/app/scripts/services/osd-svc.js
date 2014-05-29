/*global define*/
define(['lodash'], function(_) {
    'use strict';
    // Wraps the **/api/v2/cluster/<fsid>/osd** service anchor point.
    //
    var OSDService = function(ClusterService) {
        // **Constructor**
        var Service = function() {
            this.restangular = ClusterService;
        };
        Service.prototype = _.extend(Service.prototype, {
            // **getList**
            // @returns promise
            getList: function() {
                return this.restangular.cluster().getList('osd').then(function(osds) {
                    return osds;
                });
            },
            // **getSet**
            // Return a specific subset of OSDs specified by OSD ID.
            // @param *ids* - array of ids as numbers.
            // @returns promise
            getSet: function(ids) {
                var idargs = _.reduce(ids, function(result, id) {
                    result.push(id);
                    return result;
                }, []);
                return this.restangular.cluster().getList('osd', {
                    'id__in[]': idargs
                }).then(function(osds) {
                    return osds;
                });
            },
            // **get**
            // @param *id* - id as number of OSD.
            // @returns promise
            get: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.cluster().one('osd', id).get().then(function(osd) {
                    return osd;
                });
            },
            // **patch**
            // @param *id* - id of OSD you wish to patch.
            //             ID must be parseable by parseInt.
            // @param *update* - object containing key value pairs you want to update.
            patch: function(id, update) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).patch(update);
            },
            // **down**
            // @param *id* - id of the OSD you wish to set to down.
            //        There is no way to set the OSD back to **up**.
            //        Ceph automatically promotes healthy down OSDs 
            //        back to **up** unless a noup flag is set on the
            //        cluster.
            // @return promise
            down: function(id) {
                return this.patch(id, {
                    up: false
                });
            },
            // **out**
            // @param *id* - id of the OSD you wish to set to out.
            // @return promise
            out: function(id) {
                return this.patch(id, {
                    'in': false
                });
            },
            // **in**
            // @param *id* - id of the OSD you wish to set to in.
            // @return promise
            in : function(id) {
                return this.patch(id, {
                    'in': true
                });
            },
            // **scrub**
            // @param *id* - id of the OSD you wish send a scrub command to.
            // @return promise
            scrub: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('scrub').post({});
            },
            /* jshint camelcase: false */
            // **deep_scrub**
            // @param *id* - id of the OSD you wish send a deep scrub command to.
            // @return promise
            deep_scrub: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('deep_scrub').post({});
            },
            // **repair**
            // @param *id* - id of the OSD you wish send a repair command to.
            // @return promise
            repair: function(id) {
                id = _.isString(id) ? parseInt(id, 10) : id;
                return this.restangular.clusterFull().one('osd', id).all('command').all('repair').post({});
            }
        });
        return new Service();
    };
    return ['ClusterService', OSDService];
});
