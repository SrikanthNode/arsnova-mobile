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
Ext.define('ARSnova.model.FeedbackQuestion', {
	extend: 'Ext.data.Model',

	config: {
		fields: [
			'subject',
			'text',
			'mdtext',
			'timestamp',
			'read',
			'mediaElements'
		],

		validations: [
			{type: 'presence', field: 'subject'},
			{type: 'presence', field: 'text'}
		]
	},

	getFormattedDateTime: function () {
		var time = new Date(this.get('timestamp'));
		return moment(time).format('LLL');
	},

	read: function () {
		if (ARSnova.app.isSessionOwner && !this.get('read')) {
			this.set('read', true);
			ARSnova.app.socket.readInterposedQuestion(this);
		}
	}
});
