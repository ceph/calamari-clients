/*global require */
/* jshint -W106 */

'use strict';
require(['jquery', 'underscore', 'backbone', 'views/raphael_demo', 'humanize', 'views/notification-card-view', 'views/usage-view', 'models/usage-model', 'marionette'], function($, _, Backbone, Viz, humanize, NotificationCardView, UsageView, UsageModel) {
    var App = new Backbone.Marionette.Application();
    window.App = App;

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
    App.vent.on('status:healthok', function() {
        var $el = $('.health-text');
        console.log('hi');
        replaceText($el, 'OK', 'warn', 'ok');
    });
    App.vent.on('status:healthwarn', function() {
        var $el = $('.health-text');
        replaceText($el, 'WARN', 'ok', 'warn');
    });
    App.vent.on('status:healthok status:healthwarn', function() {
        replaceText($('.detail tbody'), 'No OSD Selected');
    });
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
            total_avail: totalCapacity * ONE_GIGABYTE,
            total_space: totalCapacity * ONE_GIGABYTE,
            total_used: totalUsed * ONE_GIGABYTE
        };
        gauge.set(settings);
        $('.objcount').text(Math.floor(totalObj));
        totalObjSpace = totalObj * 50;
        totalObjSpace = humanize.filesize(Math.floor(totalObjSpace)).replace(' Kb', 'K');
        $('.objspace').text(totalObjSpace);
    });

    Backbone.history.start();
    var gauge = new UsageView({
        model: new UsageModel(),
        title: 'Usage',
        el: $('.usage')
    });

    var viz = new Viz({
        App: App,
        el: '.raphael-one'
    });
    window.Viz = viz;
    $('body').on('keyup', function(evt) {
        App.vent.trigger('keyup', evt);
    });

    viz.render().then(function() {
        gauge.render();
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
    NotificationCardView.view.setElement($('.notifications')).render();
    NotificationCardView.collection.add(
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

});
