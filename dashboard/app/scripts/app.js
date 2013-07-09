/*global require */
'use strict';
require(['jquery', 'backbone', 'gauge', 'views/raphael_demo', 'humanize', 'marionette'], function($, Backbone, Gauge, raphdemo, humanize) {
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
