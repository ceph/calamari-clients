/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var FirstTimeController = function($q, $log, $timeout, $location, $scope, KeyService, ClusterService) {
            var promises = [KeyService.getList()];
            $q.all(promises).then(function(results) {

                $scope.up = true;
                if (ClusterService.clusterId !== null) {
                    $location.path('/');
                    return;
                }

                (function(keys) {
                    $scope.keys = keys;
                })(results[0]);

            });
        };
        return ['$q', '$log', '$timeout', '$location', '$scope', 'KeyService', 'ClusterService', FirstTimeController];
    });
})();
