/*global define*/
// ignore non-camel case decided by server
/* jshint -W106*/
define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    var PoolModel = Backbone.Model.extend({
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/pool';
        },
        defaults: {
            id: 0,
            cluster: 1,
            pool_id: 0,
            name: 'unknown',
            quota_max_bytes: 0,
            quota_max_objects: 0,
            used_objects: 0,
            used_bytes: 0
        }
    });
    return PoolModel;
});
