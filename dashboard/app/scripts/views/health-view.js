/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, humanize, gaugeHelper) {
    'use strict';

    /* HealthView
     * ---------
     *  Health of the cluster widget
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-4 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/health.ejs'],
        timer: null,
        ui: {
            headline: '.headline',
            subline: '.subline',
            subtext: '.subtext'
        },
        modelEvents: {
            'change': 'updateView'
        },
        initialize: function() {
            // The are defaults for Gauge.js and can be overidden from the contructor
            _.bindAll(this, 'updateView', 'set');

            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                gaugeHelper(this);
                this.listenTo(this.App.vent, 'health:update', this.set);
            }
        },
        set: function(model) {
            this.model.set(model.toJSON());
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var subtext = '',
                evt = 'status:ok',
                healthText = 'OK';
            switch (model.report.overall_status) {
                case 'HEALTH_WARN':
                    subtext = _.first(model.report.summary).summary;
                    evt = 'status:warn';
                    break;
                case 'HEALTH_ERR':
                    healthText = 'ERROR';
                    evt = 'status:fail';
                    subtext = _.first(model.report.summary).summary;
                    break;
                default:
                    break;
            }

            return {
                evt: evt,
                healthText: healthText,
                relTimeStr: subtext
            };
        },
        updateView: function( /* model */ ) {
            var data = this.serializeData();
            this.ui.headline.text(data.healthText);
            this.ui.subtext.text(data.relTimeStr);
            this.trigger(data.evt);
        }
    });
});
