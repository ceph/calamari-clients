/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates'
], function ($, _, Backbone, JST) {
    'use strict';

    var FilterLabelView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/filter-label.ejs'],
        templateHelpers: {
            isVisible: function() {
                return this.visible ? '' : 'label-hidden';
            }
        }
    });

    return FilterLabelView;
});
