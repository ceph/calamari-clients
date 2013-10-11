/*global require */
'use strict';
require(['jquery', 'underscore', 'backbone', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'poller', 'helpers/generate-osds', 'collections/osd-collection', 'views/userdropdown', 'views/clusterdropdown', 'helpers/animation', 'views/graphwall-view', 'helpers/graph-utils', 'statemachine', 'gitcommit', 'marionette', 'bootstrap', 'notytheme'], function($, _, Backbone, humanize, views, models, configloader, Poller, Generate, Collection, UserDropDown, ClusterDropDown, animation, GraphWall, helpers, StateMachine, gitcommit) {
    /* Default Configuration */
    var hostname = document.location.hostname;
    //hostname = 'mira022.front.sepia.ceph.com';
    var config = {
        offline: true,
        'delta-osd-api': false,
        'graphite-host': 'http://' + hostname + ':8080',
        'api-request-timeout-ms': 3000,
        'long-polling-interval-ms': 20000
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
        App = new Backbone.Marionette.Application();
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
        var healthView = new views.HealthView({
            App: App,
            model: new models.HealthModel({})
        });
        gaugesLayout.health.show(healthView);
        var gauge = new views.UsageView({
            App: App,
            model: new models.UsageModel({}),
            title: 'Usage'
        });
        gauge.listenTo(gauge, 'item:postrender', function() {
            App.vent.trigger('updateTotals');
        });

        var statusView = new views.StatusView({
            App: App,
            model: new models.StatusModel({})
        });
        gaugesLayout.status.show(statusView);

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


        _.extend(humanize.catalog, {
            'about_a_minute_ago': '1m',
            'minutes_ago': 'm',
            'about_an_hour_ago': '1h',
            'hours_ago': 'h',
            'one_day_ago': '1d',
            'days_ago': 'd',
            'about_a_month_ago': '1M',
            'months_ago': 'M',
            'a_year_ago': '1y',
            'years_ago': 'y'
        });
        views.NotificationCardView.view.setElement($('.notifications')).render();
        views.NotificationCardView.collection.add(
        [{
            title: 'OSD',
            message: 'OSD.100 has stopped responding',
            timestamp: humanize.time() - 24 * 60 * 60,
            priority: 2
        }, {
            title: 'Processes',
            message: 'MDS 192.168.20.2 is online',
            timestamp: humanize.time() - 60 * 60,
            priority: 0
        }, {
            title: 'Processes',
            message: 'OSD.10 has stopped responding',
            timestamp: humanize.time() - 60,
            priority: 2
        }, {
            title: 'Processes',
            message: 'MDS 192.168.20.2 has become unreachable',
            timestamp: humanize.time(),
            priority: 1
        }]);
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
            var alertsView = new views.AlertsView({ App: App });

            var poller = new Poller({
                App: App,
                cluster: cluster.get('id')
            });
            var graphWall = new GraphWall({
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

            var toWorkBenchAnimation = animation.single('toWorkBenchAnim');
            App.onentergraphmode = function( /*event, from, to, host, osd */ ) {
                $('.row').css('visibility', 'hidden');
                graphWall.render();
                $('.container').append(graphWall.$el);
            };
            App.graphEvents = {
                'cpudetail': {
                    fn: 'makeCPUDetail',
                    title: _.template('Host <%- host %> CPU Detail Host')
                },
                'iops': {
                    fn: 'makeHostDeviceIOPS',
                    title: _.template('Host <%- host %> IOPS Per Device')
                },
                'rwbytes': {
                    fn: 'makeHostDeviceRWBytes',
                    title: _.template('Host <%- host %> RW Bytes/Sec Per Device')
                },
                'rwawait': {
                    fn: 'makeHostDeviceRWAwait',
                    title: _.template('Host <%- host %> RW Await Per Device')
                },
                'diskinodes': {
                    fn: 'makeHostDeviceDiskSpaceInodes',
                    title: _.template('Host <%- host %> DiskSpace Inodes Device')
                },
                'diskbytes': {
                    fn: 'makeHostDeviceDiskSpaceBytes',
                    title: _.template('Host <%- host %> DiskSpace Bytes Device')
                },
                'netpackets': {
                    fn: 'makeHostNetworkPacketsMetrics',
                    title: _.template('Host <%- host %> Network Interface Packets TX/RX')
                },
                'netbytes': {
                    fn: 'makeHostNetworkBytesMetrics',
                    title: _.template('Host <%- host %> Network Interface Bytes TX/RX')
                }
            };
            App.ongraph = function(event, from, to, host, id) {
                //console.log('ongraph>> host: ' + host + ' device id: ' + id);
                graphWall.hideGraphs();
                var hosts;
                if (host === 'all') {
                    graphWall.hideButtons();
                    graphWall.populateAll('CPU Load for Cluster', graphWall.makeHostUrls(graphWall.makeCPUGraphUrl));
                } else if (id !== undefined && id !== null) {
                    graphWall.showButtons();
                    var graphEvent = App.graphEvents[id];
                    if (graphEvent !== undefined) {
                        graphWall[graphEvent.fn].call(graphWall, host, id).then(function(result) {
                            graphWall.populateAll(graphEvent.title({
                                host: host
                            }), function() {
                                return _.flatten(result);
                            });
                        }).fail(function(result) {
                            // TODO Handle errors gracefully
                            console.log('failed! ', result);
                        });
                        return;
                    }
                } else {
                    hosts = App.ReqRes.request('get:hosts');
                    if (_.contains(hosts, host)) {
                        graphWall.showButtons();
                        graphWall.updateBtns('overview');
                        graphWall.hostname = host;
                        graphWall.populateAll('Host Graphs for ' + host, graphWall.makeHostOverviewGraphUrl(host));
                    }
                }
            };
            App.onleavegraphmode = function() {
                graphWall.close();
                $('.row').css('visibility', 'visible');
            };
            App.onentervizmode = function(event, from) {
                var d = $.Deferred();
                var $body = $('body');
                var vent = App.vent;
                if (from === 'dashmode') {
                    vent.trigger('gauges:disappear', function() {
                        d.resolve();
                    });
                } else {
                    d.resolve();
                }

                d.promise().then(function() {
                    $body.addClass('workbench-mode');
                    toWorkBenchAnimation($body);
                    vent.trigger('viz:fullscreen', function() {
                        vent.trigger('gauges:collapse');
                    });
                });
            };
            var toDashboardAnimation = animation.single('toDashboardAnim');
            App.onleavevizmode = function(event, from, to) {
                var $body = $('body');
                var vent = App.vent;
                $body.removeClass('workbench-mode');
                var d = $.Deferred();
                if (to === 'dashmode') {
                    toDashboardAnimation($body).then(function() {
                        vent.trigger('viz:dashboard', function() {
                            d.resolve();
                        });
                    });

                } else {
                    vent.trigger('viz:dashboard', function() {
                        d.resolve();
                    });
                }
                d.promise().then(function() {
                    vent.trigger('gauges:expand', function() {
                        vent.trigger('gauges:reappear');
                    });
                });
            };
            App.onenterdashmode = function() {};

            App.onleavedashmode = function() {};

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

            appRouter.navigate('dashboard');

            App.fsm = StateMachine.create({
                initial: 'dashmode',
                events: [{
                    name: 'dashboard',
                    from: ['vizmode', 'graphmode'],
                    to: 'dashmode'
                }, {
                    name: 'viz',
                    from: ['dashmode', 'graphmode'],
                    to: 'vizmode'
                }, {
                    name: 'graph',
                    from: ['dashmode', 'vizmode', 'graphmode'],
                    to: 'graphmode'
                }],
                callbacks: {
                    onentervizmode: App.onentervizmode,
                    onleavevizmode: App.onleavevizmode,
                    onentergraphmode: App.onentergraphmode,
                    onleavegraphmode: App.onleavegraphmode,
                    onenterdashmode: App.onenterdashmode,
                    onleavedashmode: App.onleavedashmode,
                    ongraph: App.ongraph
                }
            });

            _.bindAll(App.fsm);

            App.listenTo(App.vent, 'app:fullscreen', function() {
                appRouter.navigate('workbench', {
                    trigger: true
                });
            });
            App.listenTo(App.vent, 'app:dashboard', function() {
                appRouter.navigate('dashboard', {
                    trigger: true
                });
            });
            App.listenTo(App.vent, 'app:graph', function(host) {
                if (host === undefined) {
                    host = 'all';
                }
                appRouter.navigate('graph/' + host, {
                    trigger: true
                });
            });
            // Global Exports
            window.inktank = {
                App: App,
                Router: appRouter,
                ClusterMenu: clusterMenu,
                Gauge: gauge,
                Gauges: gaugesLayout,
                GraphWallView: graphWall,
                HealthView: healthView,
                Poller: poller,
                StatusView: statusView,
                UserMenu: userMenu,
                Viz: viz,
                Alerts: alertsView,
                models: models,
                helpers: helpers,
                commit: gitcommit['git-commit']
            };
        });
        /* Defer Visualization startup to after loading the cluster metadata */
    });

    Backbone.history.start();

});
