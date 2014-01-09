/* global define */
define(['backbone'], function(Backbone) {
    'use strict';
    // manage interval timers
    var SetIntervalMixin = {
        componentWillMount: function() {
            this.intervals = [];
        },
        setInterval: function() {
            this.intervals.push(setInterval.apply(null, arguments));
        },
        componentWillUnmount: function() {
            this.intervals.map(clearInterval);
        }
    };

    // create a Model and then begin polling for it
    var PollerMixin = {
        componentWillMount: function() {
            var Model = Backbone.Model.extend({
                urlRoot: this.props.url
            });
            this.model = new Model();
        },
        componentDidMount: function() {
            this.setInterval(this.poll, this.props.frequencyMs);
        },
        poll: function() {
            this.model.fetch();
        }
    };

    return {
        SetIntervalMixin: SetIntervalMixin,
        PollerMixin: PollerMixin
    };
});
