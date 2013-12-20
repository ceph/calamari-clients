/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, gaugeHelper) {
    'use strict';

    var OsdDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/mon-dash.ejs'],
        headlineTemplate: _.template('<%- up %>/<%- total %>'),
        modelEvents: {
            'change': 'updateModel'
        },
        ui: {
            'headline': '.headline',
            'subtext': '.subtext'
        },
        initialize: function() {
            _.bindAll(this, 'set', 'updateModel', 'updateView');
            this.model = new Backbone.Model();
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
            }
            gaugeHelper(this);
        },
        set: function(model) {
            // jshint camelcase: false
            this.model.set(_.extend({
                cluster_update_time_unix: model.attributes.cluster_update_time_unix
            }, model.attributes.mon));
        },
        displayWarning: function() {
            var ok = this.model.get('ok').states['in'];
            if (ok < 1) {
                this.trigger('status:warn');
            } else {
                this.trigger('status:ok');
            }
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
            var up = this.model.get('ok').states['in'];
            var total = this.model.get('total');
            this.ui.headline.text(this.headlineTemplate({
                up: up,
                total: total
            }));
            this.displayWarning();
        }
    });

    return OsdDashView;
});
