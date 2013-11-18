/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'kinetic', 'marionette'], function($, _, Backbone, JST, gaugeHelper, Kinetic) {
    'use strict';

    var PgmapView = Backbone.Marionette.ItemView.extend({
        className: 'card gauge',
        template: JST['app/scripts/templates/pgmap.ejs'],
        ui: {
            container: '.pgcanvas'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenToOnce(this, 'render', this.postRender);
            gaugeHelper(this);
        },
        count: 15000,
        getLayout: function(count) {
            var width = 400,
                height = 250,
                x = 10,
                y = 10,
                scale = 1;
            if (count <= 15000) {
                width = 155;
                height = 95;
                scale = 2.58
            } else if (count <= 30000) {
                width = 220;
                height = 138;
                scale = 1.8;
            } else if (count <= 60000) {
                width = 310;
                height = 194;
                scale = 1.29;
            }
            x = y = x / scale;
            return {
                x: x,
                y: y,
                width: width,
                height: height,
                scale: scale
            };
        },
        postRender: function() {
            var layout = this.getLayout(this.count);
            var width = this.ui.container.width();
            var height = this.ui.container.height();
            this.stage = new Kinetic.Stage({
                container: this.ui.container[0],
                height: height,
                width: width
            });

            this.layer = new Kinetic.Layer();

            this.background = new Kinetic.Rect({
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                fill: 'red'
            });

            this.layer.add(this.background);
            this.stage.add(this.layer);
            this.background.getContext().scale(layout.scale, layout.scale);
            this.layer.drawScene();


        }
    });

    return PgmapView;
});
