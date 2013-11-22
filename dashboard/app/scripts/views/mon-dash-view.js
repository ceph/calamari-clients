/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/gauge-helper', 'marionette'], function($, _, Backbone, JST, gaugeHelper) {
    'use strict';

    var OsdDashView = Backbone.Marionette.ItemView.extend({
        className: 'col-lg-3 col-md-3 col-sm-6 col-xs-6 custom-gutter',
        template: JST['app/scripts/templates/mon-dash.ejs'],
        ui: {
            'headline': '.headline',
            'subtext': '.subtext'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            gaugeHelper(this);
        }
    });

    return OsdDashView;
});
