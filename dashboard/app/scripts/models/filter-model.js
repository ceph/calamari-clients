/*global define*/

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';
    var STATES = {
        Default: 0,
        Success: 1,
        Warning: 2,
        Important: 3,
        Info: 4,
        Inverse: 5
    };
    var _STATES = ['', 'success', 'warning', 'important', 'info', 'inverse'];

    var FilterModel = Backbone.Model.extend({
        _STATES: _STATES,
        STATES: STATES,
        defaults: {
            count: 0,
            category: 'osd',
            visible: true,
            label: 'filter',
            enabled: true,
            labelState: _STATES[STATES.Success]
        }
    });

    return FilterModel;
});
