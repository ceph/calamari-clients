/* global define */

/*  Module to add Common Gauge Behaviors
 *  ====================================
 *
 *  * Spinner animation on sync events
 *  * animations for gauges to disappear and reappear
 *  * bindings to target object
 *  * lifecycle behaviors for a gauge widget
 *
 */
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, humanize, animation) {
    'use strict';
    function expand(callback) {
        this.$el.css('display', 'block');
        if (callback) {
            callback.apply(this);
        }
    }

    function collapse(callback) {
        this.$el.css('display', 'none');
        if (callback) {
            callback.apply(this);
        }
    }

    function disappear(callback) {
        return this._disappearAnimation(this.$el, function() {
            this.$el.css('visibility', 'hidden');
            if (callback) {
                callback.apply(this);
            }
        });
    }

    function reappear(callback) {
        this.$el.css('visibility', 'visible');
        return this._reappearAnimation(this.$el, callback);
    }

    function initialize_helper(target, watched) {
        if (target.App.vent) {
            /* Assign functions */
            target._expand = expand;
            target._collapse = collapse;
            target._disappear = disappear;
            target._reappear = reappear;
            target._disappearAnimation = animation.single('fadeOutUpAnim');
            target._reappearAnimation = animation.single('fadeInDownAnim');

            /* bind new functions to target */
            _.bindAll(target, '_expand', '_collapse', '_disappear', '_reappear', '_disappearAnimation', '_reappearAnimation');

            /* Attach to App and View events */
            target.listenTo(target.App.vent, 'gauges:disappear', target._disappear);
            target.listenTo(target.App.vent, 'gauges:reappear', target._reappear);
            target.listenTo(target.App.vent, 'gauges:collapse', target._collapse);
            target.listenTo(target.App.vent, 'gauges:expand', target._expand);

            /* Defer adding UI events until render is complete */
            target.listenToOnce(target, 'render', function() {
                target.listenTo(target.App.vent, watched + ':request', function() {
                    target.ui.spinner.css('visibility', 'visible');
                });
                target.listenTo(target.App.vent, watched + ':sync ' + watched + ':error', function() {
                    setTimeout(function() {
                        target.ui.spinner.css('visibility', 'hidden');
                    }, 250);
                });
            });
        }
    }

    return initialize_helper;
});
