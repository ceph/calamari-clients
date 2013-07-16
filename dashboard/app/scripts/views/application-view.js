/*global define */
'use strict';

define(['views/health-view', 'views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/raphael_demo', 'views/usage-view', 'views/gauges-layout', 'views/status-view'], function(health, noticard, noticoll, notiitem, osddetail, osdviz, usage, gauges, status) {
    return {
        HealthView: health,
        NotificationCardView: noticard,
        NotificationCollectionView: noticoll,
        NotificationitemView: notiitem,
        OSDDetailView: osddetail,
        OSDVisualization: osdviz,
        UsageView: usage,
        GaugesLayout: gauges,
        StatusView: status
    };
});
