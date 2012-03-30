// The following lifted from some forum on the net:
function selectAll(objId) {
        (function() {
                if (document.selection) document.selection.empty();
                else if (window.getSelection)
                        window.getSelection().removeAllRanges();
        })();
	if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById(objId));
            range.select();
	}
	else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(document.getElementById(objId));
            window.getSelection().addRange(range);
	}
}