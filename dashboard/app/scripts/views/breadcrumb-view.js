/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    var BreadcrumbView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/breadcrumb.ejs'],
        ui: {
            dashboardIcon: '.icon-dashboard',
            fullscreenIcon: '.icon-sitemap',
            graphIcon: '.icon-bar-chart'
        },
        events: {
            'click span.bc-entry': 'switcher'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.AppRouter = Backbone.Marionette.getOption(this, 'AppRouter');
            _.bindAll(this, 'dashboardIcon', 'fullscreenIcon');
            this.listenTo(this.AppRouter, 'route:dashboard', this.dashboardIcon);
            this.listenTo(this.AppRouter, 'route:workbench', this.fullscreenIcon);
            this.listenTo(this.AppRouter, 'route:graph', this.graphIcon);
        },
        dashboardIcon: function() {
            this.$('.bc-active').removeClass('bc-active');
            this.ui.dashboardIcon.closest('span').addClass('bc-active');
        },
        fullscreenIcon: function() {
            this.$('.bc-active').removeClass('bc-active');
            this.ui.fullscreenIcon.closest('span').addClass('bc-active');
        },
        graphIcon: function() {
            this.$('.bc-active').removeClass('bc-active');
            this.ui.graphIcon.closest('span').addClass('bc-active');
        },
        serializeData: function() {
            return {
                title: {
                    dashboard: 'Dashboard',
                    bench: 'OSD Workbench',
                    chart: 'Charting'
                }
            };
        },
        switcher: function(evt) {
            var $target = $(evt.target);
            $target = $target.closest('span');
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
            if (action === 'chart') {
                this.App.vent.trigger('app:graph');
            }
        }
    });

    return BreadcrumbView;
});
