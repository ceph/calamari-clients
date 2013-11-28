/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'dygraphs',
    'marionette'
], function ($, _, Backbone, JST) {
    'use strict';

    var IopsDashView = Backbone.Marionette.ItemView.extend({
        className: 'custom-gutter col-sm-12 col-xs-12 col-lg-9 col-md-9',
        template: JST['app/scripts/templates/iops-dash.ejs']
    });

    return IopsDashView;
});
