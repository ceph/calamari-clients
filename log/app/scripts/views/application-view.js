/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
], function ($, _, Backbone, JST) {
    'use strict';

    var ApplicationView = Backbone.View.extend({
        template: JST['app/scripts/templates/application.ejs']
    });

    return ApplicationView;
});