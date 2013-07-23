/*global define*/
/* jshint -W106, -W069*/
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
            _.bindAll(this, 'updateView', 'set');
            // The are defaults for Gauge.js and can be overidden from the contructor
            this.App = Backbone.Marionette.getOption(this, 'App');

            if (this.App) {
                this.App.vent.on('usage:update', this.set);
            }

            this.opts = {};
            _.extend(this.opts, {
                lines: 10,
                colorStart: '#80d2dc',
                colorStop: '#55aeba',
                generateGradient: true

            });
            this.title = options.title === undefined ? 'Untitled' : options.title;
            this.on('render', this.postRender);
        },
        // Once the render has been executed and has set up the widget
        // add the canvas based gauge dial
        postRender: function() {
            this.gauge = new Gauge(this.ui.canvas[0]).setOptions(this.opts);
            this.gauge.setTextField(this.ui.number[0]);
            this.gauge.set(0);
            this.gauge.maxValue=100;
            this.gauge.minValue=0;
            this.triggerMethod('item:postrender', this);
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
        }
    });
});
