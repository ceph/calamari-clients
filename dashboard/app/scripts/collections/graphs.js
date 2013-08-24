/*global define*/

define([
    'underscore',
    'backbone',
    'models/graph-model'
], function (_, Backbone, GraphsModel) {
    'use strict';

    var GraphsCollection = Backbone.Collection.extend({
        model: GraphsModel
    });

    return GraphsCollection;
});
