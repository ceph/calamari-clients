/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/animation', 'models/health-model', 'marionette'], function($, _, Backbone, JST, humanize, animation) {
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
            _.bindAll(this, 'updateView', '_ok', '_warn', 'fadeInOutAnimation');
            if (options.App !== undefined) {
                this.App = options.App;
                this.App.vent.on('status:healthok', this._ok);
                this.App.vent.on('status:healthwarn', this._warn);
            }
            if (this.App && !this.App.Config['offline']) {}
        },
        // Demo Code
        // ---------
        _ok: function() {
            this.model.set({
                added_ms: Date.now() - 1000,
                report: {
                    overall_status: 'HEALTH_OK'
                }
            });
        },
        // Demo Code
        // ---------
        _warn: function() {
            this.model.set({
                added_ms: Date.now() - 1000,
                report: {
                    overall_status: 'HEALTH_WARN'
                }
            });
        },
        set: function(attr) {
            this.model.set(attr);
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
            console.log('changed ', model);
            this.fadeInOutAnimation(this.ui.healthText, function() {
                var data = this.serializeData();
                this.ui.healthText.removeClass('warn ok fail').addClass(data.clazz).text(data.healthText);
                this.ui.subText.text(data.relTimeStr);
            });
        }
    });
});
