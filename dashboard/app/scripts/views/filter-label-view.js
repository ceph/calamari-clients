/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'bootstrap-switch'], function($, _, Backbone, JST) {
    'use strict';

    var FilterLabelView = Backbone.Marionette.ItemView.extend({
        tagName: 'div',
        ui: {
            'toggle': '.make-switch'
        },
        getSwitch: function() {
            return this.$('.make-switch');
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
            var count = '-';
            if (model) {
                count = model.get('count');
            }
            this.getSwitch().find('label').text(count);
        },
        isEnabled: function(model) {
            return model.get('enabled');
        },
        isVisible: function(model) {
            return model.get('visible');
        },
        enabled: function() {
            var enabled = this.isEnabled(this.model);
            this.getSwitch().bootstrapSwitch('setState', enabled, true /* skip emit change event */ );
        },
        visible: function() {
            if (this.isVisible(this.model)) {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        switchDisabled: function() {
            this.getSwitch().bootstrapSwitch('setActive', false);
        },
        switchEnabled: function() {
            this.getSwitch().bootstrapSwitch('setActive', true);
        },
        stateColorMap: {
            'up/out': ['success', 'warning'],
            'down/in': ['success', 'warning'],
            'creating': ['success', 'warning'],
            'replaying': ['success', 'warning'],
            'splitting': ['success', 'warning'],
            'scrubbing': ['success', 'warning'],
            'degraded': ['success', 'warning'],
            'repair': ['success', 'warning'],
            'recovering': ['success', 'warning'],
            'backfill': ['success', 'warning'],
            'wait-backfill': ['success', 'warning'],
            'remapped': ['success', 'warning'],
            'inconsistent': ['danger', 'default'],
            'down': ['danger', 'default'],
            'peering': ['danger', 'default'],
            'incomplete': ['danger', 'default'],
            'stale': ['danger', 'default']
        },
        postRender: function() {
            var colors = this.stateColorMap[this.model.get('label')] || ['primary', 'info'];
            var $switch = this.getSwitch().attr({
                'data-on': colors[0],
                'data-off': colors[1]
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
            this.enabled();
            this.updateCount();
        },
        template: JST['app/scripts/templates/filter-label.ejs']
    });

    return FilterLabelView;
});
