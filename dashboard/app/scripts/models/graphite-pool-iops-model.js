/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    var GraphitePoolIopsModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=ceph.cluster.ceph.pool.*';
        },
        keys: function() {
            var keys =  _.map(this.attributes, function(v, k) {
                return k;
            });
            if (this.filter) {
                return this.filter(keys);
            }
            return keys;
        }
    });

    return GraphitePoolIopsModel;
});
