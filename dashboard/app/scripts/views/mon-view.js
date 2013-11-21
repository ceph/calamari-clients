/*global define*/
// jshint camelcase: false
define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'humanize', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, animation, humanize, gaugeHelper) {
    'use strict';

    var MonView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/mon.ejs'],
        countTemplate: _.template('<%- count %> of <%- total %>'),
        cardTitleTemplate: _.template('<%- count %> MON'),
        ui: {
            'spinner': '.fa-spinner',
            'monState': '.mon-state',
            'monCount': '.mon-count',
            'subText': '.subtext',
            'cardTitle': '.card-title'
        },
        modelEvents: {
            'change': 'updateModel'
        },
        updateModel: function(model) {
            var attr = model.attributes;
            var total = attr.ok.count + attr.warn.count + attr.critical.count;
            this.model.set('total', total, {
                silent: true
            });
            setTimeout(this.updateView, 0);
        },
        updateView: function() {
            var attr = this.model.attributes;
            this.ui.monState.removeClass('fail ok warn');
            var clazz = 'ok';
            if (attr.total - attr.ok.count > 0) {
                clazz = 'warn';
                if (attr.total - (attr.warn.count + attr.critical.count) === 1) {
                    clazz = 'fail';
                }
            }
            this.ui.monState.addClass(clazz);
            this.ui.monCount.text(this.countTemplate({
                total: attr.total,
                count: attr.ok.count

            }));
            this.ui.cardTitle.text(this.cardTitleTemplate({count: attr.ok.count}));
        },
        updateTimer: function() {
            this.ui.subText.text(humanize.relativeTime(this.model.get('cluster_update_time_unix') / 1000));
            this.timer = setTimeout(this.updateTimer, 1000);
        },
        initialize: function() {
            _.bindAll(this, 'set', 'updateModel', 'updateView', 'updateTimer');
            this.model = new Backbone.Model({
                cluster_update_time_unix: Date.now()
            });
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
            }
            gaugeHelper(this, 'status');
        },
        set: function(model) {
            this.model.set(_.extend({
                cluster_update_time_unix: model.attributes.cluster_update_time_unix
            }, model.attributes.mon));
        }
    });

    return MonView;
});
