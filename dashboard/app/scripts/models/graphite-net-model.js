/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    // request the network interfaces known about by Graphite for a given host.
    var GraphiteNetModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=servers.' + this.host + '.network.*';
        },
        keys: function() {
            return _.map(this.attributes, function(v, k) {
                return k;
            });
        }
    });

    return GraphiteNetModel;
});
