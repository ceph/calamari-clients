/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, snap, gaugeHelper) {
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
            gaugeHelper(this);
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
        rowlen: 9,
        countAttributes: function(attr, list) {
            return _.reduce(list, function(memo, key) {
                var value = attr[key];
                return memo + (_.isNumber(value) ? value : 0);
            }, 0)
        },
        colorMap: [{
            r: 215,
            g: 48,
            b: 39
        }, {
            r: 244,
            g: 109,
            b: 67
        }, {
            r: 253,
            g: 174,
            b: 97
        }, {
            r: 254,
            g: 224,
            b: 144
        }, {
            r: 255,
            g: 255,
            b: 191
        }, {
            r: 224,
            g: 243,
            b: 248
        }, {
            r: 171,
            g: 217,
            b: 233
        }, {
            r: 171,
            g: 217,
            b: 233
        }, {
            r: 116,
            g: 173,
            b: 209
        }, {
            r: 69,
            g: 117,
            b: 180
        }],
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
                var color;
                var yellowCount = this.countAttributes(attr, ['creating', 'replaying', 'splitting', 'scrubbing', 'degraded', 'repair', 'recovering', 'backfill', 'wait-backfill', 'remapped']);
                //yellowCount = total/2;
                if (yellowCount) {
                    ok = 0.11 + (0.7 - (0.7 * (yellowCount / total)));
                    var i = Math.floor(10 * ok);
                    console.log(i, this.colorMap[i]);
                    color = this.colorMap[i];
                    f = snap.rgb(color.r, color.g, color.b).toString();
                    console.log(f);
                }
                console.log({
                    'yellowCount': yellowCount
                });
                var redCount = this.countAttributes(attr, ['inconsistent', 'down', 'peering', 'incomplete', 'stale']);
                if (redCount) {
                    ok = 0.4 - (0.4 * (redCount / total));
                    var i = Math.floor(10 * ok);
                    console.log(i, this.colorMap[i]);
                    color = this.colorMap[i];
                    f = snap.rgb(color.r, color.g, color.b).toString();
                    console.log(f);
                }
                console.log({
                    'redCount': redCount
                });
                //f = snap.hsb2rgb(hsb).hex;
            } else if (attr.active === undefined) {
                f = '#000';
            } else {
                color = this.colorMap[9]
                f = snap.rgb(color.r, color.g, color.b).toString();
            }

            return {
                x: x,
                y: y,
                h: this.height,
                w: this.width,
                f: f
            };
        },
        renderBar: function() {
            var p = this.p;
            var x = 453/2-((this.colorMap.length*21)/2);
            var y = 390;
            _.each(this.colorMap, function(c) {
                p.rect(x, y, 20, 20).attr({
                    fill: snap.rgb(c.r, c.g, c.b).toString()
                });
                x += 21;
            });
        },
        renderMap: function() {
            var self = this;
            this.renderBar();
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
