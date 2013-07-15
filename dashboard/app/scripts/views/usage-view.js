/*global define*/
/* jshint -W106*/
define(['jquery', 'underscore', 'backbone', 'templates', 'gauge', 'humanize', 'marionette'], function($, _, Backbone, JST, Gauge, humanize) {
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
            canvas: '.usage-canvas'
        },
        modelEvents: {
            'change': 'updateView'
        },
        serializeData: function() {
            return {
                title: this.title
            };
        },
        initialize: function(options) {
            // The are defaults for Gauge.js and can be overidden from the contructor
            if (options.App !== undefined) {
                this.App = options.App;
            }
            this.opts = {};
            _.extend(this.opts, {
                minValue: 0,
                maxValue: 100,
                lines: 10,
                colorStart: '#80d2dc',
                colorStop: '#55aeba',
                generateGradient: true

            });
            this.title = options.title === undefined ? 'Untitled' : options.title;
            this.on('render', this.postRender);
            _.bindAll(this, 'updateView', 'fetchUsage');

            if (this.App && !this.App.Config['offline']) {
                this.fetchUsage();
                this.startFetch();
            }
        },
        startFetch: function() {
            var self = this;
            this.timer = setTimeout(function() {
                self.fetchUsage();
                self.timer = self.startFetch();
            }, self.delay);
            return this.timer;
        },
        fetchUsage: function() {
            return this.model.fetch();
        },
        // Once the render has been executed and has set up the widget
        // add the canvas based gauge dial
        postRender: function() {
            this.gauge = new Gauge(this.ui.canvas[0]).setOptions(this.opts);
            this.gauge.setTextField(this.ui.number[0]);
            this.gauge.set(0);
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
        set: function(values) {
            this.model.set(values);
        }
    });
});
