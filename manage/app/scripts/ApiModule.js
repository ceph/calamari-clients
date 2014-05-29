/* global define */
(function() {
    'use strict';
    define(['angular', 'services/cluster-svc', 'services/pool-svc', 'services/server-svc', 'services/key-svc', 'services/crush-svc', 'services/tool-svc', 'services/request-svc', 'services/osd-svc', 'services/osd-config-svc', 'services/user-svc'], function(angular, ClusterService, PoolService, ServerService, KeyService, CrushService, ToolService, RequestService, OSDService, OSDConfigService, UserService) {
        var moduleName = 'myAPIModule';
        // This module loads all the Calamari network API services.
        // ClusterResolver bootstraps ClusterService by
        // running it's initialize which forces it to load
        // the Cluster FSID of the first cluster in the
        // list returned by Calamari.
        //
        // *In the future this will have to be the FSID most
        // strongly associated with this user credential or
        // last loaded by this user.*
        //
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
