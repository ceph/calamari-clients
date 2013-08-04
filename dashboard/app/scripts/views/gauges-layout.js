/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, animation) {
    'use strict';

    /*
     *
     * Redefine region::open so it uses replace rather than append.
     *
     */
    var CustomRegion = Backbone.Marionette.Region.extend({
        initialize: function() {
            this.flipOutXAnimation = animation.single('flipOutXCard');
            this.flipOutYAnimation = animation.single('flipOutYCard');
            this.flipInXAnimation = animation.single('flipInXCard');
            this.flipInYAnimation = animation.single('flipInYCard');
            _.bindAll(this, 'appear', 'disappear');
        },
        open: function(view) {
            this.$el.replaceWith(view.el);
            this.$el = view.$el;
        },
        disappear: function() {
            var $view = this.$el;
            return this.flipOutYAnimation($view, function() {
                $view.hide();
            });
        },
        appear: function() {
            var $view = this.$el;
            $view.show();
            return this.flipInYAnimation($view);
        }
    });
    return Backbone.Marionette.Layout.extend({
        className: 'row gauges',
        template: JST['app/scripts/templates/gauges.ejs'],
        initialize: function() {
            this.listenTo(this, 'gauges:show', this.show);
            this.listenTo(this, 'gauges:hide', this.hide);
            _.bindAll(this, 'show', 'hide');
        },
        show: function() {
            var mgr = this.regionManager;
            mgr.get('health').appear();
            mgr.get('status').appear();
            mgr.get('usage').appear();
        },
        hide: function() {
            var mgr = this.regionManager;
            mgr.get('health').disappear();
            mgr.get('status').disappear();
            mgr.get('usage').disappear();
        },
        regions: {
            health: {
                selector: '.health',
                regionType: CustomRegion
            },
            status: {
                selector: '.status',
                regionType: CustomRegion
            },
            usage: {
                selector: '.usage',
                regionType: CustomRegion
            }
        }
    });
});
