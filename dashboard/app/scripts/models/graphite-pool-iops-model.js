/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    // Request the Pool ids for a given cluster FSID.
    var GraphitePoolIopsModel = GraphiteModel.extend({
        url: function() {
            var name = this.clusterName || 'ceph';
            return this.graphiteHost + '/metrics/find?query=ceph.cluster.' + name + '.pool.*';
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
