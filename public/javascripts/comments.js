function getAndShow(id, comments, cur, iter) {
    var reply = document.getElementById('replies-' + id);
    if (cur != null)
        cur.innerHTML = cur.innerHTML.replace('hide','show');
    if (reply.style.display == 'none') {
        getComments(id, reply, comments, iter);
        if (cur != null)
            cur.innerHTML = cur.innerHTML.replace('show','hide');
    }
    showComments(reply);
}

function getComments(parent_id, reply, comments, iter) {
    comments.reverse().forEach(function(comment_id, i, a) {
        if (window.XMLHttpRequest) { xmlhttp=new XMLHttpRequest(); }
        else { xmlhttp=new ActiveXObject("Microsoft.XMLHTTP"); }
        xmlhttp.open("GET", "/view/" + comment_id + "?json=" + (new Date()).getTime(),false);
        xmlhttp.send();
        var the_comment = JSON.parse(xmlhttp.responseText);
        
        var comment = document.createElement('div');
            comment.setAttribute('class', 'comment');
            comment.setAttribute('id', 'comments-' + comment_id);
            var anchor = document.createElement('a');
                anchor.setAttribute('name', parent_id + '.' + comment_id);
            comment.appendChild(anchor);
            var span = document.createElement('span');
            	if (the_comment.author.username == 'anonymous') {
            		span.innerHTML += 'anonymous';
            	} else {
	                var author = document.createElement('a');
	                    author.setAttribute('href','/user/' + the_comment.author.username);
	                    author.innerHTML = the_comment.author.displayName;
	                span.appendChild(author);
                }
                span.innerHTML += ' on ' + the_comment.date + ' ';
                var reply = document.createElement('a');
                    reply.setAttribute('href', '/paste/' + comment_id + '/' + the_comment.title);
                    reply.innerHTML = 'reply';
                span.appendChild(reply);
                if (the_comment.comments.length > 0 && iter < 9) {
                    span.innerHTML += ' - ';
                    reply = []; reply = document.createElement('a');
                    reply.setAttribute('href', '#' + parent_id + '.' + comment_id);
                    reply.setAttribute('onclick', "getAndShow('" + comment_id + "', " + JSON.stringify(the_comment.comments) + ", this, " + (1+iter) + ");");
                    reply.innerHTML = 'show ' + the_comment.comments.length + ' repl' + ((the_comment.comments.length==1)?'y':'ies');
                    span.appendChild(reply);
                } else if (the_comment.comments.length > 0) {
                    span.innerHTML += ' - ';
                    reply = []; reply = document.createElement('a');
                    reply.setAttribute('href', '/paste/' + comment_id + '/' + the_comment.title);
                    reply.innerHTML = 'view ' + the_comment.comments.length + ' repl' + ((the_comment.comments.length==1)?'y':'ies');
                    span.appendChild(reply);
                }
            comment.appendChild(span);
            span = null; span = document.createElement('span');
                span.setAttribute('style', 'float: right');
                var report = document.createElement('a');
                    report.setAttribute('href', '/report/' + comment_id); report.innerHTML='report';
                span.appendChild(report);
                var anchor = null; anchor = document.createElement('a');
                    anchor.setAttribute('href', '#' + parent_id + '.' + comment_id);
                    anchor.innerHTML = '#';
                span.innerHTML += ' - ';
                span.appendChild(anchor);
            comment.appendChild(span);
            var p = document.createElement('p');
                p.innerHTML = the_comment.data.replace(/\n/g,"<br />\n");
            comment.appendChild(p);
        this.appendChild(comment);
        var subcomment = document.createElement('div');
        subcomment.setAttribute('class', 'subcomment');
        subcomment.setAttribute('style', 'display: none;');
        subcomment.setAttribute('id', 'replies-' + comment_id);
        this.appendChild(subcomment);
    }, reply);
}

function showComments(reply) {
    if (reply.style.display == 'block') {
        reply.style.display = 'none';
        reply.innerHTML = '';
    }
    else if (reply.style.display == 'none') reply.style.display = 'block';
}
