/*global require */
/* jshint -W106 */

'use strict';
require(['jquery', 'underscore', 'backbone', 'views/raphael_demo', 'humanize', 'views/notification-card-view', 'views/usage-view', 'models/usage-model', 'marionette'], function($, _, Backbone, raphdemo, humanize, NotificationCardView, UsageView, UsageModel) {
    Backbone.history.start();
    var gauge = new UsageView({
        model: new UsageModel(),
        el: $('.usage')
    });

    var r = Math.random(Date.now()) * 100;
    r = Math.floor(r);
    window.vent = new Backbone.Wreqr.EventAggregator();
    var collection;
    raphdemo.then(function(r, raphdemo) {
        collection = raphdemo.collection;
        gauge.render();
        window.vent.trigger('updateTotals');
    });
    var ONE_GIGABYTE = 1024 * 1024 * 1024;

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
    window.vent.on('status:healthok', function() {
        var $el = $('.health-text');
        replaceText($el, 'OK', 'warn', 'ok');
    });
    window.vent.on('status:healthwarn', function() {
        var $el = $('.health-text');
        replaceText($el, 'WARN', 'ok', 'warn');
    });
    window.vent.on('status:healthok status:healthwarn', function() {
        replaceText($('.detail tbody'), 'No OSD Selected');
    });
    window.vent.on('status:healthok', function() {
        replaceText($('.warn-pg, .warn-osd, .warn-pool'), '0');
        replaceText($('.ok-pg'), 2400);
        replaceText($('.ok-pool'), 10);
    });
    window.vent.on('status:healthwarn', function() {
        var pg = Math.round(Math.random() * 45) + 5;
        var pool = Math.round(Math.random() * 1) + 1;
        replaceText($('.warn-pg'), pg);
        replaceText($('.warn-pool'), pool);
        replaceText($('.ok-pg'), 2400 - pg);
        replaceText($('.ok-pool'), 10 - pool);
    });
    var flip = false;
    window.vent.on('updateTotals', function() {
        var totalUsed = 0,
            totalCapacity = 0,
            totalObj = 0,
            totalObjSpace = 0;
        collection.each(function(m) {
            totalUsed += m.get('used');
            totalCapacity += m.get('capacity');
            totalObj += Math.random(Date.now()) * 100;
        });
        if (flip) {
            r *= 1.10;
        } else {
            r *= 0.90;
        }
        flip = !flip;
        r = Math.floor(r);

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

});
