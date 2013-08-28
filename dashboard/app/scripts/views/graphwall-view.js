/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/graph-utils', 'marionette'], function($, _, Backbone, JST, gutils) {
    'use strict';

    var GraphwallView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/graphwall-view.ejs'],
        className: 'graph-mode span12',
        ui: {
            'title': '.title'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.graphiteHost = Backbone.Marionette.getOption(this, 'graphiteHost');
            this.baseUrl = gutils.makeBaseUrl(this.graphiteHost);
            this.cpuTargets = gutils.makeTargets(gutils.makeCPUTargets(['system', 'user', 'idle']));
            this.heightWidth = gutils.makeHeightWidthParams(282, 167);
            this.makeCPUGraphUrl = gutils.makeGraphURL('png', this.baseUrl, this.heightWidth, this.cpuTargets);
            this.osdOpLatencyTargets = gutils.makeTargets(gutils.makeOpLatencyTargets(['op_r_latency', 'op_w_latency', 'op_rw_latency']));
            this.makeOpsLatencyGraphUrl = gutils.makeGraphURL('png', this.baseUrl, this.heightWidth, this.osdOpLatencyTargets);
        },
        makeHostUrls: function() {
            var hosts = this.App.ReqRes.request('get:hosts');
            var fn = this.makeCPUGraphUrl;
            return _.map(hosts, function(host) {
                return fn(host);
            });
        },
        selectors: ['0-1', '0-2', '0-3', '1-1', '1-2', '1-3', '2-1', '2-2', '2-3'],
        populateAll: function() {
            var urls = this.makeHostUrls();
            var self = this;
            this.ui.title.text('CPU Load for Cluster');
            _.each(urls, function(url, index) {
                var $graph = self.$('.graph' + self.selectors[index]);
                $graph.html('<embed src=' + url + '></embed>');
            });
        }
    });

    return GraphwallView;
});
