/*global require */
/* jshint -W106 */

'use strict';
require(['jquery', 'underscore', 'backbone', 'humanize', 'views/application-view', 'models/application-model', 'helpers/config-loader', 'marionette'], function($, _, Backbone, humanize, views, models, configloader) {
    var config = {
        offline: true
    };
    var promise = configloader('scripts/config.json').then(function(result) {
        _.extend(config, result);
    });
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

    promise.done(function() {
        var App = new Backbone.Marionette.Application();
        App.Config = config;
        App.vent.on('status:healthok', function() {
            replaceText($('.warn-pg, .warn-osd, .warn-pool'), '0');
            replaceText($('.ok-pg'), 2400);
            replaceText($('.ok-pool'), 10);
        });
        App.vent.on('status:healthwarn', function() {
            var pg = Math.round(Math.random() * 45) + 5;
            var pool = Math.round(Math.random() * 1) + 1;
            replaceText($('.warn-pg'), pg);
            replaceText($('.warn-pool'), pool);
            replaceText($('.ok-pg'), 2400 - pg);
            replaceText($('.ok-pool'), 10 - pool);
        });
        App.vent.on('updateTotals', function() {
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
                report: {
                    total_avail: totalCapacity * ONE_GIGABYTE,
                    total_space: totalCapacity * ONE_GIGABYTE,
                    total_used: totalUsed * ONE_GIGABYTE
                }
            };
            gauge.set(settings);
            $('.objcount').text(Math.floor(totalObj));
            totalObjSpace = totalObj * 50;
            totalObjSpace = humanize.filesize(Math.floor(totalObjSpace)).replace(' Kb', 'K');
            $('.objspace').text(totalObjSpace);
        });

        Backbone.history.start();

        var gaugesLayout = new views.GaugesLayout({
            el: '.gauges'
        });
        gaugesLayout.render();
        gaugesLayout.health.show(new views.HealthView({
            App: App,
            model: new models.HealthModel()
        }));
        var gauge = new views.UsageView({
            App: App,
            model: new models.UsageModel(),
            title: 'Usage'
        });

        gaugesLayout.status.show(new views.StatusView());

        var viz = new views.OSDVisualization({
            App: App,
            el: '.raphael-one'
        });

        $('body').on('keyup', function(evt) {
            App.vent.trigger('keyup', evt);
        });

        viz.render().then(function() {
            gaugesLayout.usage.show(gauge);
            App.vent.trigger('updateTotals');
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


        // Global Exports
        window.inktank = {
            Viz: viz,
            App: App
        };
    });

});
