/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'l20nCtx!locales/{{locale}}/strings', 'Backbone.Modal', 'marionette'], function($, _, JST, Backbone, l10n) {
    'use strict';
    var UserDropDown = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/userdropdown.ejs'],
        tagName: 'div',
        className: 'nav navbar-nav navbar-right',
        events: {
            'click .logout': 'logout',
            'click .settings': 'settings',
            'click .about': 'about'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            var Model = Backbone.Model.extend({
                url: '/api/v1/user/me'
            });
            this.model = new Model();
            this.model.set({
                username: '',
                settingsIcon: 'fa fa-cogs',
                settingsLabel: l10n.getSync('LabelSettings'),
                logoutIcon: 'fa fa-power-off',
                logoutLabel: l10n.getSync('LabelLogout'),
                aboutIcon: 'fa fa-info-circle',
                aboutLabel: l10n.getSync('LabelAbout').concat(' Calamari')
            });
            this.listenTo(this.model, 'change', this.render);
            _.bindAll(this, 'settings', 'logout');
        },
        fetch: function() {
            return this.model.fetch();
        },
        logout: function() {
            var d = $.get('/api/v1/auth/logout');
            d.always(function() {
                document.location = '/login/';
            });
        },
        settings: function() {
            document.location = '/admin/';
        },
        about: function() {
            $.get('/api/v2/info').then(function(resp) {
                var Modal = Backbone.Modal.extend({
                    template: function() {
                        return JST['app/scripts/templates/about-modal.ejs']({
                            version: {
                                calamariAPI: resp.version,
                                client: window.inktank.commit
                            },
                                l10nAbout: l10n.getSync('LabelAbout'),
                                l10nBroughtToYouBy: l10n.getSync('LabelBroughtToYouBy'),
                                l10nVersions: l10n.getSync('LabelVersions'),
                                l10nClose: l10n.getSync('UserRequestViewCloseBtn')
                        });
                    },
                    cancelEl: '.btn-primary'
                });
                var modal = new Modal();
                $('body').append(modal.render().el);
            });
        }

    });
    return UserDropDown;
});
