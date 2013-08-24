/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var GraphModel = Backbone.Model.extend({
        defaults: {
            target: [],
            origin: '',
            format: 'svg'
        }
    });

    return GraphModel;
});
