/*global define*/
define([
        'underscore',
        'backbone',
        'marionette'
], function(_, Backbone) {
    'use strict';

    var GraphiteModel = Backbone.Model.extend({
        url: function() {
            throw ('you need to define a url function');
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
            return this.fetch({
                reset: true
            });
        },
        defaults: {}
    });

    return GraphiteModel;
});
