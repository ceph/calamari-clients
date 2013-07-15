/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'gauge', 'humanize', 'marionette'], function($, _, Backbone, JST, humanize) {
    'use strict';

    /* HealthView
     * ---------
     *  Health of the cluster widget
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'gauge card span3 health',
        template: JST['app/scripts/templates/health.ejs'],
        title: 'health',
        ui: {
            cardTitle: '.card-title',
            healthText: '.health-text',
            subText: '.subtext'
        },
        modelEvents: {
            'change': 'updateView'
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var clazz = '',
                subtext = humanize.relativeTime(model.lastUpdate / 1000),
                healthText = '';
            switch (model.state) {
            case 'HEALTH_WARN':
                healthText = 'WARN';
                clazz = 'warn';
                break;
            case 'HEALTH_CRIT':
                healthText = 'CRIT';
                clazz = 'fail';
                break;
            default:
                healthText = 'OK';
                clazz = 'OK';
                break;
            }

            var viewModel = {
                title: this.title,
                healthText: healthText,
                clazz: clazz,
                subtext: subtext
            };
            return viewModel;
        },
        initialize: function(options) {
            // The are defaults for Gauge.js and can be overidden from the contructor
            _.bindAll(this, 'updateView');
            if (options.App !== undefined) {
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
