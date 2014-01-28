'use strict';

angular.module('manageApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.modal = {
      'title': 'My Aside',
      'content': 'Hello Modal. Really I mean hello world!'
    };

  });
