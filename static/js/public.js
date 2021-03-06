/* here the javascript functions used in 'last', 'compare' and 'related',
it is named 'public.js' because implement the usage of public APIs */

function initAuthor() {

    const videoId = window.location.href.split('/#').pop();
    if(_.size(videoId) < 6) {
        invalidVideoId(videoId, "URL should contain a valid-look-alike YouTube VideoId");
        $("#boring").hide();
        return console.log("error N#1 (validation)");
    }

    const url = buildApiUrl('author', videoId);
    console.log("using", videoId, "connecting to", url);

    $.getJSON(url, function (results) {

        if (_.size(results) === 0) {
            console.log("error N#2 (API)");
            return invalidVideoId(videoId);
        }

        /* if we reach here: good! we've data and now the page will be populated */
        $(".boring").hide();
        $("#title").removeAttr('hidden');
        $(".info").removeAttr('hidden');

        $(".name").text(results.authorName);
        $("#amount").text(results.total);
        $("#treasure-count").text(_.size(results.content.treasure));
        $("#foryou-count").text(_.size(results.content.foryou));
        $("#sameauthor-count").text(_.size(results.content.sameAuthor));

        /* cards creation */
        _.each(results.content.sameAuthor, _.partial(appendCard, "#sameauthor-cards"));
        _.each(results.content.foryou, _.partial(appendCard, "#foryou-cards"));
        _.each(results.content.treasure, _.partial(appendCard, "#treasure-cards"));
    });
}

function appendCard(targetId, video) {
    /* this function is used in the compare by author broken experiment! */

    if(_.size(video) != 1)
        console.log("Condition not properly tested!", video);

    video = _.first(video);
    // console.log(video);

    const entry = $("#master").clone();
    const computedId = `video-${video.id.replace(/[\ \-&=]/g, '')}`

    // TODO this regexp was to filter id with "&" which if they happen should not.

    entry.attr("id", computedId);
    $(targetId).append(entry);

    const t = $("#" + computedId);
    $("#" + computedId + " .card-title").text(video.relatedTitle);
    $("#" + computedId + " .card-text").text(video.relatedAuthorName);
    $("#" + computedId + " .text-muted").text(video.savingTime);
    $("#" + computedId).removeAttr('hidden');
}

function invalidVideoId(videoId, additionalInfo) {
    const msg = additionalInfo || "This video has not been watched by someone with ytTREX extension";
    const courtesy = videoId ?
        `Check if <a href="https://youtube.com/watch?v=${videoId}">is a valid video</a>.`
        : "";
    const nope = `
        <h3 class="text-center">Error ${msg}</h3>
        <p class="text-center">${courtesy}</p>
    `;

    $("#error").append(nope);
}

function buildCardsFromLast(containerId) {
    const url = buildApiUrl('last');
    console.log("buildCardsFromLast", url);
    $.getJSON(url, function (results) {
        // these are not really 'cards'
        _.each(results.content, function(video, i) {
            console.log(video);
            const appended =`
                    <a class="linked" href="/compare/#${video.videoId}">
                        ${video.title}
                    </a>
                    <smaller>
                        ${video.authorName} — ${video.timeago} ago
                    </smaller>
                <br/>`;
            $(containerId).append(appended);
        });
        $(".linked").click(function(e) {
            let x = $(this).attr('href');
            window.location.href = x;
            window.location.reload();
        });
    });
}

function initRelated() {
    let relatedId = null;

    if(_.size(window.location.href.split('/#')) == 2)
        relatedId = window.location.href.split('/#').pop();

    if(!relatedId) {
        invalidVideoId(null, "The URL hasn't a videoId; It is necessary, please take a recent one below."),
        buildCardsFromLast("#recent");
        $("#ifRandomVideos").show();
        return;
    }

    const url = buildApiUrl('related', relatedId);
    $.getJSON(url, function (results) {
        if (_.size(results) === 0)
            return invalidVideoId(relatedId, "This video never looks to be a 'related' content in any observation.");

        const target = _.find(results[0].related, {videoId: relatedId});
        if(!target)
            return invalidVideoId(relatedId, "Invalid data found in the database, please alert developers.");

        const hdr = `
            <div class="text-center protagonist">
                <h3>
                    ${target.title}
                </h3>
                <p class="strong">
                    ${_.size(results)} videos linked to this
                    <a class="notclassiclink" href="/compare/#${relatedId}">Compare</a>
                </p>
            </div>
        `;
        $('#related').append(hdr);

        $(".notclassiclink").click(function(e) {
            let x = $(this).attr('href');
            window.location.href = x;
            window.location.reload();
        });
        _.each(results, function (watched) {
            const match = _.find(watched.related, {videoId: relatedId});
            let videoEntry = `
                <tr id="${watched.videoId}" class="step">

                        <td class="video">
                            <b>${watched.title}</b>
                            <a class="primary" href="/compare/#${watched.videoId}">(compare)</a>
                        </td>
                        <td class="author">
                           ${watched.authorName}
                        </td>
                        <td class="foryou">
                           ${match.foryou}
                        </td>
                        <td class="position">
                           ${match.index}
                        </td>
                        <td>
                            ${watched.timeago} ago
                        </td>

                </tr>
            `;
            $('#related-list').append(videoEntry);
        });

        const thead = `
                <tr>
                    <th>Video watched</th>
                    <th>Channel</th>
                    <th><i>for you</i></th>
                    <th>Position</th>
                    <th>Happened</th>
                </tr>
            `;
        $('#related-list-head').append(thead);
    });
}

