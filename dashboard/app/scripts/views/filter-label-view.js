/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates'
], function ($, _, Backbone, JST) {
    'use strict';

    var FilterLabelView = Backbone.Marionette.ItemView.extend({
        tagName: 'li',
        initialize: function() {
            this.listenTo(this.model, 'change:enabled', this.enabled);
            this.listenTo(this.model, 'change:visible', this.visible);
        },
        isEnabled: function(model) {
            return model.get('enabled');
        },
        isVisible: function(model) {
            return model.get('visible');
        },
        enabled: function() {
            var fnName = this.isEnabled(this.model) ? 'removeClass' : 'addClass';
            this.$el[fnName].call(this.$el, 'label-disabled');
        },
        visible: function() {
            var fnName = this.isVisible(this.model) ? 'removeClass' : 'addClass';
            this.$el[fnName].call(this.$el, 'label-hidden');
        },
        className: function() {
            var classes = [];
            classes.push(this.isEnabled(this.model) ? '' : 'label-disabled');
            classes.push(this.isVisible(this.model) ? '' : 'label-hidden');
            return classes.join(' ');
        },
        template: JST['app/scripts/templates/filter-label.ejs']
    });

    return FilterLabelView;
});
