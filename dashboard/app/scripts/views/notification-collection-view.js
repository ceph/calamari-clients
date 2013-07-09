/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', '../views/notification-item-view', 'marionette'], function($, _, Backbone, JST, humanize, NotificationItemView) {
    'use strict';

    var NotificationCollectionView = Backbone.Marionette.CollectionView.extend({
        itemView: NotificationItemView,
        initialize: function() {},
        template: JST['app/scripts/templates/notifications.ejs'],
        onBeforeRender: function() {
            this.$el.empty();
            var model = {
                count: this.collection.length,
                className: this.collection.length === 0 ? '' : 'badge-important'
            };
            this.$el.html(this.template(model));
        },
        appendHtml: function(collectionView, itemView) {
            collectionView.$('.notification-rows').prepend(itemView.el);
        }
    });

    return NotificationCollectionView;
});
