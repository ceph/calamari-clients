/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/application-model'], function(_, Backbone, models) {
    'use strict';

    var OSDCollection = Backbone.Collection.extend({
        cluster: 1,
        epoch: 1,
        cluster_update_time_unix: 0,
        url: function() {
            return '/api/v1/cluster/' + this.cluster + '/osd';
        },
        initialize: function(models, options) {
            if (options && options.cluster) {
                this.cluster = options.cluster;
            }
        },
        parse: function(response) {
            this.epoch = response.epoch;
            this.cluster_update_time_unix = response.cluster_update_time_unix;
            this.pg_state_counts = response.pg_state_counts;
            if (response.osds) {
                return response.osds;
            }
            var _new = response['new'];
            var changed = response.changed;
            var removed = response.removed;
            if (_new && _new.length > 0) {
                //console.log('adding ' + _new.length);
                this.add(_new);
            }
            if (changed && changed.length > 0) {
                //console.log('changing ' + _new.length);
                this.set(changed, {
                    merge: true,
                    remove: false,
                    add: false
                });
            }
            if (removed && removed.length > 0) {
                //console.log('removing ' + _new.length);
                var list = _.pluck(removed, 'osd');
                var self = this;
                this.each(function(m) {
                    if (_.contains(list, m.get('osd'))) {
                        self.remove(m);
                    }
                });
                this.remove(removed);
            }
            return {};
        },
        update: function(options) {
            options = options ? _.clone(options) : {};
            options.url = this.url() + '/epoch/' + (this.epoch + 1);
            // Disable normal fetch processing path
            options.add = false;
            options.remove = false;
            options.merge = false;
            return this.fetch(options);
        },
        model: models.OSDModel

    });

    return OSDCollection;
});
