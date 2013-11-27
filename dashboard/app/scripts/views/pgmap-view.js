/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'kinetic', 'humanize', 'marionette'], function($, _, Backbone, JST, gaugeHelper, Kinetic, humanize) {
    'use strict';

    var PgmapView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-9 col-md-9 col-sm-12 col-xs-12 custom-gutter',
        template: JST['app/scripts/templates/pgmap.ejs'],
        headlineTemplate: _.template('<%- active %>/<%- total %>'),
        ui: {
            container: '.pgcanvas',
            headline: '.headline'
        },
        initialize: function() {
            _.bindAll(this);
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenToOnce(this, 'show', this.postRender);
            this.listenTo(this, 'renderMap', this.renderMap);
            this.collection = new Backbone.Collection();
            if (this.App) {
                this.ReqRes = Backbone.Marionette.getOption(this.App, 'ReqRes');
                this.listenTo(this.App.vent, 'filter:update', this.fetchOSDPGCount);
            }
            gaugeHelper(this);
        },
        count: 15000,
        getLayout: function(count) {
            var width = 400,
                height = 250,
                x = 25,
                y = 10,
                scale = 1;
            if (count <= 15000) {
                width = 155;
                height = 95;
                scale = 2.58;
            } else if (count <= 30000) {
                width = 220;
                height = 138;
                scale = 1.8;
            } else if (count <= 60000) {
                width = 310;
                height = 194;
                scale = 1.29;
            }
            x = x / scale;
            y = y / scale;
            return {
                x: Math.round(x),
                y: Math.round(y),
                width: width,
                height: height,
                scale: scale
            };
        },
        legendColors: [
            ['#0f0', 0.305],
            ['#ff0', 1],
            ['#f00', 1]
        ],
        legendText: [
                'Clean',
                'Working',
                'Dirty'
        ],
        makeText: function(index, x, y) {
            var t = new Kinetic.Text({
                fontFamily: 'ApexSansMedium',
                fontSize: '12',
                text: this.legendText[index],
                fill: '#37424a',
                x: x,
                y: y + 3
            });
            x += t.getWidth() + 10;
            return [t, x];
        },
        makeSwatch: function(index, x, y) {
            var o = [];
            var boxWidth = 16;
            var border = new Kinetic.Rect({
                x: x,
                y: y,
                width: boxWidth + 2,
                height: boxWidth + 2,
                stroke: '#5e6a71',
            });
            o.push(border);
            o.push(new Kinetic.Rect({
                x: x + 1,
                y: y + 1,
                width: boxWidth,
                height: boxWidth,
                fill: _.first(this.legendColors[index]),
                opacity: _.last(this.legendColors[index])
            }));
            x += border.getWidth() + 4;
            return [o, x];
        },
        makeLegend: function() {
            var x = 34,
                y = 229;
            var self = this;
            var legend = _.reduce(_.range(0, 3), function(memo, i) {
                var swatch = self.makeSwatch(i, x, y);
                memo = memo.concat(_.first(swatch));
                x = _.last(swatch);
                var text = self.makeText(i, x, y);
                x = _.last(text);
                memo.push(_.first(text));
                return memo;
            }, []);
            return _.flatten(legend);
        },
        postRender: function() {
            var layout = this.getLayout(this.count);
            var width = this.ui.container.width();
            var height = this.ui.container.height();
            this.stage = new Kinetic.Stage({
                container: this.ui.container[0],
                height: height,
                width: width
            });

            this.layer = new Kinetic.Layer();
            this.tlayer = new Kinetic.Layer();

            this.background = new Kinetic.Rect({
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                fill: '#e6e8e8'
            });

            this.layer.add(this.background);

            var legend = this.makeLegend();
            (function(tlayer) {
                _.each(legend, function(o) {
                    tlayer.add(o);
                });
            })(this.tlayer);

            this.stage.add(this.layer);
            this.stage.add(this.tlayer);
            this.layer.getContext().scale(layout.scale, layout.scale);
            this.layer.drawScene();

            this.frag = document.createDocumentFragment();
            this.backstage = new Kinetic.Stage({
                container: this.frag,
                height: height,
                width: width
            });

            this._background = new Kinetic.Rect({
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                fill: '#e6e8e8'
            });
            this._layer = new Kinetic.Layer();
            this._layer.add(this._background);
            this.backstage.add(this._layer);
            this._layer.drawScene();

        },
        fetchOSDPGCount: function() {
            var self = this;
            setTimeout(function() {
                self.collection.set(self.ReqRes.request('get:osdpgcounts'));
                self.trigger('renderMap');
            }, 0);
        },
        countAttributes: function(attr, list) {
            return _.reduce(list, function(memo, key) {
                var value = attr[key];
                return memo + (_.isNumber(value) ? value : 0);
            }, 0);
        },
        setPixel: function(imageData, x, y, r, g, b, a) {
            var index = (x + y * imageData.width) * 4;
            imageData.data[index + 0] = r;
            imageData.data[index + 1] = g;
            imageData.data[index + 2] = b;
            imageData.data[index + 3] = a;
        },
        total: 0,
        activeclean: 0,
        format: function(v) {
            return humanize.filesize(v, 1000, 1).replace(' ', '').replace('b', '').toLowerCase();
        },
        renderMap: function() {
            var self = this;
            this.total = 0;
            this.activeclean = 0;
            var r, g, b, a, y = 0;
            var l = this.getLayout(this.count);
            console.log(l);
            var ctx = this._background.getContext();
            ctx.clear();
            var imageData = this._background.getContext().getImageData(l.x, l.y, l.width, l.height);
            this.collection.each(function(m) {
                var pgStates = m.get('pg_states');
                self.total += _.reduce(pgStates, function(memo, value, key) {
                    if (key === 'active') {
                        return memo;
                    }
                    if (key === 'clean') {
                        self.activeclean += value;
                        r = 0;
                        g = 255;
                        b = 0;
                        a = 78;
                    } else if (key === 'down' || key === 'inconsistent' || key === 'peering' || key === 'incomplete' || key === 'stale') {
                        r = 255;
                        g = 0;
                        b = 0;
                        a = 255;
                    } else {
                        r = 255;
                        g = 255;
                        b = 0;
                        a = 255;
                    }
                    var x = memo,
                        xo = memo;
                    for (; x < xo + value; x++) {
                        self.setPixel(imageData, x + self.total, y, r, g, b, a); // 255 opaque
                    }
                    return xo + value;
                }, 0);
            });
            var fctx = this.background.getContext();
            fctx.clear();
            ctx.putImageData(imageData, 0, 0);
            fctx.drawImage(this._background.getCanvas()._canvas, l.x, l.y);
            this.ui.headline.text(this.headlineTemplate({
                active: this.format(this.activeclean),
                total: this.format(this.total)
            }));
        }
    });

    return PgmapView;
});
