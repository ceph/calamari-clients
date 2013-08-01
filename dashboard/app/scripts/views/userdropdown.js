/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'marionette'], function($, _, JST, Backbone) {
    'use strict';
    var UserDropDown = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/userdropdown.ejs'],
        tagName: 'ul',
        className: 'nav pull-right',
        events: {
            'click .logout': 'logout',
            'click .settings': 'settings'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            var Model = Backbone.Model.extend({
                url: '/api/v1/user/me'
            });
            this.model = new Model();
            this.model.set({
                username: '',
                settingsIcon: 'icon-gears',
                settingsLabel: 'Settings',
                logoutIcon: 'icon-power-off',
                logoutLabel: 'Logout'
            });
            this.listenTo(this.model, 'change', this.render);
            _.bindAll(this, 'settings', 'logout');
        },
        fetch: function() {
            return this.model.fetch();
        },
        logout: function() {
            // TODO look at history API
            var d = $.get('/api/v1/auth/logout');
            d.always(function() {
                document.location = '/login/';
            });
        },
        settings: function() {
            // TODO look at history API
            document.location = '/admin/';
        }

    });
    return UserDropDown;
});
