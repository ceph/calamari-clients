/* global define */
define(['jquery', 'underscore', 'templates', 'backbone', 'collections/user-request-collection', 'l20nCtx!locales/{{locale}}/strings', 'marionette'], function($, _, JST, Backbone, UserRequestCollection, l10n) {
    'use strict';
    var UserRequestView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/user-request.ejs'],
        request: JST['app/scripts/templates/request.ejs'],
        norequest: JST['app/scripts/templates/no-request.ejs'],
        tagName: 'div',
        className: '',
        events: {
            'click .close': 'close'
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.clusterId = Backbone.Marionette.getOption(this, 'cluster');
            this.collection = new UserRequestCollection({
                cluster: this.clusterId
            });
            _.bindAll(this, 'close');
        },
        serializeData: function() {
            return {
                title: l10n.getSync('UserRequestViewTitle'),
                colTask: l10n.getSync('UserRequestViewColTask'),
                colStatus: l10n.getSync('UserRequestViewColStatus'),
                colUpdated: l10n.getSync('UserRequestViewColUpdated')
            };
        },
        close: function() {
            // TBD
        }
    });
    return UserRequestView;
});
