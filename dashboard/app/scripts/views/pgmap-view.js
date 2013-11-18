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
        postRender: function() {
            var width = this.ui.container.width();
            var height = this.ui.container.height();
            this.stage = new Kinetic.Stage({
                container: this.ui.container[0],
                height: height,
                width: width
            });

            this.layer = new Kinetic.Layer();

            this.background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: this.stage.getWidth(),
                height: this.stage.getHeight(),
                fill: '#fff'
            });

            this.layer.add(this.background);
            this.stage.add(this.layer);


        }
    });

    return PgmapView;
});
