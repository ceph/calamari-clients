/*global define*/

define(['underscore', 'backbone', ], function(_, Backbone) {
    'use strict';

    var StatusModel = Backbone.Model.extend({
        initialize: function() {
            this.getPGCounts = this.makePGCounter();
            this.getPGStates = this.makePGStates();
        },
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/health_counters';
        },
        defaults: {
            'cluster': 1,
            'added_ms': Date.now(),
            'mon': {
                'not_in_quorum': 0,
                'in_quorum': 0,
                'total': 0
            },
            'mds': {
                'not_up_not_in': 0,
                'total': 0,
                'up_in': 0,
                'up_not_in': 0
            },
            'osd': {
                'up_not_in': 0,
                'not_up_not_in': 0,
                'total': 0,
                'up_in': 0
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
        // which counts a specific pg counter
        makePGReader: function(key, value, defaultValue) {
            var countDefault = this.makeDefault(defaultValue);
            return function(pg) {
                return countDefault(function() {
                    return pg[key][value];
                });
            };
        },
        // Return a function which reads the
        // counters 'ok', 'warn' and 'critical out of pg
        makePGCounter: function() {
            var okCount = this.makePGReader('ok', 'count', 0),
                warnCount = this.makePGReader('warn', 'count', 0),
                critCount = this.makePGReader('critical', 'count', 0);
            var model = this;
            return function() {
                var pg = model.get('pg');
                return {
                    ok: okCount(pg),
                    warn: warnCount(pg),
                    crit: critCount(pg)
                };
            };
        },
        makePGStates: function() {
            var okStates = this.makePGReader('ok', 'states', {}),
                warnStates = this.makePGReader('warn', 'states', {}),
                critStates = this.makePGReader('critical', 'states', {});
            var model = this;
            return function() {
                var pg = model.get('pg');
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
