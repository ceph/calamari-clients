/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    var BreadcrumbView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/breadcrumb.ejs'],
        ui: {
            dashboardIcon: '.icon-dashboard',
            fullscreenIcon: '.icon-zoom-in'
        },
        events: {
            'click span.bc-entry': 'switcher'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            _.bindAll(this, 'dashboardIcon', 'fullscreenIcon');
            this.listenTo(this.App.vent, 'app:dashboard', this.dashboardIcon);
            this.listenTo(this.App.vent, 'app:fullscreen', this.fullscreenIcon);
        },
        dashboardIcon: function() {
            this.$('.bc-active').removeClass('bc-active');
            this.ui.dashboardIcon.closest('span').addClass('bc-active');
        },
        fullscreenIcon: function() {
            this.$('.bc-active').removeClass('bc-active');
            this.ui.fullscreenIcon.closest('span').addClass('bc-active');
        },
        switcher: function(evt) {
            var $target = $(evt.target);
            $target = $target.closest('span');
            console.log($target);
            if ($target.hasClass('bc-active')) {
                return;
            }
            var action = $target.attr('data-action');
            if (!action) {
                return;
            }
            if (action === 'dashboard') {
                this.App.vent.trigger('app:dashboard');
            }
            if (action === 'bench') {
                this.App.vent.trigger('app:fullscreen');
            }
        }
    });

    return BreadcrumbView;
});
