/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'marionette'
], function ($, _, Backbone, JST) {
    'use strict';

    var OsdHexView = Backbone.Marionette.ItemView.extend({
        className: 'hex',
        template: JST['app/scripts/templates/osd-hex.ejs'],
        initialize: function() {
        }
    });

    return OsdHexView;
});
