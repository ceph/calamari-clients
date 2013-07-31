/*global define*/

define(['jquery', 'underscore', 'backbone', 'models/usage-model', 'models/health-model', 'models/status-model', 'marionette'], function($, _, Backbone, UsageModel, HealthModel, StatusModel) {
    'use strict';
    var newFetcher = function(fnName, timerName, modelName, eventPrefix) {
            return function() {
                var self = this;
                self.listenTo(self[modelName], 'request', function() {
                    self.App.vent.trigger(eventPrefix + ':request');
                });
                self.listenTo(self[modelName], 'sync', function() {
                    self.App.vent.trigger(eventPrefix + ':sync');
                });
                self.listenTo(self[modelName], 'error', function() {
                    self.App.vent.trigger(eventPrefix + ':error');
                });
                var delay = this[timerName] === null ? 0 : this.delay;
                this[timerName] = setTimeout(function() {
                    self[modelName].fetch({
                        success: function(model /*, response, options*/ ) {
                            self.App.vent.trigger(eventPrefix + ':update', model);
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
        };
    var newEventEmitter = function(fnName, timerName, eventName) {
            return function() {
                var self = this;
                var delay = this[timerName] === null ? 0 : this.delay;
                this[timerName] = setTimeout(function() {
                    self.App.vent.trigger(eventName);
                    self[timerName] = self[fnName].apply(self);
                }, delay);
                return this[timerName];
            };
        };
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

            this.start();
            this.listenTo(this.App.vent, 'cluster:update', this.updateModels);
            _.bindAll(this, 'stop', 'updateModels', 'start');
        },
        updateModels: function(cluster) {
            this.healthmodel.set('cluster', cluster.id);
            this.usageModel.set('cluster', cluster.id);
            this.statusModel.set('cluster', cluster.id);
            this.stop();
        },
        start: function() {
            this.fetchHealth = newFetcher('fetchHealth', 'healthTimer', 'healthModel', 'health');
            this.fetchUsage = newFetcher('fetchUsage', 'usageTimer', 'usageModel', 'usage');
            this.fetchStatus = newFetcher('fetchStatus', 'statusTimer', 'statusModel', 'status');
            this.updateEvent = newEventEmitter('updateEvent', 'updateTimer', 'osd:update');
        },
        stop: function() {
            clearTimeout(this.healthTimer);
            this.healthTimer = null;
            clearTimeout(this.usageTimer);
            this.usageTimer = null;
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
    });
});
