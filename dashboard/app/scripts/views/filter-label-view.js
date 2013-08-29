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
        enabled: function() {
            var fnName = this.model.get('enabled') ? 'removeClass' : 'addClass';
            this.$el[fnName].call(this.$el, 'label-disabled');
        },
        visible: function() {
            var fnName = this.model.get('visible') ? 'removeClass' : 'addClass';
            this.$el[fnName]('label-hidden');
        },
        className: function() {
            var classes = [];
            classes.push(this.model.get('enabled') ? '' : 'label-disabled');
            classes.push(this.model.get('visible') ? '' : 'label-hidden');
            return classes.join(' ');
        },
        template: JST['app/scripts/templates/filter-label.ejs']
    });

    return FilterLabelView;
});
