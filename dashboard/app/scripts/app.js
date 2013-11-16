/*global require */
'use strict';
require(['jquery', 'underscore', 'backbone', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'poller', 'helpers/generate-osds', 'collections/osd-collection', 'views/userdropdown-view', 'views/clusterdropdown-view', 'views/graphwall-view', 'helpers/graph-utils', 'gitcommit', 'application', 'marionette', 'bootstrap', 'notytheme'], function($, _, Backbone, humanize, views, models, configloader, Poller, Generate, Collection, UserDropDown, ClusterDropDown, GraphWall, helpers, gitcommit, Application) {
    /* Default Configuration */
    var hostname = document.location.hostname;
    //hostname = 'mira022.front.sepia.ceph.com';
    var config = {
        offline: true,
        'delta-osd-api': false,
        'graphite-host': 'http://' + hostname + ':8080',
        'api-request-timeout-ms': 3000,
        'long-polling-interval-ms': 20000,
        'disable-network-checks': false
    };

    /* Default Configuration */
    var AppRouter = Backbone.Router.extend({
        routes: {
            'workbench': 'workbench',
            'dashboard': 'dashboard',
            'graph/:host(/:osd)': 'graph'
        }
    });
    var appRouter = new AppRouter();
    /* Load Config.json first before starting app */
    var promise = configloader('scripts/config.json').then(function(result) {
        _.extend(config, result);
    });
    /* Load Config.json first before starting app */

    // TODO replace this with CSS version
    var replaceText = function($el, text, removeClass, addClass) {
            $el.css('display', 'none').text(text);
            if (removeClass !== undefined) {
                $el.removeClass(removeClass);
            }
            if (addClass !== undefined) {
                $el.addClass(addClass);
            }
            $el.fadeIn().css('display', '');
        };

    var App, userMenu, clusterMenu;
    promise.then(function() {
        App = new Application();
        App.ReqRes = new Backbone.Wreqr.RequestResponse();
        App.Config = config;
        userMenu = new UserDropDown({
            el: $('.usermenu'),
            App: App
        });
        userMenu.fetch();
        /* Demo Code */
        App.vent.listenTo(App.vent, 'status:healthok', function() {
            replaceText($('.warn-pg, .warn-osd, .warn-pool'), '0');
            replaceText($('.ok-pg'), 2400);
            replaceText($('.ok-pool'), 10);
        });
        App.vent.listenTo(App.vent, 'status:healthwarn', function() {
            var pg = Math.round(Math.random() * 45) + 5;
            var pool = Math.round(Math.random() * 1) + 1;
            replaceText($('.warn-pg'), pg);
            replaceText($('.warn-pool'), pool);
            replaceText($('.ok-pg'), 2400 - pg);
            replaceText($('.ok-pool'), 10 - pool);
        });
        App.vent.listenTo(App.vent, 'updateTotals', function() {
            var ONE_GIGABYTE = 1024 * 1024 * 1024;
            var totalUsed = 0,
                totalCapacity = 0,
                totalObj = 0,
                totalObjSpace = 0;
            viz.collection.each(function(m) {
                totalUsed += m.get('used');
                totalCapacity += m.get('capacity');
                totalObj += Math.random(Date.now()) * 100;
            });

            var settings = {
                cluster: 1,
                space: {
                    /* jshint -W106 */
                    free_bytes: totalCapacity * ONE_GIGABYTE,
                    capacity_bytes: totalCapacity * ONE_GIGABYTE,
                    used_bytes: totalUsed * ONE_GIGABYTE
                }
            };
            gauge.set(new models.UsageModel(settings));
            $('.objcount').text(Math.floor(totalObj));
            totalObjSpace = totalObj * 50;
            totalObjSpace = humanize.filesize(Math.floor(totalObjSpace)).replace(' Kb', 'K');
            $('.objspace').text(totalObjSpace);
        });
        /* Demo Code */


        /* Widget Setup */
        var gaugesLayout = new views.GaugesLayout({
            el: '.gauges'
        });
        gaugesLayout.render();
        var osdView = new views.OsdView({
            App: App
        });
        gaugesLayout.osd.show(osdView);
        var monView = new views.MonView({
            App: App
        });
        gaugesLayout.mon.show(monView);
        var gauge = new views.UsageView({
            App: App,
            model: new models.UsageModel({}),
            title: 'Usage'
        });
        gauge.listenTo(gauge, 'item:postrender', function() {
            App.vent.trigger('updateTotals');
        });

        var pgView = new views.PgView({
            App: App,
            el: '.pgmap'
        });
        pgView.render();
        var pgStat = new views.PgStat({
            App: App,
            el: '.pgstat'
        });
        pgStat.render();

        var collection;
        if (config.offline) {
            collection = Generate.osds(160);
        } else {
            collection = new Collection([], {});
        }
        var viz = new views.OSDVisualization({
            App: App,
            collection: collection,
            el: '.raphael-one'
        });

        $('body').on('keyup', function(evt) {
            App.vent.trigger('keyup', evt);
        });

        var statusLine = new views.StatusLine({
            App: App,
            el: '.status-line'
        });
        statusLine.render();

        _.extend(humanize.catalog, {
            'about_a_minute_ago': '1m',
            'minutes_ago': 'm',
            'about_an_hour_ago': '1h',
            'hours_ago': 'h',
            'one_day_ago': '1d',
            'days_ago': 'd'
        });

        /* Widget Setup */

        /* Defer Visualization startup to after loading the cluster metadata */
        var clusterDeferred = $.Deferred();
        clusterMenu = new ClusterDropDown({
            el: $('.clustermenu'),
            App: App
        });
        clusterMenu.fetch().done(function() {
            clusterDeferred.resolve(clusterMenu.collection.at(0));
        });
        clusterDeferred.promise().done(function(cluster) {
            var alertsView = new views.AlertsView({
                App: App
            });

            var poller = new Poller({
                App: App,
                cluster: cluster.get('id')
            });
            App.graphWall = new GraphWall({
                App: App,
                AppRouter: appRouter,
                graphiteHost: config['graphite-host']
            });

            viz.render().then(function() {
                gaugesLayout.usage.show(gauge);
                if (!config.offline) {
                    poller.start();
                }
            });

            var breadcrumbView = new views.BreadCrumbView({
                App: App,
                AppRouter: appRouter,
                el: '.inknav'
            });
            breadcrumbView.render();

            appRouter.on('route:workbench', function() {
                App.fsm.viz();
            });
            appRouter.on('route:dashboard', function() {
                App.fsm.dashboard();
            });
            appRouter.on('route:graph', function(host, osd) {
                console.log('router>> host: ' + host + ' osd: ' + osd);
                App.fsm.graph(host, osd);
            });

            App.start({
                appRouter: appRouter
            });

            appRouter.navigate('dashboard');

            // Global Exports
            window.inktank = {
                App: App,
                Router: appRouter,
                ClusterMenu: clusterMenu,
                Gauge: gauge,
                Gauges: gaugesLayout,
                GraphWallView: App.graphWall,
                Poller: poller,
                OsdView: osdView,
                MonView: monView,
                PgView: pgView,
                UserMenu: userMenu,
                Viz: viz,
                Alerts: alertsView,
                StatusLine: statusLine,
                models: models,
                helpers: helpers,
                commit: gitcommit['git-commit']
            };
        });
        /* Defer Visualization startup to after loading the cluster metadata */
    });

    Backbone.history.start();

});
