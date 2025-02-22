/*!
 * Pikaday
 * v1.8.2-31387d8
 * Copyright © 2014 David Bushell | BSD & MIT license | https://github.com/Pikaday/Pikaday
 */

(function (factory)
{
	'use strict';
	var root = (typeof self == 'object' && self.self === self && self) ||
			(typeof global == 'object' && global.global === global && global);

	if (typeof exports === 'object') {
		module.exports = factory(root);
	} else {
		root.Pikaday = factory(root);
	}
}(function (window)
{
	'use strict';
	var hasEventListeners = !!window.addEventListener,
		document = window.document,
		sto = window.setTimeout,

	addEvent = function(el, e, callback, capture)
	{
		if (hasEventListeners) {
			el.addEventListener(e, callback, !!capture);
		} else {
			el.attachEvent('on' + e, callback);
		}
	},

	removeEvent = function(el, e, callback, capture)
	{
		if (hasEventListeners) {
			el.removeEventListener(e, callback, !!capture);
		} else {
			el.detachEvent('on' + e, callback);
		}
	},

	trim = function(str)
	{
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
	},

	hasClass = function(el, cn)
	{
		return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
	},

	addClass = function(el, cn)
	{
		if (!hasClass(el, cn)) {
			el.className = (el.className === '') ? cn : el.className + ' ' + cn;
		}
	},

	removeClass = function(el, cn)
	{
		el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
	},

	isArray = function(obj)
	{
		return (/Array/).test(Object.prototype.toString.call(obj));
	},

	isDate = function(obj)
	{
		return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
	},

	isWeekend = function(date)
	{
		var day = date.getDay();
		return day === 0 || day === 6;
	},

	isLeapYear = function(year)
	{
		// solution lifted from date.js (MIT license): https://github.com/datejs/Datejs
		return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
	},

	getDaysInMonth = function(year, month)
	{
		return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	setToStartOfDay = function(date)
	{
		if (isDate(date)) date.setHours(0,0,0,0);
	},

	compareDates = function(a,b)
	{
		// weak date comparison (use setToStartOfDay(date) to ensure correct result)
		return a.getTime() === b.getTime();
	},

	extend = function(to, from, overwrite)
	{
		var prop, hasProp;
		for (prop in from) {
			hasProp = to[prop] !== undefined;
			if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
				if (isDate(from[prop])) {
					if (overwrite) {
						to[prop] = new Date(from[prop].getTime());
					}
				}
				else if (isArray(from[prop])) {
					if (overwrite) {
						to[prop] = from[prop].slice(0);
					}
				} else {
					to[prop] = extend({}, from[prop], overwrite);
				}
			} else if (overwrite || !hasProp) {
				to[prop] = from[prop];
			}
		}
		return to;
	},

	fireEvent = function(el, eventName, data)
	{
		var ev;
		if (document.createEvent) {
			ev = document.createEvent('HTMLEvents');
			ev.initEvent(eventName, true, false);
			ev = extend(ev, data);
			el.dispatchEvent(ev);
		} else if (document.createEventObject) {
			ev = document.createEventObject();
			ev = extend(ev, data);
			el.fireEvent('on' + eventName, ev);
		}
	},

	adjustCalendar = function(calendar) {
		if (calendar.month < 0) {
			calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
			calendar.month += 12;
		}
		if (calendar.month > 11) {
			calendar.year += Math.floor(Math.abs(calendar.month)/12);
			calendar.month -= 12;
		}
		return calendar;
	},

	/**
	 * defaults and localisation
	 */
	defaults = {
		// bind the picker to a form field
		field: null,

		// automatically show/hide the picker on `field` focus (default `true` if `field` is set)
		bound: undefined,

		// data-attribute on the input field with an aria assistance text (only applied when `bound` is set)
		ariaLabel: 'Use the arrow keys to pick a date',

		// position of the datepicker, relative to the field (default to bottom & left)
		// ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
		position: 'bottom left',

		// automatically fit in the viewport even if it means repositioning from the position option
		reposition: true,

		// the default output format for `.toString()` and `field` value
		format: 'YYYY-MM-DD',

		// the toString function which gets passed a current date object and format
		// and returns a string
		toString: null,

		// used to create date object from current input string
		parse: null,

		// the initial date to view when first opened
		defaultDate: null,

		// make the `defaultDate` the initial selected value
		setDefaultDate: false,

		// first day of week (0: Sunday, 1: Monday etc)
		firstDay: 0,

		// minimum number of days in the week that gets week number one
		// default ISO 8601, week 01 is the week with the first Thursday (4)
		firstWeekOfYearMinDays: 4,

		// the minimum/earliest date that can be selected
		minDate: null,
		// the maximum/latest date that can be selected
		maxDate: null,
		// the year selector sorted with minimum/earliest year at the top
		yearOrder: 'ascending',

		// number of years either side, or array of upper/lower range
		yearRange: 10,

		// show week numbers at head of row
		showWeekNumber: false,

		// show today button which sets input field to current date
		showTodayButton: false,

		// Week picker mode
		pickWholeWeek: false,

		// used internally (don't config outside)
		minYear: 0,
		maxYear: 9999,
		minMonth: undefined,
		maxMonth: undefined,

		startRange: null,
		endRange: null,

		isRTL: false,

		// Additional text to append to the year in the calendar title
		yearSuffix: '',

		// Render the month after year in the calendar title
		showMonthAfterYear: false,

		// Render days of the calendar grid that fall in the next or previous month
		showDaysInNextAndPreviousMonths: false,

		// If minDate and maxDate are supplied then convert date to minDate, if passed date is less than minDate
		// or convert date to maxDate, if passed date is greater than max Date.
		convertDateToMinOrMaxDate: true,

		// Allows user to select days that fall in the next or previous month
		enableSelectionDaysInNextAndPreviousMonths: false,

		// how many months are visible
		numberOfMonths: 1,

		// when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
		// only used for the first display or when a selected date is not visible
		mainCalendar: 'left',

		// Specify a DOM element to render the calendar in
		container: undefined,

		// Blur field when date is selected
		blurFieldOnSelect : true,

		// internationalization
		i18n: {
			previousMonth : 'Previous Month',
			nextMonth     : 'Next Month',
			today         : 'Today',
			months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
			weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
			weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
		},

		// Theme Classname
		theme: null,

		// events array
		events: [],

		// disabled days array
		disabledDays: [],

		// enabled days array
		enabledDays: [],

		// callback function
		onSelect: null,
		onOpen: null,
		onClose: null,
		onDraw: null,
		onPaginate: null,

		// Enable keyboard input
		keyboardInput: true
	},


	/**
	 * templating functions to abstract HTML rendering
	 */
	renderDayName = function(opts, day, abbr)
	{
		day += opts.firstDay;
		while (day >= 7) {
			day -= 7;
		}
		return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
	},

	renderDay = function(opts)
	{
		var arr = [];
		var ariaSelected = 'false';
		if (opts.isEmpty) {
			if (opts.showDaysInNextAndPreviousMonths) {
				arr.push('is-outside-current-month');

				if(!opts.enableSelectionDaysInNextAndPreviousMonths) {
					arr.push('is-selection-disabled');
				}

			} else {
				return '<td class="is-empty"></td>';
			}
		}
		if (opts.isDisabled) {
			arr.push('is-disabled');
		}
		if (opts.isToday) {
			arr.push('is-today');
		}
		if (opts.isSelected) {
			arr.push('is-selected');
			ariaSelected = 'true';
		}
		if (opts.hasEvent) {
			arr.push('has-event');
		}
		if (opts.isInRange) {
			arr.push('is-inrange');
		}
		if (opts.isStartRange) {
			arr.push('is-startrange');
		}
		if (opts.isEndRange) {
			arr.push('is-endrange');
		}

		return '<td data-day="' + opts.day + '" class="' + arr.join(' ') + '" aria-selected="' + ariaSelected + '">' +
				 '<button class="pika-button pika-day" type="button" ' +
					'data-pika-year="' + opts.year + '" data-pika-month="' + opts.month + '" data-pika-day="' + opts.day + '">' +
						opts.day +
				 '</button>' +
			   '</td>';
	},

	isoWeek = function(date, firstWeekOfYearMinDays)
	{
		// Ensure we're at the start of the day.
		date.setHours(0, 0, 0, 0);

		// Thursday in current week decides the year because January 4th
		// is always in the first week according to ISO8601.
		var yearDay        = date.getDate(),
			weekDay        = date.getDay(),
			dayInFirstWeek = firstWeekOfYearMinDays,
			dayShift       = dayInFirstWeek - 1, // counting starts at 0
			daysPerWeek    = 7,
			prevWeekDay    = function(day) { return (day + daysPerWeek - 1) % daysPerWeek; };

		// Adjust to Thursday in week 1 and count number of weeks from date to week 1.
		date.setDate(yearDay + dayShift - prevWeekDay(weekDay));

		var jan4th      = new Date(date.getFullYear(), 0, dayInFirstWeek),
			msPerDay    = 24 * 60 * 60 * 1000,
			daysBetween = (date.getTime() - jan4th.getTime()) / msPerDay,
			weekNum     = 1 + Math.round((daysBetween - dayShift + prevWeekDay(jan4th.getDay())) / daysPerWeek);

		return weekNum;
	},

	renderWeek = function (d, m, y, firstWeekOfYearMinDays)
	{
		var date = new Date(y, m, d),
			week = isoWeek(date, firstWeekOfYearMinDays);

		return '<td class="pika-week">' + week + '</td>';
	},

	renderRow = function(days, isRTL, pickWholeWeek, isRowSelected)
	{
		return '<tr class="pika-row' + (pickWholeWeek ? ' pick-whole-week' : '') + (isRowSelected ? ' is-selected' : '') + '">' + (isRTL ? days.reverse() : days).join('') + '</tr>';
	},

	renderBody = function(rows)
	{
		return '<tbody>' + rows.join('') + '</tbody>';
	},

	renderHead = function(opts)
	{
		var i, arr = [];
		if (opts.showWeekNumber) {
			arr.push('<th></th>');
		}
		for (i = 0; i < 7; i++) {
			arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
		}
		return '<thead><tr>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tr></thead>';
	},

	renderFooter = function(opts)
	{
		var i, arr = [];
		arr.push('<td colspan="'+(opts.showWeekNumber?'8':'7')+'"><button class="pika-set-today">'+opts.i18n.today+'</button></td>');
		return '<tfoot>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</tfoot>';
	},

	renderTitle = function(instance, c, year, month, refYear, randId)
	{
		var currentDate = instance.toString('L');
		var i, j, arr,
			opts = instance._o,
			isMinYear = year === opts.minYear,
			isMaxYear = year === opts.maxYear,
			html = '<div id="' + randId + '" aria-label="' + currentDate + '" class="pika-title" role="heading" aria-live="polite">',
			monthHtml,
			yearHtml,
			prev = true,
			next = true;

		for (arr = [], i = 0; i < 12; i++) {
			arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
				(i === month ? ' selected="selected"': '') +
				((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? ' disabled="disabled"' : '') + '>' +
				opts.i18n.months[i] + '</option>');
		}

		monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month" tabindex="-1">' + arr.join('') + '</select></div>';

		if (isArray(opts.yearRange)) {
			i = opts.yearRange[0];
			j = opts.yearRange[1] + 1;
		} else {
			i = year - opts.yearRange;
			j = 1 + year + opts.yearRange;
		}

		if (opts.yearOrder === 'ascending') {
			for (arr = []; i < j && i <= opts.maxYear; i++) {
				if (i >= opts.minYear) {
					arr.push(renderOption(i, year));
				}
			}
		} else {
			for (arr = []; j > i && j >= opts.minYear; j--) {
				if (j <= opts.maxYear) {
					arr.push(renderOption(j, year));
				}
			}
		}

		yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year" tabindex="-1">' + arr.join('') + '</select></div>';

		if (opts.showMonthAfterYear) {
			html += yearHtml + monthHtml;
		} else {
			html += monthHtml + yearHtml;
		}

		if (isMinYear && (month === 0 || opts.minMonth >= month)) {
			prev = false;
		}

		if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
			next = false;
		}

		if (c === 0) {
			html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
		}
		if (c === (instance._o.numberOfMonths - 1) ) {
			html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
		}

		return html += '</div>';
	},

	renderOption = function(value, year)
	{
		return '<option value="' + value + '"' + (value === year ? ' selected="selected"': '') + '>' + (value) + '</option>';
	},

	renderTable = function(opts, data, randId)
	{
		return '<table cellpadding="0" cellspacing="0" class="pika-table" role="grid" aria-labelledby="' + randId + '">' + renderHead(opts) + renderBody(data) + (opts.showTodayButton ? renderFooter(opts) : '') + '</table>';
	},

	isBigMove = function(pointA, pointB)
	{
		if (!pointA || !pointB) return false;
		return Math.abs(pointA.x - pointB.x) > 10 || Math.abs(pointA.y - pointB.y) > 10;
	},

	getTouchXY = function(touch)
	{
		if (!touch) return;
		return {
			x: touch.clientX,
			y: touch.clientY
		};
	},

	/**
	 * Pikaday constructor
	 */
	Pikaday = function(options)
	{
		var self = this,
			startPoint,
			isTouching = false,
			opts = self.config(options);

		self._onMouseDown = function(e)
		{
			// Windows Phone will fire mousedown even
			// when you're still holding the finger
			// (i.e, when `touchend` not fired yet),
			// so we need this isTouching flag to prevent
			// it from happening
			if (isTouching) {
				return;
			}
			if (!self._v) {
				return;
			}
			e = e || window.event;
			var target = e.target || e.srcElement;
			if (!target) {
				return;
			}

			if (!hasClass(target, 'is-disabled')) {
				if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty') && !hasClass(target.parentNode, 'is-disabled')) {
					self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
					if (opts.bound) {
						sto(function() {
							self.hide();
							if (opts.blurFieldOnSelect && opts.field) {
								opts.field.blur();
							}
						}, 100);
					}
				}
				else if (hasClass(target, 'pika-prev') && !hasClass(target, 'is-disabled')) {
					self.prevMonth();
				}
				else if (hasClass(target, 'pika-next') && !hasClass(target, 'is-disabled')) {
					self.nextMonth();
				}
				else if (hasClass(target, 'pika-set-today')) {
					self.setDate(new Date());
					self.hide();
				}
			}
			if (!hasClass(target, 'pika-select')) {
				// if this is touch event prevent mouse events emulation
				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
					return false;
				}
			} else {
				self._c = true;
			}
		};

		self._onChange = function(e)
		{
			e = e || window.event;
			var target = e.target || e.srcElement;
			if (!target) {
				return;
			}
			if (hasClass(target, 'pika-select-month')) {
				self.gotoMonth(target.value);
			}
			else if (hasClass(target, 'pika-select-year')) {
				self.gotoYear(target.value);
			}
		};

		self._onKeyChange = function(e)
		{
			e = e || window.event;

			if (self.isVisible()) {

				switch(e.keyCode){
					case 13:
					case 27:
						if (opts.field && opts.trigger) {
							opts.field.focus();
						} else if (opts.field) {
							opts.field.blur();
						}
						self.hide();
						break;
					case 37:
						self.adjustDate('subtract', 1);
						e.preventDefault();
						break;
					case 38:
						self.adjustDate('subtract', 7);
						e.preventDefault();
						break;
					case 39:
						self.adjustDate('add', 1);
						e.preventDefault();
						break;
					case 40:
						self.adjustDate('add', 7);
						e.preventDefault();
						break;
					case 8:
					case 46:
						self.setDate(null);
						break;
					case 9:
						if(opts.trigger) {
						self.hide();
					}
					break;
				}
			}
		};

		self._parseFieldValue = function()
		{
			if (opts.parse) {
				return opts.parse(opts.field.value, opts.format);
			} else {
				return new Date(Date.parse(opts.field.value));
			}
		};

		var debounce;

		self._onInputChange = function (e) {
			if (!opts.debounce) {
				return onInputChange(e);
			}
			if (debounce) {
				clearTimeout(debounce);
			}
			debounce = setTimeout(function () {
				debounce = null;
				onInputChange(e);
			}, opts.debounce);
		};

		function onInputChange(e)
		{
			var date;

			if (e.firedBy === self) {
				return;
			}
			date = self._parseFieldValue();
			if (isDate(date)) {
				self.setDate(date);
			}
		}

		self._onInputFocus = function()
		{
			if(!this.readOnly)
				self.show();
		};

		self._onInputClick = function()
		{
			if(!this.readOnly){
				if (!self._v)
					self.show();
				else
					self.hide();
			}
		};

		self._onInputBlur = function()
		{
			// IE allows pika div to gain focus; catch blur the input field
			var pEl = document.activeElement;
			do {
				if (hasClass(pEl, 'pika-single')) {
					return;
				}
			}
			while ((pEl = pEl.parentNode));

			if (!self._c) {
				self._b = sto(function() {
					self.hide();
				}, 50);
			}
			self._c = false;
		};

		self._onClick = function(e)
		{
			e = e || window.event;
			var target = e.target || e.srcElement,
				pEl = target;
			if (!target) {
				return;
			}
			if (!hasEventListeners && hasClass(target, 'pika-select')) {
				if (!target.onchange) {
					target.setAttribute('onchange', 'return;');
					addEvent(target, 'change', self._onChange);
				}
			}
			do {
				if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
					e.preventDefault();
					return;
				}
			}
			while ((pEl = pEl.parentNode));
			if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
				self.hide();
			}
		};

		self._onTouchStart = function(e) {
			isTouching = true;
			if (e.touches.length > 1) return;
			startPoint = getTouchXY(e.touches[0]);
		};
		self._onTouchEnd = function(e) {
			isTouching = false;
			if (e.changedTouches.length <= 1 &&
				!isBigMove(getTouchXY(e.changedTouches[0]), startPoint)) {
				self._onMouseDown(e);
				if (e.preventDefault) {
					e.preventDefault();
				}
				// on some devices, mousedown will fire even when the touchend
				// is prevented default. Let's set isTouching to true,
				// so mousedown will not fire twice.
				isTouching = true;
			}
			startPoint = null;
		};
		self._onTouchCancel = function() {
			isTouching = false;
			startPoint = null;
		};

		self.el = document.createElement('div');
		self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '') + (opts.theme ? ' ' + opts.theme : '');

		addEvent(self.el, 'touchstart', self._onTouchStart, true);
		addEvent(self.el, 'touchcancel', self._onTouchCancel, true);
		addEvent(self.el, 'touchend', self._onTouchEnd, true);
		addEvent(self.el, 'mousedown', self._onMouseDown, true);
		addEvent(self.el, 'change', self._onChange);

		if (opts.keyboardInput) {
			addEvent(document, 'keydown', self._onKeyChange);
		}

		if (opts.field) {
			if (opts.container) {
				opts.container.appendChild(self.el);
			} else if (opts.bound) {
				document.body.appendChild(self.el);
			} else {
				opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
			}
			addEvent(opts.field, 'change', self._onInputChange);

			if (!opts.defaultDate) {
				opts.defaultDate = self._parseFieldValue();
				opts.setDefaultDate = true;
			}
		}

		var defDate = opts.defaultDate;

		if (isDate(defDate)) {
			if (opts.setDefaultDate) {
				self.setDate(defDate, true);
			} else {
				self.gotoDate(defDate);
			}
		} else {
			defDate = new Date();

			if (opts.minDate && opts.minDate > defDate) {
				defDate = opts.minDate;
			} else if (opts.maxDate && opts.maxDate < defDate) {
				defDate = opts.maxDate;
			}

			self.gotoDate(defDate);
		}

		if (opts.bound) {
			this.hide();
			self.el.className += ' is-bound';
			addEvent(opts.trigger, 'mousedown', self._onInputClick);
			addEvent(opts.trigger, 'focus', self._onInputFocus);
			addEvent(opts.trigger, 'blur', self._onInputBlur);
		} else {
			this.show();
		}
	};


	/**
	 * public Pikaday API
	 */
	Pikaday.prototype = {
		/**
		 * configure functionality
		 */
		config: function(options)
		{
			if (!this._o) {
				this._o = extend({}, defaults, true);
			}

			var opts = extend(this._o, options, true);

			opts.isRTL = !!opts.isRTL;
			opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;
			opts.theme = (typeof opts.theme) === 'string' && opts.theme ? opts.theme : null;
			opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);
			opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;
			opts.disableWeekends = !!opts.disableWeekends;
			opts.disableDayFn = (typeof opts.disableDayFn) === 'function' ? opts.disableDayFn : null;
			opts.onPaginate = (typeof opts.onPaginate) === 'function' ? opts.onPaginate : null;
			opts.selectDayFn = (typeof opts.selectDayFn) === 'function' ? opts.selectDayFn : null;

			var nom = parseInt(opts.numberOfMonths, 10) || 1;
			opts.numberOfMonths = nom > 4 ? 4 : nom;

			if (!isDate(opts.minDate)) {
				opts.minDate = false;
			}
			if (!isDate(opts.maxDate)) {
				opts.maxDate = false;
			}
			if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
				opts.maxDate = opts.minDate = false;
			}
			if (opts.minDate) {
				this.setMinDate(opts.minDate);
			}
			if (opts.maxDate) {
				this.setMaxDate(opts.maxDate);
			}
			if (isArray(opts.yearRange)) {
				var fallback = new Date().getFullYear() - 10;
				opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
				opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
			} else {
				opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
			}
			return opts;
		},

		/**
		 * return a formatted string of the current selection
		 */
		toString: function(format)
		{
			format = format || this._o.format;
			if (!isDate(this._d)) {
				return '';
			}
			if (this._o.toString) {
				return this._o.toString(this._d, format);
			}
			return this._d.toDateString();
		},

		/**
		 * return a Date object of the current selection
		 */
		getDate: function()
		{
			return isDate(this._d) ? new Date(this._d.getTime()) : null;
		},

		/**
		 * set the current selection
		 */
		setDate: function(date, preventOnSelect)
		{
			if (!date) {
				this._d = null;

				if (this._o.field && !!this._o.field.value) {
					this._o.field.value = '';
					fireEvent(this._o.field, 'change', { firedBy: this });
				}

				return this.draw();
			}
			if (typeof date === 'string') {
				var millisecondsPerSecond = 1000,
				millisecondsPerMin = millisecondsPerSecond * 60,
				localTimeZoneOffsetFromUTCinMilliseconds = (new Date().getTimezoneOffset() * millisecondsPerMin),
				localizedDateFromUnixEpochInMilliseconds = (Date.parse(date) + localTimeZoneOffsetFromUTCinMilliseconds);
				date = new Date(localizedDateFromUnixEpochInMilliseconds);
			}
			if (!isDate(date)) {
				return;
			}

			if (this._o.convertDateToMinOrMaxDate) {
				var min = this._o.minDate,
					max = this._o.maxDate;

				if (isDate(min) && date < min) {
					date = min;
				} else if (isDate(max) && date > max) {
					date = max;
				}
			}

			this._d = new Date(date.getTime());

			if (!preventOnSelect && typeof this._o.onSelect === 'function') {
				this._o.onSelect.call(this, this.getDate());
			}

			setToStartOfDay(this._d);
			this.gotoDate(this._d);

			if (!preventOnSelect && typeof this._o.onSelect === 'function') {
				this._o.onSelect.call(this, this.getDate());
			}

			if (this._o.field) {
				var old_value = this._o.field.value;
				this._o.field.value = this.toString();
				if(this._o.field.value != old_value) {
					fireEvent(this._o.field, 'change', { firedBy: this });
				}
			}
		},

		/**
		 * clear and reset the date
		 */
		clear: function()
		{
			this.setDate(null);
		},

		/**
		 * change view to a specific date
		 */
		gotoDate: function(date)
		{
			var newCalendar = true;

			if (!isDate(date)) {
				return;
			}

			if (this.calendars) {
				var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
					lastVisibleDate = new Date(this.calendars[this.calendars.length-1].year, this.calendars[this.calendars.length-1].month, 1),
					visibleDate = date.getTime();
				// get the end of the month
				lastVisibleDate.setMonth(lastVisibleDate.getMonth()+1);
				lastVisibleDate.setDate(lastVisibleDate.getDate()-1);
				newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
			}

			if (newCalendar) {
				this.calendars = [{
					month: date.getMonth(),
					year: date.getFullYear()
				}];
				if (this._o.mainCalendar === 'right') {
					this.calendars[0].month += 1 - this._o.numberOfMonths;
				}
			}
			this.adjustCalendars();
		},

		adjustDate: function(sign, days)
		{
			var day = this.getDate() || new Date();
			var difference = parseInt(days)*24*60*60*1000;
			var newDay;
			if (sign === 'add') {
				newDay = new Date(day.valueOf() + difference);
			} else if (sign === 'subtract') {
				newDay = new Date(day.valueOf() - difference);
			}
			this.setDate(newDay);
		},

		adjustCalendars: function() {
			this.calendars[0] = adjustCalendar(this.calendars[0]);
			for (var c = 1; c < this._o.numberOfMonths; c++) {
				this.calendars[c] = adjustCalendar({
					month: this.calendars[0].month + c,
					year: this.calendars[0].year
				});
			}
			this.draw();
		},

		gotoToday: function()
		{
			this.gotoDate(new Date());
		},

		/**
		 * change view to a specific month (zero-index, e.g. 0: January)
		 */
		gotoMonth: function(month)
		{
			if (!isNaN(month)) {
				this.calendars[0].month = parseInt(month, 10);
				this.adjustCalendars();
			}
		},

		nextMonth: function()
		{
			this.calendars[0].month++;
			this.adjustCalendars();

			if (typeof this._o.onPaginate === 'function') {
				this._o.onPaginate('next', this.calendars[0].month, this.calendars[0].year);
			}            
		},

		prevMonth: function()
		{
			this.calendars[0].month--;
			this.adjustCalendars();

			if (typeof this._o.onPaginate === 'function') {
				this._o.onPaginate('prev', this.calendars[0].month, this.calendars[0].year);
			}
		},

		/**
		 * change view to a specific full year (e.g. "2012")
		 */
		gotoYear: function(year)
		{
			if (!isNaN(year)) {
				this.calendars[0].year = parseInt(year, 10);
				this.adjustCalendars();
			}
		},

		/**
		 * change the minDate
		 */
		setMinDate: function(value)
		{
			if(value instanceof Date) {
				var clone = new Date(value);
				setToStartOfDay(clone);
				this._o.minDate = clone;
				this._o.minYear  = clone.getFullYear();
				this._o.minMonth = clone.getMonth();
			} else {
				this._o.minDate = defaults.minDate;
				this._o.minYear  = defaults.minYear;
				this._o.minMonth = defaults.minMonth;
				this._o.startRange = defaults.startRange;
			}

			this.draw();
		},

		/**
		 * change the maxDate
		 */
		setMaxDate: function(value)
		{
			if(value instanceof Date) {
				var clone = new Date(value);
				setToStartOfDay(clone);
				this._o.maxDate = clone;
				this._o.maxYear = clone.getFullYear();
				this._o.maxMonth = clone.getMonth();
			} else {
				this._o.maxDate = defaults.maxDate;
				this._o.maxYear = defaults.maxYear;
				this._o.maxMonth = defaults.maxMonth;
				this._o.endRange = defaults.endRange;
			}

			this.draw();
		},

		setStartRange: function(value)
		{
			this._o.startRange = value;
		},

		setEndRange: function(value)
		{
			this._o.endRange = value;
		},

		/**
		 * refresh the HTML
		 */
		draw: function(force)
		{
			if (!this._v && !force) {
				return;
			}
			var opts = this._o,
				minYear = opts.minYear,
				maxYear = opts.maxYear,
				minMonth = opts.minMonth,
				maxMonth = opts.maxMonth,
				html = '',
				randId;

			if (this._y <= minYear) {
				this._y = minYear;
				if (!isNaN(minMonth) && this._m < minMonth) {
					this._m = minMonth;
				}
			}
			if (this._y >= maxYear) {
				this._y = maxYear;
				if (!isNaN(maxMonth) && this._m > maxMonth) {
					this._m = maxMonth;
				}
			}

			for (var c = 0; c < opts.numberOfMonths; c++) {
				randId = 'pika-title-' + Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 2);
				html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year, randId) + this.render(this.calendars[c].year, this.calendars[c].month, randId) + '</div>';
			}

			this.el.innerHTML = html;

			if (opts.bound) {
				if(opts.field.type !== 'hidden') {
					sto(function() {
						opts.trigger.focus();
					}, 1);
				}
			}

			if (typeof this._o.onDraw === 'function') {
				this._o.onDraw(this);
			}

			if (opts.bound) {
				// let the screen reader user know to use arrow keys
				opts.field.setAttribute('aria-label', opts.ariaLabel);
			}
		},

		adjustPosition: function()
		{
			var field, pEl, fieldWidth, fieldHeight, width, height, viewportWidth, viewportHeight, scrollTop, left, top, clientRect, leftAligned, bottomAligned;

			if (this._o.container) return;

			this.el.style.position = 'absolute';

			field = this._o.trigger;
			pEl = field;
			fieldWidth = (typeof field.getBBox === 'function') ? field.getBBox().width : field.offsetWidth
			fieldHeight = (typeof field.getBBox === 'function') ? field.getBBox().height : field.offsetHeight
			width = this.el.offsetWidth;
			height = this.el.offsetHeight;
			viewportWidth = window.innerWidth || document.documentElement.clientWidth;
			viewportHeight = window.innerHeight || document.documentElement.clientHeight;
			scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;
			leftAligned = true;
			bottomAligned = true;

			if (typeof field.getBoundingClientRect === 'function') {
				clientRect = field.getBoundingClientRect();
				left = clientRect.left + window.pageXOffset;
				top = clientRect.bottom + window.pageYOffset;
			} else {
				left = pEl.offsetLeft;
				top  = pEl.offsetTop + pEl.offsetHeight;
				while((pEl = pEl.offsetParent)) {
					left += pEl.offsetLeft;
					top  += pEl.offsetTop;
				}
			}

			// default position is bottom & left
			if ((this._o.reposition && left + width > viewportWidth) ||
				(
					this._o.position.indexOf('right') > -1 &&
					left - width + fieldWidth > 0
				)
			) {
				left = Math.max(left - width + fieldWidth, 0);
				leftAligned = false;
			}
			if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
				(
					this._o.position.indexOf('top') > -1 &&
					top - height - fieldHeight > 0
				)
			) {
				top = Math.max(top - height - fieldHeight, 0);
				bottomAligned = false;
			}

			if (left < 0) {
				left = 0;
			}

			if (top < 0) {
				top = 0;
			}

			this.el.style.left = left + 'px';
			this.el.style.top = top + 'px';

			addClass(this.el, leftAligned ? 'left-aligned' : 'right-aligned');
			addClass(this.el, bottomAligned ? 'bottom-aligned' : 'top-aligned');
			removeClass(this.el, !leftAligned ? 'left-aligned' : 'right-aligned');
			removeClass(this.el, !bottomAligned ? 'bottom-aligned' : 'top-aligned');
		},

		/**
		 * render HTML for a particular month
		 */
		render: function(year, month, randId)
		{
			var opts   = this._o,
				now    = new Date(),
				days   = getDaysInMonth(year, month),
				before = new Date(year, month, 1).getDay(),
				data   = [],
				row    = [];
			setToStartOfDay(now);
			if (opts.firstDay > 0) {
				before -= opts.firstDay;
				if (before < 0) {
					before += 7;
				}
			}
			var previousMonth = month === 0 ? 11 : month - 1,
				nextMonth = month === 11 ? 0 : month + 1,
				yearOfPreviousMonth = month === 0 ? year - 1 : year,
				yearOfNextMonth = month === 11 ? year + 1 : year,
				daysInPreviousMonth = getDaysInMonth(yearOfPreviousMonth, previousMonth);
			var cells = days + before,
				after = cells;
			while(after > 7) {
				after -= 7;
			}
			cells += 7 - after;
			var isWeekSelected = false;
			for (var i = 0, r = 0; i < cells; i++)
			{
				var day = new Date(year, month, 1 + (i - before)),
					isSelected = !!opts.selectDayFn ? opts.selectDayFn(day) : (isDate(this._d) && compareDates(day, this._d)),
					isToday = compareDates(day, now),
					hasEvent = opts.events.indexOf(day.toDateString()) !== -1 ? true : false,
					isEmpty = i < before || i >= (days + before),
					dayNumber = 1 + (i - before),
					monthNumber = month,
					yearNumber = year,
					isStartRange = opts.startRange && compareDates(opts.startRange, day),
					isEndRange = opts.endRange && compareDates(opts.endRange, day),
					isInRange = opts.startRange && opts.endRange && opts.startRange < day && day < opts.endRange,
					isDisabled= (opts.minDate && day < opts.minDate) ||
								(opts.maxDate && day > opts.maxDate) ||
								(opts.disableWeekends && isWeekend(day)) ||
								(opts.disableDayFn && opts.disableDayFn(day) ||
								(opts.disabledDays.indexOf(day.toDateString()) !== -1 ? true : false) ||
								(opts.enabledDays.length > 0 && (opts.enabledDays.indexOf(day.toDateString()) !== -1 ? false : true)));

				if (isEmpty) {
					if (i < before) {
						dayNumber = daysInPreviousMonth + dayNumber;
						monthNumber = previousMonth;
						yearNumber = yearOfPreviousMonth;
					} else {
						dayNumber = dayNumber - days;
						monthNumber = nextMonth;
						yearNumber = yearOfNextMonth;
					}
				}

				var dayConfig = {
						day: dayNumber,
						month: monthNumber,
						year: yearNumber,
						hasEvent: hasEvent,
						isSelected: isSelected,
						isToday: isToday,
						isDisabled: isDisabled,
						isEmpty: isEmpty,
						isStartRange: isStartRange,
						isEndRange: isEndRange,
						isInRange: isInRange,
						showDaysInNextAndPreviousMonths: opts.showDaysInNextAndPreviousMonths,
						enableSelectionDaysInNextAndPreviousMonths: opts.enableSelectionDaysInNextAndPreviousMonths
					};

				if (opts.pickWholeWeek && isSelected) {
					isWeekSelected = true;
				}

				row.push(renderDay(dayConfig));

				if (++r === 7) {
					if (opts.showWeekNumber) {
						row.unshift(renderWeek(i - before, month, year, opts.firstWeekOfYearMinDays));
					}
					data.push(renderRow(row, opts.isRTL, opts.pickWholeWeek, isWeekSelected));
					row = [];
					r = 0;
					isWeekSelected = false;
				}
			}
			return renderTable(opts, data, randId);
		},

		isVisible: function()
		{
			return this._v;
		},

		show: function()
		{
			if (!this.isVisible()) {
				this._v = true;
				this.draw();
				removeClass(this.el, 'is-hidden');
				if (this._o.bound) {
					addEvent(document, 'click', this._onClick);
					this.adjustPosition();
				}
				if (typeof this._o.onOpen === 'function') {
					this._o.onOpen.call(this);
				}
			}
		},

		hide: function()
		{
			var v = this._v;
			if (v !== false) {
				if (this._o.bound) {
					removeEvent(document, 'click', this._onClick);
				}

				if (!this._o.container) {
					this.el.style.position = 'static'; // reset
					this.el.style.left = 'auto';
					this.el.style.top = 'auto';
				}
				addClass(this.el, 'is-hidden');
				this._v = false;
				if (v !== undefined && typeof this._o.onClose === 'function') {
					this._o.onClose.call(this);
				}
			}
		},

		/**
		 * GAME OVER
		 */
		destroy: function()
		{
			var opts = this._o;

			this.hide();
			removeEvent(this.el, 'touchstart', this._onTouchStart, true);
			removeEvent(this.el, 'touchcancel', this._onTouchCancel, true);
			removeEvent(this.el, 'touchend', this._onTouchEnd, true);
			removeEvent(this.el, 'mousedown', this._onMouseDown, true);
			removeEvent(this.el, 'change', this._onChange);
			if (opts.keyboardInput) {
				removeEvent(document, 'keydown', this._onKeyChange);
			}
			if (opts.field) {
				removeEvent(opts.field, 'change', this._onInputChange);
				if (opts.bound) {
					removeEvent(opts.trigger, 'click', this._onInputClick);
					removeEvent(opts.trigger, 'focus', this._onInputFocus);
					removeEvent(opts.trigger, 'blur', this._onInputBlur);
				}
			}
			if (this.el.parentNode) {
				this.el.parentNode.removeChild(this.el);
			}
		}

	};

	return Pikaday;
}));

