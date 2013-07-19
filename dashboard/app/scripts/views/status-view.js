/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'marionette'], function($, _, Backbone, JST, humanize) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        className: 'gauge card span6 status',
        template: JST['app/scripts/templates/status.ejs'],
        title: 'status',
        timer: null,
        ui: {
            cardTitle: '.card-title',
            subText: '.subtext',
            okosd: '.ok-osd',
            warnosd: '.warn-osd',
            failosd: '.fail-osd',
            okpool: '.ok-pool',
            warnpool: '.warn-pool',
            failpool: '.fail-pool'
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
            _.bindAll(this, 'updateView', 'set', 'updateTimer');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.App.vent.on('status:update', this.set);
            }
            if (options && options.App !== undefined) {
                this.App = options.App;
            }
            if (this.App && !this.App.Config['offline']) {
                /* Placeholder */
            }
            this.on('render', function() {
                if (this.timer === null) {
                    this.updateTimer();
                }
            });
        },
        set: function(model) {
            this.model.set(model.attributes);
        },
        updateTimer: function() {
            this.ui.subText.text(humanize.relativeTime(this.model.get('added_ms') / 1000));
            this.timer = setTimeout(this.updateTimer, 1000);
        },
        updateView: function(model) {
            var attr = model.attributes;
            this.ui.okosd.text(attr.osd['up_in']);
            this.ui.warnosd.text(attr.osd['up_not_in']);
            this.ui.failosd.text(attr.osd['not_up_not_in']);
            this.ui.okpool.text(attr.pool['total']);
            this.ui.subText.text(humanize.relativeTime(attr.added_ms / 1000));
        }
    });
});
