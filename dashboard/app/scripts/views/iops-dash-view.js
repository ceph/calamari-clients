/*global define*/

define([
        'jquery',
        'underscore',
        'backbone',
        'templates',
        'dygraphs',
        'helpers/graph-utils',
        'helpers/gauge-helper',
        'marionette'
], function($, _, Backbone, JST, Dygraph, gutils, gaugeHelper) {
    'use strict';

    var IopsDashView = Backbone.Marionette.ItemView.extend({
        className: 'custom-gutter col-sm-12 col-xs-12 col-lg-6 col-md-6',
        template: JST['app/scripts/templates/iops-dash.ejs'],
        ui: {
            'canvas': '.iopscanvas',
            'headline': '.headline',
            'legend': '.legend'
        },
        initialize: function() {
            this.Dygraph = Dygraph;
            this.App = Backbone.Marionette.getOption(this, 'App');

            gaugeHelper(this);
            this.graphiteHost = Backbone.Marionette.getOption(this, 'graphiteHost');
            this.baseUrl = gutils.makeBaseUrl(this.graphiteHost);
            var metrics = ['num_read', 'num_write'];
            var targets = gutils.makePoolIOPSTargets(metrics);
            var targetParam = gutils.makeTargets(gutils.sumSeries(targets));
            var fns = [
                gutils.makeParam('format', 'json-array'),
                gutils.makeParam('from', '-1d'),
                targetParam
            ];
            this.getUrl = gutils.makeGraphURL(this.baseUrl, fns);
            _.bindAll(this, 'postRender', 'updateGraph', 'forceUpdate');
            this.listenToOnce(this, 'render', this.postRender);
            this.listenTo(this.App.vent, 'iops:update', this.updateGraph);
            this.listenTo(this.App.vent, 'dashboard:refresh', this.forceUpdate);
        },
        forceUpdate: function() {
            if (this.dygraph) {
                this.dygraph.destroy();
                this.dygraph = null;
            }
            this.postRender();
        },
        data: [
            [1, 10, 120],
            [2, 20, 80],
            [3, 50, 60],
            [4, 70, 80]
        ],
        getData: function() {
            var clusterName = this.App.ReqRes.request('get:cluster').get('id');
            return $.ajax({
                url: this.getUrl('', 'all', clusterName),
                dataType: 'json'
            });
        },
        updateGraph: function() {
            var dygraph = this.dygraph;
            this.getData().done(function(resp) {
                var d = gutils.graphiteJsonArrayToDygraph(resp);
                dygraph.updateOptions({
                    file: d.data
                });
                this.updateIOPS(d);
            }.bind(this));
        },
        updateIOPS: function(d) {
            var iops = 0;
            var iop = 0;
            if (d.data && d.data.length) {
                // Look at the last 3 values
                iops = _.last(d.data, 3);
                // Use the first one that isn't null
                // @see Issue #8350
                iop = _.find(iops.reverse(), function(tuple) {
                    return tuple[1] !== null;
                });
                if (iop === undefined) {
                    // deal with no valid value
                    iop = 0;
                } else {
                    iop = iop[1];
                }
            }
            this.ui.headline.text(iop);
        },
        postRender: function() {
            var request = this.getData();
            var canvas = this.ui.canvas[0];
            var legend = this.ui.legend[0];
            request.done(function(resp) {
                var d = gutils.graphiteJsonArrayToDygraph(resp);
                this.dygraph = new Dygraph(canvas, d.data, {
                    axisLabelFontSize: 10,
                    labels: ['Date', 'IOPS'],
                    labelsKMB: true,
                    labelsDiv: legend,
                    interactionModel: {}
                });
                this.updateIOPS(d);
            }.bind(this));
        }
    });

    return IopsDashView;
});
