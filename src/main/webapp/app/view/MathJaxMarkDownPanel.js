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
Ext.define('ARSnova.view.MathJaxMarkDownPanel', {
	/* global hljs */

	extend: 'Ext.Component',

	xtype: 'mathJaxMarkDownPanel',
	ui: 'normal',

	config: {
		itemId: 'content',
		title: 'MathJaxMarkDownPanel',
		cls: 'roundedBox',
		fullscreen: false,
		scrollable: {direction: 'auto'},
		styleHtmlContent: true,
		html: 'empty',
		style: 'margin-bottom: 10px',
		hideMediaElements: false,
		removeMediaElements: false
	},

	initialize: function () {
		this.callParent(arguments);
		this.mediaElements = {
			code: false,
			image: false,
			vimeo: false,
			latex: false,
			youtube: false,
			hyperlink: false
		};
	},

	setContent: function (content, mathJaxEnabled, markDownEnabled, mathjaxCallback) {
		var hideMediaDummy = '<div class="hideMediaDummy" accessKey="@@@"><span class="###"></span></div>';
		var markdownController = ARSnova.app.getController('MathJaxMarkdown');

		markdownController.hideMediaElements = this.config.hideMediaElements || this.config.removeMediaElements;
		markdownController.removeMediaElements = this.config.removeMediaElements;
		markdownController.hideMediaDummy = hideMediaDummy;

		var replaceCodeBlockFromContent = function (content) {
			return content.replace(/<hlcode>([\s\S]*?)<\/hlcode>/g, function (element) {
				var codeBlockMatch = element.match(/^<hlcode>\s*([\s\S]*?)\s*<\/hlcode>$/)[1];
				return "\n```auto\n" + codeBlockMatch + "\n```\n";
			});
		};

		var features = ARSnova.app.globalConfig.features;
		if (markDownEnabled && features.markdown) {
			if (mathJaxEnabled && features.mathJax && window.MathJax && MathJax.Hub) {
				var replStack = [], repl;

				// replace MathJax delimiters
				var delimiterPairs = MathJax.Hub.config.tex2jax.inlineMath.concat(MathJax.Hub.config.tex2jax.displayMath);
				delimiterPairs.forEach(function (delimiterPair, i) {
					var delimiterPositions = this.getDelimiter(content, delimiterPair[0], delimiterPair[1]);
					replStack.push(repl = this.replaceDelimiter(content, delimiterPositions, '%%MATHJAX' + i + '%%'));
					content = repl.content;
				}, this);

				// replace code block before markdown parsing
				repl.content = replaceCodeBlockFromContent(repl.content);

				// converted MarkDown to HTML
				repl.content = markdownController.markdownToHtml(repl.content);

				// undo MathJax delimiter replacements in reverse order
				for (var i = replStack.length - 1; i > 0; i--) {
					replStack[i - 1].content = this.replaceBack(replStack[i]);
				}

				if (this.config.removeMediaElements) {
					var dummy = hideMediaDummy.replace(/@@@/, 'latex');
					content = repl.content.replace(/<p>%%MATHJAX.*<\/p>/g, dummy);
				} else {
					content = this.replaceBack(replStack[0]);
				}
			} else {
				// replace code block before markdown parsing
				content = replaceCodeBlockFromContent(content);

				// directly convert Markdown if MathJax is disabled
				content = markdownController.markdownToHtml(content);
			}
		} else {
			content = Ext.util.Format.htmlEncode(content);
			content = content.replace(/\n/g, "<br />");
		}
		this.setHtml(content);
		this.addSyntaxHighlightLineNumbers();

		if (this.config.removeMediaElements) {
			this.removeMediaElements();
		}

		var callback = mathjaxCallback || Ext.emptyFn;
		if (mathJaxEnabled && features.mathJax && window.MathJax && MathJax.Hub) {
			// MathJax is enabled and content will be converted
			var queue = MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.element.dom]);
			MathJax.Hub.Queue([callback, this.element.down('div')]);
		} else {
			callback(this.element.down('div'));
		}
	},

	// get all delimiter indices as array of [start(incl), end(excl)] elements
	getDelimiter: function (input, delimiter, endDelimiter) {
		// all lines between the tags to this array
		var result = []; // [start, end]

		var idxStart = 0;
		var idxEnd = -delimiter.length;
		var run = true;

		while (run) {
			// start delimiter
			idxStart = input.indexOf(delimiter, idxEnd + endDelimiter.length);

			// end delimiter
			idxEnd = input.indexOf(endDelimiter, idxStart + delimiter.length);

			if (idxStart !== -1 && idxEnd !== -1) {
				// add delimiter position values
				result.push([idxStart, idxEnd + endDelimiter.length]);
			} else {
				run = false;
			}
		}
		return result;
	},

	// replace the delimiter with idStrN (returns an array with
	// the input string including all replacements and another array with the replaced content)
	replaceDelimiter: function (input, dArr, idLabel) {
		var result = '';

		var start = 0;

		var replaced = [];

		for (var i = 0; i < dArr.length; ++i) {
			var idxStart = dArr[i][0];
			var idxEnd = dArr[i][1];

			// until start of delimiter
			result = result + input.substring(start, idxStart);

			// set id label
			result += (idLabel + i + 'X');

			// new start becomes old end
			start = idxEnd;

			// store replaced content
			replaced.push(input.substring(idxStart, idxEnd));
		}
		result += input.substring(start);

		return {content: result, source: replaced, label: idLabel};
	},

	// replace the labels back to the contents and return the string
	replaceBack: function (contentReplaced) {
		var content = contentReplaced.content;
		var replaced = contentReplaced.source;

		for (var i = replaced.length - 1; i >= 0; --i) {
			content = this.replaceWithoutRegExp(
				content,
				contentReplaced.label + i + 'X',
				Ext.util.Format.htmlEncode(replaced[i])
			);
		}

		return content;
	},

	removeMediaElements: function () {
		var elements = this.element.select('.hideMediaDummy').elements;
		var element;

		for (var i = 0; i < elements.length; i++) {
			element = elements[i];
			this.mediaElements[element.accessKey] = true;
			element.parentNode.removeChild(element);
		}
	},

	// replace given variable with the replacement in input without using regular expressions
	replaceWithoutRegExp: function (input, find, replacement) {
		return input.split(find).join(replacement);
	},

	// add line numbers for syntax highlighted text
	addSyntaxHighlightLineNumbers: function () {
		if (hljs) {
			this.element.select('.hljs-line-numbers').elements.forEach(function (el) {
				el.parentNode.removeChild(el);
			});

			this.element.select('.hljs-highlight').elements.forEach(function (el) {
				hljs.lineNumbersBlock(el);
			});
		}
	}
});
