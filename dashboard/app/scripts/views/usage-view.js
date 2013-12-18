/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'gauge', 'humanize', 'helpers/animation', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, Gauge, humanize, animation, gaugeHelper) {
    'use strict';

    /* UsageView
     * ---------
     *  This is the view for the usage card widget in the dashboard
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/usage.ejs'],
        cardTitleTemplate: _.template('<%- used %>% Usage'),
        timer: null,
        delay: 20000,
        ui: {
            cardtitle: '.card-title',
            number: '.number',
            totalused: '.totalused',
            totalcap: '.totalcap',
            canvas: '.usage-canvas',
            spinner: '.fa-spinner'
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
                this.listenTo(this.App.vent, 'usage:update', this.set);
            }

            this.opts = {};
            _.extend(this.opts, {
                lines: 10,
                'font-size': '0px',
                percentColors: [
                    [0.0, '#1ae61a'],
                    [0.60, '#e6e619'],
                    [1.0, '#e61919']
                ],
                generateGradient: true,
                highDpiSupport: false
            });
            this.title = options.title === undefined ? 'Untitled' : options.title;
            this.listenToOnce(this, 'render', this.postRender);
            gaugeHelper(this, 'usage');
        },
        // Once the render has been executed and has set up the widget
        // add the canvas based gauge dial
        postRender: function() {
            this.gauge = new Gauge(this.ui.canvas[0]).setOptions(this.opts);
            this.gauge.set(0);
            this.gauge.maxValue = 100;
            this.gauge.minValue = 0;
            this.ui.canvas.css({
                'height': '',
                'width': ''
            });
            this.triggerMethod('item:postrender', this);
        },
        warningThreshold: 90,
        displayWarning: function() {
            if (this.model.getPercentageUsed() > this.warningThreshold) {
                this.trigger('status:warn');
            } else {
                this.trigger('status:ok');
            }
        },
        updateView: function(model) {
            var attr = model.toJSON();
            var space = attr.space;
            var used = humanize.filesize(space.used_bytes, undefined, 1);
            used = used.replace(' ', '');
            var total = humanize.filesize(space.capacity_bytes, undefined, 1);
            total = total.replace(' ', '');
            this.ui.number.text(used);
            this.ui.totalcap.text(total);
            this.gauge.set(model.getPercentageUsed());
            this.displayWarning();
        },
        set: function(model) {
            this.model.set(model.toJSON());
        }
    });
});
