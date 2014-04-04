/* global define */

define(['jquery', 'underscore', 'backbone', 'idbwrapper', 'loglevel', 'collections/user-request-collection', 'models/user-request-model', 'marionette'], function($, _, Backbone, IDBStore, log, UserRequestCollection, UserRequestModel) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.cluster = Backbone.Marionette.getOption(this, 'cluster');
            this.collection = new UserRequestCollection([], {
                cluster: this.cluster
            });
            this.model = new UserRequestModel({
                cluster: this.cluster
            });
            this.listenTo(this.App.vent, 'cluster:update', this.updateFSID);
            this.requests = new IDBStore({
                dbVersion: 2,
                storeName: 'InktankUserRequest',
                keyPath: 'id',
                autoIncrement: false,
                onStoreReady: function() {
                    log.info('Inktank User Request Store ready!');
                }
            });
            _.bindAll(this, 'updateFSID');
        },
        updateFSID: function(cluster) {
            this.collection.cluster = cluster.get('id');
            this.model.set('cluster', cluster.get('id'));
        }
    });
});
