sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/UIComponent",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, mobileLibrary,
	UIComponent, MessageToast) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("team.builder.TeamBuilder.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {

			//	var theView = sap.ui.xmlview("objectView", "Object");

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel,
				iOriginalBusyDelay,
				iOriginalBusyDelay2,
				oTable = this.byId("lineItemsList"),
				oTable2 = this.byId("AvailableItemsList");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			iOriginalBusyDelay2 = oTable2.getBusyIndicatorDelay();

			this._oDSC = this.byId("DynamicSideContent");
			this._showSideContentButton = this.byId("showSideContentButton");

			this._oTable = oTable;
			this._oTable2 = oTable2;
			this.currentTable = this._oTable;
			
			// this.aCompetenceNames = [];
			// this.aCompetenceValues = [];
			// this.aCompetenceMulti = [];

			// keeps the search state
			this._aTableSearchState = [];
			this._aTableSearchState2 = [];

			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			this._pID = parseInt(aParameters[1], 10);

			oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				busy2: false,
				delay2: 0,
				AvailableItemListTitle: this.getResourceBundle().getText("detailAvailableItemTableHeading"),
				pID: parseInt(aParameters[1], 10)
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "objectView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			oTable2.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay2", iOriginalBusyDelay2);
			});

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */

		_applySearchPID: function (aTableSearchState) {
			var oTable = this.byId("AvailableItemsList"),
				oViewModel = this.getModel("objectView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("detailNoDataWithSearchText"));
			}
		},

		onSendEmailPress: function () {
			var oViewModel = this.getModel("objectView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		
		onSendEmployeeEmail: function (oEvent) {
			var sEmail = oEvent.getSource().getText();
			var sName = this.getView().byId("firstName").getText();

			URLHelper.triggerEmail(
				sEmail,
				"<Please change according to use case before sending>",
				("Dear " + sName + ",")
			);
		},

		onNavBack: function () {
			UIComponent.getRouterFor(this).navTo("worklist");
		},

		onSearch: function (oEvent) {
			var aTableSearchState = [];
			var sQuery = oEvent.getParameter("value");
			if (sQuery && sQuery.length > 0) {
				this.byId("lineItemsList").showTableSuggestionValueHelp = true;
				aTableSearchState = new Filter({
					filters: [
						new Filter("ToEmployee/FirstName", FilterOperator.Contains, sQuery),
						new Filter("ToEmployee/LastName", FilterOperator.Contains, sQuery),
						new Filter("ToEmployee/Position", FilterOperator.Contains, sQuery),
						new Filter("ToEmployee/Language", FilterOperator.Contains, sQuery)
					],
					and: false
				});
			} else {
				this.byId("lineItemsList").showTableSuggestionValueHelp = false;
			}
			this._applySearch(aTableSearchState, 1);
		},

		onSearch2: function (oEvent) {
			this._aTableSearchState2 = [];
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var oHashChanger = new sap.ui.core.routing.HashChanger();
				var sHash = oHashChanger.getHash();
				var aParameters = sHash.split("/");
				var oEmployees = new JSONModel();

				var sQuery = oEvent.getParameter("value");

				this.getModel().read("/Project('" + aParameters[1] + "')/ToProjectAssignments?$format=json", {
					success: function (oData, oResponse) {
						oEmployees = oData;
						//MessageToast.show(oEmployees.getJSON());
						//oEmployees = oData;
						//MessageToast.show(oData.getJSON());
						var oFilterProperties = {
							filters: [],
							and: true
						};
						
						var i = 0;
						// var aEmployees = oEmployees.results;
						if (oEmployees.results[i]) {
							while (oEmployees.results[i] !== undefined) {
								oFilterProperties.filters.push(new Filter("EmployeeID", FilterOperator.NE, oEmployees.results[i].EmployeeID));
								i++;
							}
							this._aTableSearchState2 = [new Filter(oFilterProperties)];
						} else {
							this._aTableSearchState2 = [];
						}

						if (sQuery && sQuery.length > 0) {
							this._aTableSearchState2.push(new Filter([
								new Filter("FirstName", FilterOperator.Contains, sQuery),
								new Filter("LastName", FilterOperator.Contains, sQuery),
								new Filter("Position", FilterOperator.Contains, sQuery),
								new Filter("Language", FilterOperator.Contains, sQuery)
							], false));
						}
						this._applySearchPID(this._aTableSearchState2);
						//this._applySearchPID(new Filter(oFilterProperties));
					}.bind(this),
					error: function (oError) {
						MessageToast.show("fail");
					}
				});
			}
			this._getProjectCompetences();
		},

		_applySearch: function (aTableSearchState, tableNum) {
			var oTable, oViewModel = this.getModel("objectView");
			if (tableNum === 1) {
				oTable = this.byId("lineItemsList");
			} else {
				oTable = this.byId("AvailableItemsList");
			}
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("detailNoDataWithSearchText"));
			}
		},

		onViewEmployee: function (oEvent) {
			var sEmployeeID = oEvent.getParameter("listItem").getBindingContext().getProperty("EmployeeID");
			var oEmployee = new JSONModel();
			var oView = this.getView();
			this.getModel().read("/Employee('" + sEmployeeID + "')", {
				success: function (oData, oResponse) {
					oEmployee = oData;
					//MessageToast.show(oEmployee.EmployeeID);
					var oCompetence = new JSONModel();
					this.getModel().read("/Employee('" + sEmployeeID + "')/ToCompetences?$format=json", {
						success: function (oData2, oResponse2) {
							//var oModel = new JSONModel({"Competences":[]});
							oCompetence = oData2;
							// var obj = [];
							// var i = 0;
							// while (oCompetence.results[i] !== undefined) {
							// 	if (oCompetence.results[i].ProjectID === aParameters[1]) {
							// 		obj.push({"Competence": oCompetence.results[i].SkillName, "Value": parseFloat(oCompetence.results[i].Value, 10), "Employees": 0.0, "Multi": 0.0});
							// 	}
							// 	i++;
							// }
							// oModel.Competences = obj;
							// this.setModel(oModel, "competenceView");
							var oViewModel = new JSONModel({
								Headshot: oEmployee.Headshot,
								EmployeeID: oEmployee.EmployeeID,
								FirstName: oEmployee.FirstName,
								LastName: oEmployee.LastName,
								Position: oEmployee.Position,
								DateOfArrival: oEmployee.DateOfArrival,
								Address: oEmployee.Address,
								Sex: oEmployee.Sex,
								PhoneNumber: oEmployee.PhoneNumber,
								EmailAddress: oEmployee.EmailAddress,
								Language: oEmployee.Language,
								DateOfBirth: oEmployee.DateOfBirth,
								Competence1: oCompetence.results[0].SkillName,
								Competence1Value: parseInt(oCompetence.results[0].Value),
								Competence2: oCompetence.results[1].SkillName,
								Competence2Value: parseInt(oCompetence.results[1].Value)
							});
							this.setModel(oViewModel, "employeeView");
							if (!this._viewEmployee) {
								this._viewEmployee = Fragment.load({
									id: oView.getId(),
									name: "team.builder.TeamBuilder.view.ViewEmployee",
									controller: this
								}).then(function (oDialog) {
									// connect dialog to the root view of this component (models, lifecycle)
									oView.addDependent(oDialog);
									oDialog.open();
								});
							}
							var pi1 = parseInt(oCompetence.results[0].Value);
							var pi2 = parseInt(oCompetence.results[1].Value);
							this.getView().byId("epi1").setColorScheme(formatter.competenceColor2(pi1));
							this.getView().byId("epi2").setColorScheme(formatter.competenceColor2(pi2));
						}.bind(this),
						error: function (oError) {
							MessageToast.show("fail3");
						}
					});
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail");
				}
			});
			//Get Current Path
			// create menu only once
			//
		},
		
		onViewClient: function (oEvent) {
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var oClient = new JSONModel();
			var oView = this.getView();
			this.getModel().read("/Project('" + aParameters[1] + "')/ToClient", {
				success: function (oData, oResponse) {
					oClient = oData;
					var oViewModel = new JSONModel({
						Logo: oClient.Logo,
						CompanyName: oClient.CompanyName,
						Industry: oClient.Industry,
						Language: oClient.Language,
						WebAddress: oClient.WebAddress,
						Address: oClient.Address,
						PhoneNumber: oClient.PhoneNumber,
						EmailAddress: oClient.EmailAddress
					});
					this.setModel(oViewModel, "clientView");
					if (!this._viewClient) {
						this._viewClient = Fragment.load({
							id: oView.getId(),
							name: "team.builder.TeamBuilder.view.ViewClient",
							controller: this
						}).then(function (oDialog) {
							// connect dialog to the root view of this component (models, lifecycle)
							oView.addDependent(oDialog);
							oDialog.open();
						});
					}
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail");
				}
			});
		},
		
		onCloseViewEmployee: function(){
			if (this._viewEmployee) {
        		this.byId("viewEmployeeDialog").destroy();
        		this._viewEmployee = null;
    		}	
		},
		
		onCloseViewClient: function(){
			if (this._viewClient) {
        		this.byId("viewClientDialog").destroy();
        		this._viewClient = null;
    		}	
		},
		
		onCloseViewCompetences: function(){
			if (this._viewCompetence) {
        		this.byId("viewCompetencesDialog").destroy();
        		this._viewCompetence = null;
    		}	
		},

		onOpenViewObjectSettings: function (oEvent) {
			this.currentTable = this._oTable;
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewObjectSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "team.builder.TeamBuilder.view.ViewObjectSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewObjectSettingsDialog").open(sDialogTab);
			}
		},

		onOpenViewObjectSettings2: function (oEvent) {
			this.currentTable = this._oTable2;
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewObjectSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "team.builder.TeamBuilder.view.ViewObjectSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewObjectSettingsDialog").open(sDialogTab);
			}
		},

		onConfirmViewObjectSettingsDialog: function (oEvent) {
			this._applySortGroup(oEvent);
		},

		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();

			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this.currentTable.getBinding("items").sort(aSorters);
		},

		handleSideContentToggle: function (oEvent) {

			this._oDSC.setShowSideContent(!this._oDSC.isSideContentVisible());
			this.updateShowSideContentButtonVisibility(this._oDSC.getCurrentBreakpoint());

		},

		updateShowSideContentButtonVisibility: function (sCurrentBreakpoint) {
			var bShowButton = !(sCurrentBreakpoint === "S" || this._oDSC.isSideContentVisible());
			var sIcon = (bShowButton ? "sap-icon://close-command-field" : "sap-icon://open-command-field");
			this._showSideContentButton.setIcon(sIcon);
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("objectView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		onListUpdateFinished2: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("objectView");

			// only update the counter if the length is final
			if (this.byId("AvailableItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailAvailableItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailAvailableItemTableHeading");
				}
				oViewModel.setProperty("/AvailableItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			// this.getModel().read("/Project('" + sObjectId + "')/ToProjectAssignments?$format=json", {
			// 	success: function (oData, oResponse) {
			// 		var oProjects = new JSONModel(oData);
			// 		//MessageToast.show(oProjects.getJSON());
			// 		//MessageToast.show(oResourceBundle.getText("assignSuccessMessage", [sName, oProjects.Name]));
			// 	},
			// 	error: function (oError) {
			// 		MessageToast.show("fail");
			// 	}
			// });
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Project", {
					ProjectID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("objectView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			this._aTableSearchState2 = [];
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			this._applySearchPID(this._aTableSearchState2);
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var oEmployees = new JSONModel();
			//var aEmployeeIDs = [];
			
			this._getProjectCompetences.bind(this);

			this.getModel().read("/Project('" + aParameters[1] + "')/ToProjectAssignments?$format=json", {
				success: function (oData, oResponse) {
					oEmployees = oData;
					//MessageToast.show(oEmployees.getJSON());
					//oEmployees = oData;
					//MessageToast.show(oData.getJSON());
					var oFilterProperties = {
						filters: [],
						and: true
					};
					
					var i = 0;
					// var aEmployees = oEmployees.results;
					if (oEmployees.results[i]) {
						while (oEmployees.results[i] !== undefined) {
							oFilterProperties.filters.push(new Filter("EmployeeID", FilterOperator.NE, oEmployees.results[i].EmployeeID));
							i++;
						}
						this._aTableSearchState2 = [new Filter(oFilterProperties)];
					} else {
						this._aTableSearchState2 = [];
					}

					this._applySearch(this._aTableSearchState2, 2);
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail");
				}
			});
			// for (var i = 0; i < oEmployees.results.length; i++) {
			// 	MessageToast.show(oEmployees.results[i].EmployeeID);
			// }

			// this._aTableSearchState2 = [new Filter("ProjectID", sap.ui.model.FilterOperator.NE, this._pID)];

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.ProjectID,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("objectView");

			//this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
				
			//this._getProjectCompetences();
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("objectView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		_onMetadataLoaded2: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay2 = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("objectView"),
				oLineItemTable = this.byId("AvailableItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay2", 0);
			oViewModel.setProperty("/AvailableItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/AvailableItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy2", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay2", iOriginalViewBusyDelay2);
		},

		onDelete: function (oEvent) {
			// delete the dragged item
			var oItemToDelete = oEvent.getParameter("draggedControl");

			// delete the selected item from the list - if nothing selected, remove the first item
			if (!oItemToDelete) {
				var oList = this.byId("lineItemsList");
				oItemToDelete = oList.getSelectedItem() || oList.getItems()[0];
			}

			// delete the item after user confirmation
			var sProjectAssignmentID = oItemToDelete.getBindingContext().getProperty("ProjectAssignmentID"),
				sFirstName = oItemToDelete.getBindingContext().getProperty("ToEmployee/FirstName"),
				sLastName = oItemToDelete.getBindingContext().getProperty("ToEmployee/LastName"),
				sProjectName = oItemToDelete.getBindingContext().getProperty("ToProject/Name"),
				sClient = oItemToDelete.getBindingContext().getProperty("ToProject/ToClient/CompanyName"),
				sProjectID = oItemToDelete.getBindingContext().getProperty("ProjectID"),
				sName = sFirstName + " " + sLastName,
				sProject = sProjectName + " project for " + sClient;
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var pID = aParameters[1];

			if (pID === sProjectID) {
				this._confirmDelete(sProjectAssignmentID, sName, sProject);
			} else {
				var oResourceBundle = this.getResourceBundle();
				sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
					MessageBox.error(oResourceBundle.getText("deleteErrorMessage"));
				});
			}
		},

		_confirmDelete: function (sPath, sTitle, sTitle2) {
			var oResourceBundle = this.getResourceBundle();
			sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
				MessageBox.confirm(oResourceBundle.getText("deleteConfirmationMessage", [sTitle, sTitle2]), {
					title: "Confirm Deletion",
					onClose: function (sAction) {
						if (sAction === "OK") {
							this.getModel().remove("/ProjectAssignment('" + sPath + "')", {
								method: "DELETE",
								success: function () {
									MessageToast.show(oResourceBundle.getText("deleteSuccessMessage", [sTitle, sTitle2]));
								},
								error: function () {
									MessageBox.error(oResourceBundle.getText("deleteErrorMessage"));
								}
							});
						}
					}.bind(this)
				}).then(function () {
					this._oTable2.getModel().refresh(true);
					this.onSearch2(new sap.ui.base.Event("event", null, {
						value: this.getView().byId("searchInput2").getValue()
					}));
				});
			}.bind(this));
		},

		onReorderDrop: function (oEvent) {
			var oDraggedItem = oEvent.getParameter("draggedControl"),
				oDroppedItem = oEvent.getParameter("droppedControl"),
				sDropPosition = oEvent.getParameter("dropPosition"),
				oList = this.byId("lineItemsList"),
				// get the index of dragged item
				iDraggedIndex = oList.indexOfItem(oDraggedItem),
				// get the index of dropped item
				iDroppedIndex = oList.indexOfItem(oDroppedItem),
				// get the new dropped item index
				iNewDroppedIndex = iDroppedIndex + (sDropPosition === "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);

			// remove the dragged item
			oList.removeItem(oDraggedItem);
			// insert the dragged item on the new drop index
			oList.insertItem(oDraggedItem, iNewDroppedIndex);
		},

		onDropSelectedProductsTable: function (oEvent) {
			var oResourceBundle = this.getResourceBundle();
			var oDraggedItem = oEvent.getParameter("draggedControl");
			var oDraggedItemContext = oDraggedItem.getBindingContext();
			var EmployeeID = oDraggedItemContext.getProperty("EmployeeID"),
				sFirstName = oDraggedItemContext.getProperty("FirstName"),
				sLastName = oDraggedItemContext.getProperty("LastName"),
				sName = sFirstName + " " + sLastName;
			var newID = (3000000000 + parseInt(1000000000 * Math.random(), 10)).toString();
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var oModel = this.getModel();
			this.getModel().create("/ProjectAssignment", {
				ProjectAssignmentID: newID,
				EmployeeID: EmployeeID,
				ProjectID: aParameters[1],
				__metadata: {
					"uri": "ProjectAssignment(ProjectAssignmentID='" + newID + "')",
					"type": "talent.ProjectAssignment"
				},
				ToProject: {
					"__deferred": {
						"uri": "ProjectAssignment(ProjectAssignmentID='" + newID + "')/ToProject"
					}
				},
				ToEmployee: {
					"__deferred": {
						"uri": "ProjectAssignment(ProjectAssignmentID='" + newID + "')/ToEmployee"
					}
				}
			}, {
				method: "POST",
				success: function (data) {
					var oProjects = new JSONModel({});
					oModel.read("/Project('" + aParameters[1] + "')?$format=json", {
						success: function (oData, oResponse) {
							oProjects = oData;
							//MessageToast.show(oProjects.getJSON());
							MessageToast.show(oResourceBundle.getText("assignSuccessMessage", [sName, oProjects.Name]));
						},
						error: function (oError) {
							MessageToast.show("fail");
						}
					});
					//MessageToast.show(oResourceBundle.getText("assignSuccessMessage", [sName, aParameters[1]]));
				},
				error: function (response) {
					MessageToast.show(oResourceBundle.getText("assignErrorMessage", [sName, aParameters[1]]));
				}
			});

			this._oTable2.getModel().refresh(true);
			this.onSearch2(new sap.ui.base.Event("event", null, {
				value: this.getView().byId("searchInput2").getValue()
			}));
		},
		
		onViewCompetences: function () {
			var oView = this.getView();
			//this._getProjectCompetences();
			if (this.byId("viewCompetencesDialog") === undefined) {
				this._viewCompetence = Fragment.load({
					id: oView.getId(),
					name: "team.builder.TeamBuilder.view.ViewCompetences",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
					this._setUpChart();
				}.bind(this));
			} else {
				var oDialog = this.byId("viewCompetencesDialog");
				oView.addDependent(oDialog);
				oDialog.open();
				this._setUpChart();
			}
		},

		_getProjectCompetences: function () {
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var oCompetence = new JSONModel();
			
			this.getModel().read("/Competence?$format=json", {
				success: function (oData, oResponse) {
					var oModel = new JSONModel({"Competences":[]});
					oCompetence = oData;
					var obj = [];
					var i = 0;
					while (oCompetence.results[i] !== undefined) {
						if (oCompetence.results[i].ProjectID === aParameters[1]) {
							obj.push({"Competence": oCompetence.results[i].SkillName, "Value": parseFloat(oCompetence.results[i].Value, 10), "Employees": 0.0, "Multi": 0.0});
						}
						i++;
					}
					oModel.Competences = obj;
					this.setModel(oModel, "competenceView");
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail3");
				}
			});
			this._onRefreshCompetence();
			//this._getEmployees();
		},
					// if (this.byId("viewCompetencesDialog") === undefined) {
					// 	this._viewCompetence = Fragment.load({
					// 		id: oView.getId(),
					// 		name: "team.builder.TeamBuilder.view.ViewCompetences",
					// 		controller: this
					// 	}).then(function (oDialog) {
					// 		// connect dialog to the root view of this component (models, lifecycle)
					// 		oView.addDependent(oDialog);
					// 		oDialog.open();
					// 		this._setUpChart();
					// 	}.bind(this));
					// } else {
					// 	var oDialog = this.byId("viewCompetencesDialog");
					// 	oView.addDependent(oDialog);
					// 	oDialog.open();
					// 	this._setUpChart();
					// }
					
		_getEmployees: function () {
			var oHashChanger = new sap.ui.core.routing.HashChanger();
			var sHash = oHashChanger.getHash();
			var aParameters = sHash.split("/");
			var oProjectAssignments = new JSONModel();
			
			this.getModel().read("/Project('" + aParameters[1] + "')/ToProjectAssignments?$format=json", {
				success: function (oData, oResponse) {
					oProjectAssignments = oData;
					var j = 0;
					while (oProjectAssignments.results[j] !== undefined) {
						this._getEmployeeCompetences(oProjectAssignments.results[j].EmployeeID);
						j++;
					}
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail2");
				}
			});
		},
		
		_getEmployeeCompetences: function (sEmployeeID) {
			var oViewModel = this.getModel("competenceView");
			var oEmployeeCompetence = new JSONModel();
			
			this.getModel().read("/Employee('" + sEmployeeID + "')/ToCompetences?$format=json", {
				success: function (oData, oResponse) {
					oEmployeeCompetence = oData;
					var k = 0;
					while (oEmployeeCompetence.results[k] !== undefined) {
						for(var l = 0; oViewModel.Competences[l] !== undefined; l++){
							//MessageToast.show(oViewModel.Competences[l].Competence + " " + oEmployeeCompetence.results[k].SkillName);
							if (oViewModel.Competences[l].Competence === oEmployeeCompetence.results[k].SkillName) {
								oViewModel.Competences[l].Employees = oViewModel.Competences[l].Employees + parseFloat(oEmployeeCompetence.results[k].Value,10);
									//(parseFloat(oEmployeeCompetence.results[k].Value,10) + oViewModel.Competences[l].Employees * oViewModel.Competences[l].Multi)/(oViewModel.Competences[l].Multi + 1.0));
								oViewModel.Competences[l].Multi += 1.0;
								break;
							}
						}
						k++;
					}
					this.setModel(oViewModel, "competenceView");
				}.bind(this),
				error: function (oError) {
					MessageToast.show("fail1");
				}
			});
			this._onRefreshCompetence();
		},
		
		_onRefreshCompetence: function () {
			var oViewModel = this.getModel("competenceView");
			// this.getView().byId("pi1").setColorScheme({ parts: [parseInt(JSON.stringify(oViewModel.Competences[0].Value)), parseInt(JSON.stringify(oViewModel.Competences[0].Employees))], formatter: '.formatter.competenceColor' });
			// this.getView().byId("pi2").setColorScheme({ parts: [parseInt(JSON.stringify(oViewModel.Competences[1].Value)), parseInt(JSON.stringify(oViewModel.Competences[1].Employees))], formatter: '.formatter.competenceColor' });
			// this.getView().byId("pi3").setColorScheme({ parts: [parseInt(JSON.stringify(oViewModel.Competences[2].Value)), parseInt(JSON.stringify(oViewModel.Competences[2].Employees))], formatter: '.formatter.competenceColor' });
			// this.getView().byId("pi4").setColorScheme({ parts: [parseInt(JSON.stringify(oViewModel.Competences[3].Value)), parseInt(JSON.stringify(oViewModel.Competences[3].Employees))], formatter: '.formatter.competenceColor' });
			
			this.getView().byId("pi1").setText(oViewModel.Competences[0].Value + "/10");
			this.getView().byId("pi2").setText(oViewModel.Competences[1].Value + "/10");
			this.getView().byId("pi3").setText(oViewModel.Competences[2].Value + "/10");
			this.getView().byId("pi4").setText(oViewModel.Competences[3].Value + "/10");
			// this.getView().byId("pi2").setText({ parts: [oViewModel.Competences[1].Value, oViewModel.Competences[1].Employees], formatter: '.formatter.competencePercentage' });
			// this.getView().byId("pi3").setText({ parts: [oViewModel.Competences[2].Value, oViewModel.Competences[2].Employees], formatter: '.formatter.competencePercentage' });
			// this.getView().byId("pi4").setText({ parts: [oViewModel.Competences[3].Value, oViewModel.Competences[3].Employees], formatter: '.formatter.competencePercentage' });
			this.getView().byId("lpi1").setText(oViewModel.Competences[0].Competence + ":");
			this.getView().byId("lpi2").setText(oViewModel.Competences[1].Competence + ":");
			this.getView().byId("lpi3").setText(oViewModel.Competences[2].Competence + ":");
			this.getView().byId("lpi4").setText(oViewModel.Competences[3].Competence + ":");
			
			var pi1 = parseInt(oViewModel.Competences[0].Value);
			var pi2 = parseInt(oViewModel.Competences[1].Value);
			var pi3 = parseInt(oViewModel.Competences[2].Value);
			var pi4 = parseInt(oViewModel.Competences[3].Value);
			//MessageToast.show(pi1);
			
			this.getView().byId("pi1").setColorScheme(formatter.competenceColor2(pi1));
			this.getView().byId("pi2").setColorScheme(formatter.competenceColor2(pi2));
			this.getView().byId("pi3").setColorScheme(formatter.competenceColor2(pi3));
			this.getView().byId("pi4").setColorScheme(formatter.competenceColor2(pi4));
			// this.getView().byId("pi2").setColorScheme({ path: pi2, formatter: '.formatter.competenceColor2' });
			// this.getView().byId("pi3").setColorScheme({ path: pi3, formatter: '.formatter.competenceColor2' });
			// this.getView().byId("pi4").setColorScheme({ path: pi4, formatter: '.formatter.competenceColor2' });
			
			this.getView().byId("pi1").getModel().refresh(true);
			this.getView().byId("pi2").getModel().refresh(true);
			this.getView().byId("pi3").getModel().refresh(true);
			this.getView().byId("pi4").getModel().refresh(true);
		},
			// this.getModel().read("/Project('" + aParameters[1] + "')/ToProjectAssignments?$format=json", {
			// 	success: function (oData, oResponse) {
			// 		oEmployees = oData;
			// 		//MessageToast.show(oEmployees.getJSON());
			// 		var i = 0;
			// 		if (oEmployees !== undefined && oEmployees.results !== undefined) {
			// 			while (oEmployees.results[i] !== undefined) {
			// 				this.getModel().read("/Employee('" + oEmployees.results[i].EmployeeID + "')/ToCompetences?$format=json", {
			// 					success: function (oDataT, oResponseT) {
			// 						oCompetence = oDataT;
			// 						var k = 0;
			// 						if (oCompetence !== undefined && oCompetence.results !== undefined) {
			// 							while (oCompetence.results[k] !== undefined) {
			// 								//console.log(aCompetenceNames.results[k].SkillName);
			// 								var index = this.aCompetenceNames.indexOf(oCompetence.results[k].SkillName);
			// 								if (index === -1) {
			// 									this.aCompetenceValues[this.aCompetenceNames.length] = (this.aCompetenceValues[this.aCompetenceNames.length] * this.aCompetenceMulti[this.aCompetenceNames.length] + parseInt(oCompetence.results[k].Value,10)) / (this.aCompetenceMulti[this.aCompetenceNames.length] + 1) || parseInt(oCompetence.results[k].Value,10);
			// 									this.aCompetenceMulti[this.aCompetenceNames.length] = this.aCompetenceMulti[this.aCompetenceNames.length] + 1 || 1;
			// 									this.aCompetenceNames[this.aCompetenceNames.length] = oCompetence.results[k].SkillName;
			// 								} else {
			// 									this.aCompetenceValues[index] = (this.aCompetenceValues[index] * this.aCompetenceMulti[index] + oCompetence.results[k].Value) / (this.aCompetenceMulti[index] + 1);
			// 									this.aCompetenceMulti[index] = this.aCompetenceMulti[index] + 1;
			// 								}
			// 								k++;
			// 							}
			// 						}
			// 					}.bind(this),
			// 					error: function (oError) {
			// 						MessageToast.show("fail");
			// 					}
			// 				});
			// 				i++;
			// 			}
			// 			MessageToast.show(this.aCompetenceNames[0] + ":" + this.aCompetenceValues[0] + " " + this.aCompetenceNames[1] + ":" + this.aCompetenceValues[1] + " " + this.aCompetenceNames[2] + ":" + this.aCompetenceValues[2]);
			// 		}
			// 	}.bind(this),
			// 	error: function (oError) {
			// 		MessageToast.show("fail");
			// 	}
			// });
		
		_setUpChart: function() {
		var oViewModel = this.getModel("competenceView");
		
		var c1 = formatter.competenceColor2(oViewModel.Competences[0].Value);
		var c2 = formatter.competenceColor2(oViewModel.Competences[1].Value);
		var c3 = formatter.competenceColor2(oViewModel.Competences[2].Value);
		var c4 = formatter.competenceColor2(oViewModel.Competences[3].Value);
		
		var sampleDatajson = new JSONModel(oViewModel);
			var oVizFrame = this.getView().byId("competenceChart");
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: ["#0E6EB8","#FFD700","#FE9A76","#B03060"],
					dataLabel: {
						showTotal: true
					}
				},
				tooltip: {
					visible: true
				},
				title: {
					text: "Competence Chart"
				},
				legend : {
					visible: false
				}
			});
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: "Competence",
					value: "{Competence}"
				}],

				measures: [{
					name: "Value",
					value: "{Value}"
				}],

				data: {
					path: "/Competences"
				}
			});
			oVizFrame.setDataset(oDataset);

			oVizFrame.setModel(sampleDatajson);

			var oFeedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "valueAxis",
					"type": "Measure",
					"values": ["Value"]
				}),

				oFeedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					"uid": "categoryAxis",
					"type": "Dimension",
					"values": ["Competence"]
				});

			oVizFrame.addFeed(oFeedValueAxis);
			oVizFrame.addFeed(oFeedCategoryAxis);

		},

		onRefresh: function () {
			this._oTable2.getModel().refresh(true);
			this.onSearch2(new sap.ui.base.Event("event", null, {
				value: this.getView().byId("searchInput2").getValue()
			}));
		}
	});

});