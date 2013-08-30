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
            this.listenTo(this, 'render', this.postRender);
        },
        isEnabled: function(model) {
            return model.get('enabled');
        },
        isVisible: function(model) {
            return model.get('visible');
        },
        enabled: function() {
            var fnName = this.isEnabled(this.model) ? 'removeClass' : 'addClass';
            var $count = this.$('.count');
            $count[fnName].call($count, 'filter-opt-disable');
        },
        visible: function() {
            var fnName = this.isVisible(this.model) ? 'removeClass' : 'addClass';
            this.$el[fnName].call(this.$el, 'btn-hidden');
        },
        postRender: function() {
            this.enabled();
            this.visible();
        },
        template: JST['app/scripts/templates/filter-label.ejs']
    });

    return FilterLabelView;
});
