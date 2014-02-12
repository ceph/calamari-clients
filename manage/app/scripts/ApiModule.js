/* global define */
(function() {
    'use strict';
    define(['angular', 'services/cluster', 'services/pool', 'services/server', 'services/key', 'services/crush', 'services/tool', 'services/request'], function(angular, ClusterService, PoolService, ServerService, KeyService, CrushService, ToolService, RequestService) {
        var moduleName = 'myAPIModule';
        angular.module(moduleName, ['restangular'])
            .factory('ClusterService', ClusterService)
            .factory('PoolService', PoolService)
            .factory('ServerService', ServerService)
            .factory('KeyService', KeyService)
            .factory('CrushService', CrushService)
            .factory('ToolService', ToolService)
            .factory('RequestService', RequestService)
            .factory('ClusterResolver', ['ClusterService',
            function(service) {
                // Get the initial cluster list before showing views
                return service.initialize();
            }
        ]);
        return moduleName;
    });
})();
