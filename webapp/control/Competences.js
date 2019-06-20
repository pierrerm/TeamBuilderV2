sap.ui.define([
	"sap/ui/core/XMLComposite"
], function(XMLComposite){
	"use strict";

	return XMLComposite.extend("team.builder.TeamBuilder.control.Competences", {
		metadata: {
			properties: {
				Skill1: { type:"boolean", defaultValue: false},
				Skill2: { type:"boolean",defaultValue: false},
				Skill3: { type:"boolean", defaultValue: false},
				Skill4: { type:"boolean", defaultValue: false}
			},
			events: {
				confirm: {}
			}
		},

		onConfirm: function() {
			this.fireEvent("confirm", {});
			this.byId("teamCompetences").setExpanded(false);
			this._resetSwitches();
		},

		reset: function() {
			this.byId("teamCompetences").setExpanded(true);
			this._resetSwitches();
		},

		_resetSwitches: function() {
			this.setSwitchStateSkill1(false);
			this.setSwitchStateSkill2(false);
			this.setSwitchStateSkill3(false);
			this.setSwitchStateSkill4(false);
		}

	});

});
