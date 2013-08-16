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
            leftText: '.switcher-text-left',
            left: '.switcher-left > .switcher-circle',
            right: '.switcher-right > .switcher-circle',
            rightText: '.switcher-text-right'
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
                this.slideRightAnimation($active).then(function() {
                    $active.removeClass('switcher-active');
                    self.ui.right.addClass('switcher-active');
                    self.ui.leftText.addClass('switcher-text-hidden');
                    self.ui.rightText.removeClass('switcher-text-hidden');
                    self.current = 'PG';
                });
            } else {
                this.slideLeftAnimation($active).then(function() {
                    $active.removeClass('switcher-active');
                    self.ui.left.addClass('switcher-active');
                    self.ui.rightText.addClass('switcher-text-hidden');
                    self.ui.leftText.removeClass('switcher-text-hidden');
                    self.current = 'OSD';
                });
            }
        },
        serializeData: function() {
            return _.extend(this.defaults, this.options);
        },
        initialize: function() {
            this.slideRightAnimation = animation.single('sliderRightAnim');
            this.slideLeftAnimation = animation.single('sliderLeftAnim');
            _.bindAll(this, 'clickHandler');
        }
    });

    return SwitcherView;
});
