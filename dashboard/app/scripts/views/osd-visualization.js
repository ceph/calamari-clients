/*global define, Raphael*/

'use strict';
define(['jquery', 'underscore', 'backbone', 'helpers/raphael_support', 'templates', 'views/osd-detail-view', 'views/filter-view', 'models/application-model', 'helpers/animation', 'views/filterBy-view', 'loglevel', 'raphael', 'marionette', 'bootstrap-switch'], function($, _, Backbone, Rs, JST, OSDDetailView, FilterView, Models, animation, FilterByView, log) {


    // ###OSDVisualization 
    // This is a container for a Raphael managed SVG DOM Element.
    // It is a OSD centric with nods towards hosts. It started out as a card element
    // on the dashboard, and morphed into it's own view within the Dashboard SPA.
    //
    // This object also contains an install of the OSD collection, and handles
    // requests at the global event level for different slices of the data.
    //
    // It has 2 main modes and 2 sorts.
    // Mode 1 is a simple in/out,up/down style of filtering.
    // Mode 2 is filtered by PG states.
    //
    // Sort order 1 is simply by OSD ID numeric order.
    // Sort order 2 is to group by Hosts containing those OSDs.
    //
    // If you hover over states this will highlight the OSDs which are currently members of those sets.
    //
    // If you select and deselect OSDs based on their states, this triggers a
    // filtering function which removes OSDs from the collection which is used to render
    // the OSDs on screen.
    var OSDVisualization = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/viz.ejs'],
        serializeData: function() {
            return {};
        },
        // Max size of OSD element in pixels.
        step: 40,
        // Timeout handle for remove pulse animation callback.
        pulseTimer: null,
        // Internal state management - should probably be deprecated.
        state: 'dashboard',
        // Track host we are currently showing a tooltip for.
        curHostGroup: null,
        // Timeout handle for removing hostname tooltip.
        hostGroupTimer: null,
        // controls OSD sort order - normally by ID, or by Host Group
        customSort: false,
        // Default Collection fetch request timeout - overridden by `api-request-timeout-ms` in `config.json`
        timeout: 3000,
        // Promise used to gate when OSD Viz is fully initialized.
        readyPromise: null,
        ui: {
            'cardTitle': '.card-title',
            viz: '.viz',
            filter: '.filter',
            filterpanel: '.filter-panel',
            switcher: '.switcher',
            detail: '.detail-outer',
            spinner: '.fa-spinner'
        },
        events: {
            'click .viz': 'osdClickHandler',
            'mouseenter circle, tspan, rect': 'osdHoverHandler',
            'mouseleave circle, tspan, rect': 'osdUnhoverHandler'
        },
        collectionEvents: {
            'add': 'addOSD',
            'remove': 'removeOSD',
            'change': 'updateOSD',
            'request': 'spinnerOn',
            'sync error': 'spinnerOff',
            'reset': 'resetViews'
        },
        // Custom Event Handlers
        // Listens to this.App.vent Event Aggregator. @See [Marionette.JS docs](https://backbonemarionette.readthedocs.org/en/latest/marionette.eventaggregator.html).
        appEvents: {
            'osd:update': 'updateCollection',
            'cluster:update': 'switchCluster',
            'viz:fullscreen': 'fullscreen',
            'viz:dashboard': 'dashboard',
            'viz:filter': 'filter',
            'viz:pulse': 'pulse'
        },
        // **ready** is an idempotent function that allows objects that need services from this object to wait until the object is ready.
        // It uses a promise which is set up when this object is created that is
        // resolved once the first successful load of the collection is completed.
        // Future calls against this promise will always return true.
        //
        // In the case of network failure, other UI elements should compensate
        // by reporting errors.
        //
        // You use this call by doing a RequestResponse call against Wreqr for
        // 'get:ready' and receiving a promise object which you then wrap the code
        // that needs to be invoked after this promise has been resolved.
        //
        // e.g.
        // ```
        // var promise = this.App.ReqRes('get:ready')
        // promise.then(function() {
        //  // code I want to be called
        // });
        // ```
        // @see Issue 7473 wait until first OSD Map is loaded
        //
        ready: function() {
            return this.readyPromise;
        },
        // **toggleSortOrder** Apply filter again with a new sort order after the reset
        // animation has run.
        toggleSortOrder: function(deferred) {
            this.customSort = !this.customSort;
            if (this.filterCol) {
                this.filter(this.filterCol, deferred);
                return;
            }
            this.reset(function() {
                if (deferred && deferred.resolve) {
                    deferred.resolve();
                }
            });
        },
        // **spinnerOn** animated spinner when OSD collection is fetching from Calamari API
        spinnerOn: function() {
            this.ui.spinner.css('visibility', 'visible');
        },
        // **spinnerOff** turn off spinner.
        spinnerOff: function() {
            this.ui.spinner.css('visibility', 'hidden');
        },
        // **fetchError** trigger a global error when osd collection fails to load.
        fetchError: function(collection, response) {
            log.debug(_.template('osd/error: <%- statusText %>', {
                statusText: response.statusText
            }));
            this.App.vent.trigger('app:neterror', 'osd', response);
        },
        // **updateCollection** This relys on the standard Backbone collection fetch behavior.
        // We do have an experimental update path but it is not well tested and the server
        // did not end up supporting it. At some future date it should be replaced with something
        // more event driven like websockets.
        updateCollection: function() {
            if (this.App.Config['delta-osd-api'] && this.collection.length > 0) {
                this.collection.update.apply(this.collection);
            } else {
                var vent = this.App.vent;
                this.collection.fetch({
                    timeout: this.timeout,
                    error: this.fetchError
                }).then(function() {
                    // after collection update update the filter counts
                    vent.trigger('filter:update');
                });
            }
        },
        // **switchCluster** If we receive a global cluster:update event
        // update the current cluster we are pointing at. Wait until the
        // next update occurs, at worst 20 seconds, to avoid animation and
        // collection issues.
        switchCluster: function(cluster) {
            if (cluster) {
                this.collection.cluster = cluster.get('id');
            }
        },
        // **setupAnimations**
        // Custom transition animation helper setup. @see helpers/animation.js
        setupAnimations: function(obj) {
            obj.opacityOutAnimation = animation.single('animated toDashboard-enter toDashboard');
            obj.toWorkBenchAnimation = animation.single('animated toWorkBench-enter toWorkBench');
            obj.fadeInAnimation = animation.single('animated fadeIn-enter fadeIn');
        },
        // **getHosts**
        // Request Response helper to get all unique host names in the OSD data.
        getHosts: function() {
            return _.uniq(this.collection.pluck('host'));
        },
        // **getFQDNs**
        // Request Response helper to get all unique Full Qualified Domain Names in the OSD data.
        getFQDNs: function() {
            return _.uniq(this.collection.pluck('fqdn'));
        },
        // **getOSDIdsByHost**
        // Request Response helper. Return all the OSD IDs which are hosted by FQDN.
        getOSDIdsByHost: function(host) {
            return _.pluck(this.collection.filter(function(m) {
                return m.get('fqdn') === host;
            }), 'id');
        },
        // **getOSDPGCounts**
        // Return the 4 categories of OSD up/in, down/out, up/out, down,in.
        // Request Response helper.
        getOSDCounters: function() {
            /* TODO write a single pass version of this */
            return {
                down: this.collection.where({
                    'up': 0,
                    'in': 0
                }).length,
                inup: this.collection.where({
                    'up': 1,
                    'in': 1
                }).length,
                outup: this.collection.where({
                    'up': 1,
                    'in': 0
                }).length,
                indown: this.collection.where({
                    'up': 0,
                    'in': 1
                }).length

            };
        },
        // **getPGCounters**
        // Request Response. Return aggregate pg_state_counts.
        getPGCounters: function() {
            /*jshint camelcase: false */
            return this.collection.pg_state_counts || {};
        },
        // **getOSDPGCounts**
        // Request Response. Return per OSD pg_state counts.
        getOSDPGCounts: function() {
            /* jshint camelcase: false */
            return this.collection.map(function(m) {
                return {
                    id: m.id,
                    up: m.get('up'),
                    'in': m.get('in'),
                    pg_states: m.get('pg_states')
                };
            });
        },
        lookupPositionById: [],
        // **initialize** First function called on creating a new instance.
        // Responsible for basic configuration and setup.
        // All prototype defaults are also in this function.
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App.Config) {
                this.timeout = Backbone.Marionette.getOption(this.App.Config, 'api-request-timeout-ms') || this.timeout;
            }
            var deferred = $.Deferred();
            this.listenToOnce(this.App.vent, 'filter:update', function() {
                // resolve readyPromise once collection has been loaded
                deferred.resolve();
            });
            this.readyPromise = deferred.promise();
            this.legendHeight = 75;
            this.legendOffset = 25;
            this.originX = 0;
            this.originY = this.legendHeight;
            this.columns = 16;
            this.rows = 16;
            this.width = (this.columns + 1) * this.step;
            this.height = (this.rows + 1) * this.step;
            this.w = ((this.columns + 2) * this.step);
            this.h = ((this.rows + 2) * this.step) + this.legendHeight;
            this.threshx = this.w / 2;
            this.threshy = this.h / 2;
            this.startPosition = [{
                    x: 40,
                    y: 40
                }, {
                    x: 40 + ((this.columns) * this.step),
                    y: 40
                }, {
                    x: 40 + ((this.columns) * this.step),
                    y: 40 + ((this.rows - 1) * this.step)
                }, {
                    x: 40,
                    y: 40 + ((this.columns - 1) * this.step)
                }
            ];
            _.bindAll(this);

            this.setupAnimations(this);

            // App Level Events
            Backbone.Marionette.bindEntityEvents(this, this.App.vent, Backbone.Marionette.getOption(this, 'appEvents'));

            // App Level Request Responses
            this.App.ReqRes.setHandler('get:ready', this.ready);
            this.App.ReqRes.setHandler('get:hosts', this.getHosts);
            this.App.ReqRes.setHandler('get:fqdns', this.getFQDNs);
            this.App.ReqRes.setHandler('get:osdcounts', this.getOSDCounters);
            this.App.ReqRes.setHandler('get:pgcounts', this.getPGCounters);
            this.App.ReqRes.setHandler('get:osdids', this.getOSDIdsByHost);
            this.App.ReqRes.setHandler('get:osdpgcounts', this.getOSDPGCounts);
            this.render = _.wrap(this.render, this.renderWrapper);
            this.osdHoverHandler = this.makeSVGEventHandlerFunc(this.isOsdElement, [this.osdHoverHandlerCore, this.hostGroupHoverHandlerCore]);
            this.osdClickHandler = this.makeSVGEventHandlerFunc(this.isOsdElement, this.osdClickHandlerCore);
            this.setBelowCornerBits = this.makeNeighborMapAdjuster(4, 16);
            this.setAboveCornerBits = this.makeNeighborMapAdjuster(1, 32);

            // precalculate the col and row positions for quicker background rendering
            this.lookupPositionById = _.map(_.range(this.columns * this.rows), function(id) {
                return this.calcColAndRow(id);
            }.bind(this));
            // WARNING - this function is being memoized in the full knowledge only the first
            // parameter to calc position is being used for look ups. This is ok in this
            // particular application, if the grid were to change shape or size dynamically
            // then this would no longer be true. You would need to write a hash function for memoize
            // that took this into account.
            this.calcPosition = _.memoize(Rs.calcPosition);
        },
        // **toFullscreenTransitionTwo** part 2 or 2 of animation transition to workbench.
        toFullscreenTransitionTwo: function() {
            var ui = this.ui;
            this.$el.removeClass('viz-hidden');
            ui.viz.addClass('viz-fullscreen');
            ui.filterpanel.css('display', 'block');
            this.App.vent.trigger('filter:update');
            var resetFn = this.reset;
            return this.fadeInAnimation(ui.filterpanel, function() {
                resetFn();
            });
        },
        // **fullscreen** Run part 1 of 2 animation transition to workbench.
        fullscreen: function(callback) {
            this.state = 'fullscreen';
            this.ui.cardTitle.text('OSD Workbench');
            this.$el.addClass('workbench');
            return this.toWorkBenchAnimation(this.$el, callback).then(this.toFullscreenTransitionTwo);
        },
        // **toDashboardTransitionOne** to dashboard transition callback. part 2 of 2.
        toDashboardTransitionOne: function() {
            var ui = this.ui;
            ui.filterpanel.hide();
        },
        // **dashboard** to dashboard transition callback. part 1 of 2.
        dashboard: function(callback) {
            this.state = 'dashboard';
            var $el = this.$el;
            return this.opacityOutAnimation(this.$el, callback).then(function() {
                $el.addClass('viz-hidden').removeClass('workbench');
            }).then(this.toDashboardTransitionOne);
        },
        // **resetViews** perform clean up on SVG models when resetting collection.
        resetViews: function(collection, options) {
            _.each(options.previousModels, this.cleanupModelView);
        },
        // **addOSD** Add a new OSD to grid. Perform animation.
        addOSD: function(model) {
            this.moveCircle(model, this.collection.indexOf(model));
        },
        // **cleanupModelView**
        // Perform clean up of SVG elements and animate removal.
        cleanupModelView: function(model) {
            var views = model.views;
            if (views) {
                var circle = views.circle;
                circle.animate({
                    'opacity': 0,
                    'r': 0
                }, 250, 'easeIn', function() {
                    circle.remove();
                });
                views.text.remove();
                if (views.square) {
                    views.square.remove();
                    model.set('neighborMap', null);
                }
                if (views.pcircle) {
                    views.pcircle.stop().remove();
                }
                model.views = null;
            }
        },
        // **removeOSD**
        // Remove OSD DOM elements from UI.
        removeOSD: function(m) {
            this.collection.remove(m);
            this.cleanupModelView(m);
        },
        // **updateOSD**
        // Update attributes for OSD. The model takes care of updating the UI
        // elements if they exist.
        updateOSD: function(m) {
            m.set(m.attributes);
        },
        // **drawGrid** draw background grid using SVG as a single path.
        drawGrid: function(d) {
            this.drawLegend();
            var path = Rs.calcGrid(this.originX, this.originY, this.width, this.height, this.step);
            var path1 = this.paper.path('M0,0').attr({
                'stroke-width': 1,
                'stroke': '#5e6a71',
                'opacity': 0.40
            });
            var anim = Raphael.animation({
                path: path,
                callback: d.resolve
            }, 250);
            path1.animate(anim);
        },
        // **moveCircle** schedules the animation with Raphael.
        // Each circle starts from a random corner. The final position is calculated
        // and these two values are passed to `this.animateCircleTraversal` which
        // sends the animation request to Raphael.
        moveCircle: function(model, index) {
            if (model === null) {
                return;
            }
            var start = this.startPosition[Math.floor(Math.random() * 4)];
            var end = this.calcPosition(index, this.originX, this.originY, this.width, this.height, this.step);
            this.animateCircleTraversal(start.x + this.originX, start.y + this.originY, 8, end.nx, end.ny, model);
        },
        // **hex** Hexadecimalize value with correct prefix and length.
        hex: function(value) {
            var hex = '00' + value.toString(16);
            return hex.substr(hex.length - 2, hex.length);
        },
        // **criteria** Used to create comparable strings to order OSDs by host in id order.
        criteria: function(model) {
            return model.get('host') + this.hex(model.get('osd'));
        },
        // **calcColAndRow** Used to figure out the Column and Row an OSD occupies.
        calcColAndRow: function(id) {
            return [(id % this.columns), Math.floor(id / this.columns)];
        },
        // **isAdjacent** Used to detect if a square is adjacent to another square on the grid.
        // Used to color background tiles so that OSDs which belong to the same host are grouped
        // together by color. We assume we're rendering from top to bottom, so we don't have to
        // check if A is above B.
        isAdjacent: function(posA, posB) {
            var colA = this.lookupPositionById[posA.id][0];
            var rowA = this.lookupPositionById[posA.id][1];
            var colB = this.lookupPositionById[posB.id][0];
            var rowB = this.lookupPositionById[posB.id][1];
            if (rowA + 1 === rowB && colA === colB) {
                // A is below B
                posA.neighborMap = 4;
                posB.neighborMap = 1;
                return true;
            }
            if (rowA === rowB && colB === colA + 1) {
                // A is to right of B
                posA.neighborMap = 2;
                posB.neighborMap = 8;
                return true;
            }
            if (rowA === rowB && colB === colA - 1) {
                // A is to left of B
                posA.neighborMap = 8;
                posB.neighborMap = 2;
                return true;
            }
            // A is not adjacent to B.
            return false;
        },
        // **renderOSDViews**
        // Using the filter functions derived from the sliders for filtering by
        // OSD states or PG states, we render each OSD or ignore it.
        renderOSDViews: function(filterFn) {
            var coll = _.first(this.collection.models, this.columns * this.rows);
            if (filterFn) {
                coll = _.filter(coll, filterFn);
            }
            log.debug(coll.length);
            var d = $.Deferred();
            var last = _.last(coll);
            if (last) {
                // Add promise to last model so we can
                // signal rendering is done.
                last.deferred = d;
            } else {
                // Nothing to render, filtered collection is empty.
                d.resolve();
            }
            if (this.customSort) {
                // Shade the background squares for each OSD using a single
                // color for each host.
                coll = this.viewByHostGroup(coll);
            }
            _.each(coll, this.moveCircle, this);
            return d.promise();
        },
        // **viewByHostGroup**
        // To render backgrounds for each of the OSDs we create a map of their adjacencies
        // to each other when layed out on a grid.
        // 6 bits are used to represent the position's state.
        //
        // |LSB*|Meaning|
        // |---|:----|
        // |1|has a neighbor above|
        // |2|has a neighbor to left|
        // |3|has a neighbor to right|
        // |4|has a neighbor below|
        // |5|Is a corner piece above a neighbor|
        // |6|Is a corner piece below a neighbor|
        //
        // bits 5 & 6 have special rendering rules where the squares are rendered as rectangles
        // so they appear joined together in the UI and therefore part of the same group.
        // This was the most pleasing layout.
        //
        // The layout algorithm tries to place each OSD so that is adjacent to at least 1 sibling.
        //
        // The color of the block is based on the angle of Hue
        //
        // ***Least Significant Bit**
        //
        viewByHostGroup: function(coll) {
            // Group all OSDs by Host
            coll = _.sortBy(coll, this.criteria);
            // Initialize empty grid.
            var arr = _.map(_.range(this.columns * this.rows), function(value) {
                return {
                    id: value,
                    osd: null,
                    neighborMap: 0
                };
            });
            var prevPos = null;
            var self = this;
            var group = 1; // used as input to Hue value
            var neighborMap;
            // Calculate the neighbor map for each position
            _.each(coll, function(osd) {
                // Find the next adjacent position in the empty grid
                // to place this OSD element.
                var nextPos = _.find(arr, function(curPos) {
                    if (prevPos === null && curPos.osd === null) {
                        return true;
                    }
                    return curPos.osd === null && self.isAdjacent(prevPos, curPos);
                });
                nextPos.osd = osd;
                if (prevPos) {
                    if (prevPos.osd.get('host') !== osd.get('host')) {
                        // If the hosts for this OSD are not in the same group
                        // change the background grouping color formula.
                        group += 2.5;
                    } else {
                        // The OSDs are in the same group. Update neighbor maps.
                        // 
                        if (prevPos.neighborMap) {
                            neighborMap = prevPos.osd.get('neighborMap') || 0;
                            prevPos.osd.set('neighborMap', prevPos.neighborMap + neighborMap);
                        }
                        if (nextPos.neighborMap) {
                            neighborMap = osd.get('neighborMap') || 0;
                            osd.set('neighborMap', nextPos.neighborMap + neighborMap);
                        }
                    }
                }
                osd.set('group', group);
                prevPos = nextPos;
            });
            return _.map(_.pluck(_.filter(arr, function(obj) {
                return obj && obj.osd !== null;
            }), 'osd'), function(model, index) {
                var neighbors = model.get('neighborMap');
                if (this.isACornerBasedOn(neighbors)) {
                    log.debug(model.get('osd') + ' check ' + neighborMap);
                    if (this.hasBelow(neighbors)) {
                        // this is a corner piece with adjancency below
                        this.setBelowCornerBits(model, arr[index + this.columns].osd);
                    }
                    if (this.hasAbove(neighbors)) {
                        // this is a corner piece with adjancency above
                        this.setAboveCornerBits(model, arr[index - this.columns].osd);
                    }
                }
                return model;
            }, this);
        },
        // set and clear neighborMap bits on two OSD models
        makeNeighborMapAdjuster: function(clearBit, setBit) {
            /*jshint bitwise: false */
            return function(modelA, modelB) {
                if (!modelA || !modelB) {
                    return;
                }
                var neighbors = modelA.get('neighborMap') ^ clearBit;
                modelA.set('neighborMap', neighbors);
                var lneighbors = modelB.get('neighborMap');
                lneighbors |= setBit;
                modelB.set('neighborMap', lneighbors);
            };
        },
        // Is this square a corner piece?
        isACornerBasedOn: function(neighborMap) {
            return (neighborMap && neighborMap === 3 || neighborMap === 9 || neighborMap === 12 || neighborMap === 6);
        },
        // Adjacent host group square above
        hasAbove: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 1) === 1;
        },
        // Adjacent host group square to left
        hasLeft: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 2) === 2;
        },
        // Adjacent host group square below
        hasBelow: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 4) === 4;
        },
        // Adjacent host group square to right 
        hasRight: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 8) === 8;
        },
        // Corner case 1 - host square above
        isCornerAbove: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 16) === 16;
        },
        isCornerBelow: function(neighborMap) {
            /*jshint bitwise: false */
            return (neighborMap & 32) === 32;
        },
        legendCircle: function(originX, originY, index) {
            // Helper method to draw circles for use as legends beneath viz.
            var srctext = ['down', 'up/out', 'down/in', 'up/in'];
            var srcstate = [{
                    up: 0,
                    'in': 0
                }, {
                    up: 1,
                    'in': 0
                }, {
                    up: 0,
                    'in': 1
                }, {
                    up: 1,
                    'in': 1
                }
            ];
            var percent = [1, 0.66, 0.66, 0.4];

            var model = new Models.OSDModel(_.extend(srcstate[index], {
                capacity: 1024,
                used: percent[index] * 1024
            }));
            var c = this.paper.circle(originX, originY, 16 * model.getPercentage()).attr({
                fill: model.getColor(),
                stroke: 'none',
                'cursor': 'default',
                opacity: 0
            });
            var aFn = Raphael.animation({
                opacity: 1
            }, 250, 'easeOut');
            var text = srctext[index];
            this.paper.text(originX, originY + 23, text).attr({
                'cursor': 'default',
                'font-size': '12px',
                'font-family': 'Titillium Web, sans-serif',
                'font-weight': 300
            });
            return c.animate(aFn);
        },
        drawLegend: function() {
            // Calls legend circle to place in viz.
            var y = this.originY - (this.legendHeight - this.legendOffset);
            var legendGap = 50;
            var legendCount = 4;
            var xp = (this.width / 2) - ((legendGap * (legendCount - 1)) / 2);
            log.debug(xp);
            _.each(_.range(legendCount), function(index) {
                this.legendCircle(xp, y, index);
                xp += legendGap;
            }, this);
        },
        getColor: function(model) {
            var m = this.collection.findWhere({
                host: model.get('host')
            });
            var index = m.get('group') || 1;
            return 'hsb(' + 1.0 / (index / 360) + ', 0.17, 0.8)';
        },
        addBackgroundSquare: function(destX, destY, model) {
            var neighbors = model.get('neighborMap'),
                sqox = 18,
                sqoy = 18,
                sqh = 36,
                sqw = 36;
            if (this.hasAbove(neighbors)) {
                sqh += 2;
                sqoy += 2;
            }
            if (this.hasLeft(neighbors)) {
                sqw += 2;
            }
            if (this.hasBelow(neighbors)) {
                sqh += 2;
            }
            if (this.hasRight(neighbors)) {
                sqw += 2;
                sqox += 2;
            }
            if (this.isCornerAbove(neighbors)) {
                sqh += 2;
                sqoy += 2;
            }
            log.debug(model.get('osd') + ' neighborMap ' + neighbors);
            if (this.isCornerBelow(neighbors)) {
                sqh += 2;
            }
            var sq = this.paper.rect(destX - sqox, destY - sqoy, sqw, sqh).attr({
                'fill': this.getColor(model),
                opacity: '0.6',
                'stroke': this.getColor(model)
            });
            sq.data('modelid', model.id);
            return sq;
        },
        // **animateCircleTraversal** implements a simple set of animations.
        // 1. draw a circle
        // 1. travel horizontally
        // 1. travel vertically
        // 1. draw text
        //
        // Raphael takes care of the tweening and animation scheduling.
        //
        // It tracks any Raphael wrapped SVG objects created in the collection model
        // in an object called views.
        //
        animateCircleTraversal: function(originX, originY, radius, destX, destY, model) {
            var sq = null;
            if (this.customSort) {
                sq = this.addBackgroundSquare(destX, destY, model);
            }
            var c = this.paper.circle(originX, originY, 20 * model.getPercentage()).attr({
                fill: model.getColor(model),
                stroke: 'none'
            });
            c.data('modelid', model.id);
            var t;
            var aFn = Raphael.animation({
                cx: destX,
                cy: originY
            }, 250, 'easeOut', function() {
                c.animate({
                    cx: destX,
                    cy: destY
                }, 333, 'easeIn', function() {
                    t = this.paper.text(destX, destY - 0.5, model.id);
                    t.data('modelid', model.id);
                    if (model.deferred) {
                        model.deferred.resolve();
                        model.deferred = null;
                    }
                    model.views = {
                        circle: c,
                        text: t,
                        square: sq
                    };
                });
            });
            return c.animate(aFn);
        },
        renderWrapper: function(func) {
            func();
            this.paper = window.Raphael(this.ui.viz[0], this.w, this.h);
            this.$detailPanel = new OSDDetailView({
                App: this.App,
                el: this.ui.detail
            });
            this.$filter = new FilterView({
                App: this.App,
                el: this.ui.filter
            }).render();
            this.$switcher = new FilterByView({
                App: this.App,
                el: this.ui.switcher
            }).render();
            var d = $.Deferred();
            this.drawGrid(d);
            var p = d.promise();
            var vent = this.App.vent;
            var toggleSortOrder = this.toggleSortOrder;
            var $toggle = this.$('.viz-controls').bootstrapSwitch();
            $toggle.on('switch-change', function() {
                var d = $.Deferred();
                $toggle.bootstrapSwitch('setActive', false);
                toggleSortOrder(d);
                d.done(function() {
                    $toggle.bootstrapSwitch('setActive', true);
                });
            }).on('click', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
            });
            p.then(this.renderOSDViews).then(function() {
                vent.trigger('viz:render');
            });
            return p;
        },
        removePulse: function() {
            if (this.pulseCircle) {
                this.pulseCircle.stop().hide();
                this.pulseCircle = null;
                this.pulseTimer = null;
            }
        },
        pulseAnimation: Raphael.animation({
            r: 30,
            'stroke-opacity': 0
        }, 1000, 'linear').repeat(2),
        addPulse: function(attrs, id) {
            var circle = this.paper.circle(attrs.cx, attrs.cy, attrs.r + 1).attr({
                'stroke': '#000'
            }).data('modelid', id).animate(this.pulseAnimation);
            return circle;
        },
        osdUnhoverHandler: function() {
            if (this.pulseTimer === null) {
                // install a remove hover timer if none exists
                this.pulseTimer = setTimeout(this.removePulse, 1500);
            }
            this.hostGroupUnhoverHandler();
        },
        isOsdElement: function(evt) {
            var nodeName = evt.target.nodeName;
            return nodeName === 'tspan' || nodeName === 'circle' || nodeName === 'rect';
        },
        isHostGroupElement: function(evt) {
            return evt.target.nodeName === 'rect';
        },
        osdHoverHandlerCore: function(el, id) {
            if (this.pulseTimer) {
                // cancel the remove hover timer if we're
                // still active
                clearTimeout(this.pulseTimer);
                this.pulseTimer = null;
            }
            if (this.pulseCircle && this.pulseCircle.data('modelid') === id) {
                // ignore hover event if you are hovered over the
                // pulsing circle.
                return;
            }
            log.debug(id);
            if (_.isNumber(id)) {
                var views = this.collection.get(id).views;
                if (views) {
                    // use the underlying circle element for initial dimensions
                    var circle = views.circle;
                    if (circle) {
                        this.removePulse();
                        this.pulseCircle = this.addPulse(circle.attrs, id);
                    }
                }
            }
        },
        hostGroupHoverHandlerCore: function(el, id) {
            if (!this.customSort) {
                return;
            }
            if (_.isNumber(id)) {
                var model = this.collection.get(id);
                if (model.views) {
                    // use the underlying circle element for initial dimensions
                    if (this.hostGroupTimer) {
                        clearTimeout(this.hostGroupTimer);
                        this.hostGroupTimer = null;
                    }
                    var hostGroup = model.get('host');
                    if (this.curHostGroup === hostGroup) {
                        return;
                    }
                    $('.viz').tooltip('destroy').tooltip({
                        title: hostGroup
                    }).tooltip('show');
                    var y = el.attr('y');
                    $('.viz').data('tooltip').$tip[0].style.top = (y - 64) + 'px';
                    this.curHostGroup = hostGroup;
                }
            }
        },
        hostGroupUnhoverHandler: function() {
            var self = this;
            this.hostGroupTimer = setTimeout(function() {
                $('.viz').tooltip('destroy');
                self.hostGroup = null;
            }, 1000);
        },
        dialogPlacement: ['detail-outer-bottom-right', 'detail-outer-top-left', 'detail-outer-top-right', 'detail-outer-bottom-left'],
        osdClickHandlerCore: function(el, id) {
            if (_.isNumber(id)) {
                // ignore circles and tspans without data
                var mAttr = this.collection.get(id).attributes;
                mAttr.clazz = this.dialogPlacement[0];
                var placement = 0;
                var eAttr = el.attrs;
                if (eAttr.x || eAttr.cx) {
                    var ix = eAttr.x || eAttr.cx,
                        iy = eAttr.y || eAttr.cy;
                    if (ix > this.threshx && iy > this.threshy) {
                        placement = 1;
                    } else if (ix < this.threshx && iy > this.threshy) {
                        placement = 2;
                    } else if (ix > this.threshx && iy < this.threshy) {
                        placement = 3;
                    }
                }
                mAttr.clazz = this.dialogPlacement[placement];
                this.$detailPanel.set(mAttr);
            }
        },
        makeSVGEventHandlerFunc: function(testFn, handlerFn) {
            // create a SVG event handler function template
            return function(evt) {
                if (this.state === 'dashboard') {
                    return;
                }
                evt.stopPropagation();
                evt.preventDefault();
                if (!testFn(evt)) {
                    return;
                }
                var x = evt.clientX;
                var y = evt.clientY;
                log.debug(x + ' / ' + y);
                var el = this.paper.getElementByPoint(x, y);
                log.debug(el);
                log.debug(el.attrs.x + ' / ' + el.attrs.y);
                if (el) {
                    var id = el.data('modelid');
                    log.debug(id);
                    if (_.isFunction(handlerFn)) {
                        handlerFn = [handlerFn];
                    }
                    _.each(handlerFn, function(fn) {
                        fn.call(this, el, id);
                    }, this);
                }
            };
        },
        // **filter** There are are two collections used to manage OSDs. `this.collection` is the source
        // fetched directly from the Calamari API. `this.filterCol` is the copy post filtering
        // rendered to the UI.
        //
        // There may be some opportunities for Mori.JS to help us with memory management and
        // garbage collection, which is pretty naive in this version.
        filter: function(filterCol, deferred) {
            this.filterCol = filterCol;
            var enabled = filterCol.where({
                enabled: true,
                visible: true
            });
            // remove all existing OSDs from SVG
            this.resetViews(null, {
                previousModels: this.collection.models
            });
            var vent = this.App.vent;
            return this.renderOSDViews(function(m) {
                return _.find(enabled, function(obj) {
                    if (obj.get('category') !== 'osd' && m.isDown()) {
                        return true;
                    }
                    if (_.isFunction(obj.get('match'))) {
                        var t = obj.get('match')(m);
                        log.debug('matched ' + m.id + ' ' + t);
                        return t;
                    }
                    return false;
                });
            }).then(function() {
                if (deferred) {
                    deferred.resolve();
                }
                vent.trigger('viz:render');
            });
        },
        pulse: function(filterCol) {
            this.removePulse();
            var pulsed = filterCol.where({
                pulse: true,
                visible: true
            });
            this.collection.each(function(value) {
                var views = value.views;
                if (!views) {
                    return;
                }
                if (views.pcircle) {
                    views.pcircle.stop().hide();
                    views.pcircle = null;
                }
                return _.find(pulsed, function(obj) {
                    if (_.isFunction(obj.get('match'))) {
                        var t = obj.get('match')(value);
                        if (t) {
                            if (views.circle) {
                                if (views.pcircle) {
                                    views.pcircle.show();
                                } else {
                                    views.pcircle = views.circle.clone().attr({
                                        r: views.circle.attrs.r + 1,
                                        'stroke': '#000',
                                        'fill': 'none'
                                    }).animate(this.pulseAnimation);
                                }

                            }
                        }
                        return t;
                    }
                    return false;
                }, this);
            }, this);
        },
        reset: function(callback) {
            this.resetViews(null, {
                previousModels: this.collection.models
            });
            var vent = this.App.vent;
            this.filterCol = null;
            return this.renderOSDViews().then(function() {
                if (callback) {
                    callback.call(this);
                }
                vent.trigger('viz:render');
            });
        }
    });
    return OSDVisualization;
});
