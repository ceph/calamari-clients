/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'l20nCtx!locales/{{locale}}/strings', 'marionette'], function($, _, Backbone, JST, l10n) {
    'use strict';

    var BreadcrumbView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/breadcrumb.ejs'],
        ui: {
            dashboardIcon: '.fa-tachometer',
            fullscreenIcon: '.fa-sitemap',
            graphIcon: '.fa-bar-chart-o'
        },
        events: {
            'click span.bc-entry': 'switcher'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.AppRouter = Backbone.Marionette.getOption(this, 'AppRouter');
            this.initial = Backbone.Marionette.getOption(this, 'initial') || 'dashboard';
            _.bindAll(this, 'dashboardIcon', 'fullscreenIcon');
            this.listenTo(this.AppRouter, 'route:dashboard', this.dashboardIcon);
            this.listenTo(this.AppRouter, 'route:workbench', this.fullscreenIcon);
            this.listenTo(this.AppRouter, 'route:graph', this.graphIcon);
            var self = this;
            this.listenTo(this, 'render', _.once(function() {
                if (self.initial === 'vizmode') {
                    self.fullscreenIcon();
                } else if (self.initial === 'graphmode') {
                    self.graphIcon();
                }
            }));

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
                    dashboard: l10n.getSync('dashboardTitle'),
                    bench: l10n.getSync('workbenchTitle'),
                    chart: l10n.getSync('graphTitle'),
                    manage: l10n.getSync('manageTitle')
                },
                dashboard: l10n.getSync('dashboard'),
                workbench: l10n.getSync('workbench'),
                graph: l10n.getSync('graph'),
                manage: l10n.getSync('manage')
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
            if (action === 'manage') {
                document.location = '/manage/#/';
            }
        }
    });

    return BreadcrumbView;
});
