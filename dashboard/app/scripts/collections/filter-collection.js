/*global define*/

define([
    'underscore',
    'backbone',
    'models/filter-model'
], function (_, Backbone, FilterModel) {
    'use strict';

    var FilterCollection = Backbone.Collection.extend({
        model: FilterModel,
        idAttribute: 'index'
    });

    return FilterCollection;
});
