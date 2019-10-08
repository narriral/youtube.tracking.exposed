/* functions used in 'personal' visualization */

function getPubKey() {
    const t = window.location.href.split('/#').pop();
    if(t.length < 40 ) console.log("Wrong token length in the URL");
    return t;
}

function personal(pages, profile) {

    if(!pages) pages = '10-0';
    else {
        $("#report").empty();
        pages = pages + '-' + (pages - 10);
    }
    const pk = getPubKey();
    const url = buildApiUrl('personal', pk + '/' + pages); // `/personal/${pk}/`);
    $.getJSON(url, (data) => {

        //console.log(data);
        let lastTimed = "";

        _.each(data.recent, function(video) {
            addVideoRow(video);
        });

        if(!profile) {
            addPages(data.total);
            updateProfileInfo(data.supporter);
        }
    });
}

function updateProfileInfo(profile) {
    /* da qui devono essere estratti i gruppi ed eventualmente altri metadati,
     per dire all'utente:
     1) ti riconsociamo
     2) ecco il tuo profilo
     AGGIUNGEREI -- 3 ) cancella il tuo tag (Se c'è), aggiungi un nuovo tag
     così si mescola un riquadro informativo alle uniche 2 attività consentite
     */
    const userDiv = $("#user");
    const userID = `${profile._id}`;
    const publicKey = `${profile.publicKey}`;
    const userName = `${profile.p}`;
    const createdAt = new Date(`${profile.creationTime}`);
    const lastActivity = new Date(`${profile.lastActivity}`);
    const createdAtFormatted =createdAt.toUTCString();
    const lastActivityFormatted =lastActivity.toUTCString();
    const tags = `${profile.tag.name}`;

    const h = `
    <p class="mb-2">Here you can find all data collected from your <b>Youtube activity</b> since <span class="badge badge-pill badge-light">${createdAtFormatted}</span></p>
    <ul class="mb-4">
       <li class="mr-1"><p class="mb-0">Your ID: <span class="badge badge-light align-middle">${userID}</span></p></li>
       <li class="mr-1"><p class="mb-0">Your key: <span class="badge badge-light align-middle"><i>${publicKey}</i></span></p></li>
       <li class="mr-1"><p class="mb-0">Last activity: <span class="badge badge-light align-middle">${lastActivityFormatted}</span></p></li>
    </ul>

    `;

    $('#user-name').text(userName);
    userDiv.append(h);
    if (tags) {
        const tag = `<h5>Your contribution is tagged as: <span class="badge badge-info">${tags}</span></h5>`;
        userDiv.append(tag);
    }
    console.log(profile);
}


function printMessage(element, text, type) {
    if(!type) var type = 'danger';
    element.html('<p class="alert alert-' + type + ' mb-3">' + text + '</p>');
}

function updateTags(e) {
    e.preventDefault();
    const pk = getPubKey();
    const form = $('#tag-form');
    const error = form.find('.error');
    const resultDiv = form.find('.result');
    error.empty();
    resultDiv.empty();
    const tagValue = $('#tag').val();
    const passwordCheck = $('input[name=public-private]').filter(':checked').val();
    const password = $('#password');
    const passwordValue = password.val();
    const url = 'https://youtube.tracking.exposed/api/v2/profile/' + pk + '/tag';
    let data = {};

    if(tagValue == null || tagValue == '') {
        printMessage(error, 'Please, enter a tag name.');
        return;
    }
    data.tag = tagValue;

    if(passwordCheck == 'private') {
        if(passwordValue == null || passwordValue == '') {
            printMessage(error, 'Password is mandatory for private tag.');
            return;
        }
        data.password = passwordValue;
        data.accessibility = 'private';
    } else {
        data.accessibility = 'public';
    }

    //console.log("Content sent in POST: ", url, data);

    return fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    }).then(function(response) {
        return response.json();
    }).then(function(result) {

        if(result.error == true) printMessage(resultDiv, result.message);
        else printMessage(resultDiv, 'Tag "<b>' + result.group.name + '</b>" has been created', 'success');

        console.log(result);

        return result;
    });
}


function downloadCSV() {
    const pk = getPubKey();
    const csvurl = `/api/v1/personal/${pk}/csv`;
    console.log("downloadCSV from: ", csvurl);
    window.open(csvurl);
}

function addPages(total) {
    if(total > 10) {
        var page;
        const pagesNumber = total / 10;
        const fixedPageNumber = Math.ceil(pagesNumber);
        const description = `There are <b>${total}</b> evidences in <b>${fixedPageNumber}</b> pages: `;
        $('#total-evidence').html(description);
        for (page = 1; page < fixedPageNumber + 1; page++) {
            let pageValue =  page + '0';
            $('#pagination').find('ul').append('<li class="page-item"><a class="page-link" onclick="personal(' + pageValue + ', true)">'+ page +'</a></li>');
        }
    }
}
function addVideoRow(video) {
    //var id = `${video.id}`;
    //let tbody = "<tbody id="+id+" style='display: none;'>";

    // IL MIO USO di alt="" dentro agli <a> è scorretto. vorrei che quell'informazione
    // uscisse questa non dovrebbe essere una tabella, ma delle <div class="row"

    const h = `
    <div class="row border-bottom p-2 mb-3 align-middle">
      <div class="col-7">
        <p class="mb-0">
          <small> ${video.relative} </small><br />
          <b>${video.title}</b>
        </p>
      </div>
      <nav class="col-5">
          <a
            class="compare icon-small mb-1"
            title="Compare all the evidences on ${video.title}"
            href="/compare/#${video.videoId}">
              <small>Compare</small>
          </a>
          <a
            class="related icon-small mb-1"
            title="See all the related videos about ${video.title}"
            href="/related/#${video.videoId}">
              <small>Related</small>
          </a>

          <a
            class="author icon-small mb-1"
            title="Compare all the evidences from ${video.authorName}"
            href="/author/#${video.videoId}">
              <small>Channel</small>
            </a>

           <a
              class="delete icon-small mb-1"
              title="Remove the evidence: ${video.title}"
              onclick="removeEvidence('${video.videoId}')">
                <small> Remove</small>
           </a>
      </nav>
    </div>
    `;

    $("#report").append(h);
}

function addTimeHeader(timestring) {
    const h =`<h5 class="timeheader light-font mb-3 mt-5">${timestring}</h5>`;
    $("#report").append(h);
}

function removeEvidence(id) {
  console.log("todo removeEvidence", id);
}

function showPassword(status) {
    if( status == 'private') $('#group-password-wrapper').show();
    else $('#group-password-wrapper').hide();
}
