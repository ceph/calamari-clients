/* global define */

define(['jquery', 'underscore', 'backbone', 'idbwrapper', 'loglevel', 'collections/user-request-collection', 'models/user-request-model', 'q', 'moment', 'marionette'], function($, _, Backbone, IDBStore, log, UserRequestCollection, UserRequestModel, $q, momentjs) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        deferred: {},
        myid: 0,
        defaultTimer: 15000, // TODO Make this configurable
        shortTimer: 5000, // TODO Make this configurable
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
            _.bindAll(this, 'updateFSID', 'processTasks', 'checkWorkToDo', 'getTrackedTasks', '_resolvePromise', '_rejectPromise', 'remove', 'showNotification', 'showError');
            this.timeout = setTimeout(this.checkWorkToDo, this.shortTimer);
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
        showNotification: function(request) {
            this.App.vent('request:success', request);
        },
        showError: function(request) {
            this.App.vent('request:error', request);
        },
        updateFSID: function(cluster) {
            this.collection.cluster = cluster.get('id');
            this.model.set('cluster', cluster.get('id'));
        },
        processTasks: function(runningTasks, trackedTasks) {
            _.each(trackedTasks, function(trackedTask) {
                var ttID = trackedTask.id;
                var foundTask = _.find(runningTasks, function(runningTask) {
                    // search for tracked id in submitted tasks
                    return runningTask.id === ttID;
                });
                if (foundTask === undefined) {
                    // Task ID No Longer in Submitted List
                    var self = this;
                    this.model.set('id', ttID).fetch().then(function(request) {
                        log.debug('Checking task ' + ttID);
                        if (request.error) {
                            self.showError(request);
                            self.remove(ttID);
                        } else {
                            if (request.state === 'complete') {
                                log.debug('Task ' + ttID + ' is complete');
                                self.showNotification(request);
                                self.remove(ttID);
                            } else {
                                log.debug('task ' + ttID + ' is still active.');
                                if (trackedTask.timestamp) {
                                    var timestamp = momentjs(trackedTask.timestamp);
                                    var now = momentjs();
                                    if (now.diff(timestamp, 'days') >= 1) {
                                        log.warn('task ' + ttID + ' is older than 24 hours. Reaping old task.');
                                        self.remove(ttID);
                                    }
                                }
                            }
                        }
                    }, function(resp) {
                        log.debug('Error ' + resp.status + ' checking task ' + ttID, resp);
                        if (resp.status === 404) {
                            log.warn('Task ' + ttID + ' NOT FOUND');
                            self.remove(ttID);
                        }
                    });
                } else {
                    log.debug('Task ' + ttID + ' is still executing');
                }
            }, this);
            log.debug('Server has ' + runningTasks.length + ' running tasks');
            this.timeout = setTimeout(this.checkWorkToDo, this.shortTimer);
        },

        checkWorkToDo: function() {
            var self = this;
            this.getLength().then(function doWork(requestLen) {
                if (requestLen === 0) {
                    log.debug('[' + self.myid + ']' + ' No tasks to track. sleeping ' + self.defaultTimer);
                    self.timeout = setTimeout(self.checkWorkToDo, self.defaultTimer);
                    return;
                }
                log.debug('[' + self.myid + '] tracking ' + requestLen + ' tasks');
                self.collection.getSubmitted().then(function(runningTasks) {
                    self.getTrackedTasks().then(_.partial(self.processTasks, runningTasks.results), function(error) {
                        log.error('Unexpected DB error getting tracked task list ', error);
                    });
                }, function(error) {
                    log.error(error);
                    self.timeout = setTimeout(self.checkWorkToDo, self.defaultTimer);
                });
            }, function(error) {
                log.error('Error Counting Request DB ', error);
                self.timeout = setTimeout(self.checkWorkToDo, self.defaultTimer);
            });
        }
    });
});
