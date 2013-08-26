/*global require */
/* jshint -W106 */

'use strict';
require(['jquery', 'underscore', 'backbone', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'poller', 'helpers/generate-osds', 'collections/osd-collection', 'views/userdropdown', 'views/clusterdropdown', 'helpers/animation', 'views/graphwall-view', 'helpers/graph-utils', 'statemachine', 'marionette', 'bootstrap'], function($, _, Backbone, humanize, views, models, configloader, Poller, Generate, Collection, UserDropDown, ClusterDropDown, animation, GraphWall, helpers, StateMachine) {
    /* Default Configuration */
    var config = {
        offline: true,
        'delta-osd-api': false
    };

    /* Default Configuration */
    var AppRouter = Backbone.Router.extend({
        routes: {
            'workbench': 'workbench',
            'dashboard': 'dashboard'
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
            var poller = new Poller({
                App: App,
                cluster: cluster.get('id')
            });
            var graphWall = new GraphWall();


            viz.render().then(function() {
                gaugesLayout.usage.show(gauge);
                if (!config.offline) {
                    poller.start();
                }
            });

            var toWorkBenchAnimation = animation.single('toWorkBenchAnim');
            App.onentergraphmode = function() {
                $('.row').css('visibility', 'hidden');
                appRouter.navigate('graph');
                graphWall.render();
                $('.container').append(graphWall.$el);
            };
            App.onleavegraphmode = function() {
                graphWall.close();
                $('.row').css('visibility', 'visible');
            };
            App.onentervizmode = function(event, from) {
                appRouter.navigate('workbench');
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
            App.onenterdashmode = function() {
                appRouter.navigate('dashboard');
            };

            App.onleavedashmode = function() {
            };

            var breadcrumbView = new views.BreadCrumbView({
                App: App,
                el: '.inknav'
            });
            breadcrumbView.render();

            appRouter.on('route:workbench', function() {
                App.vent.trigger('app:fullscreen');
            });
            appRouter.on('route:dashboard', function() {
                App.vent.trigger('app:dashboard');
            });

            appRouter.navigate('dashboard');

            App.fsm = StateMachine.create({
                initial: 'dashmode',
                events: [{
                    name: 'dashboard',
                    from: ['vizmode', 'graphmode'],
                    to: 'dashmode'
                }, {
                    name: 'dashboard',
                    from: ['vizmode', 'graphmode'],
                    to: 'dashmode'
                }, {
                    name: 'viz',
                    from: ['dashmode', 'graphmode'],
                    to: 'vizmode'
                }, {
                    name: 'graph',
                    from: ['dashmode', 'vizmode'],
                    to: 'graphmode'
                }],
                callbacks: {
                    onentervizmode: App.onentervizmode,
                    onleavevizmode: App.onleavevizmode,
                    onentergraphmode: App.onentergraphmode,
                    onleavegraphmode: App.onleavegraphmode,
                    onenterdashmode: App.onenterdashmode,
                    onleavedashmode: App.onleavedashmode
                },
            });

            _.bindAll(App.fsm);

            App.listenTo(App.vent, 'app:fullscreen', App.fsm.viz);
            App.listenTo(App.vent, 'app:dashboard', App.fsm.dashboard);
            App.listenTo(App.vent, 'app:graph', App.fsm.graph);

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
                models: models,
                helpers: helpers
            };
        });
        /* Defer Visualization startup to after loading the cluster metadata */
    });

    Backbone.history.start();

});
