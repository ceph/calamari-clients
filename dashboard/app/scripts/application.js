/*global define*/
define(['jquery', 'underscore', 'backbone', 'helpers/animation', 'statemachine', 'loglevel', 'marionette'], function($, _, Backbone, animation, StateMachine, log) {
    'use strict';
    // 
    var Application = Backbone.Marionette.Application.extend({
        // The state machine lives in Application.
        // The state machine's main purpose is managing state transitions.
        // @see Jake Gorden's [State Machine](https://github.com/jakesgordon/javascript-state-machine)
        // for more information on how it works.
        onInitializeBefore: function(options) {
            if (options.appRouter) {
                this.appRouter = options.appRouter;
            }
            // bind Application functions to this instance.
            _.bindAll(this);
            this.fsm = StateMachine.create({
                initial: options.initial || 'dashmode',
                events: [{
                        name: 'dashboard',
                        from: ['vizmode', 'graphmode'],
                        to: 'dashmode'
                    }, {
                        name: 'viz',
                        from: ['dashmode', 'graphmode', 'vizmode'],
                        to: 'vizmode'
                    }, {
                        name: 'graph',
                        from: ['dashmode', 'vizmode', 'graphmode'],
                        to: 'graphmode'
                    }
                ],
                callbacks: {
                    onentervizmode: this.onentervizmode,
                    onleavevizmode: this.onleavevizmode,
                    onentergraphmode: this.onentergraphmode,
                    onleavegraphmode: this.onleavegraphmode,
                    onenterdashmode: this.onenterdashmode,
                    onleavedashmode: this.onleavedashmode,
                    ongraph: this.ongraph,
                    ondashboard: this.ondashboard
                }
            });
            // bind Finite State Machine functions to FSM instance.
            _.bindAll(this.fsm);

            // Start Listening to Global Application Events.
            this.listenTo(this.vent, 'app:fullscreen', function() {
                this.appRouter.navigate('workbench', {
                    trigger: true
                });
            });
            this.listenTo(this.vent, 'app:dashboard', function() {
                this.appRouter.navigate('dashboard', {
                    trigger: true
                });
            });
            this.listenTo(this.vent, 'app:graph', function(host) {
                if (host === undefined) {
                    host = 'all';
                }
                this.appRouter.navigate('graph/' + host, {
                    trigger: true
                });
            });
        },
        onInitializeAfter: function( /*options*/ ) {
            // Start History.
            if (Backbone.history) {
                Backbone.history.start();
            }
        },
        // Graph Events Lookup Object.
        //
        // `dashboard/#graph/<fqdn>/<id>`
        //
        // |**fn**|the function to call in the graph object|
        // |---|----|
        // |**title**|the UI title JST template for this specific graph|
        graphEvents: {
            'cpudetail': {
                fn: 'makeCPUDetail',
                title: _.template('Host <%- host %> CPU Detail Host')
            },
            'iops': {
                fn: 'makeHostDeviceIOPS',
                title: _.template('Host <%- host %> IOPS Per Device')
            },
            'rwbytes': {
                fn: 'makeHostDeviceRWBytes',
                title: _.template('Host <%- host %> RW Bytes/Sec Per Device')
            },
            'rwawait': {
                fn: 'makeHostDeviceRWAwait',
                title: _.template('Host <%- host %> RW Await Per Device')
            },
            'diskinodes': {
                fn: 'makeHostDeviceDiskSpaceInodes',
                title: _.template('Host <%- host %> DiskSpace Inodes Device')
            },
            'diskbytes': {
                fn: 'makeHostDeviceDiskSpaceBytes',
                title: _.template('Host <%- host %> DiskSpace Bytes Device')
            },
            'netpackets': {
                fn: 'makeHostNetworkPacketsMetrics',
                title: _.template('Host <%- host %> Network Interface Packets TX/RX')
            },
            'netbytes': {
                fn: 'makeHostNetworkBytesMetrics',
                title: _.template('Host <%- host %> Network Interface Bytes TX/RX')
            }
        },
        // On Entering Graph Event Callback.
        onentergraphmode: function(event, from, to /*, host, osd*/ ) {
            log.debug('ENTER ' + event + ', FROM ' + from + ', TO ' + to);
            $('.row').css('display', 'none');
            var ready = this.ReqRes.request('get:ready');
            var self = this;
            // This promise guarantees the app has finished initializing.
            ready.then(function() {
                self.graphWall.render();
                $('.container').append(self.graphWall.$el);
                if (event === 'startup' && from === 'none') {
                    self.ongraph(event, from, to, 'all');
                }
            });
        },
        // In Graph Event Callback.
        ongraph: function(event, from, to, fqdn, id) {
            log.debug('AFTER ' + event + ', FROM ' + from + ', TO ' + to);
            var graphWall = this.graphWall;
            var self = this;
            // We use a promise to ensure GraphWall has finished initializing.
            graphWall.isReady().then(function() {
                graphWall.hideGraphs();
                var fqdns;
                if (fqdn === 'all') {
                    // Default Graphs - Cluster Wide Graphs.
                    graphWall.hideButtons();
                    graphWall.makeClusterWideMetrics.call(graphWall).then(function(result) {
                        graphWall.renderGraphs('Cluster', function() {
                            return _.flatten(result);
                        });
                    });
                } else if (fqdn === 'iops') {
                    // IOPS graphs page.
                    graphWall.hideButtons();
                    graphWall.makePoolIOPS.call(graphWall).then(function(result) {
                        graphWall.renderGraphs('Per Pool IOPS', function() {
                            return _.flatten(result);
                        });
                    });
                } else if (id !== undefined && id !== null) {
                    // Host Graphs with a Specific Graph Event.
                    graphWall.showButtons();
                    var graphEvent = self.graphEvents[id];
                    if (graphEvent !== undefined) {
                        graphWall[graphEvent.fn].call(graphWall, fqdn, id).then(function(result) {
                            graphWall.renderGraphs(graphEvent.title({
                                host: fqdn
                            }), function() {
                                return _.flatten(result);
                            });
                        }).fail(function( /*result*/ ) {
                            // TODO Handle errors gracefully
                        });
                        return;
                    }
                } else {
                    // Default Host Specific Graphs.
                    fqdns = self.ReqRes.request('get:fqdns');
                    if (_.contains(fqdns, fqdn)) {
                        graphWall.showButtons();
                        graphWall.updateSelect(fqdn);
                        graphWall.updateBtns('overview');
                        graphWall.hostname = fqdn;
                        graphWall.renderGraphs('Host Graphs for ' + fqdn, graphWall.makeHostOverviewGraphUrl(fqdn));
                    }
                }
            });
        },
        // On Leaving Graph State.
        onleavegraphmode: function() {
            this.graphWall.close();
            $('.row').css('display', 'block');
        },
        // On entering Visualization.
        onentervizmode: function(event, from) {
            var d = $.Deferred();
            var $body = $('body');
            var vent = this.vent;
            if (from === 'dashmode') {
                vent.trigger('gauges:disappear', function() {
                    d.resolve();
                });
            } else {
                d.resolve();
            }
            // Wait until gauge disappear animation has finished before starting
            // next animation.
            d.promise().then(function() {
                $body.addClass('workbench-mode');
                var fn = function() {
                    vent.trigger('gauges:collapse');
                };
                vent.trigger('viz:fullscreen', _.once(fn));
            });
        },
        // On leaving Visualization.
        onleavevizmode: function(event, from, to) {
            var $body = $('body');
            var vent = this.vent;
            $body.removeClass('workbench-mode');
            var d = $.Deferred();
            if (to === 'dashmode') {
                vent.trigger('viz:dashboard', function() {
                    d.resolve();
                });
            } else {
                vent.trigger('viz:dashboard', function() {
                    d.resolve();
                });
            }
            d.promise().then(function() {
                vent.trigger('gauges:expand', _.once(function() {
                    vent.trigger('gauges:reappear');
                }));
            });
        },
        // On entering dashboard.
        onenterdashmode: function() {
            $('.initial-hide').removeClass('initial-hide');
        },
        // On leaving dashboard.
        onleavedashmode: function() {},
        // In dashboard.
        ondashboard: function( /*event, from, to, host, id*/ ) {
            this.vent.trigger('dashboard:refresh');
        }
    });
    return Application;
});
/*
 */
