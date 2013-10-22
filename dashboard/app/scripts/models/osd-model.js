/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'raphael'], function(_, Backbone) {
    'use strict';

    // OSDModel
    // --------
    //
    // This is the model backing the OSD entity
    //
    return Backbone.Model.extend({
        // `radius` *default* maxium radius 20 pixels
        //
        // `animationTime` *default* animation time 500ms
        //
        // `delay` *default* delay before animation 125ms
        //
        // `easing` *default* easing algorithm easeIn
        //
        // `minPerc` *default* minimum radius as percentage
        //
        radius: 20,
        animationTime: 500,
        delay: 125,
        easing: 'easeIn',
        minPerc: 0.4,
        idAttribute: 'osd',
        initialize: function() {
            // Creation sets a the function which decides how the percentage
            // via virtual function getPercentage which is the external interface
            // for use in rendering.
            this.getPercentage = this._getStatus;

            // TODO: this watcher probably needs to be virtual.
            // It should ignore changes on things we're not currently
            // interested in
            _.bindAll(this, '_getStatus', '_getUsedPercentage', 'updateSize', 'getColor', 'isDown');
            this.listenTo(this, 'change:up change:in', this.updateSize);
            this.listenTo(this, 'change', this.showChange);
        },
        isDown: function() {
            return this.get('up') === 0 && this.get('in') === 0;
        },
        _getStatus: function() {
            // Internal method - looks at the OSD state
            // returns 40% for ok, 66% for warning and 100% for 
            // something has failed
            var up = this.get('up');
            var _in = this.get('in');
            if (up === 1 && _in === 1) {
                return 0.4;
            }
            if (up === 0 && _in === 1) {
                return 0.66;
            }
            if (up === 1 && _in === 0) {
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
            var value = Math.max((this.get('used') / this.get('capacity')), this.minPerc);
            return value;
        },
        getColor: function() {
            var s = 'hsb(' + [(1 - this.getPercentage()) * 0.5, 1, 0.75] + ')';
            return s;
        },
        updateSize: function() {
            // TODO this code needs to move to an OSD view
            if (this.views && this.views.circle) {
                var a = window.Raphael.animation({
                    r: Math.floor(this.radius * this.getPercentage()),
                    fill: this.getColor()
                }, this.animationTime, this.easing);
                this.views.circle.animate(a.delay(this.delay));
            }
        },
        showChange: function() {
            // TODO this code needs to move to an OSD view
            if (this.views && this.views.text) {
                var self = this.views.text;
                var a = window.Raphael.animation({
                    opacity: 0.3
                }, 333, 'easeOut', function() {
                    self.animate({
                        opacity: 1
                    }, 333, 'easeIn');
                });
                this.views.text.animate(a.delay(this.delay));
            }
        },
        defaults: {
            osd: '1',
            capacity: 1024,
            used: 0,
            uuid: '',
            up: true,
            'in': true,
            up_from: 1,
            public_addr: '127.0.0.1:0',
            cluster_addr: '127.0.0.1:0',
            heartbeat_back_addr: '127.0.0.1:0',
            heartbeat_front_addr: '127.0.0.1:0',
            ports: []
        },
        destroy: function() {
            this.off('change');
            if (this.views) {
                this.views = null;
            }
        }
    });
});
