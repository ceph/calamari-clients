/*global define*/

define(['jquery', 'underscore', 'backbone', 'models/usage-model', 'models/health-model', 'models/status-model', 'marionette'], function($, _, Backbone, UsageModel, HealthModel, StatusModel) {
    'use strict';

    function newPoller(eventPrefix) {
        var fnName = eventPrefix + 'Poller',
            timerName = eventPrefix + 'Timer',
            modelName = eventPrefix + 'Model';
        return function() {
            var self = this;
            var App = this.App;
            _.each(['request', 'sync', 'error'], function(event) {
                this.listenTo(this[modelName], event, function() {
                    App.vent.trigger(eventPrefix + ':' + event);
                });
            }, this);
            var delay = this[timerName] === null ? 0 : this.delay;
            this[timerName] = setTimeout(function() {
                self[modelName].fetch({
                    success: function(model /*, response, options*/ ) {
                        App.vent.trigger(eventPrefix + ':update', model);
                        self[timerName] = self[fnName].apply(self);
                    },
                    error: function(model, response) {
                        console.log(response);
                        self[timerName] = self[fnName].apply(self);
                    }
                });
            }, delay);
            return this[timerName];
        };
    }

    function newEventEmitter(fnName, timerName, eventName) {
        return function() {
            var self = this;
            var delay = this[timerName] === null ? 0 : this.delay;
            this[timerName] = setTimeout(function() {
                self.App.vent.trigger(eventName);
                self[timerName] = self[fnName].apply(self);
            }, delay);
            return this[timerName];
        };
    }
    return Backbone.Marionette.ItemView.extend({
        usageTimer: null,
        usageModel: null,
        healthTimer: null,
        healthModel: null,
        statusModel: null,
        statusTimer: null,
        updateTimer: null,
        delay: 20000,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.cluster = Backbone.Marionette.getOption(this, 'cluster');
            this.healthModel = new HealthModel({
                cluster: this.cluster
            });
            this.usageModel = new UsageModel({
                cluster: this.cluster
            });
            this.statusModel = new StatusModel({
                cluster: this.cluster
            });

            this.healthPoller = newPoller('health');
            this.usagePoller = newPoller('usage');
            this.statusPoller = newPoller('status');
            this.updateEvent = newEventEmitter('updateEvent', 'updateTimer', 'osd:update');
            this.listenTo(this.App.vent, 'cluster:update', this.updateModels);
            _.bindAll(this, 'stop', 'updateModels', 'start');
            this.models = ['health', 'usage', 'status'];
            this.timers = ['health', 'usage', 'status', 'update'];
            this.pollers = ['healthPoller', 'usagePoller', 'statusPoller', 'updateEvent'];
        },
        // Cluster ID has changed. Update pollers.
        updateModels: function(cluster) {
            _.each(this.models, function(model) {
                this[model + 'Model'].set('cluster', cluster.id);
            }, this);
            this.stop();
            this.start();
        },
        // Restart Poller functions
        start: function() {
            _.each(this.pollers, function(poller) {
                this[poller].call(this);
            }, this);
        },
        // Stop and Remove All Currently running Pollers
        stop: function() {
            _.each(this.timers, function(timer) {
                var id = this[timer + 'Timer'];
                clearTimeout(id);
                this[timer + 'Timer'] = null;
            }, this);
        }
    });
});
