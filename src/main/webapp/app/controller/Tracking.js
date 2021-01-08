/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2021 The ARSnova Team and Contributors
 *
 * ARSnova Mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Mobile is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Mobile.  If not, see <http://www.gnu.org/licenses/>.
 */
Ext.define("ARSnova.controller.Tracking", {
	extend: "Ext.app.Controller",

	launch: function () {
		ARSnova.app.configLoaded.then(function () {
			/* global _paq */
			/* jshint -W020 */
			var tracking = ARSnova.app.globalConfig.tracking;
			if (tracking && ["matomo", "piwik"].indexOf(tracking.provider) !== -1) {
				_paq = [
					["trackPageView"],
					["enableLinkTracking"],
					["setTrackerUrl", tracking.trackerUrl + "matomo.php"],
					["setSiteId", tracking.siteId]
				];
				var trackerScript = document.createElement("script");
				trackerScript.src = tracking.trackerUrl + "matomo.js";
				document.body.appendChild(trackerScript);
			}
		});
	}
});
