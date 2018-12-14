/*global $*/

/*

Form Validation Functions
=========================

license: http://creativecommons.org/licenses/by/1.0/
core code by Chris Nott (chris[at]dithered[dot]com)
Extensive modifications by Singlebrook Technology (info[at]singlebrook[dot]com)

Inline Errors
-------------

To avoid the alert() display of the forms errors, you should add the
following error containers.

* An element with id of [form.id]_error. This will hold the overall
error message for the form. This is optional. Note that your form must
have an id if you want to use this field.
* For each form input with validation rules, an element with id of
[input.id]_error. This will hold the error message for that input.

There are a few CSS classes that you should implement to work with
inline errors:

* input.error will be applied to inputs that are in an error state.
Use it for colored borders or backgrounds,   or an error icon as a
background image.
* .hidden will be applied to error containers (see above) when errors
are cleared. It should contain display:none;

*/

/* `getFormErrors` returns an array of hashes with keys (element, text) */
/* trimWS is an argument that allows one to be explicit about their desires to
	trim white space while validating text fields. When False, if a field is required,
	it will check that the field's value isn't all white space, but will not affect
	the field's value. By default trimWS is true (original functionality) */
function getFormErrors(form, trimWS) { // eslint-disable-line no-unused-vars
  var errors = new Array();
  if( trimWS === undefined ){ trimWS = true; }

  var arAttributes = new Array(
    'desc',
    'data-required',
    'requiredError',
    'maxlength',
    'maxlengthError',
    'minlength',
    'minlengthError',
    'mindate',
    'mindateError',
    'maxdate',
    'maxdateError',
    'data-pattern',
    'patternError',
    'data-pattern-inverse',
    'patternInverseError',
    'disallowEmptyValue',
    'disallowEmptyValueError',
    'minval',
    'maxval');

  // loop thru all form elements
  for( var elementIndex = 0; elementIndex < form.elements.length; elementIndex++ ){
    var element = form.elements[elementIndex];

    // Copy relevant attributes to element properties for all element types excepts radios and checkboxes.
    // This allows us to put the validation params right in the form element tags.
    for( var i = 0; i < arAttributes.length; i++ ){
      if( element.hasAttribute(arAttributes[i]) ){
        // The "new String(...).replace(...).replace(...) below removes line break chars that can cause IE7 to choke and escapes double-quote chars
        element[arAttributes[i]] = new String(element.getAttribute(arAttributes[i])).replace(/[\r\n]/g, '').replace(/"/g, '\\"');
      }
    }

    /* Is the element required?  A "data-required" value of "no" will now
			be treated as false (not required) -Jared 8/17/11 */
    var isRequired = (typeof element['data-required'] != 'undefined') && (element['data-required'].toLowerCase() != 'no');

    // text and textarea types
    if (element.type == 'text' || element.type == 'textarea') {
      if( trimWS ){ element.value = trimWhitespace(element.value); }
      var eleValue = trimWhitespace(element.value);

      // required element
      if (isRequired && eleValue == '') {
        errors[errors.length] = makeError('cannot be blank', element, element.requiredError);
      }

      // maximum length
      else if (element.maxlength && isValidLength(eleValue, 0, element.maxlength) == false) {
        errors[errors.length] = makeError('cannot be longer than ' + element.maxlength + ' characters', element, element.maxlengthError);
      }

      // minimum length
      else if (element.minlength && isValidLength(eleValue, element.minlength, Number.MAX_VALUE) == false) {
        errors[errors.length] = makeError('cannot be shorter than ' + element.minlength + ' characters', element, element.minlengthError);
      }

      else if( element.maxdate || element.mindate ){
        var testDate = new Date(eleValue);
        // maximum date
        if (element.maxdate) {
          var maxDate = new Date( element.maxdate );
          if( isNonOverflowedDate(eleValue) == false ){
            errors[errors.length] = makeError('must be a valid date', element, element.patternError);
          }
          else if( maxDate < testDate ){
            errors[errors.length] = makeError('cannot be later than ' + element.maxdate, element, element.maxdateError);
          }
        }
        // minimum date
        if (element.mindate) {
          var minDate = new Date( element.mindate );
          if( isNonOverflowedDate(eleValue) == false ){
            errors[errors.length] = makeError('must be a valid date', element, element.patternError);
          }
          else if( minDate > testDate ){
            errors[errors.length] = makeError('cannot be earlier than ' + element.mindate, element, element.mindateError);
          }
        }
      }

      // pattern (credit card number, email address, zip or postal code, alphanumeric, numeric)
      else if (element['data-pattern'] && eleValue.length != 0) {
        if (
          (
            (
              element['data-pattern'].toLowerCase() == 'visa' ||
              element['data-pattern'].toLowerCase() == 'mastercard' ||
              element['data-pattern'].toLowerCase() == 'american express' ||
              element['data-pattern'].toLowerCase() == 'diners club' ||
              element['data-pattern'].toLowerCase() == 'discover' ||
              element['data-pattern'].toLowerCase() == 'enroute' ||
              element['data-pattern'].toLowerCase() == 'jcb' ||
              element['data-pattern'].toLowerCase() == 'credit card'
            ) && isValidCreditCard(eleValue, element['data-pattern']) == false
          ) ||
          (element['data-pattern'].toLowerCase() == 'email' && isValidEmailStrict(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'zip or postal code' && isValidZipcode(eleValue) == false && isValidPostalcode(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'zipcode' && isValidZipcode(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'postal code' && isValidPostalcode(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'us phone number' &&
            ( (element.prefix && element.suffix && isValidUSPhoneNumber(eleValue, form[element.prefix].value, form[element.suffix].value) == false) ||
              (!element.prefix && !element.suffix && isValidUSPhoneNumber(eleValue) == false) ) ) ||
          (element['data-pattern'].toLowerCase() == 'alphanumeric' && isAlphanumeric(eleValue, true) == false) ||
          (element['data-pattern'].toLowerCase() == 'numeric' && isNumeric(eleValue, false) == false) ||

          /* integers */
          (element['data-pattern'].toLowerCase() == 'integer' && isInteger(eleValue, false, false) == false) ||
          (element['data-pattern'].toLowerCase() == 'english integer' && isInteger(eleValue, false, true) == false) ||
          (element['data-pattern'].toLowerCase() == 'year' && isInteger(eleValue, false, false) == false) ||

          /* dates and times */
          (element['data-pattern'].toLowerCase() == 'datetime' && isDate(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'date' && isNonOverflowedDate(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'time' && isTime(eleValue) == false) ||
          (element['data-pattern'].toLowerCase() == 'alphabetic' && isAlphabetic(eleValue, true) == false) ||
          (element['data-pattern'].substring(0, 1) == '/' && matchesRegexString(eleValue, element['data-pattern']) == false)
        ) {
          errors[errors.length] = makeError('must be a valid ' + element['data-pattern'], element, element.patternError);
        }
      }

      else if (element['data-pattern-inverse'] && eleValue.length != 0){
        if (element['data-pattern-inverse'].substring(0, 1) == '/' && matchesRegexString(eleValue, element['data-pattern-inverse'])){
          errors[errors.length] = makeError('must be a valid ' + element['data-pattern-inverse'], element, element.patternInverseError);
        }
      }

      // minimum and maximum value
      // strip commas
      var testval = eleValue;
      while (testval.match(/,/) == ',')
        testval = testval.replace(',', '');

      if (testval.replace(/\s/g, '') != '' && isNumeric(testval, false)) {
        if (element.minval && (1*testval < 1*element.minval))
          errors[errors.length] = makeError('cannot be less than ' + element.minval, element);

        if (element.maxval && isNumeric(testval, false) && (1*testval > 1*element.maxval))
          errors[errors.length] = makeError('cannot be greater than ' + element.maxval, element);
      }

    }

    // password
    else if (element.type == 'password') {

      // required element
      if (isRequired  && element.value == '') {
        errors[errors.length] = makeError('cannot be blank', element, element.requiredError);
      }

      // maximum length
      else if (element.maxlength && isValidLength(element.value, 0, element.maxlength) == false) {
        errors[errors.length] = makeError('cannot be longer than ' + element.maxlength + ' characters', element, element.maxlengthError);
      }

      // minimum length
      else if (element.minlength && isValidLength(element.value, element.minlength, Number.MAX_VALUE) == false) {
        errors[errors.length] = makeError('cannot be shorter than ' + element.minlength + ' characters', element, element.minlengthError);
      }
    }

    // file upload
    else if (element.type == 'file') {

      // required element
      if (isRequired  && element.value == '') {
        errors[errors.length] = makeError('cannot be blank', element, element.requiredError);
      }
    }

    // select
    else if (element.type == 'select-one' || element.type == 'select-multiple' || element.type == 'select') {

      // required element
      if (isRequired && element.selectedIndex == -1) {
        errors[errors.length] = makeError('cannot be blank', element, element.requiredError);
      }

      // disallow empty value selection for select boxes
      else if (element.disallowEmptyValue && (element.selectedIndex == -1 || element.options[element.selectedIndex].value == '')) {
        errors[errors.length] = makeError('cannot be blank', element, element.disallowEmptyValueError);
      }

      /* Issue: IE users experience false disallowEmptyValue errors.
					Root problem: IE returns the empty stirng for the option value
					Workaround: Explicitly supply the value attribute for your option elements
					Blame: IE fails to follow the W3C HTML Spec Section 17.6
					The spec says: "[The value] attribute specifies the initial value of the control.
						If this attribute is not set, the initial value is set
						to the contents of the OPTION element."
					-Jared 3/27/09
				*/

    }

    // radio buttons
    else if (element.type == 'radio' || element.type == 'checkbox') {
      var radiogroup = form.elements[element.name];

      // required element
      if( radiogroup != undefined && radiogroup.length && radiogroup[0] && (radiogroup[0]['data-required'] || radiogroup['data-required']) ){
        var checkedRadioButton = -1;
        for (var radioIndex = 0; radioIndex < radiogroup.length; radioIndex++) {
          if (radiogroup[radioIndex].checked == true) {
            checkedRadioButton = radioIndex;
            break;
          }
        }

        // show error if required and flag group as having been tested
        if (checkedRadioButton == -1 && !radiogroup.tested) {
          if (radiogroup[0].requiredError)
            errors[errors.length] = makeError('cannot be blank', radiogroup[0], radiogroup[0].requiredError);
          else
            errors[errors.length] = makeError('cannot be blank', radiogroup, radiogroup.requiredError);

          radiogroup.tested = true;
        }

        // last radio button in group?  reset tested flag
        if (element == radiogroup[radiogroup.length - 1]) {
          radiogroup.tested = false;
        }
      }

      radiogroup = null;
    }
  }

  return errors;
} // end getFormErrors()


// Check that the number of characters in a string is between a max and a min
function isValidLength(string, min, max) {
  if (string.length < min || string.length > max) return false;
  else return true;
}

// Check that a credit card number is valid based using the LUHN formula (mod10 is 0)
function isValidCreditCard(number) {
  number = '' + number;

  if (number.length > 16 || number.length < 13 ) return false;
  else if (getMod10(number) != 0) return false;
  else if (arguments[1]) {
    var type = arguments[1];
    var first2digits = number.substring(0, 2);
    var first4digits = number.substring(0, 4);

    if (type.toLowerCase() == 'visa' && number.substring(0, 1) == 4 &&
      (number.length == 16 || number.length == 13 )) return true;
    else if (type.toLowerCase() == 'mastercard' && number.length == 16 &&
      (first2digits == '51' || first2digits == '52' || first2digits == '53' || first2digits == '54' || first2digits == '55')) return true;
    else if (type.toLowerCase() == 'american express' && number.length == 15 &&
      (first2digits == '34' || first2digits == '37')) return true;
    else if (type.toLowerCase() == 'diners club' && number.length == 14 &&
      (first2digits == '30' || first2digits == '36' || first2digits == '38')) return true;
    else if (type.toLowerCase() == 'discover' && number.length == 16 && first4digits == '6011') return true;
    else if (type.toLowerCase() == 'enroute' && number.length == 15 &&
      (first4digits == '2014' || first4digits == '2149')) return true;
    else if (type.toLowerCase() == 'jcb' && number.length == 16 &&
      (first4digits == '3088' || first4digits == '3096' || first4digits == '3112' || first4digits == '3158' || first4digits == '3337' || first4digits == '3528')) return true;

    // if the above card types are all the ones that the site accepts, change the line below to 'else return false'
    else return true;
  }
  else return true;
}

// Check that an email address is valid based on RFC 821 (?)
function isValidEmail(address) {
  if (address != '' && address.search) {
    if (address.search(/^\w+((-\w+)|(\.\w+)|('\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) != -1) {
      return true;
    } else {
      return false;
    }
  }

  // allow empty strings to return true - screen these with either a 'required' test or a 'length' test
  else return true;
}

// Check that an email address has the form something@something.something
// This is a stricter standard than RFC 821 (?) which allows addresses like postmaster@localhost
function isValidEmailStrict(address) {
  if (isValidEmail(address) == false) return false;
  var domain = address.substring(address.indexOf('@') + 1);
  if (domain.indexOf('.') == -1) return false;
  if (domain.indexOf('.') == 0 || domain.indexOf('.') == domain.length - 1) return false;
  //TLD Validation. This doesn't allow for @localhost or @[ipaddress]
  if (!domain.match(/\.[a-zA-Z]{2,}$/)) return false;
  return true;
}


// Check that a US zip code is valid
function isValidZipcode(zipcode) {
  zipcode = removeSpaces(zipcode);
  if (!(zipcode.length == 5 || zipcode.length == 9 || zipcode.length == 10)) return false;
  if ((zipcode.length == 5 || zipcode.length == 9) && !isNumeric(zipcode)) return false;
  if (zipcode.length == 10 && zipcode.search && zipcode.search(/^\d{5}-\d{4}$/) == -1) return false;
  return true;
}


// Check that a Canadian postal code is valid
function isValidPostalcode(postalcode) {
  if (postalcode.search) {
    postalcode = removeSpaces(postalcode);
    if (postalcode.length == 6 && postalcode.search(/^[a-zA-Z]\d[a-zA-Z]\d[a-zA-Z]\d$/) != -1) return true;
    else if (postalcode.length == 7 && postalcode.search(/^[a-zA-Z]\d[a-zA-Z]-\d[a-zA-Z]\d$/) != -1) return true;
    else return false;
  }
  return true;
}

// Check that a US or Canadian phone number is valid
/* eslint-disable no-redeclare */
function isValidUSPhoneNumber(areaCode, prefixNumber, suffixNumber) {
  if (arguments.length == 1) {
    var phoneNumber = arguments[0];
    phoneNumber = phoneNumber.replace(/\D+/g, '');
    var length = phoneNumber.length;
    if (phoneNumber.length >= 7) {
      var areaCode = phoneNumber.substring(0, length-7);
      var prefixNumber = phoneNumber.substring(length-7, length-4);
      var suffixNumber = phoneNumber.substring(length-4);
    }
    else return false;
  }
  else if (arguments.length == 3) {
    var areaCode = arguments[0];
    var prefixNumber = arguments[1];
    var suffixNumber = arguments[2];
  }
  else return true;

  if (areaCode.length != 3 || !isNumeric(areaCode) || prefixNumber.length != 3 || !isNumeric(prefixNumber) || suffixNumber.length != 4 || !isNumeric(suffixNumber)) return false;
  return true;
}
/* eslint-enable no-redeclare */

// Check that a string contains only letters and numbers
function isAlphanumeric(string, ignoreWhiteSpace) {
  if (string.search) {
    if ((ignoreWhiteSpace && string.search(/[^\w\s]/) != -1) || (!ignoreWhiteSpace && string.search(/\W/) != -1)) return false;
  }
  return true;
}

// Check that a string contains only letters
function isAlphabetic(string, ignoreWhiteSpace) {
  if (string.search) {
    if ((ignoreWhiteSpace && string.search(/[^a-zA-Z\s]/) != -1) || (!ignoreWhiteSpace && string.search(/[^a-zA-Z]/) != -1)) return false;
  }
  return true;
}

// Check that a string contains only numbers and an optional decimal point and an optional leading hyphen
// NOTE: Currently empty strings, and the strings '-' and '.' and '-.' may be
// incorrectly reported as isNumeric
function isNumeric(string) {
  // Remove leading and trailing whitespace (currently only space chars) if we're ignoring whitespace
  string = string.replace(/(^\s+|\s+$)/g, '');
  // Remove the leading hyphen if there is one (in a negative number)
  string = string.replace(/^-/, '');
  // Remove a single decimal point
  string = string.replace(/\./, '');

  // Only numbers should be left
  if (string.search) {
    if (string.search(/[^\d]/) != -1) return false;
  }
  return true;
}

// Check that a string contains only digits (and optional commas)
function isInteger(string, ignoreWhiteSpace, allowCommas) {
  // Set default values
  if (typeof(ignoreWhiteSpace) == 'undefined')
    ignoreWhiteSpace = false;
  if (typeof(allowCommas) == 'undefined')
    allowCommas = false;

  // Strip commas out of string that we're checking for numericness
  if (allowCommas)
    string = string.replace(/,/g, '');

  if (!isNumeric(string, ignoreWhiteSpace))
    return false;
  // Compare these as strings, otherwise numbers with only zeros in the decimal places will pass the test
  if ('' + Math.round(string, 0) !=  '' + string)
    return false;
  return true;
}

function isDate(string)
{
  return !isNaN(new Date(string));
}

function isNonOverflowedDate(string) {
  // This function checks to see if a string is parseable as a date, and that it appears to be the same
  // date as the string passed in. This is to prevent the browser from happily accepting dates like
  // 13/13/2007 (turns into 1/13/2008)
  // It currently only accepts dates in the forms 'm?m[-/]d?d[-/]yyyy'

  var dateRegex = new RegExp('^\\d?\\d[-/]\\d?\\d[-/]\\d{4}$');

  if (!string.match(dateRegex))
    return false;

  var parsedDate = new Date(string);
  if (isNaN(parsedDate))
    return false;

  var month = parsedDate.getMonth() + 1;
  var day = parsedDate.getDate();
  var year = parsedDate.getFullYear();
  var parsedDateWithSlashes = '' + month + '/' + day + '/' + year;

  // Change dashes to slashes and strip leading zeros
  var inputStringWithSlashes = string.replace(/-/g, '/').replace(/^0/, '').replace(new RegExp('/0', 'g'), '/');

  if (parsedDateWithSlashes != inputStringWithSlashes) {
    return false;
  }

  return true;
}

function isTime(strTime) {
  // This needs some work. It currently says "33:30-pm" is a valid time.
  if (strTime.length == 0)
    return true;

  var strTestTime = new String(strTime);
  strTestTime.toUpperCase();

  var bolTime = false;

  if (strTestTime.indexOf('PM',1) != -1 || strTestTime.indexOf('AM',1))
    bolTime = true;

  if (bolTime && strTestTime.indexOf(':',0) == 0)
    bolTime = false;

  var nColonPlace = strTestTime.indexOf(':',1);
  if (bolTime && ((parseInt(nColonPlace) + 5) < (strTestTime.length - 1) || (parseInt(nColonPlace) + 4) > (strTestTime.length - 1)))
    bolTime = false;


  return bolTime;
}

// Remove characters that might cause security problems from a string
function removeBadCharacters(string) { // eslint-disable-line no-unused-vars
  if (string.replace) {
    string.replace(/[<>"'%;)(&+]/, '');
  }
  return string;
}

// Remove all spaces from a string
function removeSpaces(string) {
  var newString = '';
  for (var i = 0; i < string.length; i++) {
    if (string.charAt(i) != ' ') newString += string.charAt(i);
  }
  return newString;
}

// Remove leading and trailing whitespace from a string
function trimWhitespace(string) {
  var newString  = '';
  var substring  = '';
  var beginningFound = false;

  // copy characters over to a new string
  // retain whitespace characters if they are between other characters
  for (var i = 0; i < string.length; i++) {

    // copy non-whitespace characters
    if (string.charAt(i) != ' ' && string.charCodeAt(i) != 9) {

      // if the temporary string contains some whitespace characters, copy them first
      if (substring != '') {
        newString += substring;
        substring = '';
      }
      newString += string.charAt(i);
      if (beginningFound == false) beginningFound = true;
    }

    // hold whitespace characters in a temporary string if they follow a non-whitespace character
    else if (beginningFound == true) substring += string.charAt(i);
  }
  return newString;
}

// Returns a checksum digit for a number using mod 10
function getMod10(number) {

  // convert number to a string and check that it contains only digits
  // return -1 for illegal input
  number = '' + number;
  number = removeSpaces(number);
  if (!isNumeric(number)) return -1;

  // calculate checksum using mod10
  var checksum = 0;
  for (var i = number.length - 1; i >= 0; i--) {
    var isOdd = ((number.length - i) % 2 != 0) ? true : false;
    var digit = number.charAt(i);

    if (isOdd) checksum += parseInt(digit);
    else {
      var evenDigit = parseInt(digit) * 2;
      if (evenDigit >= 10) checksum += 1 + (evenDigit - 10);
      else checksum += evenDigit;
    }
  }
  return (checksum % 10);
}

/* `showErrors` displays the errors inline or as an alert(). Note the new form arg! */
function showErrors (errors, form, customErrorListHeader, customErrorListFooter, scrollToErrors) { // eslint-disable-line no-unused-vars
  var errorContainer;
  var undisplayedErrorCount = 0;
  var scrollToErrors = typeof scrollToErrors == 'undefined' ? true : scrollToErrors; // eslint-disable-line no-redeclare

  if (form) {
    formval_clearErrors(form);
  }

  if (errors.length > 0) {
    var errorMessage = customErrorListHeader !== undefined ? customErrorListHeader :
      'The form was not submitted due to the following problem' + ((errors.length > 1) ? 's' : '') + ':';
    var errMessages = [];
    for (var errorIndex = 0; errorIndex < errors.length; errorIndex++) {

      // Add "error" class to form input
      if (document.getElementById(errors[errorIndex]['id']))
        formval_addClass(document.getElementById(errors[errorIndex]['id']), 'error');

      // Populate the [id]_error element (if it exists) with the error message
      errorContainer = document.getElementById(errors[errorIndex]['id'] + '_error');
      if (errorContainer) {
        errorContainer.innerHTML = errors[errorIndex]['text'];
        formval_removeClass(errorContainer, 'hidden');
      }
      else
        undisplayedErrorCount++;

      var thisErrMsg = '<li>' + errors[errorIndex]['text'] + '</li>';
      if( errMessages.indexOf(thisErrMsg) == -1 ){
        errMessages.push(thisErrMsg);
      }

    }
    errorMessage += '<ul>' + errMessages.join('') + '</ul>';


    errorMessage += customErrorListFooter !== undefined ? customErrorListFooter :
      'Please fix ' + ((errors.length > 1) ? 'these' : 'this') + ' problem' + ((errors.length > 1) ? 's' : '') + ' and resubmit the form.';
    var errorMessageForAlert = errorMessage.replace(/<li>/g, '\n* ').replace(/<\/?li>/g, '').replace(/<br \/>/g, '\n').replace(/<ul>/g, '\n').replace(/<\/?ul>/g, '\n\n');

    // Display an error message for the overall form
    if (form) {
      var errorContainerId = form.getAttribute('id') + '_error';
      errorContainer = document.getElementById(errorContainerId);
      if (errorContainer) {
        formval_removeClass(errorContainer, 'hidden');
        try { errorContainer.innerHTML = errorMessage; }
        catch(er) {
          /* Our errorMessage contains block elements (The UL).
					The W3C spec does not allow block elements inside certain other elements,
					like paragraphs, for example.  Firefox does NOT follow the spec, and allows
					this assignment.  Internet Explorer 7 does follow the spec, and will throw
					an exception.  So, we handle that exception below. */
          errorContainer.innerHTML = 'There was a problem with your form.  Please check it and try again.';
        }

        if( scrollToErrors ){
          formval_scrollTo($('#' + errorContainerId));
        }
      }
      // Fallback to an alert if there were errors we couldn't display inline and there's no overall form error message area
      else if (undisplayedErrorCount > 0)
        alert(errorMessageForAlert);
    }
    // Fallback to an alert if there were errors we couldn't display inline and there's no overall form error message area
    else if (undisplayedErrorCount > 0)
      alert(errorMessageForAlert);

    return false;
  }

  // no errors: return true
  return true;
}

function formval_scrollTo(elm) {
  $('html, body').animate({ scrollTop: $(elm).offset().top }, 1000);
}

/* `makeError` creates an error (but does not add it to the array).
errorMsg will be preceded by element.desc, but customErrorMsg will
override errorMsg and does not get any prefix. */
function makeError (errorMsg, element, customErrorMsg) {
  var theError;               // The error text
  var stError = new Array();  // A hash with keys (id, text)

  if (customErrorMsg)
    theError = customErrorMsg;
  else if (element.desc)
    theError = element.desc + ' ' + errorMsg;
  else if (element.name)
    theError = element.name + ' ' + errorMsg;
  else
    theError = errorMsg;

  stError['id'] = element.id;
  stError['text'] = theError;

  return stError;
}



function matchesRegexString (value, regexString) {
  // Regex options are anything following the last slash
  var regexOpts = regexString.replace(/^.*\//, '');
  // Strip the leading slash and the last slash plus any options
  var regexNoSlashes = regexString.replace(/(^\/|\/([^/]*)$)/g, '');

  //alert("regexNoSlashes = " + regexNoSlashes + "\nregexOpts = " + regexOpts);

  var myRE = new RegExp(regexNoSlashes, regexOpts);

  if (value.match(myRE))
    return true;
  else
    return false;
}


// Adds a CSS class to an element
function formval_addClass (element, newClass) {
  var classRE = new RegExp('(^| )' + newClass + '($| )');
  if (!element.className.match(classRE))
    if (element.className == '')
      element.className = newClass;
    else
      element.className += ' ' + newClass;
}


function formval_clearErrors(form) {
  var arEls, i;
  // Clear all errors from the form
  // Inputs
  arEls = formval_getFormInputsWithErrors(form);
  for (i = 0; i < arEls.length; i++)
    formval_removeClass(arEls[i], 'error');
  // Error msgs
  arEls = formval_getFormErrorContainers(form);
  for (i = 0; i < arEls.length; i++) {
    arEls[i].innerHTML = '';
    formval_addClass(arEls[i], 'hidden');
  }
}


// Returns an array of elements matching the specified class. Parent node and tag type are optional.
function formval_getElementsByClass(searchClass,node,tag) {
  var i, j;
  var classElements = new Array();
  if (node == null)
    node = document;
  if (tag == null)
    tag = '*';
  var els = node.getElementsByTagName(tag);
  var elsLen = els.length;
  var pattern = new RegExp('(^|\\s)'+searchClass+'(\\s|$)');
  for (i = 0, j = 0; i < elsLen; i++) {
    if (pattern.test(els[i].className) ) {
      classElements[j] = els[i];
      j++;
    }
  }
  return classElements;
}


// Returns an array of elements meant to hold error message. These include the element with id
// [form.id]_error and any elements whose id is like [formelement.id]_error
function formval_getFormErrorContainers(form) {
  var arErrorContainers = new Array();

  if (document.getElementById(form.id + '_error'))
    arErrorContainers.push(document.getElementById(form.id + '_error'));

  for (var i = 0; i < form.elements.length; i++) {
    if (document.getElementById(form.elements[i].id + '_error'))
      arErrorContainers.push(document.getElementById(form.elements[i].id + '_error'));
  }

  return arErrorContainers;
}


// Returns an array of form inputs that are in an error condition.
function formval_getFormInputsWithErrors(form) {
  return formval_getElementsByClass('error', form, 'input').concat(
    formval_getElementsByClass('error', form, 'select')).concat(
    formval_getElementsByClass('error', form, 'textarea'));
}


// Removes a CSS class from an element
function formval_removeClass (element, theClass) {
  var classRE = new RegExp('(^| )' + theClass + '($| )');
  element.className = element.className.replace(classRE, ' ').replace(/ {2}/g, ' ');
}
