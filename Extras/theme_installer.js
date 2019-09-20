function elementReady(selector) {
	return new Promise((resolve, reject) => {
		let el = document.querySelector(selector);
		if (el) {
			resolve(el);
		}
		new MutationObserver((mutationRecords, observer) => {
				// Query for elements matching the specified selector
				Array.from(document.querySelectorAll(selector)).forEach((element) => {
					resolve(element);
					// Once we have resolved we don't need the observer anymore.
					observer.disconnect();
				});
			})
			.observe(document.documentElement, {
				childList: true,
				subtree: true
			});
	});
}

var retries = 0; // A count of amount of times the script has checked if the tab is fully loaded
var retryTime = 1; // Time in MS for how often to check if the tab is loaded.
var retrySlowdown = 500; // When retrying after this many times, slow down how fast you will retry.
var retrySlowdownTime = 250; // Time in MS for how often to check if a tab is loaded when under a retrySlowdown state.
var maxRetries = 1500; // Amount of retry attempts allowed.

function themeInstaller(tabName, themeUrl) {
	var frameName = "#frame-" + tabName;

	// Wait for Organizr to create the iframe
	elementReady(frameName).then(
		(loadJS) => {

			// Ensure the page has finished it's first load before appending a theme.
			if ($(frameName).contents().find("head>title").length && $(frameName).contents().find("html>body").length) {
				// Make sure that the styling will apply through iframe reload
				$(frameName).on("load", function() {
					// Frame has been fully loaded and the theme can be applied
					console.log(frameName + " detected. Applying theme.");
					var stylesheet = document.createElement("link");
					stylesheet.rel = "stylesheet";
					stylesheet.href = themeUrl;
					$(frameName).contents().find("body").append(stylesheet);
				})
			}

			// If the tab isn't ready, wait for the tab to be loaded before attempting to apply the theme
			else if (retries < maxRetries) {
				setTimeout(function() {
					retries++;
					themeInstaller(tabName, themeUrl);
					// Slow down upon excessive retry attempts to avoid lagging the browser.
					if (retries == retrySlowdown) {
						retryTime = retrySlowdownTime;
					}
				}, retryTime);
			}

			// Tab has failed to load itself within a reasonable amount of time.
			else {
				console.log("Blackberry Theme Installer has reached the maximum amount of retries for " + tabName + ". Giving up.");
			}
		});
}