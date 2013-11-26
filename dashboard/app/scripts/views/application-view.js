/*global define */
'use strict';

define(['views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/osd-visualization', 'views/usage-view', 'views/gauges-layout', 'views/breadcrumb-view', 'views/alerts-view', 'views/osd-dash-view', 'views/mon-dash-view', 'views/pgmap-view', 'views/status-line-view', 'views/osd-hex-view', 'views/hosts-dash-view', 'views/pools-dash-view'], function(noticard, noticoll, notiitem, osddetail, osdviz, usage, gauges, breadcrumb, alerts, osd, mon, pg, statusLine, osdHex, hosts, pools) {
    return {
        NotificationCardView: noticard,
        NotificationCollectionView: noticoll,
        NotificationitemView: notiitem,
        OSDDetailView: osddetail,
        OSDVisualization: osdviz,
        UsageView: usage,
        GaugesLayout: gauges,
        BreadCrumbView: breadcrumb,
        AlertsView: alerts,
        OsdView: osd,
        MonView: mon,
        PgView: pg,
        StatusLine: statusLine,
        OsdHexView: osdHex,
        HostsView: hosts,
        PoolsView: pools
    };
});
