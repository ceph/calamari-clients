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
        timer: null,
        ui: {
            cardTitle: '.card-title',
            healthText: '.health-text',
            subText: '.subtext',
            spinner: '.icon-spinner'
        },
        modelEvents: {
            'change': 'updateView'
        },
        initialize: function() {
            // The are defaults for Gauge.js and can be overidden from the contructor
            this.fadeInOutAnimation = animation.pair('fadeOutAnim', 'fadeInAnim');
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            _.bindAll(this, 'updateView', '_ok', '_warn', 'set', 'fadeInOutAnimation', 'disappearAnimation', 'reappearAnimation', 'updateTimer', 'disappear', 'reappear', 'expand', 'collapse');

            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:healthok', this._ok);
                this.listenTo(this.App.vent, 'status:healthwarn', this._warn);
                this.listenTo(this.App.vent, 'health:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
            }
            this.listenToOnce(this, 'render', function() {
                if (this.timer === null) {
                    this.updateTimer();
                }
                var self = this;
                if (this.App) {
                    this.listenTo(this.App.vent, 'health:request', function() {
                        self.ui.spinner.css('visibility', 'visible');
                    });
                    this.listenTo(this.App.vent, 'health:sync health:error', function() {
                        self.ui.spinner.css('visibility', 'hidden');
                    });
                }
            });
        },
        updateTimer: function() {
            this.ui.subText.text(humanize.relativeTime(this.model.get('cluster_update_time_unix') / 1000));
            this.timer = setTimeout(this.updateTimer, 1000);
        },
        // Demo Code
        // ---------
        _ok: function() {
            this.model.set({
                cluster_update_time_unix: Date.now() - 1000,
                report: {
                    overall_status: 'HEALTH_OK'
                }
            });
        },
        // Demo Code
        // ---------
        _warn: function() {
            this.model.set({
                cluster_update_time_unix: Date.now() - 1000,
                report: {
                    overall_status: 'HEALTH_WARN'
                }
            });
        },
        set: function(model) {
            this.model.set(model.toJSON());
        },
        serializeData: function() {
            var model = this.model.toJSON();
            var clazz = '',
                subtext = humanize.relativeTime(model.cluster_update_time_unix / 1000),
                healthText = '';
            switch (model.report.overall_status) {
            case 'HEALTH_WARN':
                healthText = 'WARN';
                clazz = 'warn';
                break;
            case 'HEALTH_ERR':
                healthText = 'ERROR';
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
        updateView: function( /* model */ ) {
            var data = this.serializeData();
            if (data.healthText !== this.ui.healthText.text()) {
                this.fadeInOutAnimation(this.ui.healthText, function() {
                    this.ui.healthText.removeClass('warn ok fail').addClass(data.clazz).text(data.healthText);
                });
            }
            this.ui.subText.text(data.relTimeStr);
        },
        disappear: function(callback) {
            return this.disappearAnimation(this.$el, function() {
                this.$el.css('visibility', 'hidden');
            }).then(function() {
                if (callback) {
                    callback.apply(this);
                }
            });
        },
        reappear: function(callback) {
            this.$el.css('visibility', 'visible');
            return this.reappearAnimation(this.$el, callback);
        },
        expand: function(callback) {
            this.$el.css('display', 'block');
            if (callback) {
                callback.apply(this);
            }
        },
        collapse: function(callback) {
            this.$el.css('display', 'none');
            if (callback) {
                callback.apply(this);
            }
        }
    });
});
