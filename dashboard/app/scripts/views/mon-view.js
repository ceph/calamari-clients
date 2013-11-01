/*global define*/
// jshint camelcase: false
define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'humanize', 'marionette'], function($, _, Backbone, JST, animation, humanize) {
    'use strict';

    var MonView = Backbone.Marionette.ItemView.extend({
        className: 'gauge card mon',
        template: JST['app/scripts/templates/mon.ejs'],
        countTemplate: _.template('<%- count %> of <%- total %>'),
        ui: {
            'spinner': '.fa-spinner',
            'monState': '.mon-state',
            'monCount': '.mon-count',
            'subText': '.subtext'
        },
        modelEvents: {
            'change': 'updateModel'
        },
        updateModel: function(model) {
            var attr = model.attributes;
            var total = attr.ok.count + attr.warn.count + attr.critical.count;
            this.model.set('total', total, {
                silent: true
            });
            this.updateView();
        },
        updateView: function() {
            var attr = this.model.attributes;
            this.ui.monState.removeClass('fail ok warn');
            var clazz = 'ok';
            if (attr.total - attr.ok.count > 0) {
                clazz = 'warn';
                if (attr.total - (attr.warn.count + attr.critical.count) === 1) {
                    clazz = 'fail';
                }
            }
            this.ui.monState.addClass(clazz);
            this.ui.monCount.text(this.countTemplate({
                total: attr.total,
                count: attr.ok.count

            }));
        },
        updateTimer: function() {
            this.ui.subText.text(humanize.relativeTime(this.model.get('cluster_update_time_unix') / 1000));
            this.timer = setTimeout(this.updateTimer, 1000);
        },
        initialize: function() {
            _.bindAll(this, 'disappear', 'reappear', 'expand', 'collapse', 'set', 'updateModel', 'updateView', 'updateTimer');
            this.model = new Backbone.Model({
                cluster_update_time_unix: Date.now()
            });
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
                this.updateTimer();
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
        set: function(model) {
            this.model.set(_.extend({
                cluster_update_time_unix: model.attributes.cluster_update_time_unix
            }, model.attributes.mon));
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

    return MonView;
});
