/*global define*/

define([
    'underscore',
    'backbone',
    'models/application-model'
], function (_, Backbone, models) {
    'use strict';

    var OSDCollection = Backbone.Collection.extend({
        model: models.OSDModel
    });

    return OSDCollection;
});
