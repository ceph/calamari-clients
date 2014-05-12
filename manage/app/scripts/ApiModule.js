/* global define */
(function() {
    'use strict';
    define(['angular', 'services/cluster', 'services/pool', 'services/server', 'services/key', 'services/crush', 'services/tool', 'services/request', 'services/osd', 'services/osd-config', 'services/user'], function(angular, ClusterService, PoolService, ServerService, KeyService, CrushService, ToolService, RequestService, OSDService, OSDConfigService, UserService) {
        var moduleName = 'myAPIModule';
        angular.module(moduleName, ['restangular'])
            .factory('ClusterService', ClusterService)
            .factory('PoolService', PoolService)
            .factory('ServerService', ServerService)
            .factory('KeyService', KeyService)
            .factory('CrushService', CrushService)
            .factory('ToolService', ToolService)
            .factory('RequestService', RequestService)
            .factory('OSDService', OSDService)
            .factory('OSDConfigService', OSDConfigService)
            .factory('UserService', UserService)
            .factory('ClusterResolver', ['ClusterService',
            function(service) {
                // Get the initial cluster list before showing views
                return service.initialize();
            }
        ]);
        return moduleName;
    });
})();
