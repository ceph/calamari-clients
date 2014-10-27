/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/gauge-helper', 'l20nCtx!locales/{{locale}}/strings', 'Backbone.Modal', 'marionette'], function($, _, Backbone, JST, humanize, gaugeHelper, l10n) {
    'use strict';

    /* HealthView
     * ---------
     *  Health of the cluster widget
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/health.ejs'],
        updateTemplate: _.template('<%- time %>'),
        badgeTemplate: _.template('<span class="badge <%- clazz %>"><%- count %></span> <%- description %>'),
        rowTemplate: _.template('<tr><td><span class="<%- clazz %>"><%- severity %></span></td><td><%- details %></td></tr>'),
        healthTemplate: _.template('<i class="fa <%- clazz %>"></i>'),
        timer: null,
        events: {
            'click .badge': 'badgeHandler'
        },
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
        badgeHandler: function() {
            var content = _.reduce(this.model.toJSON().report.summary, function(markup, report) {
                var severity = report.severity === 'HEALTH_WARN' ? 'WARN' : 'ERROR';
                var details = report.summary;
                markup.push(this.rowTemplate({
                    severity: severity,
                    clazz: severity === 'WARN' ? 'text-warning' : 'text-danger',
                    details: details
                }));
                return markup;
            }.bind(this), []);
            var Modal = Backbone.Modal.extend({
                template: function() {
                    return JST['app/scripts/templates/health-modal.ejs']({
                        content: content.join('')
                    });
                },
                cancelEl: '.bbm-button'
            });
            var modal = new Modal();
            $('body').append(modal.render().el);
        },
        updateUI: function() {
            this.ui.subline.text(this.updateTemplate({
                time: humanize.relativeTime(this.lastUpdateUnix / 1000)
            }));
        },
        set: function(model) {
            this.model.set(model.toJSON());
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var subtext = '',
                evt = 'status:ok',
                healthText = 'ok fa-check';
            if (model.report.overall_status && model.report.summary.length) {
                var counts = _.reduce(model.report.summary, function(result, summary) {
                    if (summary.severity === 'HEALTH_WARN') {
                        result.warn += 1;
                    } else {
                        result.error += 1;
                    }
                    return result;
                }, {
                    warn: 0,
                    error: 0
                });
                if (counts.warn > 0) {
                    subtext += this.badgeTemplate({
                        count: counts.warn,
                        clazz: 'alert-warning',
                        description: 'warnings'
                    });
                }
                if (counts.error > 0) {
                    subtext += this.badgeTemplate({
                        count: counts.error,
                        clazz: 'alert-danger',
                        description: 'errors'
                    });
                }
            }
            switch (model.report.overall_status) {
                case 'HEALTH_WARN':
                    evt = 'status:warn';
                    healthText = 'fa-warning warn';
                    break;
                case 'HEALTH_ERR':
                    healthText = 'fail fa-exclamation-circle';
                    evt = 'status:fail';
                    break;
                default:
                    break;
            }

            return {
                evt: evt,
                healthText: this.healthTemplate({clazz:healthText}),
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
            this.ui.headline.html(data.healthText);
            this.ui.subtext.html(data.relTimeStr);
            this.trigger(data.evt);
        },
        updateTimer: function(model) {
            this.lastUpdateUnix = model.get('cluster_update_time_unix');
        }
    });
});
