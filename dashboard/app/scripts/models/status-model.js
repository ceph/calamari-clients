/*global define*/

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    var StatusModel = Backbone.Model.extend({
        initialize: function() {
            this.getPGCounts = this.makeCounter('pg');
            this.getPGStates = this.makeStates('pg');
            this.getOSDCounts = this.makeCounter('osd');
            this.getOSDStates = this.makeStates('osd');
            this.getMONCounts = this.makeCounter('mon');
            this.getMONStates = this.makeStates('mon');
        },
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/health_counters';
        },
        defaults: {
            'cluster': 1,
            'cluster_update_time_unix': Date.now(),
            'mon': {
                'ok': {
                    count: 0
                },
                'warn': {
                    count: 0
                },
                'critical': {
                    count: 0
                }
            },
            'mds': {
                'not_up_not_in': 0,
                'total': 0,
                'up_in': 0,
                'up_not_in': 0
            },
            'osd': {
                'ok': {
                    count: 0
                },
                'warn': {
                    count: 0
                },
                'critical': {
                    count: 0
                }
            },
            pg: {
                'ok': {
                    count: 0
                },
                'warn': {
                    count: 0
                },
                'critical': {
                    count: 0
                }
            },
            'pool': {
                'total': 0
            }
        },
        // Return a partially applied function which
        // always returns the default if the value is undefined
        // or the result of the invoked function.
        makeDefault: function(defaultValue) {
            return function(fn) {
                try {
                    var value = fn();
                    return value ? value : defaultValue;
                } catch (e) {
                    return defaultValue;
                }
            };
        },
        // Return a partially applied function
        // which counts a specific counter
        makeReader: function(key, value, defaultValue) {
            var countDefault = this.makeDefault(defaultValue);
            return function(src) {
                return countDefault(function() {
                    return src[key][value];
                });
            };
        },
        // Return a function which reads the
        // counters 'ok', 'warn' and 'critical out of pg
        makeCounter: function(key) {
            var okCount = this.makeReader('ok', 'count', 0),
                warnCount = this.makeReader('warn', 'count', 0),
                critCount = this.makeReader('critical', 'count', 0);
            var model = this;
            return function() {
                var obj = model.get(key);
                return {
                    ok: okCount(obj),
                    warn: warnCount(obj),
                    crit: critCount(obj)
                };
            };
        },
        makeStates: function(key) {
            var okStates = this.makeReader('ok', 'states', {}),
                warnStates = this.makeReader('warn', 'states', {}),
                critStates = this.makeReader('critical', 'states', {});
            var model = this;
            return function() {
                var pg = model.get(key);
                return {
                    ok: okStates(pg),
                    warn: warnStates(pg),
                    crit: critStates(pg)
                };
            };
        }
    });

    return StatusModel;
});
