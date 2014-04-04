/*global define*/
define(['jquery', 'underscore', 'backbone', 'helpers/animation', 'statemachine', 'loglevel', 'marionette'], function($, _, Backbone, animation, StateMachine, log) {
    'use strict';
    var Application = Backbone.Marionette.Application.extend({
        onInitializeBefore: function(options) {
            if (options.appRouter) {
                this.appRouter = options.appRouter;
            }
            _.bindAll(this); // bind Application functions to this instance
            this.fsm = StateMachine.create({
                initial: options.initial || 'dashmode',
                events: [{
                        name: 'dashboard',
                        from: ['vizmode', 'graphmode'],
                        to: 'dashmode'
                    }, {
                        name: 'viz',
                        from: ['dashmode', 'graphmode'],
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
            _.bindAll(this.fsm); // bind Finite State Machine functions to FSM instance
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
            if (Backbone.history) {
                Backbone.history.start();
            }
        },
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
        onentergraphmode: function(event, from, to /*, host, osd*/ ) {
            log.debug('ENTER ' + event + ', FROM ' + from + ', TO ' + to);
            $('.row').css('display', 'none');
            var ready = this.ReqRes.request('get:ready');
            var self = this;
            ready.then(function() {
                self.graphWall.render();
                $('.container').append(self.graphWall.$el);
                if (event === 'startup' && from === 'none') {
                    self.ongraph(event, from, to, 'all');
                }
            });
        },
        ongraph: function(event, from, to, fqdn, id) {
            log.debug('AFTER ' + event + ', FROM ' + from + ', TO ' + to);
            var graphWall = this.graphWall;
            var self = this;
            graphWall.isReady().then(function() {
                graphWall.hideGraphs();
                var fqdns;
                if (fqdn === 'all') {
                    graphWall.hideButtons();
                    graphWall.makeClusterWideMetrics.call(graphWall).then(function(result) {
                        graphWall.renderGraphs('Cluster', function() {
                            return _.flatten(result);
                        });
                    });
                } else if (fqdn === 'iops') {
                    graphWall.hideButtons();
                    graphWall.makePoolIOPS.call(graphWall).then(function(result) {
                        graphWall.renderGraphs('Per Pool IOPS', function() {
                            return _.flatten(result);
                        });
                    });
                } else if (id !== undefined && id !== null) {
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
        onleavegraphmode: function() {
            this.graphWall.close();
            $('.row').css('display', 'block');
        },
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
            d.promise().then(function() {
                $body.addClass('workbench-mode');
                var fn = function() {
                    vent.trigger('gauges:collapse');
                };
                vent.trigger('viz:fullscreen', _.once(fn));
            });
        },
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
        onenterdashmode: function() {
            $('.initial-hide').removeClass('initial-hide');
        },
        onleavedashmode: function() {},
        ondashboard: function( /*event, from, to, host, id*/ ) {
            this.vent.trigger('dashboard:refresh');
        }
    });
    return Application;
});
/*
 */
