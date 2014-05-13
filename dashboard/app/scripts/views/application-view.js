/*global define */
'use strict';

// This is an aggregation object. It provides a convenient place to load all the views we want to export
// with a single handle.
//
// Typical usage:
//
// ```
// define(['application-view'], function(views) {
//  var iopsView = new views.IopsView({ app: app });
// });
// ```
//
define(['views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/osd-visualization', 'views/usage-view', 'views/gauges-layout', 'views/breadcrumb-view', 'views/alerts-view', 'views/osd-dash-view', 'views/mon-dash-view', 'views/pgmap-view', 'views/status-line-view', 'views/osd-hex-view', 'views/hosts-dash-view', 'views/pools-dash-view', 'views/iops-dash-view', 'views/health-view', 'views/type-one-view', 'views/dashboard-row', 'views/user-request-view', 'views/notification-bell-view'], function(noticard, noticoll, notiitem, osddetail, osdviz, usage, gauges, breadcrumb, alerts, osd, mon, pg, statusLine, osdHex, hosts, pools, iops, health, typeOne, dashboardRow, userRequestView, notificationBellView) {
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
        PoolsView: pools,
        IopsView: iops,
        HealthView: health,
        TypeOneView: typeOne,
        DashboardRow: dashboardRow,
        UserRequestView: userRequestView,
        NotificationBellView: notificationBellView
    };
});
