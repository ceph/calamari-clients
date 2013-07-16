/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'marionette'], function($, _, Backbone, JST, humanize) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        className: 'gauge card span6 status',
        template: JST['app/scripts/templates/status.ejs'],
        title: 'status',
        ui: {
            cardTitle: '.card-title',
            subText: '.subtext'
        },
        modelEvents: {
            'change': 'updateView'
        },
        serializeData: function() {
            return {
                title: this.title,
                relTime: humanize.relativeTime(Date.now() / 1000)
            };
        },
        initialize: function(options) {
            // The are defaults for Gauge.js and can be overidden from the contructor
            _.bindAll(this, 'updateView');
            this.App = {
                Config: {}
            };
            if (options && options.App !== undefined) {
                this.App = options.App;
            }
            if (this.App && !this.App.Config['offline']) {
                /* Placeholder */
            }
        },
        updateView: function(model) {
            console.log(model);
        }
    });
});
