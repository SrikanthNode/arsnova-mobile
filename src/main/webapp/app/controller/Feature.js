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
Ext.define("ARSnova.controller.Feature", {
	extend: 'Ext.app.Controller',

	useCases: {
		custom: true,
		total: false,
		clicker: false,
		liveClicker: false,
		liveFeedback: false,
		interposedFeedback: false,
		flashcard: false,
		peerGrading: false
	},

	features: {
		pi: true,
		jitt: true,
		lecture: true,
		feedback: true,
		interposed: true,
		learningProgress: true,
		slides: true
	},

	lastUpdate: 0,

	getActiveFeatures: function () {
		var features = Ext.decode(sessionStorage.getItem("features"));
		if (features && features.total) {
			/* Needed for backwards compatibility */
			features.slides = true;
		}

		return features;
	},

	applyFeatures: function (prevFeatures) {
		var features = this.getActiveFeatures();

		var useCases = {
			clicker: this.applyClickerUseCase,
			peerGrading: this.applyPeerGradingUseCase,
			flashcard: this.applyFlashcardUseCase,
			liveFeedback: this.applyLiveFeedbackUseCase,
			interposedFeedback: this.applyInterposedFeedbackUseCase,
			liveClicker: this.applyLiveClickerUseCase,
			total: this.applyTotalUseCase,
			custom: this.applyCustomUseCase
		};

		if (this.getLoneActiveFeatureKey(features) === 'twitterWall') {
			features.twitterWall = false;
			features.interposedFeedback = true;
			sessionStorage.setItem("features", Ext.encode(features));
		}

		if (ARSnova.app.userRole !== ARSnova.app.USER_ROLE_SPEAKER &&
			prevFeatures && (prevFeatures.liveClicker || features.liveClicker)) {
			ARSnova.app.getController('Sessions').liveClickerSessionReload(prevFeatures);
			return;
		}

		for (var property in features) {
			if (features[property] && typeof useCases[property] === 'function') {
				useCases[property].call(this, features);
			}
		}
	},

	applyClickerUseCase: function (useCases) {
		this.applyCustomUseCase(this.getFeatureValues(useCases));
	},

	applyPeerGradingUseCase: function (useCases) {
		this.applyCustomUseCase(this.getFeatureValues(useCases));
	},

	applyFlashcardUseCase: function (useCases) {
		this.applyCustomUseCase(this.getFeatureValues(useCases));
	},

	applyLiveFeedbackUseCase: function (useCases) {
		this.applyCustomUseCase(this.getFeatureValues(useCases));
	},

	applyInterposedFeedbackUseCase: function (useCases) {
		this.applyCustomUseCase(this.getFeatureValues(useCases));
	},

	applyTotalUseCase: function (useCases) {
		var tabPanel = ARSnova.app.mainTabPanel.tabPanel;
		this.applyCustomUseCase(this.getFeatureValues(useCases));

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tabPanel.speakerTabPanel;
			tabPanel.inClassPanel.changeActionButtonsMode(useCases);
		} else {
			tabPanel = tabPanel.userTabPanel;
		}
	},

	applyLiveClickerUseCase: function (useCases, featureChange) {
		var tabPanel = ARSnova.app.mainTabPanel.tabPanel;
		var fP = tabPanel.feedbackTabPanel;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER ||
			localStorage.getItem('lastVisitedRole') === ARSnova.app.USER_ROLE_SPEAKER) {
			this.applyCustomUseCase(useCases, this.getFeatureValues(useCases));
			tabPanel.speakerTabPanel.inClassPanel.showcaseActionButton.setHidden(false);
			tabPanel.speakerTabPanel.inClassPanel.changeActionButtonsMode();
			tabPanel.feedbackTabPanel.tab.show();
		} else {
			this.setSinglePageMode('feedback', {});
		}

		fP.votePanel.initializeOptionButtons();
		fP.statisticPanel.initializeOptionButtons();
		fP.statisticPanel.setToolbarTitle(Messages.QUESTION_LIVE_CLICKER);
		fP.votePanel.setToolbarTitle(Messages.QUESTION_LIVE_CLICKER);
		fP.votePanel.questionRequestButton.setHidden(true);
	},

	applyCustomUseCase: function (features) {
		features = features || this.getActiveFeatures();

		var functions = {
			pi: this.applyPiFeature,
			jitt: this.applyJittFeature,
			lecture: this.applyLectureFeature,
			feedback: this.applyFeedbackFeature,
			flashcardFeature: this.applyFlashcardsFeature,
			interposed: this.applyInterposedFeature,
			learningProgress: this.applyLearningProgressFeature,
			slides: this.applySlidesFeature
		};

		/* Two loops are used to avoid race conditions. */
		var property;
		for (property in features) {
			if (typeof functions[property] === 'function' && !features[property]) {
				functions[property].call(this, false);
			}
		}
		for (property in features) {
			if (typeof functions[property] === 'function' && features[property]) {
				functions[property].call(this, true);
			}
		}

		if (features && Object.keys(features).length) {
			this.applyAdditionalChanges(features);
		}
	},

	getFeatureValues: function (useCases) {
		var features = Ext.Object.merge({}, this.features, useCases);

		if (!useCases.custom && !useCases.total) {
			features.jitt = false;
			features.learningProgress = false;
			features.flashcardFeature = false;
			features.interposed = false;
			features.feedback = false;
			features.lecture = false;
			features.pi = false;
			features.slides = false;

			if (useCases.flashcard) {
				features.flashcardFeature = true;
			}

			if (useCases.liveFeedback) {
				features.feedback = true;
			}

			if (useCases.interposedFeedback) {
				features.interposed = true;
			}

			if (useCases.clicker) {
				features.lecture = true;
				features.pi = true;
			}

			if (useCases.peerGrading) {
				features.learningProgress = true;
				features.lecture = true;
				features.pi = true;
			}
		}

		return features;
	},

	/**
	 * apply changes affecting the "lecture" feature
	 */
	applyLectureFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			position = 1;
		} else {
			tabPanel = tP.userTabPanel;
			position = 0;
		}

		container = tabPanel.inClassPanel.inClassButtons;
		button = tabPanel.inClassPanel.lectureQuestionButton;
		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "jitt" feature
	 */
	applyJittFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			position = 2;
		} else {
			tabPanel = tP.userTabPanel;
			position = 1;
		}

		container = tabPanel.inClassPanel.inClassButtons;
		button = tabPanel.inClassPanel.preparationQuestionButton;
		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "feedback" feature
	 */
	applyFeedbackFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var inClassPanel, container;

		tP.feedbackTabPanel.tab.setHidden(!enable);

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			inClassPanel = tP.speakerTabPanel.inClassPanel;
			container = inClassPanel.inClassButtons;
			this.applyButtonChange(container, inClassPanel.liveFeedbackButton, enable, 4);
		} else {
			inClassPanel = tP.userTabPanel.inClassPanel;
			container = inClassPanel.actionButtonPanel;
			this.applyButtonChange(container, inClassPanel.voteButton, enable, 4);
		}
	},

	/**
	 * apply changes affecting the "flashcards" feature
	 */
	applyFlashcardsFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var inClassPanel, container, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			inClassPanel = tP.speakerTabPanel.inClassPanel;
			container = inClassPanel.inClassButtons;
			position = 3;
		} else {
			inClassPanel = tP.userTabPanel.inClassPanel;
			container = inClassPanel.inClassButtons;
			position = 2;
		}

		this.applyButtonChange(container, inClassPanel.flashcardQuestionButton, enable, position);
	},

	/**
	 * apply changes affecting the "interposed" feature
	 */
	applyInterposedFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.feedbackQuestionButton;
			tP.feedbackQuestionsPanel.tab.setHidden(!enable);
			position = 0;
		} else {
			tabPanel = tP.userTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.myQuestionsButton;
			tabPanel.inClassPanel.feedbackButton.setHidden(!enable);
			position = 2;
		}

		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * apply changes affecting the "learningProgress" feature
	 */
	applyLearningProgressFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.courseLearningProgressButton;
		} else {
			tabPanel = tP.userTabPanel;
			container = tabPanel.inClassPanel.inClassButtons;
			button = tabPanel.inClassPanel.myLearningProgressButton;
		}

		this.applyButtonChange(container, button, enable, 3);
	},

	/**
	 * apply changes affecting the "slides" feature
	 */
	applySlidesFeature: function (enable) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel, container, button, position;

		if (ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER) {
			tabPanel = tP.speakerTabPanel;
			position = 1;
			tP.speakerTabPanel.inClassPanel.changeActionButtonsMode();
		} else {
			tabPanel = tP.userTabPanel;
			position = 0;
		}

		container = tabPanel.inClassPanel.inClassButtons;
		button = tabPanel.inClassPanel.lectureQuestionButton;
		this.applyButtonChange(container, button, enable, position);
	},

	/**
	 * return key of lone active option
	 */
	getLoneActiveFeatureKey: function (features) {
		var loneActiveFeature = false;
		for (var key in features) {
			if (!this.useCases.hasOwnProperty(key) && key !== 'pi') {
				if (loneActiveFeature && features[key]) {
					return false;
				} else if (features[key] && key !== 'learningProgress') {
					loneActiveFeature = key;
				}
			}
		}

		return loneActiveFeature;
	},

	/**
	 * apply changes affecting combined feature activation/deactivation
	 */
	applyAdditionalChanges: function (features) {
		var hasQuestionFeatures = features.lecture || features.jitt || features.slides || features.flashcardFeature;
		var feedbackWithoutInterposed = features.feedback && !features.interposed;
		var isSpeaker = ARSnova.app.userRole === ARSnova.app.USER_ROLE_SPEAKER;
		var loneActiveFeature = this.getLoneActiveFeatureKey(features);

		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel = isSpeaker ? tP.speakerTabPanel : tP.userTabPanel;

		tP.feedbackQuestionsPanel.setActiveItem(tP.feedbackQuestionsPanel.questionsPanel);
		tP.feedbackTabPanel.statisticPanel.setToolbarTitle(localStorage.getItem('shortName'));
		tP.feedbackTabPanel.statisticPanel.initializeOptionButtons();
		tP.feedbackTabPanel.votePanel.setToolbarTitle(Messages.FEEDBACK);
		tP.feedbackTabPanel.votePanel.initializeOptionButtons();
		tP.feedbackTabPanel.statisticPanel.updateTabBar();
		tP.getTabBar().setHidden(false);

		if (isSpeaker) {
			var inClass = tabPanel.inClassPanel;
			inClass.showcaseActionButton.setHidden(!hasQuestionFeatures);
			inClass.createAdHocQuestionButton.setHidden(!hasQuestionFeatures);
			inClass.feedbackQuestionButton.setText(inClass.feedbackQuestionButton.initialConfig.text);
			inClass.updateActionButtonElements();
			inClass.changeActionButtonsMode(features);
		} else {
			// hide questionsPanel tab when session has no question features active
			tP.userQuestionsPanel.tab.setHidden(!hasQuestionFeatures);

			// hide question request button if interposed feature is disabled
			tP.feedbackTabPanel.votePanel.questionRequestButton.setHidden(feedbackWithoutInterposed);

			if (features.jitt && !features.lecture) {
				tP.userQuestionsPanel.setPreparationMode();
				tabPanel.inClassPanel.updateQuestionsPanelBadge();
				tP.userQuestionsPanel.tab.setTitle(Messages.TASKS);
			} else if (features.flashcardFeature && !features.lecture) {
				tP.userQuestionsPanel.setFlashcardMode();
				tabPanel.inClassPanel.updateQuestionsPanelBadge();
				tP.userQuestionsPanel.tab.setTitle(Messages.FLASHCARDS);
			} else {
				tP.userQuestionsPanel.setLectureMode();
				tabPanel.inClassPanel.updateQuestionsPanelBadge();
				tP.userQuestionsPanel.tab.setTitle(Messages.QUESTIONS);
			}

			var lectureButtonText = Messages.LECTURE_QUESTIONS_LONG;
			var questionsButtonText = Messages.MY_QUESTIONS_AND_COMMENTS;

			if (features.slides) {
				lectureButtonText = Messages.PRESENTATION;
				questionsButtonText = Messages.MY_QUESTIONS;
			} else if (features.peerGrading) {
				lectureButtonText = Messages.EVALUATION_QUESTIONS;
			}

			tabPanel.inClassPanel.myQuestionsButton.setText(questionsButtonText);
			tabPanel.inClassPanel.lectureQuestionButton.setText(lectureButtonText);
			tabPanel.inClassPanel.applyUIChanges(features);

			if (tabPanel.inClassPanel.myLearningProgressButton) {
				tabPanel.inClassPanel.myLearningProgressButton.setText(
					features.peerGrading ? Messages.EVALUATION_ALT : Messages.MY_LEARNING_PROGRESS
				);
			}

			if (localStorage.getItem('lastVisitedRole') !== ARSnova.app.USER_ROLE_SPEAKER) {
				this.setSinglePageMode(loneActiveFeature.toString(), features);
			}
		}

		if (features.learningProgress) {
			var hidePointsVariantField = false;
			var hideQuestionVariantField = false;
			var sessionController = ARSnova.app.getController('Sessions');
			var progressOptions = Object.create(sessionController.getLearningProgressOptions());
			var questionVariant = progressOptions.questionVariant;

			if (!features.lecture || !features.jitt) {
				hideQuestionVariantField = true;
				if (questionVariant !== 'preparation' && !features.lecture) {
					progressOptions.questionVariant = 'preparation';
				} else if (questionVariant !== 'lecture' && !features.jitt) {
					progressOptions.questionVariant = 'lecture';
				}
			}

			if (features.peerGrading) {
				progressOptions.type = 'points';
				hidePointsVariantField = true;
			}

			// set learningProgessOption after learningProgressOptions socket has been send
			var changeLearningProgressOptions = function changeOptions() {
				if (ARSnova.app.sessionModel.isLearningProgessOptionsInitialized) {
					Ext.create('Ext.util.DelayedTask', function () {
						sessionController.setLearningProgressOptions(progressOptions);
						tabPanel.learningProgressPanel.refreshQuestionVariantFields();
					}).delay(500);
				} else {
					Ext.create('Ext.util.DelayedTask', changeOptions).delay(100);
				}
			};

			tabPanel.learningProgressPanel.setPointsVariantFieldHidden(hidePointsVariantField);
			tabPanel.learningProgressPanel.setQuestionVariantFieldHidden(hideQuestionVariantField);
			changeLearningProgressOptions();
		}
	},

	setSinglePageMode: function (featureKey, features) {
		var tP = ARSnova.app.mainTabPanel.tabPanel;
		var tabPanel = tP.userTabPanel;

		if (features[featureKey]) {
			tabPanel.inClassPanel.stopTasks();
			tabPanel.tab.hide();
		}

		switch (featureKey) {
			case 'jitt':
			case 'lecture':
			case 'flashcardFeature':
			case 'slides':
				if (tP.getActiveItem() === tP.userQuestionsPanel) {
					tP.userQuestionsPanel.removeAll();
					tP.userQuestionsPanel.getUnansweredSkillQuestions();
				}
				tP.userQuestionsPanel.setSinglePageMode(true, this);
				tP.setActiveItem(tP.userQuestionsPanel);
				break;
			case 'feedback':
				tP.feedbackTabPanel.votePanel.setSinglePageMode(true, this);
				tP.setActiveItem(tP.feedbackTabPanel);
				break;
			default:
			case 'interposed':
				tP.setActiveItem(tabPanel);

				if (Date.now() - this.lastUpdate > 1000) {
					this.lastUpdate = Date.now();
					ARSnova.app.socket.setSession(null);
					ARSnova.app.socket.setSession(sessionStorage.getItem('keyword'));
					ARSnova.app.sessionModel.fireEvent(ARSnova.app.sessionModel.events.sessionJoinAsStudent);
				}

				tP.feedbackTabPanel.votePanel.setSinglePageMode(false, this);
				tP.userQuestionsPanel.setSinglePageMode(false, this);
				tabPanel.inClassPanel.startTasks();
				tabPanel.tab.show();
		}
	},

	/**
	 * removes or adds button from given container
	 */
	applyButtonChange: function (container, button, addButton, index) {
		if (!container || !button) {
			return;
		}

		if (typeof addButton !== 'boolean') {
			addButton = false;
		}

		if (addButton) {
			container.insert(index, button);
		} else {
			container.remove(button, false);
		}
	},

	applyNewQuestionPanelChanges: function (panel) {
		var indexMap = panel.getOptionIndexMap();
		var features = this.getActiveFeatures();
		var options = panel.questionOptions.getInnerItems();
		panel.questionOptions.setPressedButtons([1]);

		if (features.slides && !features.lecture && !features.jitt) {
			panel.questionOptions.setPressedButtons([indexMap[Messages.SLIDE]]);
			panel.optionsToolbar.setHidden(true);
		} else if (features.peerGrading) {
			panel.questionOptions.setPressedButtons([indexMap[Messages.EVALUATION]]);
			panel.optionsToolbar.setHidden(true);
		} else if (features.clicker) {
			options[indexMap[Messages.FREETEXT]].hide();
			options[indexMap[Messages.EVALUATION]].hide();
			options[indexMap[Messages.SCHOOL]].hide();
			options[indexMap[Messages.GRID]].hide();
			panel.optionsToolbar.setHidden(false);
		} else {
			panel.optionsToolbar.setHidden(false);
			panel.questionOptions.config.showAllOptions();
			options[indexMap[Messages.FLASHCARD]].hide();
			if (features.slides) {
				panel.questionOptions.setPressedButtons([indexMap[Messages.SLIDE]]);
			}
		}

		options[indexMap[Messages.SLIDE]].setHidden(!features.slides);
	}
});
