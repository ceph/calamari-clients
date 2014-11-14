/*global require, Uri */
'use strict';
require(['jquery', 'underscore', 'backbone', 'loglevel', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'poller', 'collections/osd-collection', 'views/userdropdown-view', 'views/clusterdropdown-view', 'views/graphwall-view', 'helpers/graph-utils', 'gitcommit', 'application', 'tracker', 'jsuri', 'marionette', 'bootstrap', 'notytheme', 'notyGrowltheme'], function($, _, Backbone, log, humanize, views, models, configloader, Poller, Collection, UserDropDown, ClusterDropDown, GraphWall, helpers, gitcommit, Application, UserRequestTracker) {
    // Process Page URL - we look for parameters like target to set initial SPA state.
    var uri = new Uri(document.URL);
    var target = uri.getQueryParamValue('target');
    var initial = 'dashmode';
    var anchor = 'dashboard';
    // TODO This needs to be moved to config.json
    log.setLevel(log.levels.WARN);
    if (target) {
        console.log(target);
        if (target === 'workbench') {
            initial = 'vizmode';
            anchor = 'workbench';
        } else if (target === 'graph') {
            initial = 'graphmode';
            anchor = 'graph/all';
        }
        // Once we have processed the target param, delete it from the URL
        uri.deleteQueryParam('target');
        uri.setAnchor(anchor);
        history.pushState('', 'Dashboard', uri.toString());
    }

    // Default Dashboard Configuration. This can be overriden by `config.json`
    //
    // |Key|Description|
    // |---|-----|
    // |**graphite-host**|Graphite Host URL|
    // |**api-request-timeout-ms**|How to long to wait before considering an API request Timed-out in Milliseconds|
    // |**long-polling-interval**|How frequently to request updates in Milliseconds|
    // |**disable-network-checks**|Used for development. Ignores stale timestamps on the server errors.|
    // |**graphite-request-delay-ms**|Duration between graphite requests to prevent overloading graphite per graph in Milliseconds|
    // |**enable-demo-mode**|Demo mode flag. *Reserved for future use*|
    // |**offline**|Used for offline demos. *Reserved for future use*|
    // |**delta-osd-api**|Used enabling delta OSD API. *Reserved for future use*|
    var config = {
        'offline': false,
        'delta-osd-api': false,
        'graphite-host': '/graphite',
        'api-request-timeout-ms': 10000,
        'long-polling-interval-ms': 20000,
        'disable-network-checks': false,
        'graphite-request-delay-ms': 50,
        'enable-demo-mode': false
    };

    /* Default Backbone Router Configuration */
    var AppRouter = Backbone.Router.extend({
        routes: {
            'workbench': 'workbench',
            'dashboard': 'dashboard',
            'graph/:host(/:osd)': 'graph'
        }
    });
    var appRouter = new AppRouter();

    /* Load Config.json first before starting app */
    var configUrl = 'scripts/config.json';
    // Load config.json using a promise. This is the error handler.
    var promise = configloader(configUrl).then(undefined, function(jqXHR, textStatus, errorThrown) {
        if (_.isString(jqXHR)) {
            // Error was probably caused a JSON parsing error. Pass through the error string.
            console.log(jqXHR);
            // In order to get a pretty error message, we have to complete loading of widgets, including AlertView.
            // This creates a callback which gets executed after the normal app initialization has completed
            // allowing the UI to report the error rather than stopping the UI.
            var waitAfterLoadedFn = function() {
                this.inktank.App.vent.trigger('app:configerror', jqXHR);
            };
            return $.Deferred().resolve(waitAfterLoadedFn);
        } else if (_.isObject(jqXHR) && jqXHR.readState) {
            console.log(errorThrown + ' loading ' + configUrl);
        } else {
            // No config.json was found. Treat this is a non-error by returning a resovled promise.
            console.log('No ' + configUrl + ' found. Using app defaults');
            return $.Deferred().resolve();
        }
    });

    // One we've loaded config.json successfully configure the graphite-host and iops-host
    // values which are used by Graph to make requests for metrics.
    promise.done(function(result) {
        _.extend(config, result);
        if (config['graphite-host'] && config['iops-host'] === undefined) {
            config['iops-host'] = config['graphite-host'];
        }
    });

    // ###Dashboard initialization starts here
    var App, userMenu, clusterMenu;
    promise.then(function(waitFn) {

        // Create the Application Object
        App = new Application();
        // TODO This instance should probably go away as Application comes with one.
        App.ReqRes = new Backbone.Wreqr.RequestResponse();
        // Attach our config object to app so all components have access to it.
        App.Config = config;


        userMenu = new UserDropDown({
            el: $('.usermenu'),
            App: App
        });
        // User dropdown menu needs user meta-data. It's not critical path so load it in the background.
        userMenu.fetch();

        // Top Row Dashboard - aka gauges. Uses Marionette Layout to contain widgets.
        var gaugesLayout = new views.GaugesLayout({
            el: '.gauges'
        });
        gaugesLayout.render();

        // All Components get an instance of App so they get access to the event bus,
        // request response and config.
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

        var poolsView = new views.PoolsView({
            App: App
        });
        gaugesLayout.d.show(poolsView);


        // Middle Row of Dashboard
        var mapsLayout = new views.GaugesLayout({
            el: '.maps'
        });
        mapsLayout.render();

        var pgView = new views.PgView({
            App: App
        });
        mapsLayout.a.show(pgView);


        // Bottom row of Dashboard Layout Widget
        var iopsLayout = new views.GaugesLayout({
            el: '.iops'
        });
        iopsLayout.render();

        var hostsView = new views.HostsView({
            App: App
        });
        iopsLayout.c.show(hostsView);

        // OSD Collection instance is initialized here. This is the vestiges of our former offline and demo modes.
        var collection;
        collection = new Collection([], {});

        // Start the OSD Visualization. It isn't rendered yet, but it's needed for other components to query against.
        var viz = new views.OSDVisualization({
            App: App,
            collection: collection,
            el: '.raphael-one'
        });

        // Deprecated - key handlers are installed
        if (config['enable-demo-mode']) {
            $('body').on('keyup', function(evt) {
                App.vent.trigger('keyup', evt);
            });
        }

        // Reconfigure humanize.js with labels we like better.
        // TODO add this text to l20n.js
        _.extend(humanize.catalog, {
            'seconds_ago': ' secs ago',
            'about_a_minute_ago': '1 min ago',
            'minutes_ago': ' mins ago',
            'about_an_hour_ago': '1h ago',
            'hours_ago': 'h ago',
            'one_day_ago': '1d ago',
            'days_ago': 'd ago'
        });

        // Defer Visualization startup to after loading the cluster metadata
        // Now our base widgets are setup, we need to get the first cluster returned
        // by the calamari API and use it's metadata to initialize our polling task.
        var clusterDeferred = $.Deferred();
        clusterMenu = new ClusterDropDown({
            el: $('.clustermenu'),
            App: App
        });
        clusterMenu.fetch().done(function() {
            clusterDeferred.resolve(clusterMenu.collection.first());
        });
        clusterDeferred.promise().done(function(cluster) {
            // **All the following components need to know what cluster they are operating against.**

            // Now we know what cluster we're operating on, load the iops view.
            var iopsView = new views.IopsView({
                'graphiteHost': config['iops-host'],
                App: App
            });
            iopsLayout.a.show(iopsView);

            // Start the alerts view, which is responsible for all notifications in the dashboard.
            var alertsView = new views.AlertsView({
                App: App
            });


            // init the poller task. Starting happens after the viz renders.
            var poller = new Poller({
                App: App,
                cluster: cluster.get('id')
            });

            // Initialize the graph wall sub-module.
            App.graphWall = new GraphWall({
                App: App,
                AppRouter: appRouter,
                clusterId: cluster.get('id'),
                clusterName: cluster.get('name'),
                graphiteHost: config['graphite-host'],
                graphiteRequestDelayMs: config['graphite-request-delay-ms']
            });

            // Now we have a cluster, start the poller task so we get updates.
            viz.render().then(function() {
                iopsLayout.b.show(gauge);
                if (!config.offline) {
                    poller.start();
                }
            });

            // Add hooks to the State Machine so it responds to routing change events.
            appRouter.on('route:workbench', function() {
                App.fsm.viz();
            });
            appRouter.on('route:dashboard', function() {
                App.fsm.dashboard();
            });
            appRouter.on('route:graph', function(host, osd) {
                log.debug('router>> host: ' + host + ' osd: ' + osd);
                App.fsm.graph(host, osd);
            });

            // If a wait function was supplied invoke it now
            App.addInitializer(function() {
                if (_.isFunction(waitFn)) {
                    // run this callback after the app has been set up
                    waitFn.call(window);
                }
            });

            // Initialize the navigating menus at top of screen.
            var breadcrumbView = new views.BreadCrumbView({
                App: App,
                AppRouter: appRouter,
                initial: initial,
                el: '.inknav'
            });
            breadcrumbView.render();

            // Start the app fully
            App.start({
                appRouter: appRouter,
                initial: initial
            });

            // Create a Request Tracker Singleton
            var userRequestTracker = new UserRequestTracker({
                App: App,
                cluster: cluster.get('id')
            });

            // Add a View controller
            var userRequestView = new views.UserRequestView({
                App: App,
                cluster: cluster.get('id'),
                el: '.userrequests'
            });

            // Make the first toggle request render the User Request View and
            // all subsequent ones hide and show the widget. Lazy init.
            App.listenToOnce(App.vent, 'UserRequestView:toggle', function() {
                userRequestView.render();
                App.listenTo(App.vent, 'UserRequestView:toggle', function() {
                    userRequestView.show();
                });
            });


            // Initialize the notification bell which shows and hides the UserRequestView
            var notificationBellView = new views.NotificationBellView({
                App: App,
                el: '.bell-button'
            });

            // Global Exports for Debugging
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
                UserRequestTracker: userRequestTracker,
                UserRequestView: userRequestView,
                NotificationBellView: notificationBellView
            };

        });

    });


});
