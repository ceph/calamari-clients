/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'humanize', 'kinetic', 'loglevel', 'marionette'], function($, _, Backbone, JST, gaugeHelper, humanize, Kinetic, log) {
    'use strict';

    // ##PgmapView
    //
    // This is an attempt to visualize the current state of the PG Map for a given cluster.
    // It attempts to map each PG on each OSD to a single pixel and colors that pixel based
    // on what bucket of states that PG is currently in.
    //
    // It is meant to be an at a glance overview of the PG state for a given cluster. It
    // includes PG replicas in the count because this is the granularity we have access to.
    // It embeds a 2D canvas which is manipulated by Kinetic.js
    //
    // There are always 2 canvas in use, one that is being rendered to and the one that
    // is being displayed. We swap them once the rendering has completed.
    //
    // In order to fill the space with useful data, the canvas area rendered into is
    // scaled to fill the available space using a fixed set of breakpoints based on how
    // many data points are available.
    //
    //  * < 15K PGs
    //  * < 30K PGs
    //  * < 60K PGs
    //  * 60K to 100K PGs
    //
    //If there are more than 100K PGs in the cluster then this vis will need to be
    //modified to handle this case.
    //
    //TODO handle more than 100K PGs and respond correctly to breakpoint changes by
    //updating the visualization.
    //
    var PgmapView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 custom-gutter',
        template: JST['app/scripts/templates/pgmap.ejs'],
        headlineTemplate: _.template('<%- active %>/<%- total %>'),
        subtextTemplate: _.template('<%- value %> <%- key %>'),
        ui: {
            container: '.pgcanvas',
            headline: '.headline',
            subtext: '.subtext'
        },
        count: 15000,
        total: 0,
        activeclean: 0,
        // **initialize**
        // Configure instance of object.
        initialize: function() {
            _.bindAll(this);
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenTo(this, 'renderMap', this.renderMap);
            this.collection = new Backbone.Collection();
            if (this.App) {
                this.ReqRes = Backbone.Marionette.getOption(this.App, 'ReqRes');
                this.listenTo(this.App.vent, 'filter:update', this.fetchOSDPGCount);
                this.listenTo(this.App.vent, 'dashboard:refresh', this.fetchOSDPGCount);
                this.listenTo(this.App.vent, 'status:update', this.statusUpdate);
            }
            gaugeHelper(this);
        },
        // **statusUpdate**
        // Update text element on widget.
        statusUpdate: function(model) {
            this.total = _.reduce(model.get('pg'), function(memo, obj) {
                return memo + obj.count;
            }, 0);
            this.ui.headline.text(this.headlineTemplate({
                active: this.format(model.get('pg').ok.states.clean),
                total: this.format(this.total)
            }));
        },
        // **getLayout**
        // This method is responsible for laying out the widget by provide sizing info to
        // kinectic so that it renders correctly.
        getLayout: function(count) {
            var width = 610,
                height = 165,
                x = 0,
                y = 0,
                scale = 1;
            if (count <= 15000) {
                width = 238;
                height = 63;
                scale = 2.6;
            } else if (count <= 30000) {
                width = 336;
                height = 90;
                scale = 1.8;
            } else if (count <= 60000) {
                width = 476;
                height = 128;
                scale = 1.3;
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
        // **legendColors**
        // Provide the colors we use for the legends with opacity value.
        legendColors: [
            ['#0f0', 0.305],
            ['#ff0', 1],
            ['#f00', 1]
        ],
        // **legendText**
        // The labels we use for the legend.
        // TODO extract to l10n.
        legendText: [
                'Clean',
                'Working',
                'Dirty'
        ],
        // **makeText**
        // Creates a text object and returns it and the new x offset.
        makeText: function(index, x, y) {
            var t = new Kinetic.Text({
                fontFamily: 'Titillium Web, sans-serif',
                fontSize: '12',
                fontWeight: '400',
                text: this.legendText[index],
                fill: '#37424a',
                x: x,
                y: y + 3
            });
            x += t.getWidth() + 10;
            return [t, x];
        },
        // **makeSwatch**
        // creates a color swatch and the new x offset.
        makeSwatch: function(index, x, y) {
            var o = [];
            var boxWidth = 16;
            var border = new Kinetic.Rect({
                x: x,
                y: y,
                width: boxWidth + 2,
                height: boxWidth + 2,
                stroke: '#5e6a71'
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
        // **makeLegend**
        // Makes a group of legend objects using makeSwatch and makeText
        // which we can turn into its own layer.
        makeLegend: function() {
            var x = 230,
                y = 160;
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
        // **initCanvas**
        // Initializes the canvas.
        canvasDebugTemplate: _.template('height: <%- height %>, width: <%- width %>, count: <%- this.count %>, layout: <%- layout %>'),
        initCanvas: function() {
            // Set's up 2 different canvas objects.
            // The 1st one is used to render the on screen UI.
            // The 2nd one is used to render the 1:1 dot representation off screen.
            // This is then copied into the on screen canvas.
            var layout = this.getLayout(this.count);
            var width = this.ui.container.width();
            var height = this.ui.container.height();
            this.stage = new Kinetic.Stage({
                container: this.ui.container[0],
                height: height,
                width: width
            });
            log.debug(this.canvasDebugTemplate({
                height: height,
                width: width,
                count: this.count,
                layout: layout
            }));

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

            // 2nd canvas is rendered into a document fragment.

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
        // **countPGs**
        // Count the PG states.
        countPGs: function() {
            return this.collection.reduce(function(memo, m) {
                var pgs = m.get('pg_states');
                return memo + _.reduce(pgs, function(memo, v, k) {
                    if (k === 'active') {
                        return memo;
                    }
                    return memo + v;
                }, 0);
            }, 0);
        },
        // **fetchOSDPGCount**
        // Use RequestResponse to get an updated OSD PG Count.
        // Force a re-render of the UI widget in any case.
        fetchOSDPGCount: function() {
            // Always update the collection on an update
            this.collection.set(this.ReqRes.request('get:osdpgcounts'));
            if (!this.$el.is(':visible')) {
                // do nothing if the widget isn't visible
                return;
            }
            this.count = this.countPGs();
            this.forceUIUpdate();
        },
        // **forceUIUpdate**
        // Clean up the stage and backstage canvas objects and
        // re-render everything.
        forceUIUpdate: function() {
            log.debug('Rendering PG Map');
            setTimeout(function() {
                if (this.stage) {
                    this.stage.destroy();
                    this.backstage.destroy();
                }
                this.initCanvas();
                this.trigger('renderMap');
            }.bind(this), 0);
        },
        // **setPixel**
        // We're drawing directly into an image buffer. Set each RGBA value.
        setPixel: function(imageData, x, y, color) {
            var index = (x + y * imageData.width) * 4;
            imageData.data[index + 0] = color.r;
            imageData.data[index + 1] = color.g;
            imageData.data[index + 2] = color.b;
            imageData.data[index + 3] = color.a;
        },
        formatNumberTemplate: _.template('<%- num %><%- unit %>'),
        // **format**
        // Format numbers into Millions & Thousands.
        format: function(v) {
            var num = v,
                unit = '',
                digits = 0;
            if (num >= 1000000) {
                num /= 1000000;
                unit = 'M';
                digits = 1;
            } else if (num >= 1000) {
                num /= 1000;
                unit = 'K';
                digits = 1;
            }
            return this.formatNumberTemplate({
                num: humanize.numberFormat(num, digits),
                unit: unit
            });
        },
        // **priorityOrder**
        // Sort order of importance.
        priorityOrder: [
                'stale',
                'incomplete',
                'peering',
                'down',
                'inconsistent',
                'remapped',
                'wait-backfill',
                'backfill',
                'recovering',
                'repair',
                'degraded',
                'scrubbing',
                'splitting',
                'replaying',
                'creating'
        ],
        // **redStates**
        // Which states are critical.
        redStates: {
            'stale': true,
            'incomplete': true,
            'peering': true,
            'down': true,
            'inconsistent': true
        },
        // **displayWarnings**
        // Only display a warning icon if we're in a critical state.
        displayWarnings: function(found) {
            if (found in this.redStates) {
                this.trigger('status:warn');
            } else {
                this.trigger('status:ok');
            }
        },
        // Create less garbage, use references for colors.
        green: {
            r: 0,
            g: 255,
            b: 0,
            a: 78
        },
        red: {
            r: 255,
            g: 0,
            b: 0,
            a: 255
        },
        yellow: {
            r: 255,
            g: 255,
            b: 0,
            a: 255
        },
        // **renderMap**
        // Take the PG State data from each OSD and render it into the canvas
        renderMap: function() {
            var self = this;
            this.pgReplicaTotal = 0;
            this.activeclean = 0;
            var y = 0,
                color;
            var l = this.getLayout(this.count);
            var ctx = this._background.getContext();
            ctx.clear();
            var imageData = this._background.getContext().getImageData(l.x, l.y, l.width, l.height);
            this.stats = {};
            this.collection.each(function(m) {
                var pgStates = m.get('pg_states');
                self.pgReplicaTotal += _.reduce(pgStates, function(memo, value, key) {
                    if (self.stats[key] === undefined) {
                        self.stats[key] = 0;
                    }
                    self.stats[key] += value;

                    if (key === 'active') {
                        return memo;
                    }
                    if (key === 'clean') {
                        self.activeclean += value;
                        color = self.green;
                    } else if (key in self.redStates) {
                        color = self.red;
                    } else {
                        color = self.yellow;
                    }
                    var x = memo,
                        xo = memo;
                    for (; x < xo + value; x++) {
                        self.setPixel(imageData, x + self.pgReplicaTotal, y, color); // 255 opaque
                    }
                    return xo + value;
                }, 0);
            });
            var fctx = this.background.getContext();
            fctx.clear();
            // Render the image into the background canvas.
            ctx.putImageData(imageData, 0, 0);
            // Re-render the image into the onto screen canvas
            fctx.drawImage(this._background.getCanvas()._canvas, l.x, l.y);
            // Search for the most important state and display warnings.
            var found = _.find(this.priorityOrder, function(key) {
                return self.stats[key] > 0;
            });
            if (found) {
                this.displayWarnings(found);
            } else {
                // clear states when there's no interesting states
                // to display
                this.ui.subtext.text('');
                this.displayWarnings('');
            }
        }
    });

    return PgmapView;
});
