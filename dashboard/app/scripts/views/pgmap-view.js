/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'kinetic', 'marionette'], function($, _, Backbone, JST, gaugeHelper, Kinetic) {
    'use strict';

    var PgmapView = Backbone.Marionette.ItemView.extend({
        className: 'card gauge',
        template: JST['app/scripts/templates/pgmap.ejs'],
        ui: {
            container: '.pgcanvas'
        },
        initialize: function() {
            _.bindAll(this);
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenToOnce(this, 'render', this.postRender);
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
                x: x,
                y: y,
                width: width,
                height: height,
                scale: scale
            };
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
                fill: '#fff'
            });

            this.layer.add(this.background);

            this.text = new Kinetic.Text({
                fontFamily: 'ApexSansMedium',
                fontSize: '12',
                text: 'Example Text - Goes Down Here',
                fill: '#000',
                x: 25,
                y: 235
            });
            this.tlayer.add(this.text);

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
                fill: '#fff'
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
        renderMap: function() {
            var self = this;
            this.total = 0;
            var r, g, b, a, y = 0;
            var l = this.getLayout(this.count);
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
        }
    });

    return PgmapView;
});
