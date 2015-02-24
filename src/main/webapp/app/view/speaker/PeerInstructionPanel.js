/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2015 The ARSnova Team
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
Ext.define('ARSnova.view.speaker.PeerInstructionPanel', {
	extend: 'Ext.Panel',

	config: {
		title: "Peer-Instruction",
		iconCls: 'icon-timer',
		fullscreen: true,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		}
	},

	initialize: function (arguments) {
		this.callParent(arguments);

		this.toolbar = Ext.create('Ext.Toolbar', {
			docked: 'top',
			title: this.getTitle(),
			ui: 'light',
			items: [{
				xtype: 'button',
				text: Messages.STATISTIC,
				ui: 'back',
				scope: this,
				handler: function () {
					ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.statisticTabPanel.setActiveItem(0);
					ARSnova.app.innerScrollPanel = false;
				}
			}]
		});

		this.countdownTimer = Ext.create('ARSnova.view.components.CountdownTimer', {
			sliderDefaultValue: 2,
			//hidden: true
		});
		
		this.startRoundButton = Ext.create('Ext.Button', {
			text: 'Erste Runde starten',
			style: 'margin: 0 auto;',
			ui: 'confirm',
			width: 220,
			scope: this,
			handler: function() {
				this.countdownTimer.start();
				this.startRoundButton.hide();
				this.endRoundButton.show();
			}
		});
		
		this.endRoundButton = Ext.create('Ext.Button', {
			text: 'Runde sofort beenden',
			style: 'margin: 0 auto;',
			ui: 'decline',
			hidden: true,
			width: 220,
			scope: this,
			handler: function() {
				Ext.Msg.confirm('Beenden der Abstimmungsrunde', 'Wenn die Runde beendet wird, sind keine Abstimmungen mehr möglich bis eine neue Runde gestartet wird oder die Frage manuell entsperrt wird. Möchten Sie fortfahren?', function(id) {
					if(id === 'yes') {
						this.countdownTimer.stop();
						this.endRoundButton.hide();
						this.startRoundButton.setText('Zweite Runde starten');
						ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart.enablePiRoundElements();
						ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart.questionObj.piRound++;
						if(this.round < 2) {
							this.startRoundButton.show();
						} else {
							this.countdownTimer.minutes = 0;
							this.countdownTimer.seconds = 0;
							this.countdownTimer.showTimer();
							this.countdownTimer.slider.hide();
						}
						
						this.round++;
						
						ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.statisticTabPanel.setActiveItem(0);
						ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart.activatePreviousSegmentButton();
					}
				}, this);
			}
		});
		
		this.questionManagementContainer = Ext.create('Ext.form.FieldSet', {
			title: Messages.QUESTION_MANAGEMENT,
			cls: 'centerFormTitle',
			hidden: true
		});
		
		this.roundManagementContainer = Ext.create('Ext.form.FieldSet', {
			title: 'Abstimmungsverwaltung',
			cls: 'centerFormTitle',
			items: [
				this.countdownTimer,
				this.startRoundButton,
				this.endRoundButton
			]
		});

		this.add([
			this.toolbar, 
			{
				xtype: 'formpanel',
				scrollable: null,
				items: [
					this.roundManagementContainer, 
					this.questionManagementContainer
				]
			}

		]);

		this.on('activate', this.onActivate);
		this.onBefore('activate', this.beforeActivate);
	},

	onActivate: function () {
		ARSnova.app.innerScrollPanel = this;
	},

	beforeActivate: function () {
		var statisticChart = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart;
		this.round = statisticChart.questionObj.piRound;

		if(this.round === 1) {
			this.startRoundButton.setText('Erste Runde starten');
			this.countdownTimer.slider.show();
			this.startRoundButton.show();
		} else if (this.round === 2) {
			this.startRoundButton.setText('Zweite Runde starten');
			this.countdownTimer.slider.show();
			this.startRoundButton.show();
		} else {
			this.startRoundButton.hide();
		}

		if(!this.editButtons) {
			this.editButtons = Ext.create('ARSnova.view.speaker.ShowcaseEditButtons', {
				speakerStatistics: true,
				questionObj: this.cleanupQuestionObj(statisticChart.questionObj)
			});

			this.questionManagementContainer.add(this.editButtons);
			this.questionManagementContainer.show();
		} else {
			this.editButtons.questionObj = statisticChart.questionObj;
			this.editButtons.updateData(statisticChart.questionObj);
		}
	},

	cleanupQuestionObj: function(questionObj) {
		if(questionObj) {
			questionObj.possibleAnswers.forEach(function(answer) {
				delete answer.formattedText;
			});
		}

		return questionObj;
	}
});
