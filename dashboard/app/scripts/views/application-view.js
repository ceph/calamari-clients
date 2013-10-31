/*global define */
'use strict';

define(['views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/osd-visualization', 'views/usage-view', 'views/gauges-layout', 'views/breadcrumb-view', 'views/alerts', 'views/osd-view'], function(noticard, noticoll, notiitem, osddetail, osdviz, usage, gauges, breadcrumb, alerts, osd) {
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
        OsdView: osd
    };
});
