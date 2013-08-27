/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/graph-utils', 'marionette'], function($, _, Backbone, JST, gutils) {
    'use strict';

    var GraphwallView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/graphwall-view.ejs'],
        className: 'graph-mode span12',
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.baseUrl = gutils.makeBaseUrl('mira022.front.sepia.ceph.com:8080');
            this.cpuTargets = gutils.makeTargets(gutils.makeCPUTargets(['system', 'user', 'idle']));
            this.heightWidth = gutils.makeHeightWidthParams(300, 200);
            this.makeCPUGraphUrl = gutils.makeGraphURL('svg', this.baseUrl, this.heightWidth, this.cpuTargets);
        },
        makeHostUrls: function() {
            var hosts = this.App.ReqRes.request('get:hosts');
            var fn = this.makeCPUGraphUrl;
            return _.map(hosts, function(host) {
                return fn(host);
            });
        }
    });

    return GraphwallView;
});
