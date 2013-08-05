/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'gauge', 'humanize', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, Gauge, humanize, animation) {
    'use strict';

    /* UsageView
     * ---------
     *  This is the view for the usage card widget in the dashboard
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'gauge card span3 usage',
        template: JST['app/scripts/templates/usage.ejs'],
        timer: null,
        delay: 20000,
        ui: {
            cardtitle: '.card-title',
            number: '.number',
            totalused: '.totalused',
            totalcap: '.totalcap',
            canvas: '.usage-canvas',
            spinner: '.icon-spinner'
        },
        modelEvents: {
            'change': 'updateView'
        },
        serializeData: function() {
            return {
                title: this.title
            };
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
        initialize: function(options) {
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            _.bindAll(this, 'updateView', 'set', 'disappearAnimation', 'disappear', 'reappear', 'reappearAnimation', 'expand', 'collapse');
            // The are defaults for Gauge.js and can be overidden from the contructor
            this.App = Backbone.Marionette.getOption(this, 'App');

            if (this.App) {
                this.listenTo(this.App.vent, 'usage:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
            }

            this.opts = {};
            _.extend(this.opts, {
                lines: 10,
                colorStart: '#80d2dc',
                colorStop: '#55aeba',
                generateGradient: true

            });
            this.title = options.title === undefined ? 'Untitled' : options.title;
            this.listenToOnce(this, 'render', this.postRender);
        },
        // Once the render has been executed and has set up the widget
        // add the canvas based gauge dial
        postRender: function() {
            var self = this;
            this.gauge = new Gauge(this.ui.canvas[0]).setOptions(this.opts);
            this.gauge.setTextField(this.ui.number[0]);
            this.gauge.set(0);
            this.gauge.maxValue = 100;
            this.gauge.minValue = 0;
            this.triggerMethod('item:postrender', this);
            this.listenTo(this.App.vent, 'usage:request', function() {
                self.ui.spinner.css('visibility', 'visible');
            });
            this.listenTo(this.App.vent, 'usage:sync usage:error', function() {
                self.ui.spinner.css('visibility', 'hidden');
            });
        },
        updateView: function(model) {
            var attr = model.toJSON();
            var used = humanize.filesize(attr.report.total_used);
            used = used.replace(' ', '');
            var total = humanize.filesize(attr.report.total_space);
            total = total.replace(' ', '');
            this.ui.totalused.text(used);
            this.ui.totalcap.text(total);
            this.gauge.set(model.getPercentageUsed());
        },
        set: function(model) {
            this.model.set(model.toJSON());
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
});
