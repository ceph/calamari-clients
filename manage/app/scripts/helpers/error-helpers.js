/* global define */
(function() {
    'use strict';
    define([], function() {
        function makeFunctions($q, $log) {
            /*
             * Take a 304 Error to Calamari API and convert it back to a success response.
             * 304s can be indicative of a state change on the server that has already
             * been completed and can be ignored.
             */
            function intercept304Error(promise) {
                return promise.then(function(resp) {
                    // request succeeded, pass through
                    return resp;
                }, function(resp) {
                    var d = $q.defer();
                    if (resp.status === 304) {
                        // request failed check if it's a 304
                        $log.debug('intercepting 304 and ignoring');
                        /* jshint camelcase: false */
                        d.resolve({
                            status: 200,
                            data: {
                                request_id: null
                            }
                        });
                        // return a new promise, this command was
                        // a NOP
                        return d.promise;
                    }
                    // pass through error
                    d.reject(resp)
                    return d.promise;
                });
            }
            return {
                intercept304Error: intercept304Error
            };
        }
        return {
            makeFunctions: makeFunctions
        };
    });
})();
