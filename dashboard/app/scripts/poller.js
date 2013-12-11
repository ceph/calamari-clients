/* global define */

define(['jquery', 'underscore', 'backbone', 'models/usage-model', 'models/health-model', 'models/status-model', 'models/cluster-model', 'marionette'], function($, _, Backbone, UsageModel, HealthModel, StatusModel, ClusterModel) {
    'use strict';

    function newPoller(eventPrefix, context, options) {
        var fnName = eventPrefix + 'Poller',
            timerName = eventPrefix + 'Timer',
            modelName = eventPrefix + 'Model';
        var self = context;
        var App = context.App;
        _.each(['request', 'sync', 'error'], function(event) {
            this.listenTo(this[modelName], event, function() {
                App.vent.trigger(eventPrefix + ':' + event);
            });
        }, context);
        var config = _.extend({
            timeout: self.defaultTimeout,
            delay: self.defaultDelay
        }, options);
        return function() {
            var delay = this[timerName] === null ? 0 : config.delay;
            this[timerName] = setTimeout(function() {
                //var rtt = performance.now();
                self[modelName].fetch({
                    success: function(model /*, response, options*/ ) {
                        //console.log(eventPrefix + ' request took ' + (performance.now() - rtt) + ' ms');
                        App.vent.trigger(eventPrefix + ':update', model);
                        self[timerName] = self[fnName].apply(self);
                    },
                    error: function(model, response) {
                        console.log(eventPrefix + '/error: ' + response.statusText);
                        App.vent.trigger('app:neterror', eventPrefix, response);
                        self[timerName] = self[fnName].apply(self);
                    },
                    timeout: config.timeout
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
        osdUpdateTimer: null,
        poolUpdateTimer: null,
        defaultDelay: 20000,
        defaultTimeout: 3000,
        heartBeatDelay: 60000,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App.Config) {
                this.delay = Backbone.Marionette.getOption(this.App.Config, 'long-polling-interval-ms') || this.delay;
                this.timeout = Backbone.Marionette.getOption(this.App.Config, 'api-request-timeout-ms') || this.defaultTimeout;
                this.disableNetworkChecks = Backbone.Marionette.getOption(this.App.Config, 'disable-network-checks') || false;
            }
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
            this.krakenHeartBeatModel = new ClusterModel({
                cluster: this.cluster
            });

            this.healthPoller = newPoller('health', this, { timeout: this.timeout });
            this.usagePoller = newPoller('usage', this, { timeout: this.timeout });
            this.statusPoller = newPoller('status', this, { timeout: this.timeout });
            if (!this.disableNetworkChecks) {
                this.krakenHeartBeatPoller = newPoller('krakenHeartBeat', this, {
                    delay: this.heartBeatDelay
                });
            }
            this.osdUpdateEvent = newEventEmitter('osdUpdateEvent', 'osdUpdateTimer', 'osd:update');
            this.poolUpdateEvent = newEventEmitter('poolUpdateEvent', 'poolUpdateTimer', 'pool:update');
            this.listenTo(this.App.vent, 'cluster:update', this.updateModels);
            _.bindAll(this, 'stop', 'updateModels', 'start');
            this.models = ['health', 'usage', 'status', 'krakenHeartBeat'];
            this.timers = ['health', 'usage', 'status', 'update', 'krakenHeartBeat'];
            this.pollers = ['healthPoller', 'usagePoller', 'statusPoller', 'krakenHeartBeatPoller', 'osdUpdateEvent', 'poolUpdateEvent'];
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
                if (_.isFunction(this[poller])) {
                    this[poller].call(this);
                }
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
