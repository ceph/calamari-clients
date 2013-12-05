/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/graph-utils', 'models/application-model', 'dygraphs', 'marionette'], function($, _, Backbone, JST, gutils, models, Dygraph) {
    'use strict';

    var GraphwallView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/graphwall.ejs'],
        graphTemplate: JST['app/scripts/templates/graph.ejs'],
        className: 'graph-mode',
        ui: {
            'title': '.title',
            'buttons': '.btn-toolbar',
            'hosts': '.hosts-select'
        },
        events: {
            'click .btn-graph .btn': 'clickHandler',
            'change .hosts-select select': 'hostChangeHandler'
        },
        hostChangeHandler: function(evt) {
            var target = evt.target;
            var $el = $(target.options[target.selectedIndex]);
            var host = $el.attr('value');
            this.AppRouter.navigate('graph/' + host, {
                trigger: true
            });
        },
        clickHandler: function(evt) {
            var $target = $(evt.target);
            var id = $target.attr('data-id');
            var route = 'graph/' + this.hostname + '/' + id;
            if (id === 'overview') {
                route = 'graph/' + this.hostname;
            }
            //console.log(route);
            this.AppRouter.navigate(route, {
                trigger: true
            });
        },
        onItemBeforeClose: function() {
            this.$('.graph-card').each(function(index, graph) {
                var $graph = $(graph);
                var dynagraph = $graph.data('graph');
                // jshint camelcase: false
                if (dynagraph && dynagraph.maindiv_ !== null) {
                    dynagraph.destroy();
                }
                $graph.data('graph', undefined);
            });
        },
        titleTemplates: {},
        dygraphDefaults: {},
        graphs: [{
                metrics: ['byte_free', 'byte_used'],
                fn: 'makeDiskSpaceBytesGraphUrl',
                util: 'makeDiskSpaceTargets',
                titleTemplate: _.template('OSD <%- id %> Disk Space'),
                options: {
                    labelsKMG2: true,
                    stackedGraph: true,
                    fillGraph: true,
                    labels: ['Date', 'Free', 'Used']
                }
            }, {
                metrics: ['inodes_free', 'inodes_used'],
                fn: 'makeDiskSpaceInodesGraphUrl',
                util: 'makeDiskSpaceTargets',
                titleTemplate: _.template('OSD <%- id %> Inodes'),
                options: {
                    labelsKMB: true,
                    stackedGraph: true,
                    fillGraph: true,
                    labels: ['Date', 'Free', 'Used']
                }
            }, {
                metrics: ['system', 'user', 'idle'],
                fn: 'makeCPUGraphUrl',
                util: 'makeCPUTargets',
                titleTemplate: _.template('<%- hostname %> CPU Summary'),
                options: {
                    labels: ['Date', 'System', 'User', 'Idle'],
                    stackedGraph: true,
                    fillGraph: true,
                    stepPlot: true
                }
            }, {
                metrics: ['system', 'user', 'nice', 'idle', 'iowait', 'irq', 'softirq', 'steal'],
                fn: 'makeCPUDetailGraphUrl',
                util: 'makeCPUDetailedTargets',
                titleTemplate: _.template('<%- id %> CPU Detail'),
                options: {
                    labels: ['Date', 'System', 'User', 'Nice', 'Idle', 'IOWait', 'IRQ', 'Soft IRQ', 'Steal'],
                    stackedGraph: true,
                    fillGraph: true,
                    stepPlot: true
                }
            }, {
                metrics: ['op_r_latency', 'op_w_latency', 'op_rw_latency'],
                fn: 'makeOpsLatencyGraphUrl',
                util: 'makeOpLatencyTargets',
                titleTemplate: _.template('<%- id %> Ops Latency'),
                options: {
                    labels: ['Date', 'Read Latency', 'Write Latency', 'RW Latency']
                }
            }, {
                metrics: ['journal_ops', 'journal_wr'],
                fn: 'makeJournalOpsGraphUrl',
                util: 'makeFilestoreTargets',
                titleTemplate: _.template('<%- id %> Journal Ops'),
                options: {
                    labels: ['Date', 'Journal Ops', 'Journal Writes']
                }
            }, {
                metrics: ['01', '05', '15'],
                fn: 'makeLoadAvgGraphUrl',
                util: 'makeLoadAvgTargets',
                titleTemplate: _.template('<%- hostname %> Load Avg'),
                options: {
                    labels: ['Date', '1 Min', '5 Min', '15 Min']
                }
            }, {
                metrics: ['Active', 'Buffers', 'Cached', 'MemFree'],
                fn: 'makeMemoryGraphUrl',
                util: 'makeMemoryTargets',
                titleTemplate: _.template('<%- hostname %> Memory'),
                options: {
                    labelsKMG2: true,
                    labels: ['Date', 'Active', 'Buffers', 'Cached', 'Free'],
                    fillGraph: true,
                    stackedGraph: true
                }
            }, {
                metrics: ['read_byte_per_second', 'write_byte_per_second'],
                fn: 'makeHostDeviceRWBytesGraphUrl',
                util: 'makeIOStatIOPSTargets',
                titleTemplate: _.template('<%- id %> RW Bytes'),
                options: {
                    labelsKMG2: true,
                    labels: ['Date', 'Read Bytes/Sec', 'Write Bytes/Sec']
                }
            }, {
                metrics: ['read_await', 'write_await'],
                fn: 'makeHostDeviceRWAwaitGraphUrl',
                util: 'makeIOStatIOPSTargets',
                titleTemplate: _.template('<%- id %> RW Await'),
                options: {
                    labels: ['Date', 'Reads', 'Writes']
                }
            }, {
                metrics: ['iops'],
                fn: 'makeHostDeviceIOPSGraphUrl',
                util: 'makeIOStatIOPSTargets',
                titleTemplate: _.template('<%- id %> IOPS'),
                options: {
                    labels: ['Date', 'IOPS']
                }
            }, {
                metrics: ['tx_byte', 'rx_byte'],
                fn: 'makeHostNetworkTXRXBytesGraphURL',
                util: 'makeNetworkTargets',
                titleTemplate: _.template('<%- id %> Network TX/RX Bytes'),
                options: {
                    labelsKMG2: true,
                    labels: ['Date', 'TX Bytes', 'RX Bytes']
                }
            }, {
                metrics: ['tx_packets', 'rx_packets'],
                fn: 'makeHostNetworkTXRXPacketsGraphURL',
                util: 'makeNetworkTargets',
                titleTemplate: _.template('<%- id %> Network TX/RX Packets'),
                options: {
                    labelsKMB: true,
                    labels: ['Date', 'TX Packets', 'RX Packets']
                }
            }, {
                metrics: ['tx_errors', 'rx_errors'],
                fn: 'makeHostNetworkTXRXErrorsGraphURL',
                util: 'makeNetworkTargets',
                titleTemplate: _.template('<%- id %> Network TX/RX Errors'),
                options: {
                    labelsKMB: true,
                    labels: ['Date', 'TX Errors', 'RX Errors']
                }
            }, {
                metrics: ['tx_drop', 'rx_drop'],
                fn: 'makeHostNetworkTXRXDropGraphURL',
                util: 'makeNetworkTargets',
                titleTemplate: _.template('<%- id %> Network TX/RX Drops'),
                options: {
                    labelsKMB: true,
                    labels: ['Date', 'TX Drops', 'RX Drops']
                }
            }
        ],
        makeGraphFunctions: function(options) {
            var targets = gutils.makeTargets(gutils[options.util](options.metrics));
            var fns = [
                gutils.makeParam('format', 'json-array'),
                targets
            ];
            this[options.fn] = gutils.makeGraphURL(this.baseUrl, fns);
            this.titleTemplates[options.fn] = options.titleTemplate;
            this.dygraphDefaults[options.fn] = options.options;
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.AppRouter = Backbone.Marionette.getOption(this, 'AppRouter');
            this.graphiteHost = Backbone.Marionette.getOption(this, 'graphiteHost');
            this.baseUrl = gutils.makeBaseUrl(this.graphiteHost);
            this.heightWidth = gutils.makeHeightWidthParams(442, 266);
            _.bindAll(this, 'makeGraphFunctions', 'renderHostSelector', 'dygraphLoader', 'renderGraphTemplates', 'onItemBeforeClose');

            _.each(this.graphs, this.makeGraphFunctions);

            this.cpuTargetModels = new models.GraphiteCPUModel(undefined, {
                graphiteHost: this.graphiteHost
            });
            this.ioTargetModels = new models.GraphiteIOModel(undefined, {
                graphiteHost: this.graphiteHost
            });
            this.netTargetModels = new models.GraphiteNetModel(undefined, {
                graphiteHost: this.graphiteHost
            });
            this.render = _.wrap(this.render, this.renderWrapper);
            this.listenTo(this, 'item:before:close', this.onItemBeforeClose);
        },
        // Wrap render so we can augment it with ui elements and
        // redelegate events on new ui elements
        renderWrapper: function(fn) {
            fn.call(this);
            this.renderGraphTemplates();
            this.renderHostSelector();
            this.delegateEvents(this.events);
        },
        renderGraphTemplates: function() {
            var self = this;
            this.selectors = _.map(_.range(30), function(id) {
                var selector = 'graph-' + id;
                var t = self.graphTemplate({
                    graphid: selector
                });
                self.$el.append(t);
                return '.' + selector;
            });
        },
        makeCPUDetail: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeCPUDetailGraphUrl', this.cpuTargetModels);
        },
        makeHostDeviceIOPS: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeHostDeviceIOPSGraphUrl', this.ioTargetModels);
        },
        makeHostDeviceRWBytes: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeHostDeviceRWBytesGraphUrl', this.ioTargetModels);
        },
        makeHostDeviceRWAwait: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeHostDeviceRWAwaitGraphUrl', this.ioTargetModels);
        },
        updateBtns: function(id) {
            this.ui.buttons.find('.btn').removeClass('active');
            this.ui.buttons.find('[data-id="' + id + '"]').addClass('active');
        },
        getOSDIDs: function() {
            // create a fake model that mimics the interfaces we need
            var reqres = this.App.ReqRes;
            var model = {};
            model.fetchMetrics = function(hostname) {
                var d = $.Deferred();
                setTimeout(function() {
                    var resp = reqres.request('get:osdids', hostname);
                    model.ids = resp;
                    d.resolve(resp);
                }, 0);
                return d.promise();
            };
            model.keys = function() {
                return model.ids;
            };
            return model;
        },
        makeHostDeviceDiskSpaceBytes: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeDiskSpaceBytesGraphUrl', this.getOSDIDs());
        },
        makeHostDeviceDiskSpaceInodes: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeDiskSpaceInodesGraphUrl', this.getOSDIDs());
        },
        makeHostNetworkBytesMetrics: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostModelGraphs(hostname, 'makeHostNetworkTXRXBytesGraphURL', this.netTargetModels);
        },
        makeHostNetworkPacketsMetrics: function(hostname, id) {
            this.updateBtns(id);
            var self = this;
            var r = _.map(['makeHostNetworkTXRXPacketsGraphURL', 'makeHostNetworkTXRXErrorsGraphURL', 'makeHostNetworkTXRXDropGraphURL'], function(graph) {
                return self.makePerHostModelGraphs(hostname, graph, self.netTargetModels);
            });
            return $.when.apply(undefined, r).then(function(a, b, c) {
                return a.concat(b).concat(c);
            });
        },
        showButtons: function() {
            this.ui.buttons.css('visibility', 'visible');
        },
        hideButtons: function() {
            this.ui.buttons.css('visibility', 'hidden');
        },
        makePerHostGraphs: function(hostname, fnName) {
            var fn = this[fnName];
            var titleFn = this.titleTemplates[fnName];
            var title;
            if (titleFn) {
                title = titleFn({
                    hostname: hostname
                });
            }
            var options = this.dygraphDefaults[fnName];
            return {
                url: fn.call(this, hostname),
                title: title,
                options: options
            };
        },
        makePerHostModelGraphs: function(hostname, fnName, model) {
            var self = this;
            var titleFn = this.titleTemplates[fnName];
            var fn = this[fnName];
            var options = this.dygraphDefaults[fnName];
            this.hostname = hostname;
            var deferred = $.Deferred();
            model.fetchMetrics(hostname).done(function() {
                var list = model.keys();
                deferred.resolve(_.map(list, function(id) {
                    var title;
                    if (titleFn) {
                        title = titleFn({
                            hostname: hostname,
                            id: id
                        });
                    }
                    return {
                        url: fn.call(self, hostname, id),
                        title: title,
                        options: options
                    };
                }));
            }).fail(function(resp) {
                deferred.reject(resp);
            });
            return deferred.promise();
        },
        makeHostUrls: function(fnName) {
            var self = this;
            return function() {
                var hosts = this.App.ReqRes.request('get:hosts');
                return _.map(hosts, function(host) {
                    return self.makePerHostGraphs(host, fnName);
                });
            };
        },
        selectTemplate: _.template('<select class="form-control" name="hosts"><option value="all" selected>Cluster - per host CPU</option><%= list %></select>'),
        optionTemplate: _.template('<option value="<%- args.host %>">Host - <%- args.host %></option>"', null, {
            variable: 'args'
        }),
        renderHostSelector: function() {
            var hosts = this.App.ReqRes.request('get:hosts');
            var opts = _.reduce(hosts, function(memo, host) {
                return memo + this.optionTemplate({
                    host: host
                });
            }, null, this);
            var $el = this.ui.hosts;
            $el.html(this.selectTemplate({
                list: opts
            }));
        },
        selectors: [],
        dygraphDefaultOptions: {
            labelsKMG2: false,
            labelsKMB: false,
            stackedGraph: false,
            fillGraph: false,
            stepPlot: false,
            connectSeparatedPoints: true,
            colors: ['#8fc97f', '#beaed4', '#fdc086', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
            labelsSeparateLines: true,
            legend: 'always',
            axes: {
                x: {
                    valueFormatter: function(ms) {
                        return new Date(ms).strftime('%Y-%m-%d @ %H:%M%Z');
                    }
                }
            }
        },
        dygraphLoader: function($el, url, overrides) {
            var self = this;
            var $workarea = $el.find('.workarea_g');
            var $graphveil = $el.find('.graph-spinner').removeClass('hidden');
            $workarea.css('visibility', 'hidden');
            _.defer(function() {
                $.ajax({
                    url: url,
                    dataType: 'json'
                }).done(function(resp) {
                    var d = $.Deferred();
                    _.defer(function() {
                        var post = self.processDygraph(resp);
                        d.resolve(post);
                    });
                    d.promise().done(function(post) {
                        if (overrides && overrides.labels) {
                            // handle too few series items
                            var labels = _.map(['Date'].concat(post.labels), function(value, index) {
                                if (overrides.labels[index] !== undefined) {
                                    return overrides.labels[index];
                                } else {
                                    return value;
                                }
                            });
                            overrides.labels = labels;
                        }
                        var options = _.extend({
                            labelsDiv: $el.find('.dygraph-legend')[0]
                        }, self.dygraphDefaultOptions, overrides);
                        $workarea.css('visibility', 'visible');
                        var $g = $el.data('graph');
                        if ($g) {
                            $g.updateOptions(_.extend({
                                file: post.data
                            }, options));
                        } else {
                            $el.data('graph', new Dygraph($workarea[0], post.data, options));
                        }
                        $graphveil.addClass('hidden');
                    });
                });
            });
        },
        makeHostOverviewGraphUrl: function(host) {
            var self = this;
            return function() {
                return _.map(['makeCPUGraphUrl', 'makeLoadAvgGraphUrl', 'makeMemoryGraphUrl'], function(fnName) {
                    return self.makePerHostGraphs(host, fnName);
                });
            };
        },
        hideGraphs: function() {
            this.$('.graph-card, .workarea_g').css('visibility', 'hidden');
        },
        processDygraph: function(resp) {
            // convert time which is usually the first part of a series tuple
            var data = _.map(resp.datapoints, function(series) {
                return _.map(series, function(value, index) {
                    if (index === 0) {
                        return new Date(value * 1000);
                    }
                    return value;
                });
            });
            return {
                labels: resp.targets,
                data: data
            };
        },
        renderGraphs: function(title, fn) {
            var graphs = fn.call(this);
            var self = this;
            this.ui.title.text(title);
            _.each(graphs, function(graph, index) {
                var $graphEl = self.$(self.selectors[index]);
                $graphEl.css('visibility', 'visible');
                if (graph.title) {
                    $graphEl.find('.graph-subtitle').text(graph.title);
                }
                self.dygraphLoader($graphEl, graph.url, graph.options);
            });
        }
    });

    return GraphwallView;
});
