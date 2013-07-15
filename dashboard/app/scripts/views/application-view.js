/*global define */
'use strict';

define(['views/health-view', 'views/notification-card-view', 'views/notification-collection-view', 'views/notification-item-view', 'views/osd-detail-view', 'views/raphael_demo', 'views/usage-view'],
function(health, noticard, noticoll, notiitem, osddetail, osdviz, usage) {
    return {
        HealthView: health,
        NotificationCardView: noticard,
        NotificationCollectionView: noticoll,
        NotificationitemView: notiitem,
        OSDDetailView: osddetail,
        OSDVisualization: osdviz,
        UsageView: usage
    };
});
