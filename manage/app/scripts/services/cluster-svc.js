/*global define*/
define(['lodash'], function(_) {
    'use strict';

    // Cluster Service is a service which is injected into other services.
    // We do this so we have only one service tracking the active cluster
    // FSID, simplifying updates across the app.
    //
    // This service is slightly different because it has an initialize
    // method, which is a simple bootstrap that requests the current list
    // of Cluster FSIDs known about and picks the very first one returned.
    //
    // In the future this will have to be a guided, by either the User's
    // profile and/or saved defaults.
    //
    // ###A typical usage pattern
    // ```
    // ClusterService.getList().then(function(clusters) {
    //     ...do something with clusters result array...
    // });
    // ```
    //
    // All service methods should return $q style promises.
    // @see https://docs.angularjs.org/api/ng/service/$q
    //
    var ClusterService = function(Restangular, $location, ErrorService) {
        // This custom response extractor handles the paginated response
        // from our Calamari Django JSON API.
        var djangoPaginationResponseExtractor = function(response /*, operation, what, url */ ) {
            if (response.count !== undefined && response.results !== undefined) {
                var newResponse = response.results;
                // Add a new object **pagination** which contains the next, previous urls and count.
                // These are currently unused.
                newResponse.pagination = {
                    next: response.next,
                    previous: response.previous,
                    count: response.count
                };
                return newResponse;
            }
            return response;
        };

        // We use Restangular to wrap $http and give us a more natural interface
        // to the Calamari JSON API that returns $q promises.
        //
        // We instantiate 2 root restangular instances with different configurations.
        // The first one is for simple JSON API requests.
        var restangular = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setResponseExtractor(djangoPaginationResponseExtractor).setErrorInterceptor(ErrorService.errorInterceptor);
        });
        // The second gives us access to the raw response so we can look at the status code.
        // Useful for APIs that return 202 responses for asynchronous tasks.
        var restangularFull = Restangular.withConfig(function(RestangularConfigurer) {
            RestangularConfigurer.setBaseUrl('/api/v2').setFullResponse(true).setResponseExtractor(djangoPaginationResponseExtractor).setErrorInterceptor(ErrorService.errorInterceptor);
        });
        // **constructor**
        var Service = function() {
            this.restangular = restangular;
            this.restangularFull = restangularFull;
        };
        Service.prototype = _.extend(Service.prototype, {
            // **initialize**
            // This must be run before any other service to
            // initialize the cluster model and fsid values.
            // **@returns** a promise so you can wait for it to be complete.
            initialize: function() {
                var self = this;
                return this.getList().then(function(clusters) {
                    if (clusters.length) {
                        var cluster = _.first(clusters);
                        self.clusterId = cluster.id;
                        self.clusterModel = cluster;
                        return;
                    }
                    self.clusterId = null;
                    self.clusterModel = null;
                    $location.path('/first');
                });
            },
            // **getList**
            // **@returns** a promise with a list of all the clusters Calamari knows about.
            getList: function() {
                return this.restangular.all('cluster').getList().then(function(clusters) {
                    return clusters;
                });
            },
            // **get**
            // **@returns** a promise with the cluster metadata for the specific
            // cluster based on it's FSID.
            get: function(id) {
                return this.cluster(id).get().then(function(cluster) {
                    return cluster;
                });
            },
            // **cluster**
            // A base function that defines the root of all cluster specific
            // API requests.  It's designed to be called by other services.
            // ####e.g.
            // ```
            //     return restangular.cluster().all('servers');
            // ```
            //
            // This is how we can re-use this service without other
            // services having to be aware of the cluster FSID.
            //
            cluster: function(id) {
                if (id === undefined) {
                    id = this.clusterId;
                }
                return this.restangular.one('cluster', id);
            },
            // **clusterFull**
            // A base function that defines the root of all cluster
            // specific API request.
            // It's designed to be called by other methods.
            // Responses are raw and contain extra fields such as
            // status code.
            clusterFull: function(id) {
                if (id === undefined) {
                    id = this.clusterId;
                }
                return this.restangularFull.one('cluster', id);
            },
            // **switchCluster**
            // This will be invoked when the user switches the cluster
            // using the cluster dropdown in the top of the page
            switchCluster: function(cluster){
                this.clusterModel = cluster;
                this.clusterId = cluster.id;
            },
            // **base**
            // Return the raw restangular reference.
            base: function() {
                return this.restangular;
            }
        });
        var service = new Service();
        return service;
    };
    return ['Restangular', '$location', 'ErrorService', ClusterService];
});
