sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		statusColor: function (dStart, dEnd, bCanceled) {
			if (!bCanceled) {
				var dTodayDate = new Date();
				var dStartDate = new Date(dStart);
				var dEndDate = new Date(dEnd);
				if (dTodayDate < dStartDate) {
					return 5;
				} else if (dTodayDate < dEndDate) {
					return 1;
				} else {
					return 7;
				}
			} else {
				return 3;
			}
		},

		statusText: function (dStart, dEnd, bCanceled) {
			if (!bCanceled) {
				var dTodayDate = new Date();
				var dStartDate = new Date(dStart);
				var dEndDate = new Date(dEnd);
				if (dTodayDate < dStartDate) {
					return "new";
				} else if (dTodayDate < dEndDate) {
					return "ongoing";
				} else {
					return "finished";
				}
			} else {
				return "canceled";
			}
		},
		
		competencePercentage: function (iValue, iEmployees) {
			return parseInt(iValue).toString() + "%";
			//return (parseInt(((iEmployees/iValue) * 100), 10).toString() + "%");
		},
		
		competencePercentage2: function (iValue) {
			return parseInt(iValue).toString() + "%";
			//return (parseInt(((iEmployees/iValue) * 100), 10).toString() + "%");
		},
		
		competenceColor: function (iValue, iEmployees) {
			var percentage = ((iEmployees/iValue) * 100);
			if (percentage >= 100) {
				return 7;
			} else if (percentage >= 70) {
				return 4;
			} else if (percentage >= 30) {
				return 1;
			} else {
				return 3;
			}
		},
		
		competenceColor2: function (iValue) {
			if (iValue >= 7.5) {
				return 7;
			} else if (iValue >= 5) {
				return 8;
			} else if (iValue >= 2.5) {
				return 1;
			} else {
				return 3;
			}
		},
		
		competenceColor3: function (iValue) {
			if (iValue >= 9) {
				return "#016936";
			} else if (iValue >= 6) {
				return "#FFD700";
			} else if (iValue >= 3) {
				return "#FE9A76";
			} else {
				return "#B03060";
			}
		}
	};
});