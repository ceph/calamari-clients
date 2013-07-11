/*global define*/

define(['underscore', 'backbone', 'raphael'], function(_, Backbone) {
    'use strict';

    var ApplicationModel = Backbone.Model.extend({
        defaults: {}
    });

    var OSD = Backbone.Model.extend({
        initialize: function() {
            _.bindAll(this, 'getUsedPercentage', 'updateSize', 'getCapacityColor', 'stateChange');
            this.on('change:up change:in', this.updateSize);
        },
        getUsedPercentage: function() {
            var up = this.get('up');
            var _in = this.get('in');
            if (up && _in) {
//                console.log('up');
                return 0.4;
            }
            if (up && _in === false) {
//                console.log('out');
                return 0.66;
            }
//           console.log('down');
            return 1;
        },
        getCapacityColor: function() {
            var s = 'hsb(' + [(1 - this.getUsedPercentage()) * 0.5, 1, 0.75] + ')';
            return s;
        },
        updateSize: function() {
            //console.log('size of ' + this.get('index') + ' changed to ' + this.get('used'));
            if (this.view) {
                var a = window.Raphael.animation({
                    r: (20 * this.getUsedPercentage()),
                    fill: this.getCapacityColor()
                }, 1000, 'easeIn');
                this.view.animate(a.delay(125));
            }
        },
        stateChange: function() {
            //console.log('isDown');
            var color = this.get('up') ? this.getCapacityColor() : '#fff';
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
            ip: ''
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