// #recent and #comparison
// with 'last' we populate some snippet
// with 'getVideoId' we get the videos, it is display the different comparison
function initCompare() {

    var compareId = null;

    if(_.size(window.location.href.split('/#')) == 2) {
        compareId = window.location.href.split('/#').pop();
    } 

    if(_.isNull(compareId)) {
        console.log("Not found any ID (returning without action) rif:", window.location.href);
        invalidVideoId(null, "— You should select a video —");
        buildCardsFromLast("#recent");
        $("#ifRandomVideos").show();
        return;
    }

    const url = buildApiUrl('videoId', compareId);
    $.getJSON(url, function (results) {
        if (_.size(results) == 0)
            return invalidVideoId(relatedId);

        const allrelated = _.flatten(_.map(results, 'related'));
        const csvVideoURL = buildApiUrl("videoCSV", results[0].videoId);

        $("#ifVideoExists").show();
        $("#title").text(results[0].title);
        $("#relatedSize").text(_.size(allrelated));
        $("#resultSize").text(_.size(results));
        $("#relatedLink").attr('href', `/related/#${results[0].videoId}`);
        $("#authorLink").attr('href', `/author/#${results[0].videoId}`);
        $("#author").text(results[0].authorName);
        $("#ytLink").attr('href', `https://www.youtube.com/watch?v=${results[0].videoId}`);
        $("#csvLink").attr('href', csvVideoURL);

        const x = _.reverse(_.orderBy(_.groupBy(allrelated, 'videoId'), _.size));

        let lastH = null;
        let tableBodyElement = null;
        let tableElement = null;
        _.each(x, function (relatedList) {
            let currentRepetition = _.size(relatedList);
            // something was seen three times now is seen twice ..
            if (currentRepetition != lastH) {
                // when this happen, create a new table
                tableElement = $("#table-master").clone();
                let tableId = "table-" + currentRepetition;
                tableElement.attr('id', tableId);
                $('#comparison').append(tableElement);
                // this bodyElement would be updated by <tr> below
                tableBodyElement = $("#" + tableId + '> tbody');
                // the tableHeader is on top. we might filter if the table become
                // too long.
                let tableHeader = $("#" + tableId + '> thead');
                // The text printed on top
                let printed = "Reccomended " + (currentRepetition > 1 ? currentRepetition + " times" : "once");
                tableHeader.html(`<tr>
                    <th><h2>${printed}</h2></th>
                    <th>Channel</th>
                    <th>Position</th>
                </tr>`);

                $("#" + tableId).append(tableHeader);
                // the table is display:none CSS until we don't display it
                $("#" + tableId).show();
            }
            // copy to spot if change in the next iterations
            lastH = currentRepetition;

            // this might or might not be useful: 1,2,11,5,15 what does it gives??
            const positions = _.join(_.map(relatedList, 'index'), ', ');
            const relatedVideo = _.first(relatedList);
            const videoEntry = `
                <tr id="${relatedVideo.videoId}" class="step">
                     <td class="video">
                         ${relatedVideo.title}<br />
                         <a class="linked" href="/related/#${relatedVideo.videoId}">Related</a> |
                         <a class="linked" href="/compare/#${relatedVideo.videoId}">Compare</a> |
                         <a target=_blank href="https://www.youtube.com/watch?v=${relatedVideo.videoId}">Video</a>
                    </td>
                    <td class="author">
                        ${relatedVideo.source}
                    </td>
                    <td class="position">
                         ${positions}
                    </td>
               </tr>
            `;
            tableBodyElement.append(videoEntry);
        });
        $(".linked").click(function(e) {
            let x = $(this).attr('href');
            window.location.href = x;
            window.location.reload();
        });
    });

}

function unfoldRelated(memo, e) {
    // this function is not called?
    let add = `
        <small class="related">
            <b>${e.index}</b>:
            <span>${e.title}</span>
            <a class="linked" href="/related/#${e.videoId}">See related</a> |
            <a target=_blank href="https://www.youtube.com/watch?v=${e.videoId}">See video</a>
        </small><br />
    `;
    memo += add;
    return memo;
}