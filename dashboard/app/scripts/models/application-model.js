/*global define*/

define(['underscore', 'backbone', 'raphael'], function(_, Backbone) {
    'use strict';

    var ApplicationModel = Backbone.Model.extend({
        defaults: {}
    });

    // OSDModel
    // --------
    //
    // This is the model backing the OSD entity
    //
    var OSD = Backbone.Model.extend({
        defaultRadius: 20,
        defaultAnimationTime: 500,
        initialize: function() {
            // Creation sets a the function which decides how the percentage
            // via virtual function getPercentage which is the external interface
            // for use in rendering.
            this.getPercentage = this._getStatus;

            // TODO: this watcher probably needs to be virtual
            // It should ignore changes on things we're not currently
            // interested in
            this.on('change:up change:in', this.updateSize);
            _.bindAll(this, '_getStatus', '_getUsedPercentage', 'updateSize', 'getColor', 'stateChange');
        },
        _getStatus: function() {
            // Internal method - looks at the OSD state
            // returns 40% for ok, 66% for warning and 100% for 
            // something has failed
            var up = this.get('up');
            var _in = this.get('in');
            if (up && _in) {
                return 0.4;
            }
            if (up && _in === false) {
                return 0.66;
            }
            return 1;
        },
        _getUsedPercentage: function() {
            // Internal method - looks at OSD used percentage of total capacity
            // returns this as a percentage
            if (this.get('used') === 0) {
                return 0;
            }
            var value = Math.max((this.get('used') / this.get('capacity')), 0.4);
            return value;
        },
        getColor: function() {
            var s = 'hsb(' + [(1 - this.getPercentage()) * 0.5, 1, 0.75] + ')';
            return s;
        },
        updateSize: function(delay) {
            if (delay === undefined) {
                delay = 125;
            }
            if (this.view) {
                var a = window.Raphael.animation({
                    r: (this.defaultRadius * this.getPercentage()),
                    fill: this.getColor()
                }, this.defaultAnimationTime, 'easeIn');
                this.view.animate(a.delay(delay));
            }
        },
        stateChange: function() {
            var color = this.get('up') ? this.getColor() : '#fff';
            if (this.view) {
                var a = window.Raphael.animation({
                    fill: color
                }, 1000, 'easeIn');
                this.view.animate(a.delay(125));
            }
        },
        defaults: {
            name: '1',
            capacity: 1024,
            used: 0,
            uuid: '',
            up: true,
            'in': true,
            created: Date.now(),
            modified: Date.now(),
            ip: '127.0.0.1',
            ports: []
        },
        destroy: function() {
            this.off('changed');
            if (this.view) {
                this.view = null;
            }
        }
    });

    return {
        AppModel: ApplicationModel,
        OSDModel: OSD
    };
});
