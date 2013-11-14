/*global define, mina*/

define(['jquery', 'underscore', 'backbone', 'templates', 'snapsvg', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, snap, gaugeHelper) {
    'use strict';

    var OsdHistogramView = Backbone.Marionette.ItemView.extend({
        className: 'osd-histogram card gauge',
        template: JST['app/scripts/templates/osd-histogram.ejs'],
        cardTitleTemplate: _.template('<%- total %> OSD'),
        modelEvents: {
            'change': 'modelChanged'
        },
        ui: {
            count: '.osd-histogram-count',
            spinner: '.fa-spinner',
            cardTitle: '.card-title'
        },
        initialize: function() {
            _.bindAll(this, 'modelChanged', 'animateBar', 'initSVG', 'set');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
            }
            this.listenToOnce(this, 'render', this.initSVG);
            this.model = new Backbone.Model({
                'ok': 0,
                'warn': 0,
                'critical': 0
            });
            gaugeHelper(this, 'status');
        },
        svg: {},
        set: function(model) {
            var attr = model.attributes.osd;
            this.model.set({
                ok: attr.ok.count,
                warn: attr.warn.count,
                critical: attr.critical.count,
            });
        },
        animationMs: 1000,
        easing: mina.bounce,
        animateBar: function(svgBar, svgText, percentage, text, offset) {
            var y = 10 + 100 - percentage;
            var height = percentage;
            svgBar.animate({
                y: y,
                height: height
            }, this.animationMs, this.easing);
            svgText.attr({
                text: text
            });
            var x = offset + (24 / 2 - svgText.node.getBBox().width / 2);
            svgText.attr({
                x: x
            });
        },
        percentage: function(count, total) {
            return Math.round(count / total * 100);
        },
        modelChanged: function(model) {
            var ok = model.get('ok');
            var warn = model.get('warn');
            var critical = model.get('critical');
            var count = 0;
            if (_.isNumber(ok)) {
                count += ok;
            }
            if (_.isNumber(warn)) {
                count += warn;
            }
            if (_.isNumber(critical)) {
                count += critical;
            }
            this.ui.cardTitle.text(this.cardTitleTemplate({total: count}));
            var svg = this.svg;
            var legendX = this.legendX;
            if (_.isNumber(ok)) {
                this.animateBar(svg.ok, svg.okcount, this.percentage(ok, count), ok.toString(), legendX[0]);
            }
            if (_.isNumber(warn)) {
                this.animateBar(svg.warn, svg.warncount, this.percentage(warn, count), warn.toString(), legendX[1]);
            }
            if (_.isNumber(critical)) {
                this.animateBar(svg.critical, svg.criticalcount, this.percentage(critical, count), critical.toString(), legendX[2]);
            }
            this.animationMs = 250;
            this.easing = mina.linear;
        },
        legendX: [ 10, 45, 80 ],
        barX: [ 13, 48, 83 ],
        initSVG: function() {
            var svg = this.svg;
            var p;
            this.p = snap(this.$('.osd-histogram-svg')[0]);
            p = this.p;
            var barBaseline = 110;
            var legendBaseline = barBaseline + 20;
            var barWidth = 20;
            var barHeight = 100;
            var barY = barBaseline - barHeight;
            p.node.setAttribute('viewBox', '0 0 130 130');
            p.path('M5,5L5,' + (barBaseline+1) + 'L110,' + (barBaseline+1)).attr({
                'class': 'osd-lines'
            });
            var legendX = this.legendX;
            var barX = this.barX;
            svg.ok = p.rect(barX[0], barY, barWidth, barHeight).attr({
                'class': 'osd-histogram-ok'
            });
            svg.warn = p.rect(barX[1], barY, barWidth, barHeight).attr({
                'class': 'osd-histogram-warn'
            });
            svg.critical = p.rect(barX[2], barY, barWidth, barHeight).attr({
                'class': 'osd-histogram-critical'
            });
            svg.okcount = p.text(legendX[0], legendBaseline, '0').attr({
                'class': 'osd-count-text'
            });
            svg.warncount = p.text(legendX[1], legendBaseline, '0').attr({
                'class': 'osd-count-text'
            });
            svg.criticalcount = p.text(legendX[2], legendBaseline, '0').attr({
                'class': 'osd-count-text'
            });
        }
    });

    return OsdHistogramView;
});
