/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, animation) {
    'use strict';

    var PgView = Backbone.Marionette.ItemView.extend({
        className: 'gauge card pg',
        template: JST['app/scripts/templates/pg.ejs'],
        countTemplate: _.template('<span class="pg-count-top"><%- count %></span><br><span class="pg-count-bottom"><%- state %></span>'),
        ui: {
            'spinner': '.fa-spinner',
            'count': '.pg-count',
            'state': '.pg-state'
        },
        modelEvents: {
            'change': 'updateModel'
        },
        initialize: function() {
            _.bindAll(this, 'disappear', 'reappear', 'expand', 'collapse','set', 'updateModel', 'updateView');
            this.model = new Backbone.Model();
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
            }
            var self = this;
            this.listenToOnce(this, 'render', function() {
                self.listenTo(self.App.vent, 'status:request', function() {
                    self.ui.spinner.css('visibility', 'visible');
                });
                self.listenTo(self.App.vent, 'status:sync status:error', function() {
                    setTimeout(function() {
                        self.ui.spinner.css('visibility', 'hidden');
                    }, 250);
                });
            });
        },
        updateModel: function(model) {
            var attr = model.attributes;
            var total = attr.ok.count + attr.critical.count + attr.warn.count;
            this.model.set('total', total, { silent: true });
            setTimeout(this.updateView, 0);
        },
        prioritizeStates: function(states) {
            var ret = _.reduce(states, function(memo, value, key) {
                if (memo.count === undefined || value > memo.count) {
                    return { count: value, state: key };
                }
                return memo;
            }, { count: 0, state: '' });
            return ret;
        },
        updateView: function() {
            var attr = this.model.attributes;
            this.ui.state.removeClass('ok warn fail');
            var state;
            if (attr.critical.count > 0) {
                this.ui.state.text('CRITICAL').addClass('fail');
                state = this.prioritizeStates(attr.critical.states);
                this.ui.count.html(this.countTemplate(state));
            } else if (attr.warn.count > 0) {
                this.ui.state.text('WARN').addClass('warn');
                state = this.prioritizeStates(attr.warn.states);
                this.ui.count.html(this.countTemplate(state));
            } else {
                this.ui.state.text('OK').addClass('ok');
                state = this.prioritizeStates(attr.ok.states);
                this.ui.count.html(this.countTemplate(state));
            }
        },
        set: function(model) {
            this.model.set(model.attributes.pg);
        },
        expand: function(callback) {
            this.$el.css('display', 'block');
            if (callback) {
                callback.apply(this);
            }
        },
        collapse: function(callback) {
            this.$el.css('display', 'none');
            if (callback) {
                callback.apply(this);
            }
        },
        disappear: function(callback) {
            return this.disappearAnimation(this.$el, function() {
                this.$el.css('visibility', 'hidden');
                if (callback) {
                    callback.apply(this);
                }
            });
        },
        reappear: function(callback) {
            this.$el.css('visibility', 'visible');
            return this.reappearAnimation(this.$el, callback);
        }
    });

    return PgView;
});
