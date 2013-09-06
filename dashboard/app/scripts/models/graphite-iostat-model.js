/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var GraphiteCpuModel = Backbone.Model.extend({
        url: '/api/graphite/iometrics',
        parse: function(resp) {
            return _.reduce(resp, function(memo, value) {
                memo[value.text] = value.id;
                return memo;
            }, {});
        },
        defaults: {
        }
    });

    return GraphiteCpuModel;
});
