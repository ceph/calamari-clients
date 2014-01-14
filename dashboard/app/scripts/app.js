/*global require */
'use strict';
require(['jquery', 'underscore', 'backbone', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'poller', 'helpers/generate-osds', 'collections/osd-collection', 'views/userdropdown-view', 'views/clusterdropdown-view', 'views/graphwall-view', 'helpers/graph-utils', 'gitcommit', 'application', 'plugin_loader', 'marionette', 'bootstrap', 'notytheme'], function($, _, Backbone, humanize, views, models, configloader, Poller, Generate, Collection, UserDropDown, ClusterDropDown, GraphWall, helpers, gitcommit, Application, PluginLoader) {
    /* Default Configuration */
    var hostname = document.location.hostname;
    //hostname = 'mira022.front.sepia.ceph.com';
    var config = {
        offline: true,
        'delta-osd-api': false,
        'graphite-host': 'http://' + hostname + ':8080',
        'api-request-timeout-ms': 10000,
        'long-polling-interval-ms': 20000,
        'disable-network-checks': false,
        'graphite-request-delay-ms': 50,
        'enable-demo-mode': false
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
        if (config['graphite-host'] && config['iops-host'] === undefined) {
            config['iops-host'] = config['graphite-host'];
        }
    }).fail(function(jqXHR) {
        window.alert(jqXHR);
        console.log(jqXHR);
    });
    /* Load Config.json first before starting app */

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

        /* Widget Setup */
        var gaugesLayout = new views.GaugesLayout({
            el: '.gauges'
        });
        gaugesLayout.render();
        var healthView = new views.HealthView({
            App: App,
            model: new models.HealthModel()
        });
        gaugesLayout.a.show(healthView);
        var osdView = new views.OsdView({
            App: App
        });
        gaugesLayout.b.show(osdView);
        var monView = new views.MonView({
            App: App
        });
        gaugesLayout.c.show(monView);
        var gauge = new views.UsageView({
            App: App,
            model: new models.UsageModel({}),
            title: 'Usage'
        });

        var mapsLayout = new views.GaugesLayout({
            el: '.maps'
        });
        mapsLayout.render();

        var pgView = new views.PgView({
            App: App
        });
        mapsLayout.a.show(pgView);


        var poolsView = new views.PoolsView({
            App: App
        });
        gaugesLayout.d.show(poolsView);

        var iopsLayout = new views.GaugesLayout({
            el: '.iops'
        });
        iopsLayout.render();

        var iopsView = new views.IopsView({
            'graphiteHost': config['iops-host'],
            App: App
        });
        iopsLayout.a.show(iopsView);
        var hostsView = new views.HostsView({
            App: App
        });
        iopsLayout.c.show(hostsView);

        var collection;
        collection = config.offline ? Generate.osds(160) : new Collection([], {});
        var viz = new views.OSDVisualization({
            App: App,
            collection: collection,
            el: '.raphael-one'
        });

        if (config['enable-demo-mode']) {
            $('body').on('keyup', function(evt) {
                App.vent.trigger('keyup', evt);
            });
        }

        _.extend(humanize.catalog, {
            'seconds_ago': ' secs ago',
            'about_a_minute_ago': '1 min ago',
            'minutes_ago': ' mins ago',
            'about_an_hour_ago': '1h ago',
            'hours_ago': 'h ago',
            'one_day_ago': '1d ago',
            'days_ago': 'd ago'
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
                graphiteHost: config['graphite-host'],
                graphiteRequestDelayMs: config['graphite-request-delay-ms']
            });

            viz.render().then(function() {
                iopsLayout.b.show(gauge);
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

            var pluginLoader = new PluginLoader({
                vent: App.vent,
                url: 'scripts/plugin.json',
                el: $('.plugins')[0]
            });
            pluginLoader.render();

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
                models: models,
                helpers: helpers,
                commit: gitcommit['git-commit'],
                views: views,
                PoolsView: poolsView,
                IopsView: iopsView,
                HostsView: hostsView,
                HealthView: healthView,
                pluginLoader: pluginLoader
            };
        });
        /* Defer Visualization startup to after loading the cluster metadata */
        Backbone.history.start();
        appRouter.navigate('dashboard');
    });


});
