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
Ext.define('ARSnova.view.QuestionStatusButton', {
	extend: 'Ext.Panel',

	config: {
		wording: {
			release: Messages.RELEASE_QUESTION,
			confirm: Messages.CONFIRM_CLOSE_QUESTION,
			confirmMessage: Messages.CONFIRM_CLOSE_QUESTION_MESSAGE
		},
		slideWording: {
			release: Messages.RELEASE_SLIDE
		},
		flashcardWording: {
			release: Messages.RELEASE_FLASHCARD,
			confirm: Messages.CONFIRM_CLOSE_FLASHCARD,
			confirmMessage: Messages.CONFIRM_CLOSE_FLASHCARD_MESSAGE
		}
	},

	handler: null,
	isOpen: false,

	questionObj: null,
	parentPanel: null,

	constructor: function (args) {
		this.callParent(arguments);

		this.questionObj = args.questionObj;
		this.parentPanel = args.parentPanel;

		this.isOpen = this.questionObj && this.questionObj.active;
		var label = this.getWording().release;

		if (this.questionObj) {
			if (this.questionObj.questionType === 'slide') {
				label = this.getSlideWording().release;
			} else if (this.questionObj.questionType === 'flashcard') {
				label = this.getFlashcardWording().release;
				this.setWording(this.getFlashcardWording());
			}
		}

		this.button = Ext.create('ARSnova.view.MatrixButton', {
			buttonConfig: 'togglefield',
			text: label,
			scope: this,
			cls: this.getCls(),
			toggleConfig: {
				scope: this,
				label: false,
				value: this.isOpen ? 1 : 0,
				listeners: {
					scope: this,
					change: function (toggle, newValue, oldValue, eOpts) {
						this.changeStatus();
					}
				}
			}
		});

		this.add([this.button]);
	},

	changeStatus: function () {
		var me = this;
		var question = this.questionObj;

		if (this.isOpen) {
			Ext.Msg.confirm(this.getWording().confirm, this.getWording().confirmMessage, function (buttonId) {
				if (buttonId !== "no") {
					/* close this question */
					ARSnova.app.getController('Questions').setActive({
						questionId: question._id,
						active: 0,
						statusButton: me
					});
					question.active = false;
				} else {
					me.button.setToggleFieldValue(true);
				}
			}, this);
		} else {
			/* open this question */
			ARSnova.app.getController('Questions').setActive({
				questionId: question._id,
				active: 1,
				statusButton: me
			});
			question.active = true;
		}
	},

	checkInitialStatus: function () {
		if (this.isRendered) {
			return;
		}

		var active = localStorage.getItem('active') === "1";
		this.isOpen = active;
		this.button.setToggleFieldValue(active);
		this.isRendered = true;
	},

	toggleStatusButton: function (active) {
		this.button.setToggleFieldValue(active);
		this.isOpen = active;
	},

	questionClosedSuccessfully: function () {
		this.isOpen = false;

		if (this.parentPanel) {
			this.parentPanel.questionObj.active = this.isOpen;
		}
	},

	questionOpenedSuccessfully: function () {
		this.isOpen = true;

		if (this.parentPanel) {
			this.parentPanel.questionObj.active = this.isOpen;
		}
	}
});
