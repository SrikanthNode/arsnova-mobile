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

Ext.define('ARSnova.view.TextCheckfield', {
	extend: 'Ext.field.Text',
	alias: 'x-textcheckfield',
	xtype: 'textcheckfield',

	config: {
		container: null,
		checked: null,
		checkedCls: 'checked',
		uncheckedCls: 'unchecked',

		/**
		 * Overwriting label of textfield in order to place a checkbox instead of the label.
		 * Label value '3' is the checkbox icon (check css cls checkItem).
		 */
		label: '3',
		labelAlign: 'right',
		labelWidth: '2.0em',
		labelCls: 'checkItem',

		/**
		 * listener for tap event on label element (toggleChecked())
		 */
		listeners: {
			'tap': {
				element: 'label',
				fn: function () {
					var parent = this.getContainer();
					if (parent.config.singleChoice) {
						for (var i = 0; i < parent.selectAnswerCount.getValue(); i++) {
							parent.answerComponents[i].uncheck();
						}

						if (!this.isChecked()) {
							this.toggleChecked();
						}
					} else {
						this.toggleChecked();
					}
					this.fireEvent('checkchange', this, this.isChecked());
				}
			}
		}
	},

	initialize: function () {
		this.callParent(arguments);
		/**
		 * If checked is set true, the class of the label will be set to this.config.checkedCls,
		 * otherwise to this.config.uncheckedCls.
		 */
		this.label.addCls(
			(this.isChecked() ? this.getCheckedCls() : this.getUncheckedCls())
		);

		/**
		 * initialize checked as false by default. If this step is not done, the framework
		 * don't initialize 'checked' and let it undefined.
		 */
		this.onAfter('initialize', function () {
			if (this.getChecked() == null) {
				this.uncheck();
			}
		});
	},

	/**
	 * @return: Returns the value of this.config.checked (boolean).
	 */
	isChecked: function () {
		return this.getChecked();
	},

	/**
	 * checks the checkfield
	 */
	check: function () {
		this.setChecked(true);
		this.setCheckfieldCls();
	},

	/**
	 * unchecks the checkfield
	 */
	uncheck: function () {
		this.setChecked(false);
		this.setCheckfieldCls();
	},

	/**
	 * Toggles checkfield cls and value
	*/
	toggleChecked: function () {
		this.setChecked(!this.isChecked());
		this.setCheckfieldCls();
	},

	/**
	 * Toggles labelCls between this.config.uncheckedCls and this.config.checkedCls
	 */
	setCheckfieldCls: function () {
		if (this.isChecked()) {
			this.label.replaceCls(this.getUncheckedCls(), this.getCheckedCls());
		} else {
			this.label.replaceCls(this.getCheckedCls(), this.getUncheckedCls());
		}
	}
});
