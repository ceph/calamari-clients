/*global define*/

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';
    var FilterModel = Backbone.Model.extend({
        defaults: {
            count: 0,
            category: 'osd',
            visible: true,
            label: 'filter',
            enabled: true,
            labelState: 'ok'
        }
    });

    return FilterModel;
});
