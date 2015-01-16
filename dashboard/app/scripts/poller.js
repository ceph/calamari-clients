/* global define */

define(['jquery', 'underscore', 'backbone', 'loglevel', 'models/usage-model', 'models/health-model', 'models/status-model', 'models/cluster-model', 'marionette'], function($, _, Backbone, log, UsageModel, HealthModel, StatusModel, ClusterModel) {
    'use strict';

    // **newPoller**
    // Creates a long polling function which invokes a BackboneModel fetch request
    // which sends out an update event at regular intervals.

    function newPoller(eventPrefix, context, options) {
        // Event prefixes **must** be unique, postfixes are uniform
        var fnName = eventPrefix + 'Poller',
            timerName = eventPrefix + 'Timer',
            modelName = eventPrefix + 'Model';
        var self = context;
        var App = context.App;

        // listen to model events and re-transmit them to the
        // correct namespace.
        _.each(['request', 'sync', 'error'], function(event) {
            this.listenTo(this[modelName], event, function() {
                App.vent.trigger(eventPrefix + ':' + event);
            });
        }, context);

        // Use defaults but allow overrides.
        var config = _.extend({
            timeout: self.defaultTimeout,
            delay: self.defaultDelay
        }, options);

        // Return the templatized polling function.
        return function() {
            var delay = this[timerName] === null ? 0 : config.delay;
            this[timerName] = setTimeout(function() {
                //var rtt = performance.now();
                self[modelName].fetch({
                    success: function(model /*, response, options*/ ) {
                        //log.debug(eventPrefix + ' request took ' + (performance.now() - rtt) + ' ms');
                        App.vent.trigger(eventPrefix + ':update', model);
                        self[timerName] = self[fnName].apply(self);
                    },
                    error: function(model, response) {
                        log.error(eventPrefix + '/error: ' + response.statusText);
                        App.vent.trigger('app:neterror', eventPrefix, response);
                        self[timerName] = self[fnName].apply(self);
                    },
                    timeout: config.timeout
                });
            }, delay);
            return this[timerName];
        };
    }

    // **newEventEmitter**
    // Creates an event emitter function which is used to notify listeners that
    // they are supposed to do something at regular intervals.
    // Used primarily to tell the Visualization to poll for changes
    // in the OSD map.

    function newEventEmitter(fnName, timerName, eventName, defaultDelay) {
        return function() {
            var self = this;
            var delay = this[timerName] === null ? 0 : defaultDelay;
            this[timerName] = setTimeout(function() {
                self.App.vent.trigger(eventName);
                self[timerName] = self[fnName].apply(self);
            }, delay);
            return this[timerName];
        };
    }

    // **PollerView**
    // Responsible for setting up Long Polling Models and Event Emitters.
    return Backbone.Marionette.ItemView.extend({
        usageTimer: null,
        usageModel: null,
        healthTimer: null,
        healthModel: null,
        statusModel: null,
        statusTimer: null,
        osdUpdateTimer: null,
        poolUpdateTimer: null,
        hostUpdateTimer: null,
        defaultDelay: 20000,
        defaultTimeout: 3000,
        heartBeatDelay: 60000,
        krakenHeartBeatTimer: null,
        // ** initialize **
        // Run by Backbone on construction of new instance.
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            // Override prototype defaults from App configuration object.
            if (this.App.Config) {
                this.delay = Backbone.Marionette.getOption(this.App.Config, 'long-polling-interval-ms') || this.delay;
                this.timeout = Backbone.Marionette.getOption(this.App.Config, 'api-request-timeout-ms') || this.defaultTimeout;
                this.disableNetworkChecks = Backbone.Marionette.getOption(this.App.Config, 'disable-network-checks') || false;
            }
            this.cluster = Backbone.Marionette.getOption(this, 'cluster');

            // Create Backbone.Model Instances used to fetch updates.
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

            // Create Poller Instances
            this.healthPoller = newPoller('health', this, {
                timeout: this.timeout
            });
            this.usagePoller = newPoller('usage', this, {
                timeout: this.timeout
            });
            this.statusPoller = newPoller('status', this, {
                timeout: this.timeout
            });
            if (!this.disableNetworkChecks) {
                this.krakenHeartBeatPoller = newPoller('krakenHeartBeat', this, {
                    delay: this.heartBeatDelay
                });
            }

            // Create Event Emitters.
            this.osdUpdateEvent = newEventEmitter('osdUpdateEvent', 'osdUpdateTimer', 'osd:update', this.delay);
            this.poolUpdateEvent = newEventEmitter('poolUpdateEvent', 'poolUpdateTimer', 'pool:update', this.delay);
            this.hostUpdateEvent = newEventEmitter('hostUpdateEvent', 'hostUpdateTimer', 'host:update', this.delay);
            this.iopsUpdateEvent = newEventEmitter('iopsUpdateEvent', 'iopsUpdateTimer', 'iops:update', 60000);

            // Listen for cluster ID changes.
            this.listenTo(this.App.vent, 'cluster:update', this.updateModels);
            _.bindAll(this, 'stop', 'updateModels', 'start');

            // Data used by start stop methods.
            this.models = [
                    'health',
                    'krakenHeartBeat',
                    'status',
                    'usage'
            ];
            this.timers = [
                    'health',
                    'krakenHeartBeat',
                    'status',
                    'update',
                    'usage'
            ];
            this.pollers = [
                    'healthPoller',
                    'krakenHeartBeatPoller',
                    'statusPoller',
                    'usagePoller',
                    'osdUpdateEvent',
                    'poolUpdateEvent',
                    'hostUpdateEvent',
                    'iopsUpdateEvent'
            ];
        },
        // **updateModels**
        // Cluster ID has changed. Update pollers.
        updateModels: function(cluster) {
            _.each(this.models, function(model) {
                this[model + 'Model'].set('cluster', cluster.get('id'));
            }, this);
            this.stop();
            this.start();
        },
        // **start**
        // Restart Poller functions if they've been stopped.
        // TODO Extend to restart event emitters.
        start: function() {
            _.each(this.pollers, function(poller) {
                if (_.isFunction(this[poller])) {
                    this[poller].call(this);
                }
            }, this);
        },
        // **stop**
        // Stop and Remove All Currently running Pollers.
        stop: function() {
            _.each(this.timers, function(timer) {
                var id = this[timer + 'Timer'];
                clearTimeout(id);
                this[timer + 'Timer'] = null;
            }, this);
            //Clean up event emitters
            clearTimeout(this['osdUpdateTimer']);
            clearTimeout(this['poolUpdateTimer']);
            clearTimeout(this['hostUpdateTimer']);
            clearTimeout(this['iopsUpdateTimer']);
            this['osdUpdateTimer'] = null;
            this['poolUpdateTimer'] = null;
            this['hostUpdateTimer'] = null;
            this['iopsUpdateTimer'] = null;
        }
    });
});
