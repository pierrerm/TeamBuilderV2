sap.ui.define([
	"sap/m/Input"
], function (Input) {
	"use strict";

	return Input.extend("team.builder.TeamBuilder.control.SearchInput", {

		init: function () {
			this.setShowValueHelp(true);
		},

		renderer: {},

		onAfterRendering: function () {
			if (sap.m.Input.prototype.onAfterRendering) {
				sap.m.Input.prototype.onAfterRendering.apply(this, arguments);
			}

			var icon = this._getValueHelpIcon();
			icon.setSrc("sap-icon://decline");
			icon.setSize('1rem');
		},

		fireValueHelpRequest: function () {
			this.setValue("");
			this.fireSubmit();
		}
	});
});