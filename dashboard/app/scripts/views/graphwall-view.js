/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/graph-utils', 'models/application-model', 'marionette'], function($, _, Backbone, JST, gutils, models) {
    'use strict';

    var GraphwallView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/graphwall-view.ejs'],
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
        graphs: [{
            metrics: ['byte_avail', 'byte_free', 'byte_used'],
            fn: 'makeDiskSpaceBytesGraphUrl',
            util: 'makeDiskSpaceTargets'
        }, {
            metrics: ['inodes_avail', 'inodes_free', 'inodes_used'],
            fn: 'makeDiskSpaceInodesGraphUrl',
            util: 'makeDiskSpaceTargets'
        }, {
            metrics: ['system', 'user', 'idle'],
            fn: 'makeCPUGraphUrl',
            util: 'makeCPUTargets'
        }, {
            metrics: ['system', 'user', 'nice', 'idle', 'iowait', 'irq', 'softirq', 'steal'],
            fn: 'makeCPUDetailGraphUrl',
            util: 'makeCPUDetailedTargets'
        }, {
            metrics: ['op_r_latency', 'op_w_latency', 'op_rw_latency'],
            fn: 'makeOpsLatencyGraphUrl',
            util: 'makeOpLatencyTargets'
        }, {
            metrics: ['journal_ops', 'journal_wr'],
            fn: 'makeJournalOpsGraphUrl',
            util: 'makeFilestoreTargets'
        }, {
            metrics: ['01', '05', '15'],
            fn: 'makeLoadAvgGraphUrl',
            util: 'makeLoadAvgTargets'
        }, {
            metrics: ['Active', 'Buffers', 'Cached', 'MemFree'],
            fn: 'makeMemoryGraphUrl',
            util: 'makeMemoryTargets'
        }, {
            metrics: ['read_byte_per_second', 'write_byte_per_second'],
            fn: 'makeHostDeviceRWBytesGraphUrl',
            util: 'makeIOStatIOPSTargets'
        }, {
            metrics: ['read_await', 'write_await'],
            fn: 'makeHostDeviceRWAwaitGraphUrl',
            util: 'makeIOStatIOPSTargets'
        }, {
            metrics: ['iops'],
            fn: 'makeHostDeviceIOPSGraphUrl',
            util: 'makeIOStatIOPSTargets'
        }, {
            metrics: ['rx_byte', 'tx_byte'],
            fn: 'makeHostNetworkTXRXBytesGraphURL',
            util: 'makeNetworkTargets'
        }, {
            metrics: ['tx_packets', 'rx_packets'],
            fn: 'makeHostNetworkTXRXPacketsGraphURL',
            util: 'makeNetworkTargets'
        }, {
            metrics: ['tx_errors', 'rx_errors'],
            fn: 'makeHostNetworkTXRXErrorsGraphURL',
            util: 'makeNetworkTargets'
        }, {
            metrics: ['tx_drop', 'rx_drop'],
            fn: 'makeHostNetworkTXRXDropGraphURL',
            util: 'makeNetworkTargets'
        }],
        makeGraphFunctions: function(options) {
            var targets = gutils.makeTargets(gutils[options.util](options.metrics));
            this[options.fn] = gutils.makeGraphURL('png', this.baseUrl, this.heightWidth, targets);
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.AppRouter = Backbone.Marionette.getOption(this, 'AppRouter');
            this.graphiteHost = Backbone.Marionette.getOption(this, 'graphiteHost');
            this.baseUrl = gutils.makeBaseUrl(this.graphiteHost);
            this.heightWidth = gutils.makeHeightWidthParams(442, 266);
            _.bindAll(this, 'makeGraphFunctions', 'renderHostSelector');

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
        },
        // Wrap render so we can augment it with ui elements and
        // redelegate events on new ui elements
        renderWrapper: function(fn) {
            fn.call(this);
            this.renderHostSelector();
            this.delegateEvents(this.events);
        },
        makeCPUDetail: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeCPUDetailGraphUrl, this.cpuTargetModels);
        },
        makeHostDeviceIOPS: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeHostDeviceIOPSGraphUrl, this.ioTargetModels);
        },
        makeHostDeviceRWBytes: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeHostDeviceRWBytesGraphUrl, this.ioTargetModels);
        },
        makeHostDeviceRWAwait: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeHostDeviceRWAwaitGraphUrl, this.ioTargetModels);
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
            return this.makePerHostGraphs(hostname, this.makeDiskSpaceBytesGraphUrl, this.getOSDIDs());
        },
        makeHostDeviceDiskSpaceInodes: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeDiskSpaceInodesGraphUrl, this.getOSDIDs());
        },
        makeHostNetworkBytesMetrics: function(hostname, id) {
            this.updateBtns(id);
            return this.makePerHostGraphs(hostname, this.makeHostNetworkTXRXBytesGraphURL, this.netTargetModels);
        },
        makeHostNetworkPacketsMetrics: function(hostname, id) {
            this.updateBtns(id);

            return this.makePerHostGraphs(hostname, this.makeNetworkPacketsOverviewGraphURL(), this.netTargetModels);
        },
        makeNetworkPacketsOverviewGraphURL: function() {
            var self = this;
            return function(hostname, id) {
                return [self.makeHostNetworkTXRXPacketsGraphURL(hostname, id), self.makeHostNetworkTXRXErrorsGraphURL(hostname, id), self.makeHostNetworkTXRXDropGraphURL(hostname, id)];
            };
        },
        showButtons: function() {
            this.ui.buttons.css('visibility', 'visible');
        },
        hideButtons: function() {
            this.ui.buttons.css('visibility', 'hidden');
        },
        makePerHostGraphs: function(hostname, fn, model) {
            var self = this;
            this.hostname = hostname;
            var deferred = $.Deferred();
            model.fetchMetrics(hostname).done(function() {
                var list = model.keys();
                deferred.resolve(_.map(list, function(id) {
                    return fn.call(self, hostname, id);
                }));
            }).fail(function(resp) {
                deferred.reject(resp);
            });
            return deferred.promise();
        },
        makeHostUrls: function(fn) {
            return function() {
                var hosts = this.App.ReqRes.request('get:hosts');
                return _.map(hosts, function(host) {
                    return fn(host);
                });
            };
        },
        selectTemplate: _.template('<select class="form-control" name="hosts"><option value="all" selected>Cluster</option><%= list %></select>'),
        optionTemplate: _.template('<option value="<%- args.host %>"><%- args.host %></option>"', null, { variable: 'args' }),
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
        selectors: ['0-1', '0-2', '1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2', '5-1', '5-2', '6-1', '6-2', '7-1', '7-2', '8-1', '8-2'],
        imageLoader: function($el, url) {
            setTimeout(function() {
                $el.html('<i class="fa fa-spinner fa-spin fa-lg fa-3x"></i>');
                var image = new Image();
                image.src = url;
                image.onload = function() {
                    $el.html(image);
                };
                image.onerror = function() {
                    $el.html('<i class="fa fa-exclamation-triangle fa-lg fa-3x"></i>');
                };
            }, 0);
        },
        makeHostOverviewGraphUrl: function(host) {
            return function() {
                return [this.makeCPUGraphUrl(host), this.makeLoadAvgGraphUrl(host), this.makeMemoryGraphUrl(host)];
            };
        },
        hideGraphs: function() {
            this.$('.graph-card').css('visibility', 'hidden');
        },
        populateAll: function(title, fn) {
            var urls = fn.call(this);
            var self = this;
            this.ui.title.text(title);
            _.each(urls, function(url, index) {
                var $graph = self.$('.graph' + self.selectors[index]);
                $graph.css('visibility', 'visible');
                self.imageLoader($graph, url);
            });
        }
    });

    return GraphwallView;
});
