/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    // Request the CPU target id keys from Graphite for a specific fqdn.
    var GraphiteCpuModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=servers.' + this.host + '.cpu.*';
        },
        keys: function() {
            return _.map(this.attributes, function(v, k) {
                return k;
            });
        }
    });

    return GraphiteCpuModel;
});
