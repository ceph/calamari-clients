/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    var GraphitePoolIopsModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=ceph.cluster.ceph.pool.*';
        },
        DriveRegexp: new RegExp('sd[a-z]$'),
        keys: function() {
            return _.map(this.attributes, function(v, k) {
                return k;
            });
        }
    });

    return GraphitePoolIopsModel;
});
