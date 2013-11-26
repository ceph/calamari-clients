/*global define*/

define(['jquery',
        'underscore',
        'backbone',
        'templates',
        'helpers/gauge-helper',
        'marionette'
], function($, _, Backbone, JST) {
    'use strict';

    var PoolsDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-md-3 col-lg-4 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/pools-dash.ejs'],
        headlineTemplate: _.template('<%- count %>'),
        ui: {
            headline: '.headline'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'filter:update', this.getPools);
            }
            _.bindAll(this);
        },
        getPools: function() {
            var pools = this.App.ReqRes.request('get:pools');
            this.ui.headline.text(this.headlineTemplate({
                count: pools.length
            }));
        }
    });

    return PoolsDashView;
});
