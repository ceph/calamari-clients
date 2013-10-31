/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    /*
     *
     * Redefine region::open so it uses replace rather than append.
     *
     */
    var CustomRegion = Backbone.Marionette.Region.extend({
        open: function(view) {
            this.$el.replaceWith(view.el);
            this.$el = view.$el;
        }
    });
    return Backbone.Marionette.Layout.extend({
        className: 'row gauges',
        template: JST['app/scripts/templates/gauges.ejs'],
        regions: {
            osd: {
                selector: '.osd',
                regionType: CustomRegion
            },
            mon: {
                selector: '.mon',
                regionType: CustomRegion
            },
            pg: {
                selector: '.pg',
                regionType: CustomRegion
            },
            usage: {
                selector: '.usage',
                regionType: CustomRegion
            }
        }
    });
});
