/*global define*/

define([
    'underscore',
    'backbone',
    'models/graphite-model'
], function (_, Backbone, GraphiteModel) {
    'use strict';

    var GraphiteIoModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=servers.' + this.host + '.iostat.*';
        }
    });

    return GraphiteIoModel;
});
