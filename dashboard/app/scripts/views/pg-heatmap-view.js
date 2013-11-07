/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'marionette'], function($, _, Backbone, JST, snap) {
    'use strict';

    var PgHeatmapView = Backbone.Marionette.ItemView.extend({
        className: 'pgmap card',
        template: JST['app/scripts/templates/pg-heatmap.ejs'],
        collectionEvents: {
            'change': 'changeView'
        },
        initialize: function() {
            _.bindAll(this, 'initSVG', 'fetchOSDPGCount', 'renderMap', 'changeView');
            this.collection = new Backbone.Collection();
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.ReqRes = Backbone.Marionette.getOption(this.App, 'ReqRes');
                this.listenTo(this.App.vent, 'filter:update', this.fetchOSDPGCount);
            }
            this.listenToOnce(this, 'render', this.initSVG);
            this.listenToOnce(this, 'renderMap', this.renderMap);
        },
        firstRun: true,
        changeView: function(m) {
            console.log(m, ' changed');
            var p = this.calcPosition(m, m.views.index);
            m.views.rect.animate({
                fill: p.f
            }, 1000);
        },
        initSVG: function() {
            this.p = snap(this.$('.pg-heatmap-svg')[0]);
            //this.p.node.setAttribute('viewBox', '40 0 130 130');
        },
        fetchOSDPGCount: function() {
            var self = this;
            setTimeout(function() {
                self.collection.set(self.ReqRes.request('get:osdpgcounts'));
                self.trigger('renderMap');
            }, 0);
        },
        width: 50,
        height: 50,
        countAttributes: function(attr, list) {
            return _.reduce(list, function(memo, key) {
                var value = attr[key];
                return memo + (_.isNumber(value) ? value : 0);
            }, 0)
        },
        rowlen: 9,
        calcPosition: function(model, index) {
            var margin = 1;
            var margin = 0;
            var line = Math.floor(index / this.rowlen);
            var y = (line * this.height) + 0;
            if (line) {
                y += line * margin;
            }
            var col = Math.floor(index % this.rowlen);
            var x = (col * this.width) + 0;
            if (x > 2) {
                x += col * margin;
            }
            var ok = 100;
            var attr = model.attributes.pg_states;
            var f;
            if (attr.active !== attr.clean) {
                console.log('index ' + index + ' has interesting states');
                var total = attr.active;
                ok = (attr.clean / total);
                if (1 - ok < 0.1) {
                    ok = 0.75;
                }
                var green = '#26bf00',
                    yellow = '#bbbf00',
                    red = '#bf0000';
                var other = yellow;
                var otherrgb = {
                    r: 0xbb,
                    g: 0xbf,
                    b: 0x0
                };

                var yellowCount = this.countAttributes(attr, ['creating', 'replaying', 'splitting', 'scrubbing', 'degraded', 'repair', 'recovering', 'backfill', 'wait-backfill', 'remapped']);
                //yellowCount = total/2;
                if (yellowCount) {
                    ok = 0.25 + (0.5 - (0.5 * (yellowCount / total)));
                }
                console.log({
                    'yellowCount': yellowCount
                });
                var redCount = this.countAttributes(attr, ['inconsistent', 'down', 'peering', 'incomplete', 'stale']);
                if (redCount) {
                    ok = 0.6 - (0.6 * (redCount / total));
                }
                console.log({
                    'redCount': redCount
                });
                var hsb = snap.rgb2hsb(otherrgb.r, otherrgb.g, otherrgb.b);
                hsb.h = (107 * ok) / 360;
                f = snap.hsb2rgb(hsb).hex;
            } else if (attr.active === undefined) {
                f = '#000';
            } else {
                f = '#26bf00';
            }

            return {
                x: x,
                y: y,
                h: this.height,
                w: this.width,
                f: f
            };
        },
        renderMap: function() {
            var self = this;
            this.collection.each(function(m, index) {
                var pos = self.calcPosition(m, index);
                var el = self.p.rect(pos.x, pos.y, pos.w, pos.h).attr({
                    fill: (self.firstRun ? '#fff' : pos.f)
                });
                el.animate({
                    fill: pos.f
                }, 500);
                m.views = {
                    index: index,
                    rect: el
                }
            });
        }
    });

    return PgHeatmapView;
});
