'use strict';

angular.module('manageApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'mgcrea.ngStrap',
  'ngAnimate'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/osd', {
        templateUrl: 'views/osd.html',
        controller: 'OSDCtrl'
      })
      .when('/pool', {
        templateUrl: 'views/pool.html',
        controller: 'PoolCtrl'
      })
      .when('/pool', {
        templateUrl: 'views/pool.html',
        controller: 'PoolCtrl'
      })
      .when('/pool/new', {
        templateUrl: 'views/pool-new.html',
        controller: 'PoolCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
