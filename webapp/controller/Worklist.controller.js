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
	"sap/m/MessageToast"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, MessageToast) {
	"use strict";

	return BaseController.extend("team.builder.TeamBuilder.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

			this._oTable = oTable;

			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		onCancel: function (oEvent) {
			// delete the dragged item
			var oItemToCancel = oEvent.getParameter("draggedControl");

			// delete the selected item from the list - if nothing selected, remove the first item
			if (!oItemToCancel) {
				var oList = this.byId("lineItemsList");
				oItemToCancel = oList.getSelectedItem() || oList.getItems()[0];
			}

			// delete the item after user confirmation
			var sProjectID = oItemToCancel.getBindingContext().getProperty("ProjectID"),
				sProjectName = oItemToCancel.getBindingContext().getProperty("Name"),
				sClient = oItemToCancel.getBindingContext().getProperty("ToClient/CompanyName"),
				bCanceled = oItemToCancel.getBindingContext().getProperty("Canceled"),
				sProject = sProjectName + " project for " + sClient;

			this._confirmCancel(sProjectID, sProject, bCanceled);
		},

		_confirmCancel: function (sProjectID, sProject, bCanceled) {
			var oResourceBundle = this.getResourceBundle();
			var sMessage = "",
				sResponseMessage = "";
			sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
				if (bCanceled) {
					sMessage = "Reactivate";
					sResponseMessage = "reactivated";
				} else {
					sMessage = "Cancel";
					sResponseMessage = "canceled";
				}
				MessageBox.confirm(oResourceBundle.getText("cancelConfirmationMessage", [sMessage, sProject]), {
					title: "Confirm Cancelation",
					onClose: function (sAction) {
						if (sAction === "OK") {
							this.getModel().update("/Project(ProjectID='" + sProjectID + "')", {
								Canceled: !bCanceled
							}, {
								method: "PUT",
								success: function (data) {
									MessageToast.show(oResourceBundle.getText("cancelSuccessMessage", [sProject, sResponseMessage]));
								},
								error: function (response) {
									MessageToast.show(oResourceBundle.getText("cancelErrorMessage", [sProject, sResponseMessage]));
								}
							});
							this._oTable.getBinding("items").refresh();
						}
					}.bind(this)
				});
			}.bind(this));
		},

		onReorderDrop: function (oEvent) {
			var oDraggedItem = oEvent.getParameter("draggedControl"),
				oDroppedItem = oEvent.getParameter("droppedControl"),
				sDropPosition = oEvent.getParameter("dropPosition"),
				oList = this.byId("table"),
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

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		onSearch: function (oEvent) {
			var aTableSearchState = [];
			var sQuery = oEvent.getParameter("value");
			if (sQuery && sQuery.length > 0) {
				this.byId("table").showTableSuggestionValueHelp = true;
				aTableSearchState = new Filter([
					new Filter("Name", FilterOperator.Contains, sQuery),
					new Filter("ToClient/CompanyName", FilterOperator.Contains, sQuery),
					new Filter("ToClient/Language", FilterOperator.Contains, sQuery),
					new Filter("Category", FilterOperator.Contains, sQuery)
				], false);
			} else {
				this.byId("table").showTableSuggestionValueHelp = false;
			}
			this._applySearch(aTableSearchState, 1);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		onOpenViewSettings: function (oEvent) {
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
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "team.builder.TeamBuilder.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */

		action: function (oEvent) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				objectId: (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty('ProjectID')
			}, bReplace);
		},

		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ProjectID")
			});
		},

		onConfirmViewSettingsDialog: function (oEvent) {

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
			this._oTable.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		onAddProject: function (oEvent) {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("addProjectDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "team.builder.TeamBuilder.view.AddProject",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("addProjectDialog").open();
			}
		},

		closeDialog: function () {
			this.byId("addProjectDialog").close();
		},

		onSave: function () {
			var that = this;
			var oResourceBundle = that.getResourceBundle(),
				sProjectID = (2000000000 + parseInt(100000000 * Math.random())).toString(),
				sContractorID = that.getView().byId("Client").getSelectedKey(),
				sName = that.getView().byId("Name").getValue(),
				sDescription = that.getView().byId("Description").getValue(),
				sCategory = that.getView().byId("Category").getSelectedKey(),
				dStart = new Date(that.getView().byId("DateStarted").getValue()),
				dEnd = new Date(that.getView().byId("DateEnd").getValue()),
				dToday = new Date(),
				sProject = sName + " project for " + that.getModel().getProperty("/Client('" + sContractorID + "')/CompanyName");
			that.getModel().create("/Project(ProjectID='" + sProjectID + "')", {
				ProjectID: sProjectID,
				ContractorID: sContractorID,
				Category: sCategory,
				Name: sName,
				Description: sDescription,
				DateStarted: dStart,
				DateEnd: dEnd,
				CreatedAt: dToday,
				ChangedAt: dToday,
				__metadata: {
					"uri": "Project(ProjectID='" + sProjectID + "')",
					"type": "talent.Project"
				},
				ToProjectAssignments: {
					"__deferred": {
						"uri": "Project(ProjectID='" + sProjectID + "')/ToProjectAssignments"
					}
				},
				ToClient: {
					"__deferred": {
						"uri": "Project(ProjectID='" + sProjectID + "')/ToClient"
					}
				},
				ToCompetences: {
					"__deferred": {
						"uri": "Project(ProjectID='" + sProjectID + "')/ToCompetences"
					}
				}
			}, {
				method: "POST",
				success: function (data) {
					MessageToast.show(oResourceBundle.getText("createSuccessMessage", [sProject]));
				},
				error: function (response) {
					MessageToast.show(oResourceBundle.getText("createErrorMessage", [sProject]));
				}
			});
			that._oTable.getBinding("items").refresh();
			that.byId("addProjectDialog").close();
		}

	});
});