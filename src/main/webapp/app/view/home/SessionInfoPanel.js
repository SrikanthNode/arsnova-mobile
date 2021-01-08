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
Ext.define('ARSnova.view.home.SessionInfoPanel', {
	extend: 'Ext.Panel',
	alias: 'widget.SessionInfoPanel',

	config: {
		title: Messages.SESSION_INFO_TITLE,
		sessionInfo: null,
		backReference: null,
		referencePanel: null,
		fullscreen: true,
		sessionCreationMode: false,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		},
		layout: {
			type: 'vbox',
			pack: 'center'
		}
	},

	requires: ['Ext.ux.Fileup'],

	initialize: function () {
		this.callParent(arguments);
		var me = this;
		var config = ARSnova.app.globalConfig;

		var subjectOptionsPP = [];	// save loaded subjects
		var licenceOptionsPP = [];  // save loaded lincences
		var levelsPP = [];  // save loaded levels

		// Check if this feauture is enabled - if not do not use these fields
		if (config.features.publicPool) {
			var subjects = config.publicPool.subjects.split(',');

			subjects.forEach(function (entry) {
				subjectOptionsPP.push({text: entry, value: entry});
			});

			var licenses = config.publicPool.licenses.split(',');

			licenses.forEach(function (entry) {
				licenceOptionsPP.push({text: entry, value: entry});
			});

			var levels;
			if (moment.locale() === "en") {
				levels = config.publicPool.levelsEn.split(',');
			} else {
				levels = config.publicPool.levelsDe.split(',');
			}

			levels.forEach(function (entry) {
				levelsPP.push({text: entry, value: entry});
			});
		}

		var screenWidth = (window.innerWidth > 0) ?
				window.innerWidth :	screen.width;
		var showShortLabels = screenWidth < 480;

		this.matrixButtonPanel = Ext.create('Ext.Panel', {
			layout: {
				type: 'hbox',
				pack: 'center'
			}
		});

		this.backButton = Ext.create('Ext.Button', {
			text: Messages.BACK,
			ui: 'back',
			align: 'left',
			handler: function () {
				var xTP = me.getReferencePanel();
				xTP.animateActiveItem(me.getBackReference(), {
					type: 'slide',
					direction: 'right'
				});
			}
		});

		this.saveButton = Ext.create('Ext.Button', {
			text: Messages.SAVE,
			ui: 'confirm',
			hidden: true,
			align: 'right',
			cls: 'saveQuestionButton',
			style: 'width: 89px',
			handler: function () {
				var panel = ARSnova.app.mainTabPanel.tabPanel.homeTabPanel.newSessionPanel;
				if (me.validate()) {
					if (me.getSessionInfo().keyword) {
						var sessionInfo = me.getSessionInfo();
						sessionInfo.name = me.sessionName.getValue();
						sessionInfo.shortName = me.sessionShortName.getValue();
						sessionInfo.ppAuthorName = me.authorName.getValue();
						sessionInfo.ppAuthorMail = me.email.getValue();
						sessionInfo.ppUniversity = me.university.getValue();
						sessionInfo.ppFaculty = me.faculty.getValue();
						sessionInfo.ppDescription = me.description.getValue();
						if (config.features.publicPool) {
							sessionInfo.ppLevel = me.level.getValue();
							sessionInfo.ppSubject = me.subject.getValue();
							sessionInfo.ppLicense = me.licence.getValue();
						}
						ARSnova.app.getController('Sessions').update(sessionInfo);
					} else {
						if (config.features.publicPool) {
							ARSnova.app.getController('Sessions').loadFeatureOptions({
								name: me.sessionName.getValue(),
								shortName: me.sessionShortName.getValue(),
								ppAuthorName: me.authorName.getValue(),
								ppAuthorMail: me.email.getValue(),
								ppUniversity: me.university.getValue(),
								ppFaculty: me.faculty.getValue(),
								ppLevel: me.level.getValue(),
								ppSubject: me.subject.getValue(),
								ppLicense: me.licence.getValue(),
								ppDescription: me.description.getValue(),
								lastPanel: panel,
								creationTime: Date.now()
							}, true);
						} else {
							ARSnova.app.getController('Sessions').loadFeatureOptions({
								name: me.sessionName.getValue(),
								shortName: me.sessionShortName.getValue(),
								ppAuthorName: me.authorName.getValue(),
								ppAuthorMail: me.email.getValue(),
								ppUniversity: me.university.getValue(),
								ppFaculty: me.faculty.getValue(),
								ppDescription: me.description.getValue(),
								lastPanel: panel,
								creationTime: Date.now()
							}, true);
						}
					}
					me.disableInput();
				}
			},
			scope: this
		});

		this.editButton = Ext.create('Ext.Button', {
			text: Messages.EDIT,
			ui: 'normal',
			hidden: true,
			align: 'right',
			cls: 'saveQuestionButton',
			style: 'width: 89px',
			handler: function () {
				me.enableInput();
			}
		});

		this.toolbar = Ext.create('Ext.TitleBar', {
			title: Ext.os.is.Desktop ?
				Messages.SESSION_INFO_TITLE :
				Messages.SESSION_INFO_TITLE_SHORT,
			docked: 'top',
			ui: 'light',
			items: [
				this.backButton,
				this.saveButton,
				this.editButton
			]
		});

		this.authorName = Ext.create('Ext.field.Text', {
			name: 'name',
			label: Messages.EXPORT_FIELD_NAME,
			maxLength: 50,
			placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: me.getSessionInfo().ppAuthorName,
			clearIcon: true
		});

		this.email = Ext.create('Ext.field.Text', {
			name: 'email',
			label: Messages.EXPORT_FIELD_EMAIL,
			vtype: 'email',
			maxLength: 50,
			placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: me.getSessionInfo().ppAuthorMail,
			clearIcon: true
		});

		this.university = Ext.create('Ext.field.Text', {
			name: 'hs',
			label: Messages.EXPORT_FIELD_UNI,
			maxLength: 50,
			placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: me.getSessionInfo().ppUniversity,
			clearIcon: true
		});

		this.faculty = Ext.create('Ext.field.Text', {
			name: 'faculty',
			label: Messages.EXPORT_FIELD_SPECIAL_FIELD,
			placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: me.getSessionInfo().ppFaculty,
			maxLength: 50,
			clearIcon: true
		});

		this.creatorFieldSet = Ext.create('Ext.form.FieldSet', {
			title: Messages.SESSIONPOOL_AUTHORINFO,
			cls: 'standardFieldset',
			itemId: 'contentFieldset',
			items: [this.authorName, this.email, this.university, this.faculty]
		});

		this.sessionName = Ext.create('Ext.field.Text', {
			name: 'sessionName',
			label: Messages.SESSION_NAME,
			maxLength: 50,
			placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: localStorage.getItem('name'), //me.getSessionInfo().name,
			clearIcon: true
		});

		this.sessionShortName = Ext.create('Ext.field.Text', {
			name: 'sessionShortName',
			label: Messages.SESSION_SHORT_NAME,
			maxLength: 8,
			placeHolder: 'max. 8 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: localStorage.getItem('shortName'), //me.getSessionInfo().shortName,
			clearIcon: true
		});

		this.description = Ext.create('Ext.plugins.ResizableTextArea', {
			name: 'description',
			label: Messages.SESSIONPOOL_INFO,
			maxLength: 5000,
			placeHolder: 'max. 5000 ' + Messages.SESSIONPOOL_CHARACTERS,
			value: me.getSessionInfo().ppDescription,
			disabled: false
		});

		this.markdownEditPanel = Ext.create('ARSnova.view.MarkDownEditorPanel', {
			processElement: this.description
		});

		this.descriptionText = Ext.create('ARSnova.view.MathJaxMarkDownPanel', {
			label: Messages.SESSIONPOOL_INFO
		});
		this.descriptionText.setContent(me.description.getValue(), true, true);

		this.descriptionFieldSet = Ext.create('Ext.form.FieldSet', {
			hidden: true,
			cls: 'standardFieldset',
			items: [
				this.descriptionText
			]
		});

		this.previewButton = Ext.create('Ext.Button', {
			text: Ext.os.is.Desktop ?
				Messages.SESSION_PREVIEW_BUTTON_TITLE_DESKTOP :
				Messages.QUESTION_PREVIEW_BUTTON_TITLE,
			ui: 'action',
			cls: 'centerButton previewButton',
			scope: this,
			handler: function () {
				this.previewHandler();
			}
		});

		if (config.features.publicPool) {
			this.subject = Ext.create('Ext.field.Select', {
				name: 'subject',
				label: Messages.EXPORT_FIELD_SUBJECT,
				maxLength: 50,
				value: me.getSessionInfo().ppSubject,
				placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS
			});
			this.subject.updateOptions(subjectOptionsPP);

			this.licence = Ext.create('Ext.field.Select', {
				name: 'licence',
				label: Messages.EXPORT_FIELD_LICENCE,
				maxLength: 50,
				value: me.getSessionInfo().ppLicense,
				placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS
			});
			this.licence.updateOptions(licenceOptionsPP);

			this.level = Ext.create('Ext.field.Select', {
				name: 'level',
				label: Messages.EXPORT_FIELD_LEVEL,
				maxLength: 50,
				value: me.getSessionInfo().ppLevel,
				placeHolder: 'max. 50 ' + Messages.SESSIONPOOL_CHARACTERS
			});
			this.level.updateOptions(levelsPP);

			this.sessionFieldSet = Ext.create('Ext.form.FieldSet', {
				title: Messages.SESSIONPOOL_SESSIONINFO,
				cls: 'standardFieldset',
				itemId: 'contentFieldset',
				items: [this.sessionName, this.sessionShortName, this.markdownEditPanel, this.description, this.subject, this.licence, this.level]
			});
		} else {
			this.sessionFieldSet = Ext.create('Ext.form.FieldSet', {
				title: Messages.SESSIONPOOL_SESSIONINFO,
				cls: 'standardFieldset',
				itemId: 'contentFieldset',
				items: [this.sessionName, this.sessionShortName, this.markdownEditPanel, this.description]
			});
		}

		this.sendButton = Ext.create('Ext.Button', {
			ui: 'action',
			hidden: true,
			text: Messages.SEND,
			style: {
				'height': '1em',
				'margin-top': '7.5px',
				'margin-left': '10px'
			}
		});

		var sessionLinkLabel = {};
		var keyword = sessionStorage.getItem('keyword');

		if (keyword) {
			sessionLinkLabel = {
				cls: 'gravure selectable',
				html: showShortLabels ? Messages.SESSION_ID + ": " +
					ARSnova.app.formatSessionID(keyword) :
					window.location + 'id/' + keyword
			};
		}

		this.mainPart = Ext.create('Ext.form.FormPanel', {
			cls: 'newQuestion',
			scrollable: null,
			style: 'margin-bottom: 15px 0 0 15px',
			items: [sessionLinkLabel,
				this.descriptionFieldSet,
				this.creatorFieldSet,
				this.sessionFieldSet,
				this.previewButton,
				{
					xtype: 'fieldset',
					layout: 'vbox',
					items: [this.matrixButtonPanel]
				}
			]
		});

		this.add([this.toolbar, this.mainPart]);
		this.on('painted', this.onPainted);
	},

	previewHandler: function () {
		var descriptionPreview = Ext.create('ARSnova.view.PreviewBox', {});
		descriptionPreview.showPreview(this.description.getValue());
	},

	onPainted: function () {
		if (this.config.sessionCreationMode) {
			this.enableInput();
		} else {
			this.disableInput();
			var sessionLink = this.mainPart.element.down('.selectable');
			var range = {};

			if (sessionLink) {
				/** selectable event listener **/
				sessionLink.addListener('tap', function () {
					if (document.selection) {
						range = document.body.createTextRange();
						range.moveToElementText(this.dom);
						range.select();
					} else if (window.getSelection) {
						range = document.createRange();
						range.selectNode(this.dom);
						window.getSelection().addRange(range);
					}
				});
			}
		}
	},

	validate: function () {
		var isValid = true;
		var me = this ;
		var config = ARSnova.app.globalConfig;
		var validation;
		if (config.features.publicPool) {
			validation = Ext.create('ARSnova.model.PublicPool', {
				name: me.authorName.getValue(),
				hs: me.university.getValue(),
				subject: me.subject.getValue(),
				licence: me.licence.getValue(),
				level: me.level.getValue(),
				email: me.email.getValue(),
				sessionName: me.sessionName.getValue(),
				sessionShortName: me.sessionShortName.getValue(),
				description: me.description.getValue(),
				faculty: me.faculty.getValue()
			});
		} else {
			validation = Ext.create('ARSnova.model.Session', {
				type: 'session',
				name: me.sessionName.getValue(),
				shortName: me.sessionShortName.getValue(),
				ppUniversity: me.university.getValue(),
				creator: localStorage.getItem('login'),
				ppAuthorName: me.authorName.getValue(),
				ppAuthorMail: me.email.getValue(),
				ppDescription: me.description.getValue(),
				ppFaculty: me.faculty.getValue()
			});
		}

		var errs = validation.validate();
		var msg = '';

		if (!errs.isValid()) {
			errs.each(function (err) {
				msg += err.getMessage();
				msg += '<br/>';
			});
			isValid = false;
			Ext.Msg.alert(Messages.SESSIONPOOL_NOTIFICATION, msg);
		}
		return isValid;
	},

	disableInput: function () {
		this.description.hide();
		this.previewButton.hide();
		this.markdownEditPanel.hide();

		this.faculty.disable();
		this.university.disable();
		this.authorName.disable();
		this.sessionName.disable();
		this.description.disable();
		this.creatorFieldSet.disable();
		this.sessionShortName.disable();

		this.email.setPlaceHolder('');
		this.faculty.setPlaceHolder('');
		this.authorName.setPlaceHolder('');
		this.university.setPlaceHolder('');
		this.sessionName.setPlaceHolder('');
		this.sessionShortName.setPlaceHolder('');

		if (ARSnova.app.globalConfig.features.publicPool) {
			this.subject.disable();
			this.licence.disable();
			this.level.disable();
		}

		if (this.getSessionInfo().ppDescription) {
			this.descriptionText.setContent(this.getSessionInfo().ppDescription, true, true);
			this.descriptionFieldSet.show();
		}

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			this.saveButton.hide();
			this.editButton.show();
		}
	},

	enableInput: function () {
		this.description.show();
		this.previewButton.show();
		this.markdownEditPanel.show();

		this.faculty.enable();
		this.university.enable();
		this.authorName.enable();
		this.sessionName.enable();
		this.description.enable();
		this.creatorFieldSet.enable();
		this.sessionShortName.enable();

		this.email.setPlaceHolder(this.email.initialConfig.placeHolder);
		this.faculty.setPlaceHolder(this.faculty.initialConfig.placeHolder);
		this.authorName.setPlaceHolder(this.authorName.initialConfig.placeHolder);
		this.university.setPlaceHolder(this.university.initialConfig.placeHolder);
		this.sessionName.setPlaceHolder(this.sessionName.initialConfig.placeHolder);
		this.sessionShortName.setPlaceHolder(this.sessionShortName.initialConfig.placeHolder);

		if (ARSnova.app.globalConfig.features.publicPool) {
			this.subject.enable();
			this.licence.enable();
			this.level.enable();
		}

		if (this.getSessionInfo().ppDescription) {
			this.descriptionFieldSet.hide();
		}

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			this.saveButton.show();
			this.editButton.hide();
		}
	}
});
