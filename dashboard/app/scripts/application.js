/*global define*/
define(['jquery', 'underscore', 'backbone', 'helpers/animation', 'statemachine', 'marionette'], function($, _, Backbone, animation, StateMachine) {
    'use strict';
    var Application = Backbone.Marionette.Application.extend({
        onentergraphmode: function( /*event, from, to, host, osd */ ) {
            $('.row').css('display', 'none');
            this.graphWall.render();
            $('.container').append(this.graphWall.$el);
        },
        onInitializeBefore: function(options) {
            if (options.appRouter) {
                this.appRouter = options.appRouter;
            }
            _.bindAll(this);
            this.fsm = StateMachine.create({
                initial: 'dashmode',
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
                    ongraph: this.ongraph
                }
            });
            _.bindAll(this.fsm);
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
        ongraph: function(event, from, to, host, id) {
            //console.log('ongraph>> host: ' + host + ' device id: ' + id);
            this.graphWall.hideGraphs();
            var hosts;
            var self = this;
            if (host === 'all') {
                this.graphWall.hideButtons();
                this.graphWall.renderGraphs('CPU Load for Cluster', this.graphWall.makeHostUrls('makeCPUGraphUrl'));
            } else if (host === 'iops') {
                this.graphWall.hideButtons();
                this.graphWall.makePoolIOPS.call(this.graphWall).then(function(result) {
                    self.graphWall.renderGraphs('Per Pool IOPS', function() {
                        return _.flatten(result);
                    });
                });
            } else if (id !== undefined && id !== null) {
                this.graphWall.showButtons();
                var graphEvent = this.graphEvents[id];
                if (graphEvent !== undefined) {
                    this.graphWall[graphEvent.fn].call(this.graphWall, host, id).then(function(result) {
                        self.graphWall.renderGraphs(graphEvent.title({
                            host: host
                        }), function() {
                            return _.flatten(result);
                        });
                    }).fail(function(result) {
                        // TODO Handle errors gracefully
                        console.log('failed! ', result);
                    });
                    return;
                }
            } else {
                hosts = this.ReqRes.request('get:hosts');
                if (_.contains(hosts, host)) {
                    this.graphWall.showButtons();
                    this.graphWall.updateBtns('overview');
                    this.graphWall.hostname = host;
                    this.graphWall.renderGraphs('Host Graphs for ' + host, this.graphWall.makeHostOverviewGraphUrl(host));
                }
            }
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
                vent.trigger('viz:fullscreen', function() {
                    vent.trigger('gauges:collapse');
                });
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
                vent.trigger('gauges:expand', function() {
                    vent.trigger('gauges:reappear');
                });
            });
        },
        onenterdashmode: function() {
            this.vent.trigger('dashboard:refresh');
        },
        onleavedashmode: function() {}
    });
    return Application;
});
/*
 */
