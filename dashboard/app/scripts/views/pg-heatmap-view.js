/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'marionette'], function($, _, Backbone, JST, snap) {
    'use strict';

    var PgHeatmapView = Backbone.Marionette.ItemView.extend({
        className: 'pgmap card',
        template: JST['app/scripts/templates/pg-heatmap.ejs'],
        initialize: function() {
            _.bindAll(this, 'initSVG');
            this.model = new Backbone.Model();
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {}
            this.listenToOnce(this, 'render', this.initSVG);
        },
        initSVG: function() {
            this.p = snap(this.$('.pg-heatmap-svg')[0]);
        }
    });

    return PgHeatmapView;
});
