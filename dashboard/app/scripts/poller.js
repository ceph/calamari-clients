/*global define*/

define(['jquery', 'underscore', 'backbone', 'models/usage-model', 'models/health-model', 'marionette'], function($, _, Backbone, UsageModel, HealthModel) {
    'use strict';
    var newFetcher = function(fnName, timerName, modelName, eventName) {
            return function() {
                var self = this;
                var delay = this[timerName] === null ? 0 : this.delay;
                this[timerName] = setTimeout(function() {
                    self[modelName].fetch({
                        success: function(model /*, response, options*/ ) {
                            self.App.vent.trigger(eventName, model);
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
    return Backbone.Marionette.ItemView.extend({
        healthTimer: null,
        usageTimer: null,
        usageModel: null,
        healthModel: null,
        delay: 20000,
        initialize: function() {
            this.healthModel = new HealthModel();
            this.usageModel = new UsageModel();
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.fetchHealth = newFetcher('fetchHealth', 'healthTimer', 'healthModel', 'health:update');
            this.fetchUsage = newFetcher('fetchUsage', 'usageTimer', 'usageModel', 'usage:update');
            _.bindAll(this, 'stop');
        },
        stop: function() {
            clearTimeout(this.healthTimer);
            this.healthTimer = null;
            clearTimeout(this.usageTimer);
            this.usageTimer = null;
        }
    });
});
