/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/gauge-helper', 'l20nCtx!locales/{{locale}}/strings', 'marionette'], function($, _, Backbone, JST, humanize, gaugeHelper, l10n) {
    'use strict';

    /* HealthView
     * ---------
     *  Health of the cluster widget
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/health.ejs'],
        updateTemplate: _.template('<%- time %>'),
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
            _.bindAll(this, 'updateView', 'set', 'updateTimer');

            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                gaugeHelper(this);
                this.listenTo(this.App.vent, 'health:update', this.set);
                this.listenTo(this.App.vent, 'krakenHeartBeat:update', this.updateTimer);
            }
            this.lastUpdateUnix = Date.now();
            this.timerWrapper(this.updateUI);
        },
        updateUI: function() {
            this.ui.subline.text(this.updateTemplate({
                time: humanize.relativeTime(this.lastUpdateUnix / 1000)
            }));
        },
        set: function(model) {
            this.model.set(model.toJSON());
        },
        getSummary: function(report) {
            if (report.summary && report.summary.length) {
                return _.first(report.summary).summary;
            }
            return '';
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var subtext = '',
                evt = 'status:ok',
                healthText = 'OK';
            switch (model.report.overall_status) {
                case 'HEALTH_WARN':
                    subtext = this.getSummary(model.report);
                    break;
                case 'HEALTH_ERR':
                    healthText = 'ERROR';
                    evt = 'status:fail';
                    subtext = this.getSummary(model.report);
                    break;
                default:
                    break;
            }

            return {
                evt: evt,
                healthText: healthText,
                relTimeStr: subtext,
                title: l10n.getSync('healthOSDTitle')
            };
        },
        timerWrapper: function(fn) {
            var self = this;
            return setTimeout(function() {
                fn.call(self);
                self.timer = self.timerWrapper(fn);
            }, 1000);
        },
        updateView: function( /* model */ ) {
            var data = this.serializeData();
            this.ui.headline.text(data.healthText);
            this.ui.subtext.text(data.relTimeStr);
            this.trigger(data.evt);
        },
        updateTimer: function(model) {
            this.lastUpdateUnix = model.get('cluster_update_time_unix');
        }
    });
});
