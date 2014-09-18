/*global define*/

define(['underscore', 'models/graphite-model'], function(_, GraphiteModel) {
    'use strict';

    // Request the iostats for a given server fqdn.
    var GraphiteIoModel = GraphiteModel.extend({
        url: function() {
            return this.graphiteHost + '/metrics/find?query=servers.' + this.host + '.iostat.*';
        },
        DriveRegexp: new RegExp('[sv]d[a-z]$'),
        keys: function() {
            var re = this.DriveRegexp;
            return _.filter(_.map(this.attributes, function(v, k) {
                return k;
            }), function(v) {
                return re.test(v);
            });
        }
    });

    return GraphiteIoModel;
});
