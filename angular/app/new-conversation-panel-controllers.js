/* global angular */
'use strict';

var controllers = angular.module('newConversationPanelControllers', []);

/**
 * The New Conversation Controller provides a UI for creating a new Conversation.
 * This consists of a place to edit a title bar, a list of users to select,
 * and a place to enter a first message.
 */
controllers.controller('newConversationCtrl', function($scope) {

  /**
   * Hacky DOMish way of getting the selected users
   * Angular developers should feel free to improve on this
   * and submit a PR :-)
   */
  function getSelectedUsers() {
    var result = Array.prototype.slice.call(document.querySelectorAll('.user-list :checked'))
      .map(function(node) {
        return node.value;
      });

    // Make sure that the user of this session is part of the list
    if (result.indexOf($scope.appCtrlState.client.userId) === -1) {
      result.push($scope.appCtrlState.client.userId);
    }
    return result;
  }

  /**
   * On typing a message and hitting ENTER, the send method is called.
   * $scope.chatCtrlState.currentConversation is a basic object; we use it to get the
   * Conversation instance and use the instance to interact with Layer Services
   * sending the Message.
   *
   * See: http://static.layer.com/sdk/docs/#!/api/layer.Conversation
   *
   * For this method, we simply do nothing if no participants;
   * ideally, some helpful error would be reported to the user...
   *
   * Once the Conversatino itself has been created, update the URL
   * to point to that Conversation.
   */
  $scope.send = function() {
    var participants = getSelectedUsers();
    if (participants.length) {

      var metadata = {};
      if ($scope.newTitle) metadata.title = $scope.newTitle;

      // Create the Conversation
      var conversationInstance = $scope.appCtrlState.client.createConversation({
        participants: participants,
        distinct: participants.length === 1,
        metadata: metadata
      });

      // Once its been sent, update our location and rerender.
      conversationInstance.once('conversations:sent', function() {
        // TODO: Angular Experts: Why does $location.hash(conversationInstance.id.substring(8)) fail?
        location.hash = '#' + conversationInstance.id.substring(8);
        $scope.$digest();
      });

      // Create and send the Message.  Note that sending the Message
      // will also insure that the Conversation gets created if needed.
      conversationInstance.createMessage($scope.sendText).send();

      // Reset state
      $scope.sendText = '';
      Array.prototype.slice.call(document.querySelectorAll('.user-list :checked')).forEach(function(input) {
        input.checked = false;
      });
    }
  };

  /**
   * Any time the checkbox list of users changes, udpate the
   * title to match.  Don't update the title if the user
   * has changed the title manually.
   */
  $scope.updateTitle = function() {
    if (!$scope.userChangedTitle) {
      $scope.newTitle = getSelectedUsers().join(', ').replace(/(.*),(.*?)/, '$1 and$2')
    }
  };
});

/**
 * The User List Controller manages a list of users with checkboxes next to them
 * for setting up participants for a new conversation.
 */
controllers.controller('userListCtrl', function($scope) {
  $scope.users = [];

  // Once the users list has been loaded, grab and store
  // this data to drive our user list.
  $scope.$watch('appCtrlState.isReady', function(newValue) {
    if (newValue) {
      $scope.users = window.layerSample.users;
    }
  });
});
