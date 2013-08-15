/*global define */
'use strict';

define(['views/health-view', 'views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/osd-visualization', 'views/usage-view', 'views/gauges-layout', 'views/status-view', 'views/breadcrumb-view'], function(health, noticard, noticoll, notiitem, osddetail, osdviz, usage, gauges, status, breadcrumb) {
    return {
        HealthView: health,
        NotificationCardView: noticard,
        NotificationCollectionView: noticoll,
        NotificationitemView: notiitem,
        OSDDetailView: osddetail,
        OSDVisualization: osdviz,
        UsageView: usage,
        GaugesLayout: gauges,
        BreadCrumbView: breadcrumb,
        StatusView: status
    };
});
