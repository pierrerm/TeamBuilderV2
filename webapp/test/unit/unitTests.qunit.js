/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"team/builder/TeamBuilder/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});