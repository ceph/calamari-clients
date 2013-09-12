/*global define*/

define(['underscore', 'backbone', 'models/graphite-model', ], function(_, Backbone, GraphiteModel) {
    'use strict';

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
