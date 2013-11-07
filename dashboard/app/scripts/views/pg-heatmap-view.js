/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'marionette'], function($, _, Backbone, JST, snap) {
    'use strict';

    var PgHeatmapView = Backbone.Marionette.ItemView.extend({
        className: 'pgmap card',
        template: JST['app/scripts/templates/pg-heatmap.ejs'],
        initialize: function() {
            _.bindAll(this, 'initSVG', 'fetchOSDPGCount', 'renderMap');
            this.collection = new Backbone.Collection();
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.ReqRes = Backbone.Marionette.getOption(this.App, 'ReqRes');
                this.listenTo(this.App.vent, 'filter:update', this.fetchOSDPGCount);
            }
            this.listenToOnce(this, 'render', this.initSVG);
            this.listenTo(this, 'renderMap', this.renderMap);
        },
        initSVG: function() {
            this.p = snap(this.$('.pg-heatmap-svg')[0]);
            this.p.node.setAttribute('viewBox', '40 0 130 130');
        },
        fetchOSDPGCount: function() {
            var self = this;
            setTimeout(function() {
                self.collection.set(self.ReqRes.request('get:osdpgcounts'));
                self.trigger('renderMap');
            }, 0);
        },
        width: 20,
        calcPosition: function(model, index) {
            var rowlen = 9;
            var width = 20;
            var line = Math.floor(index / rowlen);
            var y = (line * 10) + 2;
            var x = (Math.floor(index % rowlen) * width) + 2;
            var ok = 100;
            var warn = 100;
            var attr = model.attributes;
            if (attr.active != attr.clean) {
                console.log('index ' + index + ' has interesting states');
                var total = attr.active;
                ok = 25 * (attr.clean/total);
                console.log(ok);
            }
            if (attr.active === undefined) {
                ok = warn = 0;
            }
            var f = this.p.gradient('l(1, 1, 0, 0)#26bf00:' + ok + '-#bbbf00:' + warn + '-#bf0000');

            return {
                x: x,
                y: y,
                h: 10,
                w: 20,
                f: f
            };
        },
        renderMap: function() {
            var self = this;
            this.collection.each(function(m, index) {
                var pos = self.calcPosition(m, index);
                self.p.rect(pos.x, pos.y, pos.w, pos.h).attr({
                    fill: pos.f
                });
            });
        }
    });

    return PgHeatmapView;
});
