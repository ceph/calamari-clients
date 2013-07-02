/*global define*/

define(['underscore', 'backbone', 'raphael'], function(_, Backbone) {
    'use strict';

    var ApplicationModel = Backbone.Model.extend({
        defaults: {}
    });

    var OSD = Backbone.Model.extend({
        initialize: function() {
            _.bindAll(this, 'getUsedPercentage', 'updateSize', 'getCapacityColor', 'stateChange');
            this.on('change:used', this.updateSize);
            this.on('change:up', this.stateChange);
        },
        getUsedPercentage: function() {
            if (this.get('used') === 0) {
                return 0;
            }
            var value = Math.max((this.get('used') / this.get('capacity')), 0.4);
            return value;
        },
        getCapacityColor: function() {
            var s = 'hsb(' + [(1 - this.getUsedPercentage()) * 0.5, 1, 0.75] + ')';
            return s;
        },
        updateSize: function() {
            if (this.get('up') === false) {
                return;
            }
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
            up: true
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
        OSDModel: OSD,
    };
});

