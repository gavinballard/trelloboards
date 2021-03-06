var TB_APP_KEY = 'd8c65fac278e6cfc05f5ef3a88aea5c3';

/**
 * Load all the board into an array grouped by their organisation
 *
 * @param boards
 * @param orgs
 * @return {Array}
 */
function loadBoards(boards, orgs) {
	var
		// Hash of orgs, "indexed" by id so boards can be easily sorted
		orgs_indexed = {'me': {
			'id': 'me',
			'name': 'me',
			'logo': 'me',
			'url': 'https://trello.com/',
			'displayName': 'My Boards',
			'sortName': 'aaa',
			'boards': []
		}},
		// Array of orgs and their boards, to be filtered ready for display
		org_boards = [];

	// Load orgs into list
	$.each(orgs, function(i, org) {
		org.logo = org.logoHash ? 'pic' : 'org';
		orgs_indexed[org.id] = $.extend(org, {boards: []});
	});

	// Group the boards into their organisation
	$.each(boards, function(i, board) {
		// Don't include closed boards
		if(board.closed) return;
		// Set the sort name of the board allowing case-insensitive sorting
		board.sortName = board.name.toLowerCase();
		// Push the board onto the list under its parent organisation
		orgs_indexed[board.idOrganization || 'me'].boards.push(board);
	});

	// Filter out orgs that have no boards, and add to the orgs list.
	$.each(orgs, function(i, org) {
		org.sortName = org.displayName.toLowerCase();
		org_boards.push(org);
	});

	// Add "my boards"
	org_boards.push(orgs_indexed['me']);

	return org_boards;
}

/**
 * Boards List Angular JS controller
 *
 * @param $scope
 * @param $http
 * @constructor
 */
function BoardsCtl($scope, $http) {
	// Initialise boards list to local boards list
	$scope.orgs = JSON.parse(localStorage.trello_orgs || "[]");

	// Send off HTTP reqest to get organisations for user
	$http
		.get('https://api.trello.com/1/members/me/organizations/?key=' + TB_APP_KEY + '&token=' + localStorage.trello_token)
		.success(function(response_orgs) {
			// Send off HTTP request to refresh boards list
			$http
				.get('https://api.trello.com/1/members/me/boards/?key=' + TB_APP_KEY + '&token=' + localStorage.trello_token)
				.success(function(response_boards) {
					var orgs = loadBoards(response_boards,response_orgs)
					localStorage.trello_orgs = JSON.stringify(orgs);
					$scope.orgs = orgs;
				});
		});
}

/**
 * Apply i18n to any elements in $scope with a data-message attribute.
 *
 * @param $scope
 */
function translate($scope) {
  var elements = $scope.querySelectorAll('[data-message]');
  for (var i = 0; i < elements.length; ++i) {
    var element = elements[i];
    if(element.dataset && element.dataset.message) {
    	console.log(element, element.dataset.message, chrome.i18n.getMessage(element.dataset.message));
    	element.innerHTML = chrome.i18n.getMessage(element.dataset.message);
    }
	}
}

// Setup form elements
$('#close').click(function(ev) {
	ev.stopPropagation();
	window.close();
});

// Initialise the extension!
$(function() {
	if(!localStorage.trello_token) {
		// Close popup and open auth tab
		setTimeout(function() {
			window.close();
			chrome.tabs.create({url: chrome.extension.getURL('authorise.html')});
		}, 100);
		return;
	}

	// show the boards list.
	$('#loading_wrapper').show();

	// translate the extension.
	translate(document);
});
