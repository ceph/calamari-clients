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
    /*jshint validthis:true */

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
    var colors = 'ok warn fail';
    var icons = 'fa-check fa-warning fa-exclamation-circle';

    function makeIconEventHandler(colorClass, iconClass) {
        return function() {
            if (this.ui && this.ui.statusIcon) {
                this.ui.statusIcon.removeClass(colors).addClass(colorClass).find('.fa-stack-1x').removeClass(icons).addClass(iconClass);
            }
        };
    }

    var okEvent = makeIconEventHandler('ok', 'fa-check');
    var warningEvent = makeIconEventHandler('warn', 'fa-warning');
    var failEvent = makeIconEventHandler('fail', 'fa-exclamation-circle');

    function initializeHelper(target, watched) {
        if (target.listenTo) {
            target._okEvent = okEvent;
            target._warningEvent = warningEvent;
            target._failEvent = failEvent;
            _.bindAll(target, '_okEvent', '_warningEvent', '_failEvent');
            target.listenTo(target, 'status:ok', target._okEvent);
            target.listenTo(target, 'status:warn', target._warningEvent);
            target.listenTo(target, 'status:fail', target._failEvent);
            if (target.ui) {
                target.ui.statusIcon = '.card-icon';
            }
        }
        if (target.App && target.App.vent) {
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
                if (target.ui && target.ui.spinner) {
                    target.listenTo(target.App.vent, watched + ':request', function() {
                        target.ui.spinner.css('visibility', 'visible');
                    });
                    target.listenTo(target.App.vent, watched + ':sync ' + watched + ':error', function() {
                        setTimeout(function() {
                            target.ui.spinner.css('visibility', 'hidden');
                        }, 250);
                    });
                }
            });
        } else {
            console.log(target, ' is missing App or App.vent object');
        }
    }

    return initializeHelper;
});
