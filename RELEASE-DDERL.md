Application dderl
=================

Release history with new or improved features and bugfixes

Version 1.0.7 (Release Date TBD)
=======================================
* Generalized erlang term editor, now it support any text in read only format
* Improved ctrl+click selection to not clear the selection in case of small mouse drags
* Minimum size of columns set to fixed 40 pixels instead of proportional to the column name

Version 1.0.6 (Release Date 04.09.2013)
=======================================
* Fixed support to table operations on multi selection.
* Delete key now clear the content of the cells unless the full row is selected

Version 1.0.5 (Release Date 28.08.2013)
=======================================

* numeric columns are right aligned
* disconnecting from the system clean up all the session related processes in a shorter time
* added a Window entry on the menu to allow easier selection of open tables
* added support to perform table operations using multiple selection

* fix click on a disabled table behind the erlang term editor steal the focus

Version 1.0.4 (Release Date 08.08.2013)
=======================================

* added table operations drop, truncate, snapshot and restore as context menu of the data
* erlang term editor now support functions inside binaries and preserve comments
* implemented auto edit replacing the content of the current cell on key press
* Enter and f2 keys set the cell to edit mode, positioning the caret at the end of the text-box
* Enter key when the cell is in edit mode, accept the new value and move to the next cell
* added support to have more than one table in edit mode at the time
* shift + arrows keys selection improved to select range instead of full rows
* implemented keep-alive ping mechanism to avoid losing the session if the browser is active
* initial view shown can be redefined by the user

* fix focus not being recover after scrolling
* fix drag bug when tables are bigger than the available space
* fix erlang term editor crash on empty tuples
* fix error after reload a table with an active cell editor

Version 1.0.3 (Release Date 09.07.2013)
=======================================

* check for compatible versions of the dependencies running
* improved positioning of sort windows and sql editor
* control characters in the data are now shown as utf-8 escaped characters

* fix sorting by columns not presented in the table
* fix crash due to invalid utf-8 encoded data
* fix range selection

Version 1.0.2 (Release Date 25.06.2013)
=======================================

* added about dialog to get information about the applications in the system
* implemented erlang term editor with automatic formatting
* included support for Internet Explorer 9

* fix right click error on empty row