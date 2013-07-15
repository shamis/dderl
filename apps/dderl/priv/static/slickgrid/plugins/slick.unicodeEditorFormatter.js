// Helpers functions for the formatter & editor
// Tested on http://jsfiddle.net/YP42G/2/
/* Creates a uppercase hex number with at least length digits from a given number */
function fixedHex(number, length)
{
    var str = number.toString(16).toUpperCase();
    while(str.length < length) {
        str = "0" + str;
    }
    return str;
}

/* Creates a unicode literal based on the string */
function unicodeLiteral(str)
{
    var i;
    var result = "";
    for( i = 0; i < str.length; ++i) {
        if(str.charCodeAt(i) === 9) {
            result += "\\t";
        } else if(str.charCodeAt(i) === 10) {
            result += "\\n";
        } else if(str.charCodeAt(i) < 32) {
            result += "\\u" + fixedHex(str.charCodeAt(i),4);
        } else if(str.charCodeAt(i) !== 13) {
            result += str[i];
        }
    }
    return result;
}

/* Parse escaped unicode characters */
function fromUnicodeLiteral(str)
{
    var r = /\\u([\d\w]{4})/gi;
    str = str.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
    str = str.replace(/\\t/gi, "\t");
    str = str.replace(/\\n/gi, "\n");
    return unescape(str);
}

// adding new formatters to slickgrid
(function ($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "Formatters": {
                "Checkmark": CheckmarkFormatter,
                "AscDescSelect": AscDescSelectFormatter,
                "BinStringText": BinStringTextFormatter,
            },
            "Editors": {
                "ControlChars": ControlCharsEditor
            }
        }
    });

    function CheckmarkFormatter(row, cell, value, columnDef, dataContext) {
        return "<img src='./static/media/cross.png'>";
    }

    function AscDescSelectFormatter(row, cell, value, columnDef, dataContext) {
        return '<SELECT><OPTION value="true" '+ (value ? 'selected' : '') +'>ASC</OPTION>'+
            '<OPTION value="false" '+(!value ? 'selected' : '')+'>DESC</OPTION></SELECT>';
    }

    function BinStringTextFormatter(row, cell, value, columnDef, dataContext) {
        var newValue;
        if (value == null) {
            newValue = "";
        } else {
            newValue = value.toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        }
        return unicodeLiteral(newValue);
    }

    function ControlCharsEditor(args) {
        var $input;
        var defaultValue;
        var scope = this;

        this.init = function () {
            $input = $("<INPUT type=text class='editor-text' />")
                .appendTo(args.container)
                .bind("keydown.nav", function (e) {
                    if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
                        e.stopImmediatePropagation();
                    }
                })
                .focus()
                .select();
        };

        this.destroy = function () {
            $input.remove();
        };

        this.focus = function () {
            $input.focus();
        };

        this.loadValue = function (item) {
            defaultValue = item[args.column.field] || "";
            $input.val(unicodeLiteral(defaultValue));
            $input[0].defaultValue = defaultValue;
            $input.select();
        };

        this.serializeValue = function () {
            return fromUnicodeLiteral($input.val());
        };

        this.applyValue = function (item, state) {
            item[args.column.field] = state;
        };

        this.isValueChanged = function () {
            return (!($input.val() == "" && defaultValue == null)) && (fromUnicodeLiteral($input.val()) != defaultValue);
        };

        this.validate = function () {
            if (args.column.validator) {
                var validationResults = args.column.validator($input.val());
                if (!validationResults.valid) {
                    return validationResults;
                }
            }

            return {
                valid: true,
                msg: null
            };
        };

        this.init();
    }
})(jQuery);