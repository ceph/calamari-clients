/*global define, Raphael*/

'use strict';
define(['jquery', 'underscore', 'backbone', 'helpers/raphael_support', 'templates', 'bootstrap', 'views/osd-detail-view', 'views/filter-view', 'models/application-model', 'helpers/animation', 'views/switcher-view', 'raphael', 'marionette'], function($, _, Backbone, Rs, JST, bs, OSDDetailView, FilterView, Models, animation, SwitcherView) {
    var OSDVisualization = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/viz.ejs'],
        serializeData: function() {
            return {};
        },
        originX: 0,
        originY: 0,
        step: 40,
        timer: null,
        pulseTimer: null,
        state: 'dashboard',
        ui: {
            'cardTitle': '.card-title',
            viz: '.viz',
            filter: '.filter',
            filterpanel: '.filter-panel',
            switcher: '.switcher',
            detail: '.detail-outer',
            spinner: '.icon-spinner'
        },
        events: {
            'click .viz': 'osdClickHandler',
            'click': 'screenSwitchHandler',
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
        appEvents: {
            'keyup': 'keyHandler',
            'osd:update': 'updateCollection',
            'cluster:update': 'switchCluster',
            'viz:fullscreen': 'fullscreen',
            'viz:dashboard': 'dashboard',
            'viz:filter': 'filter',
            'viz:pulse': 'pulse'
        },
        spinnerOn: function() {
            this.ui.spinner.css('visibility', 'visible');
        },
        spinnerOff: function() {
            this.ui.spinner.css('visibility', 'hidden');
        },
        updateCollection: function() {
            if (this.App.Config['delta-osd-api'] && this.collection.length > 0) {
                this.collection.update.apply(this.collection);
            } else {
                var vent = this.App.vent;
                this.collection.fetch().then(function() {
                    // after collection update update the filter counts
                    vent.trigger('filter:update');
                });
            }
        },
        switchCluster: function(cluster) {
            if (cluster) {
                this.collection.cluster = cluster.get('id');
            }
        },
        setupAnimations: function(obj) {
            obj.vizMoveUpAnimation = animation.single('moveVizUpAnim');
            obj.vizMoveDownAnimation = animation.single('moveVizDownAnim');
            obj.vizSlideRightAnimation = animation.single('slideVizRightAnim');
            obj.vizSlideLeftAnimation = animation.single('slideVizLeftAnim');
            obj.fadeInAnimation = animation.single('fadeInAnim');
            obj.fadeOutAnimation = animation.single('fadeOutAnim');
        },
        getHosts: function() {
            return _.uniq(this.collection.pluck('host'));
        },
        getOSDIdsByHost: function(host) {
            return _.pluck(this.collection.filter(function(m) {
                return m.get('host') === host;
            }), 'id');
        },
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
        getPGCounters: function() {
            /*jshint camelcase: false */
            return this.collection.pg_state_counts || {};
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.columns = 16;
            this.rows = 10;
            this.width = (this.columns + 1) * this.step;
            this.height = (this.rows + 1) * this.step;
            this.w = 720;
            this.h = 520;
            this.threshx = this.w / 2;
            this.threshy = this.h / 2;
            _.bindAll(this);

            this.setupAnimations(this);

            this.keyHandler = _.debounce(this.keyHandler, 250, true);
            this.screenSwitchHandler = _.debounce(this.screenSwitchHandler, 250, true);

            // App Level Events
            Backbone.Marionette.bindEntityEvents(this, this.App.vent, Backbone.Marionette.getOption(this, 'appEvents'));

            // App Level Request Responses
            this.App.ReqRes.setHandler('get:hosts', this.getHosts);
            this.App.ReqRes.setHandler('get:osdcounts', this.getOSDCounters);
            this.App.ReqRes.setHandler('get:pgcounts', this.getPGCounters);
            this.App.ReqRes.setHandler('get:osdids', this.getOSDIdsByHost);
            this.render = _.wrap(this.render, this.renderWrapper);
            this.osdHoverHandler = this.makeSVGEventHandlerFunc(this.isOsdElement, [this.osdHoverHandlerCore, this.hostGroupHoverHandlerCore]);
            this.osdClickHandler = this.makeSVGEventHandlerFunc(this.isOsdElement, this.osdClickHandlerCore);
            this.setBelowCornerBits = this.makeNeighborMapAdjuster(4, 16);
            this.setAboveCornerBits = this.makeNeighborMapAdjuster(1, 32);
        },
        screenSwitchHandler: function() {
            if (this.state === 'dashboard') {
                this.App.vent.trigger('app:fullscreen');
            }
        },
        toFullscreenTransitionOne: function() {
            return this.vizSlideRightAnimation(this.ui.viz);
        },
        toFullscreenTransitionTwo: function() {
            var ui = this.ui;
            ui.viz.addClass('viz-fullscreen');
            ui.filterpanel.show();
            this.App.vent.trigger('filter:update');
            return this.fadeInAnimation(ui.filterpanel);
        },
        fullscreen: function(callback) {
            this.state = 'fullscreen';
            this.ui.cardTitle.text('OSD Workbench');
            this.$el.removeClass('card').addClass('workbench');
            return this.vizMoveUpAnimation(this.$el, callback).then(this.toFullscreenTransitionOne).then(this.toFullscreenTransitionTwo);
        },
        toDashboardTransitionOne: function() {
            var ui = this.ui;
            this.fadeOutAnimation(ui.filterpanel).then(function() {
                ui.filterpanel.css('visibility', 'hidden');
            }).then(function() {
                ui.filterpanel.css('visibility', 'visible');
            });
            this.reset();
            return this.vizSlideLeftAnimation(ui.viz);
        },
        toDashboardTransitionTwo: function() {
            var ui = this.ui;
            ui.viz.removeClass('viz-fullscreen');
            ui.filterpanel.hide();
        },
        dashboard: function(callback) {
            this.state = 'dashboard';
            this.ui.cardTitle.text('OSD Status');
            this.$el.addClass('card').removeClass('workbench');
            return this.vizMoveDownAnimation(this.$el, callback).then(this.toDashboardTransitionOne).then(this.toDashboardTransitionTwo);
        },
        resetViews: function(collection, options) {
            _.each(options.previousModels, this.cleanupModelView);
        },
        addOSD: function(model) {
            this.moveCircle(model, this.collection.indexOf(model));
        },
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
        removeOSD: function(m) {
            this.collection.remove(m);
            this.cleanupModelView(m);
        },
        updateOSD: function(m) {
            m.set(m.attributes);
        },
        drawGrid: function(d) {
            var path = Rs.calcGrid(this.originX, this.originY, this.width, this.height, this.step);
            var path1 = this.paper.path('M0,0').attr({
                'stroke-width': 1,
                'stroke': '#5e6a71',
                'opacity': 0.40
            });
            this.drawLegend(285, 475);
            var anim = Raphael.animation({
                path: path,
                callback: d.resolve
            }, 250);
            path1.animate(anim);
        },
        startPosition: [{
            x: 40,
            y: 40
        }, {
            x: 600,
            y: 40
        }, {
            x: 600,
            y: 400
        }, {
            x: 40,
            y: 400
        }],
        moveCircle: function(model, index) {
            if (model === null) {
                return;
            }
            var start = this.startPosition[Math.floor(Math.random() * 4)];
            var pos = Rs.calcPosition(index, this.originX, this.originY, this.width, this.height, this.step);
            this.animateCircleTraversal(start.x, start.y, 8, pos.nx, pos.ny, model);
        },
        hex: function(value) {
            var hex = '00' + value.toString(16);
            return hex.substr(hex.length - 2, hex.length);
        },
        criteria: function(model) {
            return model.get('host') + this.hex(model.get('osd'));
        },
        isAdjacent: function(posA, posB) {
            var colA = posA.id % this.columns;
            var rowA = Math.floor(posA.id / this.columns);
            var colB = posB.id % this.columns;
            var rowB = Math.floor(posB.id / this.columns);
            if (rowA + 1 === rowB && colA === colB) {
                // below
                posA.neighborMap = 4;
                posB.neighborMap = 1;
                return true;
            }
            if (rowA === rowB && colB === colA + 1) {
                // to right
                posA.neighborMap = 2;
                posB.neighborMap = 8;
                return true;
            }
            if (rowA === rowB && colB === colA - 1) {
                //to left
                posA.neighborMap = 8;
                posB.neighborMap = 2;
                return true;
            }
            return false;
        },
        renderOSDViews: function(filterFn) {
            var coll = this.collection.models;
            if (filterFn) {
                coll = _.filter(coll, filterFn);
            }
            //console.log(coll.length);
            var d = $.Deferred();
            var last = _.last(coll);
            if (last) {
                // add deferred to last model so we can
                // signal rendering is done.
                last.deferred = d;
            } else {
                d.resolve();
            }
            // TODO Add another stage here for position sorting which takes the
            // first list and creates a new list with gaps in the list
            // then it should render correctly.
            coll = _.sortBy(coll, this.criteria);
            var arr = _.map(_.range(160), function(value) {
                return {
                    id: value,
                    osd: null,
                    neighborMap: 0
                };
            });
            var lastElem = null;
            var self = this;
            var group = 1;
            var neighborMap;
            _.each(coll, function(osd) {
                var arrItem = _.find(arr, function(elem) {
                    if (lastElem === null && elem.osd === null) {
                        return true;
                    }
                    return elem.osd === null && self.isAdjacent(lastElem, elem);
                });
                arrItem.osd = osd;
                if (lastElem) {
                    if (lastElem.osd.get('host') !== osd.get('host')) {
                        group += 2.5;
                    } else {
                        if (lastElem.neighborMap) {
                            neighborMap = lastElem.osd.get('neighborMap') || 0;
                            lastElem.osd.set('neighborMap', lastElem.neighborMap + neighborMap);
                        }
                        if (arrItem.neighborMap) {
                            neighborMap = osd.get('neighborMap') || 0;
                            osd.set('neighborMap', arrItem.neighborMap + neighborMap);
                        }
                    }
                }
                osd.set('group', group);
                lastElem = arrItem;
            });
            coll = _.map(_.pluck(arr, 'osd'), function(model, index) {
                var neighbors = model.get('neighborMap');
                if (this.isACornerBasedOn(neighbors)) {
                    //console.log(model.get('osd') + ' check ' + neighborMap);
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
            _.each(coll, this.moveCircle, this);
            return d.promise();
        },
        // set and clear neighborMap bits on two OSD models
        makeNeighborMapAdjuster: function(clearBit, setBit) {
            /*jshint bitwise: false */
            return function(modelA, modelB) {
                var neighbors = modelA.get('neighborMap') ^ clearBit;
                modelA.set('neighborMap', neighbors);
                var lneighbors = modelB.get('neighborMap');
                lneighbors |= setBit;
                modelB.set('neighborMap', lneighbors);
                //console.log('above ' + losd.get('osd') + ' ' + losd.get('neighborMap'));
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
            }];
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
                'font-family': 'ApexSansLight'
            });
            return c.animate(aFn);
        },
        drawLegend: function(originX, originY) {
            // Calls legend circle to place in viz.
            var xp = originX;
            _.each(_.range(4), function(index) {
                this.legendCircle(xp, originY, index);
                xp += 50;
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
            //console.log(model.get('osd') + ' neighborMap ' + neighborMap);
            if (this.isCornerBelow(neighbors)) {
                sqh += 2;
            }
            var sq = this.paper.rect(destX - sqox, destY - sqoy, sqw, sqh).attr({
                'fill': this.getColor(model),
                opacity: '0.4',
                'stroke': this.getColor(model)
            });
            sq.data('modelid', model.id);
            return sq;
        },
        animateCircleTraversal: function(originX, originY, radius, destX, destY, model) {
            var sq = this.addBackgroundSquare(destX, destY, model);
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
                    t = this.paper.text(destX, destY - 1, model.id).attr({
                        font: '',
                        stroke: '',
                        fill: '',
                        style: ''
                    });
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
        simulateUsedChanges: function() {
            this.removePulse();
            var maxRed = 2;
            this.collection.each(function(m) {
                var up = true;
                var _in = Math.random();
                _in = _in < 0.95;
                if (!_in && (Math.random() > 0.6) && maxRed > 0) {
                    maxRed -= 1;
                    up = false;
                    //console.log(m.id + ' setting to down');
                } else {
                    if (Math.random() > 0.6) {
                        up = false;
                    }
                }
                m.set({
                    'up': up ? 1 : 0,
                    'in': _in ? 1 : 0
                });
            });
            this.App.vent.trigger('updateTotals');
            this.App.vent.trigger('status:healthwarn');
        },
        resetChanges: function() {
            this.removePulse();
            this.collection.each(function(m) {
                m.set({
                    'up': 1,
                    'in': 1
                });
            });
            this.App.vent.trigger('updateTotals');
            this.App.vent.trigger('status:healthok');
        },
        startSimulation: function() {
            var self = this;
            this.timer = setTimeout(function() {
                self.simulateUsedChanges();
                self.timer = self.startSimulation();
            }, 3000);
            return this.timer;
        },
        stopSimulation: function() {
            clearTimeout(this.timer);
            this.timer = null;
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
            this.$switcher = new SwitcherView({
                App: this.App,
                el: this.ui.switcher
            }).render();
            var d = $.Deferred();
            this.drawGrid(d);
            var p = d.promise();
            var vent = this.App.vent;
            p.then(this.renderOSDViews).then(function() {
                vent.trigger('viz:render');
            });
            return p;
        },
        keyHandler: function(evt) {
            evt.preventDefault();
            if (!evt.keyCode) {
                return;
            }
            var keyCode = evt.keyCode;
            if (keyCode === 27) /* Escape */
            {
                this.App.vent.trigger('escapekey');
            }
            if (keyCode === 82) /* r */
            {
                this.resetChanges();
                return;
            }
            if (keyCode === 85) /* u */
            {
                this.simulateUsedChanges();
                return;
            }
            if (keyCode === 32) /* space */
            {
                var $spinner = $('.icon-spinner');
                if (this.timer === null) {
                    this.startSimulation();
                    $spinner.closest('i').addClass('.icon-spin').show();
                } else {
                    this.stopSimulation();
                    $spinner.closest('i').removeClass('.icon-spin').hide();
                }
            }
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
            'stroke-opacity': 0,
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
            //console.log(id);
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
        hostGroup: null,
        hostGroupTimer: null,
        hostGroupHoverHandlerCore: function(el, id) {
            if (_.isNumber(id)) {
                var model = this.collection.get(id);
                if (model.views) {
                    // use the underlying circle element for initial dimensions
                    if (this.hostGroupTimer) {
                        clearTimeout(this.hostGroupTimer);
                        this.hostGroupTimer = null;
                    }
                    var hostGroup = model.get('host');
                    if (this.hostGroup === hostGroup) {
                        return;
                    }
                    $('.viz').tooltip('destroy').tooltip({
                        title: hostGroup
                    }).tooltip('show');
                    this.hostGroup = hostGroup;
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
                //console.log(x + ' / ' + y);
                var el = this.paper.getElementByPoint(x, y);
                //console.log(el);
                //console.log(el.attrs.x + ' / ' + el.attrs.y);
                if (el) {
                    var id = el.data('modelid');
                    //console.log(id);
                    if (_.isFunction(handlerFn)) {
                        handlerFn = [handlerFn];
                    }
                    _.each(handlerFn, function(fn) {
                        fn.call(this, el, id);
                    }, this);
                }
            };
        },
        filter: function(filterCol) {
            var enabled = filterCol.where({
                enabled: true,
                visible: true
            });
            this.resetViews(null, {
                previousModels: this.collection.models
            });
            var vent = this.App.vent;
            return this.renderOSDViews(function(m) {
                return _.find(enabled, function(obj) {
                    if (_.isFunction(obj.get('match'))) {
                        var t = obj.get('match')(m);
                        //console.log('matched ' + m.id + ' ' + t);
                        return t;
                    }
                    return false;
                });
            }).then(function() {
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
        reset: function() {
            this.resetViews(null, {
                previousModels: this.collection.models
            });
            var vent = this.App.vent;
            return this.renderOSDViews().then(function() {
                vent.trigger('viz:render');
            });
        }
    });
    return OSDVisualization;
});
