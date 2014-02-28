/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var OSDModifyController = function($scope, ClusterService, OSDService, $location, $routeParams, $window, $modal) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            var makeOSDPatchFn = function(prefix, operation) {
                return function(id) {
                    var modal = $modal({
                        template: 'views/osd-cmd-modal.html',
                        title: 'Sending ' + prefix + ' Request to OSD ' + id,
                        html: true,
                        content: '<i class="fa fa-spinner fa-spin fa-lg"></i> Waiting...',
                        background: 'static'
                    });
                    modal.$scope.closeDisabled = true;
                    OSDService.patch(id, operation).then(function( /*resp*/ ) {
                        modal.$scope.title = prefix + ' Request Sent Successfully to OSD ' + id;
                        modal.$scope.content = 'Complete.';
                        modal.$scope.closeDisabled = false;
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                            $window.history.back();
                        };
                    }, function(resp) {
                        if (resp.status === 403) {
                            modal.$scope.title = '<i class="text-danger fa fa-exclamation-circle"></i> Unauthorized Access';
                            modal.$scope.content = 'Try logging out and back in again.';
                        } else {
                            modal.$scope.title = 'Unexpected Error ' + resp.status;
                            modal.$scope.content = '<pre>' + resp.data + '</pre>';
                        }
                        modal.$scope._hide = function() {
                            modal.$scope.$hide();
                        };
                        modal.$scope.closeDisabled = false;
                    });
                };
            };
            $scope.cancelFn = function() {
                $window.history.back();
            };
            $scope.down = makeOSDPatchFn('Down', {
                'up': false
            });
            $scope.out = makeOSDPatchFn('Out', {
                'in': false
            });
            $scope.in = makeOSDPatchFn('In', {
                'in': true
            });
            $scope.tooltip = {
                title: 'Use Advanced Operations to change this'
            };
            $scope.clusterName = ClusterService.clusterModel.name;
            $scope.gotoServer = function(fqdn) {
                $location.path('/osd/server/' + fqdn);
            };
            OSDService.get($routeParams.id).then(function(osd) {
                $scope.osd = osd;
                $scope.keys = ['uuid', 'up', 'in', 'reweight', 'server', 'pools'];
                $scope.up = true;
            });
        };
        return ['$scope', 'ClusterService', 'OSDService', '$location', '$routeParams', '$window', '$modal', OSDModifyController];
    });
})();
