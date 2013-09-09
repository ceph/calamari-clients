/*global define*/

define([
    'underscore',
    'backbone',
    'marionette'
], function (_, Backbone) {
    'use strict';

    var GraphiteCpuModel = Backbone.Model.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=servers.' + this.host + '.cpu.*';
        },
        parse: function(resp) {
            return _.reduce(resp, function(memo, value) {
                memo[value.text] = value.id;
                return memo;
            }, {});
        },
        initialize: function(attrs, options) {
            this.graphiteHost = Backbone.Marionette.getOption(options, 'graphiteHost');
        },
        fetchMetrics: function(host) {
            this.host = host;
            return this.fetch();
        },
        defaults: {
        }
    });

    return GraphiteCpuModel;
});
