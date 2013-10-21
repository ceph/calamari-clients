/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'bootstrap-switch'], function($, _, Backbone, JST) {
    'use strict';

    var FilterLabelView = Backbone.Marionette.ItemView.extend({
        tagName: 'div',
        ui: {
            'btn': '.make-switch'
        },
        initialize: function() {
            this.listenTo(this.model, 'change:enabled', this.enabled);
            this.listenTo(this.model, 'change:visible', this.visible);
            this.listenTo(this.model, 'change:count', this.updateCount);
            this.listenTo(this, 'render', this.postRender);
            this.listenTo(this.options.vent, 'disable', this.switchDisabled);
            this.listenTo(this.options.vent, 'enable', this.switchEnabled);
            _.bindAll(this, 'switchDisabled', 'switchEnabled');
        },
        updateCount: function(model) {
            this.$('.make-switch label').text(model.get('count'));
        },
        isEnabled: function(model) {
            return model.get('enabled');
        },
        isVisible: function(model) {
            return model.get('visible');
        },
        enabled: function() {
            var fnName = this.isEnabled(this.model) ? 'removeClass' : 'addClass';
            //            this.ui.count[fnName]('filter-opt-disable');
            this.ui.btn[fnName]('active');
        },
        visible: function() {
            if (!this.isVisible(this.model)) {
                this.$el.hide();
            }
        },
        switchDisabled: function() {
            var $switch = this.$('.make-switch');
            $switch.bootstrapSwitch('setActive', false);
        },
        switchEnabled: function() {
            var $switch = this.$('.make-switch');
            $switch.bootstrapSwitch('setActive', true);
        },
        postRender: function() {
            var $switch = this.$('.make-switch').attr({
                'data-on': 'success',
                'data-off': 'danger'
            });
            var self = this;
            $switch.bootstrapSwitch('destroy');
            $switch.bootstrapSwitch().on('switch-change', function() {
                var d = $.Deferred();
                self.options.vent.trigger('disable');
                self.model.set('enabled', !self.model.get('enabled'));
                self.options.vent.trigger('filter', d);
                d.done(function() {
                    self.options.vent.trigger('enable');
                });
            }).on('click', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
            });
            this.visible();
        },
        template: JST['app/scripts/templates/filter-label.ejs']
    });

    return FilterLabelView;
});
