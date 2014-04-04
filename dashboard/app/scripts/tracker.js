/* global define */

define(['jquery', 'underscore', 'backbone', 'idbwrapper', 'loglevel', 'collections/user-request-collection', 'models/user-request-model', 'q', 'marionette'], function($, _, Backbone, IDBStore, log, UserRequestCollection, UserRequestModel, $q) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        deferred: {},
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
        getLength: function() {
            var d = $q.defer();
            this.requests.count(d.resolve, d.reject);
            return d.promise;
        },
        getTrackedTasks: function() {
            var d = $q.defer();
            this.requests.getAll(d.resolve, d.reject);
            return d.promise;
        },
        _resolvePromise: function(ttID) {
            if (this.deferred[ttID]) {
                this.deferred[ttID].resolve(ttID);
                delete this.deferred[ttID];
            }
        },
        _rejectPromise: function(ttID, error) {
            if (this.deferred[ttID]) {
                this.deferred[ttID].reject(ttID, error);
                delete this.deferred[ttID];
            }
        },
        remove: function(ttID) {
            var d = $q.defer();
            this.requests.remove(ttID, d.resolve, d.reject);
            var self = this;
            d.promise.then(function() {
                log.debug('Removed task id ' + ttID);
                self._resolvePromise(ttID);
            }, function(error) {
                log.error('Error removing task id ' + ttID, error);
                self._rejectPromise(ttID, error);
            });
            return d.promise;
        },
        updateFSID: function(cluster) {
            this.collection.cluster = cluster.get('id');
            this.model.set('cluster', cluster.get('id'));
        }
    });
});
