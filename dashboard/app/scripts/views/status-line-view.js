/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'humanize', 'marionette'], function($, _, Backbone, JST, gaugeHelper, humanize) {
    'use strict';

    var StatusLineView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/status-line.ejs'],
        updateTemplate: _.template('<i class="fa fa-heart"></i> <%- time %>'),
        className: 'card status-line',
        timer: null,
        initialize: function() {
            _.bindAll(this, 'updateUI', 'timerWrapper');
            this.lastUpdateUnix = Date.now();
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'krakenHeartBeat:update', this.updateTimer);
            }
            this.timerWrapper(this.updateUI);
            gaugeHelper(this);
        },
        timerWrapper: function(fn) {
            var self = this;
            return setTimeout(function() {
                fn.call(self);
                self.timer = self.timerWrapper(fn);
            }, 1000);
        },
        updateUI: function() {
            this.$el.html(this.updateTemplate({
                time: humanize.relativeTime(this.lastUpdateUnix / 1000)
            }));
        },
        updateTimer: function(model) {
            this.lastUpdateUnix = model.get('cluster_update_time_unix');
        }
    });

    return StatusLineView;
});
