/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, humanize, animation) {
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
        initialize: function(options) {
            // The are defaults for Gauge.js and can be overidden from the contructor
            this.fadeInOutAnimation = animation('fadeOutAnim', 'fadeInAnim');
            _.bindAll(this, 'updateView', 'ok', 'warn', 'fadeInOutAnimation');
            if (options.App !== undefined) {
                this.App = options.App;
                this.App.vent.on('status:healthok', this.ok);
                this.App.vent.on('status:healthwarn', this.warn);
            }
            if (this.App && !this.App.Config['offline']) {}
        },
        ok: function() {
            this.fadeInOutAnimation(this.ui.healthText, function() {
                this.ui.healthText.removeClass('warn fail').addClass('ok').text('OK');
            });
        },
        warn: function() {
            this.fadeInOutAnimation(this.ui.healthText, function() {
                this.ui.healthText.removeClass('ok fail').addClass('warn').text('WARN');
            });
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var clazz = '',
                subtext = humanize.relativeTime(model.added_ms / 1000),
                healthText = '';
            switch (model.report.overall_status) {
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
                clazz = 'ok';
                break;
            }

            return {
                title: this.title,
                clazz: clazz,
                healthText: healthText,
                relTimeStr: subtext
            };
        },
        updateView: function(model) {
            console.log(model);
        }
    });
});
