/*global define*/

define([
        'jquery',
        'underscore',
        'backbone',
        'templates',
        'dygraphs',
        'marionette'
], function($, _, Backbone, JST, Dygraph) {
    'use strict';

    var IopsDashView = Backbone.Marionette.ItemView.extend({
        className: 'custom-gutter col-sm-12 col-xs-12 col-lg-9 col-md-9',
        template: JST['app/scripts/templates/iops-dash.ejs'],
        ui: {
            'canvas': '.iopscanvas',
            'headline': '.headline'
        },
        initialize: function() {
            this.Dygraph = Dygraph;
            _.bindAll(this, 'postRender');
            this.listenToOnce(this, 'render', this.postRender);
        },
        data: [
            [1, 10, 120],
            [2, 20, 80],
            [3, 50, 60],
            [4, 70, 80]
        ],
        postRender: function() {
            this.d = new Dygraph(this.ui.canvas[0], this.data, {
                axisLabelFontSize: 10,
                drawYAxis: false,
                height: 100,
                width: 400
            });
            this.ui.headline.text('lotta');
        }
    });

    return IopsDashView;
});
