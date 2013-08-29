/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, animation) {
    'use strict';

    var SwitcherView = Backbone.Marionette.ItemView.extend({
        className: 'switcher',
        template: JST['app/scripts/templates/switcher.ejs'],
        events: {
            'click': 'clickHandler'
        },
        ui: {
            leftText: '.switcher-text-one',
            left: '.switcher-one > .switcher-circle',
            right: '.switcher-two > .switcher-circle',
            rightText: '.switcher-text-two'
        },
        defaults: {
            state1: 'OSD',
            state2: 'PG'
        },
        current: 'OSD',
        clickHandler: function() {
            var $active = this.$('.switcher-active');
            var self = this;
            if (this.current === 'OSD') {
                this.slidePositionOneAnimation($active).then(function() {
                    $active.removeClass('switcher-active');
                    self.ui.right.addClass('switcher-active');
                    self.ui.leftText.addClass('switcher-text-hidden');
                    self.ui.rightText.removeClass('switcher-text-hidden');
                    self.current = 'PG';
                    self.App.vent.trigger('switcher:two');
                });
            } else {
                this.slidePositionTwoAnimation($active).then(function() {
                    $active.removeClass('switcher-active');
                    self.ui.left.addClass('switcher-active');
                    self.ui.rightText.addClass('switcher-text-hidden');
                    self.ui.leftText.removeClass('switcher-text-hidden');
                    self.current = 'OSD';
                    self.App.vent.trigger('switcher:one');
                });
            }
        },
        serializeData: function() {
            return _.extend(this.defaults, this.options);
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.slidePositionTwoAnimation = animation.single('sliderUpAnim');
            this.slidePositionOneAnimation = animation.single('sliderDownAnim');
            _.bindAll(this, 'clickHandler');
        }
    });

    return SwitcherView;
});
