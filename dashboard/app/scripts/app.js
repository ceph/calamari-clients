/*global require */
'use strict';
require(['jquery', 'underscore', 'backbone', 'gauge', 'views/raphael_demo', 'humanize', 'views/notification-card-view', 'marionette'], function($, _, Backbone, Gauge, raphdemo, humanize, NotificationCardView) {
    Backbone.history.start();
    var opts = {
        lines: 10,
        colorStart: '#80d2dc',
        colorStop: '#55aeba',
        generateGradient: true

    };
    var gauge = new Gauge($('.usage-canvas')[0]).setOptions(opts);

    var r = Math.random(Date.now()) * 100;
    r = Math.floor(r);
    window.vent = new Backbone.Wreqr.EventAggregator();
    var collection;
    raphdemo.then(function(r, raphdemo) {
        collection = raphdemo.collection;
        gauge.set(0);
        gauge.setTextField($('.number')[0]);
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
    window.vent.on('status:healthok', function() {
        var $el = $('.health-text');
        $el.css('display', 'none').text('OK').removeClass('warn').addClass('ok').fadeIn().css('display', '');
    });
    window.vent.on('status:healthwarn', function() {
        var $el = $('.health-text');
        $el.css('display', 'none').text('WARN').removeClass('ok').addClass('warn').fadeIn().css('display', '');
    });
    window.vent.on('status:healthok status:healthwarn', function() {
        $('.detail tbody').css('display', 'none').text('No OSD selected').fadeIn().css('display', '');
    });
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
        r = (totalUsed / totalCapacity) * 100;
        r = Math.floor(r);
        console.log(r);
        var used = humanize.filesize(totalUsed * ONE_GIGABYTE);
        used = used.replace(' Tb', 'T');
        $('.usedcap').text(used);
        var total = humanize.filesize(totalCapacity * ONE_GIGABYTE);
        total = total.replace(' Tb', 'T');
        $('.totalcap').text(total);
        $('.totalused').text(used);
        $('.objcount').text(Math.floor(totalObj));
        totalObjSpace = totalObj * 50;
        totalObjSpace = humanize.filesize(Math.floor(totalObjSpace)).replace(' Kb', 'K');
        $('.objspace').text(totalObjSpace);
        gauge.set(r);
    });

});
