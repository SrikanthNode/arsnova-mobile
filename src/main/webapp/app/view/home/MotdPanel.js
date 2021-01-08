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
Ext.define('ARSnova.view.home.MotdPanel', {
	extend: 'Ext.Panel',

	requires: [
		'ARSnova.view.Caption',
		'ARSnova.model.Motd'
	],

	config: {
		title: 'MotdPanel',
		layout: {
			type: 'vbox',
			pack: 'center'
		},
		fullscreen: true,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		},
		controller: null,
		mode: null,
		sessionkey: null
	},

	/* toolbar items */
	toolbar: null,
	backButton: null,

	motdStore: null,

	initialize: function () {
		this.callParent(arguments);

		var self = this;
		var screenWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		var actionButtonCls = screenWidth < 410 ? 'smallerActionButton' : 'actionButton';

		this.backButton = Ext.create('Ext.Button', {
			text: Messages.BACK,
			ui: 'back',
			scope: this,
			handler: function () {
				if (this.getMode() === 'admin') {
					var hTP = ARSnova.app.mainTabPanel.tabPanel.homeTabPanel;
					hTP.animateActiveItem(hTP.mySessionsPanel, {
						type: 'slide',
						direction: 'right'
					});
				} else {
					var sTP = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel;
					sTP.animateActiveItem(sTP.inClassPanel, {
						type: 'slide',
						direction: 'right'
					});
				}
			}
		});

		this.toolbar = Ext.create('Ext.Toolbar', {
			title: Messages.MESSAGEOFTHEDAY,
			cls: 'titlePaddingLeft',
			docked: 'top',
			ui: 'light',
			items: [
				this.backButton
			]
		});

		this.motdStore = Ext.create('Ext.data.JsonStore', {
			model: 'ARSnova.model.Motd',
			hidden: true
		});

		this.motdList = Ext.create('ARSnova.view.components.List', {
			activeCls: 'search-item-active',
			cls: 'roundedCorners leftText',
			hidden: false,

			style: {
				marginTop: '15px',
				backgroundColor: 'transparent'
			},

			/*loadHandler: this.getMotds,*/
			loadScope: this,

			itemCls: 'forwardListButton',
			itemTpl: Ext.create('Ext.XTemplate',
				'<tpl><div class="buttontext noOverflow">{title:htmlEncode}</div>',
				'<div class="x-button x-hasbadge audiencePanelListBadge">',
				'</div>'
			),
			grouped: true,
			store: this.motdStore,

			listeners: {
				scope: this,
				itemtap: function (list, index, element) {
					this.getController().details({
						motd: list.getStore().getAt(index).data
					}, this.getMode());
				}
			}
		});

		this.motdListContainer = Ext.create('Ext.form.Panel', {
			scrollable: null,
			hidden: true,
			items: [{
				xtype: 'fieldset',
				items: [
					this.motdList
				]
			}]
		});

		this.newMotdButton = Ext.create('ARSnova.view.MatrixButton', {
			text: Messages.CREATE_NEW_MOTD,
			buttonConfig: 'icon',
			cls: actionButtonCls,
			imageCls: 'icon-blog',
			scope: this,
			handler: this.newMotdHandler
		});

		this.actionButtonPanel = Ext.create('Ext.Panel', {
			layout: {
				type: 'hbox',
				pack: 'center'
			},

			style: 'margin-top: 30px',

			items: [
				this.newMotdButton
			]
		});

		this.add([
			this.toolbar,
			this.actionButtonPanel,
			this.motdListContainer
		]);

		this.on('activate', this.onActivate);
	},

	onActivate: function () {
		if (!this.getController()) {
			/*
			 * Somewhere, in ARSnova's endless depths, this method gets called before this panel is ready.
			 * This happens for a returning user who was logged in previously, and is redirected into his session.
			 */
			return;
		}
		this.motdStore.removeAll();
		this.getMotds();
	},

	getMotds: function () {
		var me = this;
		if (this.getMode() === 'admin') {
			me.getController().getAllMotds({
				success: function (response) {
					var motds = Ext.decode(response.responseText);
					if (motds.length > 0) {
						me.motdListContainer.show();
					}
					me.motdStore.add(motds);
				},
				failure: function (records, operation) {
					console.log('server side error');
				}
			});
		}	else {
			me.getController().getAllSessionMotds(this.getSessionkey(), {
				success: function (response) {
					var motds = Ext.decode(response.responseText);
					if (motds.length > 0) {
						me.motdListContainer.show();
					}
					me.motdStore.add(motds);
				},
				failure: function (records, operation) {
					console.log('server side error');
				}
			});
		}
	},

	newMotdHandler: function () {
		if (this.getMode() === 'admin') {
			var sTP = ARSnova.app.mainTabPanel.tabPanel.homeTabPanel;
			sTP.animateActiveItem(sTP.newMotdPanel, 'slide');
		}	else {
			var hTP = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel;
			hTP.animateActiveItem(hTP.newSessionMotdPanel, 'slide');
		}
	}
});
