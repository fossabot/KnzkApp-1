function reset_alert() {
  ons.notification
    .confirm(dialog_i18n('clear_alert', 1), {
      title: dialog_i18n('clear_alert'),
      modifier: 'material',
      cancelable: true,
    })
    .then(function(e) {
      if (e === 1) {
        Fetch('https://' + inst + '/api/v1/notifications/clear', {
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + now_userconf['token'],
          },
          method: 'POST',
        })
          .then(function(response) {
            if (response.ok) {
              return response.json();
            } else {
              throw response;
            }
          })
          .then(function(json) {
            showtoast('ok-clear-alert');
            showAlert();
            alert_old_id = 0;
            alert_new_id = 0;
          })
          .catch(function(error) {
            catchHttpErr('clear_notification', error);
          });
      }
    });
}

function showAlert(reload, more_load) {
  var get = '',
    reshtml = '',
    i = 0,
    alert_text = '',
    e = 0;
  if (reload) {
    get = '?since_id=' + alert_new_id;
  }
  if (more_load) {
    more_load.value = 'Loading now...';
    more_load.disabled = true;
    get = '?max_id=' + alert_old_id;
  }
  Fetch('https://' + inst + '/api/v1/notifications' + get, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + now_userconf['token'],
    },
    method: 'GET',
  })
    .then(function(response) {
      if (response.ok) {
        if (more_load) more_load.className = 'invisible';
        return response.json();
      } else {
        throw response;
      }
    })
    .then(function(json) {
      if (json[i]) {
        resetLabel();
        displayTime('update');
        if (more_load) {
          reshtml = elemId('alert_main').innerHTML;
        }
        while (json[i]) {
          alert_new_id = json[0]['id'];
          if (!json[i]['account']['display_name'])
            json[i]['account']['display_name'] = json[i]['account']['username'];
          var filter = getConfig(
            5,
            (json[i]['account']['acct'].indexOf('@') === -1
              ? json[i]['account']['acct'] + '@' + inst
              : json[i]['account']['acct']
            ).toLowerCase()
          );
          if (json[i]['type'] === 'follow') {
            if (!filter['follow']) {
              alert_text = "<div class='alert_text'>";
              alert_text +=
                '<ons-icon icon="fa-user-plus" class=\'boost-active\'></ons-icon> ' +
                i18next.t('toot.follow.prefix') +
                "<b onclick='show_account(" +
                json[i]['account']['id'] +
                ")'>" +
                t_text(
                  escapeHTML(json[i]['account']['display_name']),
                  json[i]['account']['emojis'],
                  json[i]['account']['acct']
                ) +
                '</b>' +
                i18next.t('toot.follow.suffix') +
                " (<span data-time='" +
                json[i]['created_at'] +
                "' class='date'>" +
                displayTime('new', json[i]['created_at']) +
                '</span>)';
              alert_text += '</div>';
              reshtml +=
                '<div class="toot">\n' +
                alert_text +
                "<div class='toot_flex'>\n" +
                "<div width='50px'>\n" +
                '<img src="' +
                json[i]['account']['avatar'] +
                '" class="icon-img" onclick=\'show_account(' +
                json[i]['account']['id'] +
                ")'/></p>\n" +
                '</div>\n' +
                '<div class="toot-card-right">\n' +
                "<span onclick='show_account(" +
                json[i]['account']['id'] +
                ")'><b>" +
                t_text(
                  escapeHTML(json[i]['account']['display_name']),
                  json[i]['account']['emojis'],
                  json[i]['account']['acct']
                ) +
                '</b> <small>@' +
                json[i]['account']['acct'] +
                '</small></span>\n' +
                '</div></div></div>\n';
            }
          } else {
            if (json[i]['type'] === 'favourite') {
              alert_text =
                '<ons-icon icon="fa-star" class=\'fav-active\'></ons-icon> ' +
                i18next.t('toot.fav.prefix') +
                "<b onclick='show_account(" +
                json[i]['account']['id'] +
                ")'>" +
                t_text(
                  escapeHTML(json[i]['account']['display_name']),
                  json[i]['account']['emojis'],
                  json[i]['account']['acct']
                ) +
                '</b>' +
                i18next.t('toot.fav.suffix') +
                " (<span data-time='" +
                json[i]['created_at'] +
                "' class='date'>" +
                displayTime('new', json[i]['created_at']) +
                '</span>)';
            }
            if (json[i]['type'] === 'reblog') {
              alert_text =
                '<ons-icon icon="fa-retweet" class=\'boost-active\'></ons-icon> ' +
                i18next.t('toot.boost.me.prefix') +
                "<b onclick='show_account(" +
                json[i]['account']['id'] +
                ")'>" +
                t_text(
                  escapeHTML(json[i]['account']['display_name']),
                  json[i]['account']['emojis'],
                  json[i]['account']['acct']
                ) +
                '</b>' +
                i18next.t('toot.boost.me.suffix') +
                " (<span data-time='" +
                json[i]['created_at'] +
                "' class='date'>" +
                displayTime('new', json[i]['created_at']) +
                '</span>)';
            }
            if (json[i]['type'] === 'mention') {
              alert_text = '';
            }
            if (
              !(
                (json[i]['type'] === 'favourite' && filter['fav']) ||
                (json[i]['type'] === 'reblog' && filter['boost']) ||
                (json[i]['type'] === 'mention' && filter['mention'])
              )
            ) {
              reshtml += toot_card(json[i]['status'], 'full', alert_text, null, 'alert');
            }
            alert_text = '';
          }
          i++;
        }
        if (reload) {
          //追加読み込み
          reshtml += elemId('alert_main').innerHTML;
        }
        if (more_load || !reload) {
          //TL初回
          if (i !== 0) alert_old_id = json[i - 1]['id'];
          reshtml +=
            "<button class='button button--large--quiet' onclick='showAlert(null,this)'>" +
            i18next.t('navigation.load_more') +
            '</button>';
        }
        elemId('alert_main').innerHTML = reshtml;
      }
      if (reload) reload();
    })
    .catch(error => {
      showtoast('cannot-load');
      if (reload) reload();
      catchHttpErr('notification', error);
    });
}

function openTL(mode) {
  $('#TLChangeTab').hide();
  if (mode === 'alert') {
    load('alert.html');
    showAlert();
    setTimeout(function() {
      initph('alert');
    }, 200);
  } else if (mode === 'alert_nav') {
    loadNav('alert.html');
    showAlert();
    setTimeout(function() {
      elemId('alert_button').innerHTML =
        '<ons-toolbar-button onclick="BackTab()" class="toolbar-button">\n' +
        '<ons-icon icon="fa-chevron-left" class="ons-icon fa-chevron-left fa"></ons-icon>' +
        i18next.t('navigation.back') +
        '</ons-toolbar-button>';
      initph('alert');
      $('#alert-speed_dial').removeClass('invisible');
    }, 200);
  } else {
    closeAllws();
    load('home.html');
    setTimeout(function() {
      initTimeline();
      elemId('home-icon').src = user_icon;
      document
        .getElementById('simple_toot_TL_input')
        .setAttribute(
          'placeholder',
          i18next.t('toot.toot_as', { acct: now_userconf['username'] + '@' + inst })
        );
    }, 200);
  }
}

function initTimeline() {
  var i = 0;
  TL_change(timeline_default_tab);
  now_TL = timeline_config[timeline_default_tab];
  timeline_now_tab = timeline_default_tab;
  elemId('home_title').innerHTML = TLname(timeline_config[timeline_now_tab]);
  showTL(null, null, null, true);

  var dial = getConfig(1, 'dial'),
    icon;
  if (dial && dial != 'change') {
    $('#dial_main').removeClass('invisible');
    if (dial === 'toot') icon = 'fa-pencil';
    else if (dial === 'alert') icon = 'fa-bell';
    if (dial === 'reload') icon = 'fa-refresh';
    elemId('dial-icon').className = 'ons-icon fa ' + icon;
  } else if (dial) {
    $('#dial_TL').removeClass('invisible');
    var bufhtml = '',
      icons = {
        home: 'fa fa-fw fa-home',
        local: 'fa fa-fw fa-users',
        federated: 'fa fa-fw fa-globe',
        local_media: 'fa fa-fw fa-picture-o',
        federated_media: 'ons-icon zmdi zmdi-collection-image-o',
        hashtag: 'fa fa-fw fa-hashtag',
        list: 'fa fa-fw fa-bars',
        plus_local: '+ローカル',
      };
    i = 0;
    bufhtml +=
      '<div onclick="openTL(\'alert_nav\')"><span>' +
      i18next.t('navigation.notifications') +
      '</span><div><i class="fa fa-fw fa-bell"></i></div></div>';
    while (i <= timeline_config.length - 1) {
      bufhtml +=
        '<div onclick="TL_change(' +
        i +
        ')"><span>' +
        TLname(timeline_config[i]) +
        '</span><div><i class="' +
        icons[TLident(timeline_config[i])] +
        '"></i></div></div>';
      i++;
    }
    elemId('TLChangeList').innerHTML = bufhtml;
  }
  if (getConfig(1, 'swipe_menu') == 1) elemId('tl_tabs').setAttribute('swipeable', '1');
}

/**
 * 自分でもわけわからなくなってるのでいつか書き直す
 * @param mode タイムラインの種類 home=ホーム, local=ローカルTL, public=連合TL
 * @param reload 引っ張って更新を終了させる変数を入れる
 * @param more_load もっと読み込むのボタンオブジェクト (thisでぶち込む)
 * @param clear_load 一旦破棄してやり直すときtrue
 */
function showTL(mode, reload, more_load, clear_load) {
  var tlmode = '',
    i = 0,
    reshtml = '',
    n;
  if (!mode) mode = now_TL;
  if (clear_load) {
    closeAllws();
    tl_postdata = {};
    TlStoreData_pre = {};
    TlStoreData_pre[inst] = {};
    TlStoreData_pre[inst][timeline_now_tab] = '';
    home_auto_num = 0;
    toot_new_id = 0;
    toot_old_id = 0;
    more_load = false;
    setTLheadcolor(0);
  }
  if (!mode) return;
  if (mode === 'home') {
    if (more_load) tlmode = 'home?max_id=' + toot_old_id;
    else tlmode = 'home?since_id=' + toot_new_id;
    n = true;
  } else if (mode === 'public') {
    if (more_load) tlmode = 'public?max_id=' + toot_old_id;
    else tlmode = 'public?since_id=' + toot_new_id;
    n = true;
  } else if (mode === 'local') {
    if (more_load) tlmode = 'public?local=true&max_id=' + toot_old_id;
    else tlmode = 'public?local=true&since_id=' + toot_new_id;
    n = true;
  } else if (mode === 'local_media') {
    if (more_load) tlmode = 'public?local=true&max_id=' + toot_old_id;
    else tlmode = 'public?limit=40&local=true&since_id=' + toot_new_id;
    n = true;
  } else if (mode === 'public_media') {
    if (more_load) tlmode = 'public?max_id=' + toot_old_id;
    else tlmode = 'public?limit=40&since_id=' + toot_new_id;
    n = true;
  } else if (mode.match(/hashtag:/i)) {
    var tag = mode.replace('hashtag:', '');
    if (more_load) tlmode = 'tag/' + tag + '?max_id=' + toot_old_id;
    else tlmode = 'tag/' + tag + '?since_id=' + toot_new_id;
    n = true;
  } else if (mode.match(/list:/i)) {
    var list = mode.replace('list:', '');
    if (more_load) tlmode = 'list/' + list + '?max_id=' + toot_old_id;
    else tlmode = 'list/' + list + '?since_id=' + toot_new_id;
    n = true;
  }
  if (more_load && getConfig(1, 'chatmode')) more_load.className = 'invisible';
  if (n) {
    Fetch('https://' + inst + '/api/v1/timelines/' + tlmode, {
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + now_userconf['token'],
      },
      method: 'GET',
    })
      .then(function(response) {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(function(json) {
        if (!more_load) {
          while (timeline_config[i]) {
            try {
              elemTimeline(i).innerHTML =
                '<div class="loading-now"><ons-progress-circular indeterminate></ons-progress-circular></div>';
            } catch (e) {}
            i++;
          }
          i = 0;
        }
        if (json) {
          displayTime('update');
          if (more_load && !getConfig(1, 'chatmode')) {
            reshtml = elemTimeline().innerHTML;
          } else if (getConfig(1, 'realtime') == 1) {
            startWebSocket(mode, reload, more_load);
          }

          if (getConfig(1, 'chatmode')) {
            if (more_load || mode != last_load_TL || clear_load) {
              //TL初回
              reshtml +=
                "<button class='button button--large--quiet more_load_bt_" +
                timeline_now_tab +
                "' onclick='showTL(null,null,this)'>" +
                i18next.t('navigation.load_more') +
                '</button>';
            }
            json = json.reverse();

            var chat_jump_id = toot_old_id;
          }

          while (json[i]) {
            var TLmode = mode === 'local_media' || mode === 'public_media' ? 'media' : '';
            var tootbox = toot_card(json[i], 'full', null, TLmode);

            reshtml += tootbox;

            toot_new_id = getConfig(1, 'chatmode') ? json[i]['id'] : json[0]['id'];
            toot_old_id = getConfig(1, 'chatmode') ? json[0]['id'] : json[i]['id'];
            i++;
          }

          if (more_load && mode == last_load_TL && !clear_load && getConfig(1, 'chatmode')) {
            reshtml += elemTimeline().innerHTML;
          }

          if (!more_load && mode !== last_load_TL && !getConfig(1, 'chatmode')) {
            var tl = document.querySelector('#TL' + timeline_now_tab + '_main');

            tl.onInfiniteScroll = function(done) {
              showTL(null, null, done);
            };
          }
          last_load_TL = timeline_now_tab;
          elemTimeline().innerHTML = reshtml;

          if (reload && reload !== 'dial') reload();
          if (getConfig(1, 'chatmode')) {
            if (more_load) window.location = '#post_' + chat_jump_id;
            else $('.page__content').scrollTop(99999999999999999999999);
          } else if (more_load) {
            more_load();
          }
        }
      })
      .catch(error => {
        showtoast('cannot-load');
        if (reload && reload !== 'dial') reload();
        catchHttpErr('timeline', error);
      });
  }
}

function startWebSocket(mode, reload, more_load) {
  var ws_mode;
  if (mode === 'public' || mode === 'public_media') ws_mode = 'public';
  else if (mode === 'local' || mode === 'local_media') ws_mode = 'public:local';
  else if (mode === 'home') ws_mode = 'user';
  else if (mode.match(/hashtag:/i)) ws_mode = 'hashtag&tag=' + mode.replace('hashtag:', '');
  else if (mode.match(/list:/i)) ws_mode = 'list&list=' + mode.replace('list:', '');

  if (!reload && !more_load) {
    var instance_ws = inst,
      now_tab = timeline_now_tab;
    var ws_url =
      'wss://' +
      inst +
      '/api/v1/streaming/?access_token=' +
      now_userconf['token'] +
      '&stream=' +
      ws_mode;
    if (TL_websocket[now_tab]) {
      try {
        TL_websocket[now_tab].close();
      } catch (e) {}
      TL_websocket[now_tab] = null;
    }
    TL_websocket[now_tab] = new WebSocket(ws_url);
    TL_websocket[now_tab].onopen = function() {
      ws_leavePage = false;
      var heartbeat = setInterval(() => TL_websocket[now_tab].send('p'), 10000); //ping
      var ws_now_url = TL_websocket[now_tab].url;
      TL_websocket[now_tab].onmessage = function(message) {
        displayTime('update');
        if (instance_ws !== inst || timeline_now_tab !== now_tab || ws_now_url !== ws_url) {
          console.warn('エラー:Websocketが切断されていません');
          try {
            TL_websocket[now_tab].close();
          } catch (e) {}
          TL_websocket[now_tab] = null;
        } else {
          var ws_resdata = JSON.parse(message.data);
          var ws_reshtml = JSON.parse(ws_resdata.payload);

          if (ws_resdata.event === 'update') {
            if (ws_reshtml['id']) {
              if (toot_new_id !== ws_reshtml['id']) {
                var TLmode = mode === 'local_media' || mode === 'public_media' ? 'media' : '';

                if (!ws_reshtml['media_attachments'][0] && TLmode === 'media') {
                  return;
                }

                updateTLtrack();
                if (home_auto_mode) {
                  //OK
                  home_auto_event = false;
                  if (getConfig(1, 'chatmode'))
                    elemTimeline(now_tab).innerHTML =
                      elemTimeline(now_tab).innerHTML +
                      TlStoreData_pre[instance_ws][now_tab] +
                      toot_card(ws_reshtml, 'full', null, TLmode);
                  else {
                    if (getConfig(1, 'tl_speech')) {
                      var ssu = new SpeechSynthesisUtterance();
                      ssu.text = ws_reshtml.content.replace(/<.*?>/gi, '');
                      ssu.lang = getConfig(1, 'tl_speech');
                      speechSynthesis.speak(ssu);
                    }
                    elemTimeline(now_tab).innerHTML =
                      toot_card(ws_reshtml, 'full', null, TLmode) +
                      TlStoreData_pre[instance_ws][now_tab] +
                      elemTimeline(now_tab).innerHTML;
                    cacheTL(now_tab);
                  }

                  TlStoreData_pre[instance_ws][now_tab] = '';
                  home_auto_num = 0;
                  setTLheadcolor(0);
                  if (getConfig(1, 'chatmode'))
                    $('.page__content').scrollTop(99999999999999999999999);
                } else {
                  if (getConfig(1, 'chatmode'))
                    TlStoreData_pre[instance_ws][now_tab] += toot_card(
                      ws_reshtml,
                      'full',
                      null,
                      TLmode
                    );
                  else
                    TlStoreData_pre[instance_ws][now_tab] =
                      toot_card(ws_reshtml, 'full', null, TLmode) +
                      TlStoreData_pre[instance_ws][now_tab];

                  if (!home_auto_event) {
                    home_auto_event = true;
                    home_autoevent();
                  }
                }

                if (
                  !home_auto_mode &&
                  ((ws_reshtml['media_attachments'][0] && TLmode === 'media') || TLmode !== 'media')
                ) {
                  home_auto_num++;
                  setTLheadcolor(1);
                }
              }
              toot_new_id = ws_reshtml['id'];
            }
          } else if (ws_resdata.event === 'delete') {
            var del_toot = elemId('post_' + ws_resdata.payload);
            if (del_toot) del_toot.parentNode.removeChild(del_toot);
          }
        }
      };

      TL_websocket[now_tab].onclose = function() {
        clearInterval(heartbeat);
        if (
          instance_ws === inst &&
          timeline_now_tab === now_tab &&
          ws_now_url === ws_url &&
          !ws_leavePage
        ) {
          console.log('reconnect:websocket');
          startWebSocket(mode, reload, more_load);
        } else {
          console.log('ok:websocket:del');
        }
        ws_leavePage = false;
      };
    };

    TL_websocket[now_tab].onerror = function() {
      console.warn('err');
    };
  }
}

function cacheTL(loc = timeline_now_tab) {
  if (pageid === 'home') {
    var posts = Array.from(elemTimeline(loc).children);
    if (posts.length > 30) {
      var cutData = posts.slice(24),
        i = 0;
      toot_old_id = posts[24].id.replace('post_', '');
      while (cutData[i]) {
        posts[24 + i].parentNode.removeChild(posts[24 + i]);
        i++;
      }
    }
  }
}

function elemTimeline(number = timeline_now_tab) {
  return document.querySelector('#TL' + number + '_main > .page__content');
}

function showTagTL(tag, more_load) {
  var i = 0,
    reshtml = '',
    get = '';
  if (!tag) tag = tag_str;
  else tag_str = tag;
  if (more_load) {
    get = '?max_id=' + tag_old_id;
    more_load.value = 'Loading now...';
    more_load.disabled = true;
  } else {
    loadNav('showtag.html');
  }
  Fetch('https://' + inst + '/api/v1/timelines/tag/' + tag + get, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + now_userconf['token'],
    },
    method: 'GET',
  })
    .then(function(response) {
      if (response.ok) {
        if (more_load) more_load.className = 'invisible';
        return response.json();
      } else {
        throw response;
      }
    })
    .then(function(json) {
      if (json) {
        if (more_load) {
          reshtml = elemId('tag_main').innerHTML;
        } else {
          elemId('showtag_title').innerHTML = '#' + decodeURI(tag);
        }

        while (json[i]) {
          reshtml += toot_card(json[i], 'full', null);
          i++;
        }

        if (i !== 0) tag_old_id = json[i - 1]['id'];
        elemId('tag_main').innerHTML = reshtml;
        if (more_load) more_load();
        return true;
      }
    })
    .catch(function(error) {
      catchHttpErr('show_account', error);
    });
}

function showAccountTL(id, more_load, mode = '', reload) {
  var i = 0,
    reshtml = '',
    get = '';
  acct_mode = mode;
  if (more_load) {
    more_load.value = 'Loading now...';
    more_load.disabled = true;
    get = '?max_id=' + account_toot_old_id + '&';
  } else {
    account_toot_old_id = 0;
    get = '?';
  }

  if (mode === 'media') get += 'only_media=true';
  else if (mode === 'with_re') get += 'exclude_replies=false';
  else if (mode === 'pinned') get += 'pinned=true';
  else get += 'exclude_replies=true';

  if (!more_load) {
    //読み込みマーク入れる
    i = 0;
    try {
      elemId('account_toot').innerHTML =
        '<div class="loading-now"><ons-progress-circular indeterminate></ons-progress-circular></div>';
    } catch (e) {}
  }

  Fetch('https://' + inst + '/api/v1/accounts/' + id + '/statuses' + get, {
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + now_userconf['token'],
    },
    method: 'GET',
  })
    .then(function(response) {
      if (response.ok) {
        if (more_load) more_load.className = 'invisible';
        return response.json();
      } else {
        throw response;
      }
    })
    .then(function(json) {
      if (json) {
        if (more_load) {
          reshtml = elemId('account_toot').innerHTML;
          displayTime('update');
        } else {
          var conf = $("[id^='acctTL_mode']");
          while (conf[i]) {
            $(conf[i]).removeClass('acctTL_now');
            i++;
          }
          $('#acctTL_mode_' + mode).addClass('acctTL_now');
        }
        i = 0;
        while (json[i]) {
          reshtml += toot_card(json[i], 'full', null);
          i++;
        }
        if (i !== 0) account_toot_old_id = json[i - 1]['id'];
        if (mode)
          reshtml +=
            "<button class='button button--large--quiet' onclick='showAccountTL(account_page_id, this, \"" +
            mode +
            '")\'>' +
            i18next.t('navigation.load_more') +
            '</button>';
        else
          reshtml +=
            "<button class='button button--large--quiet' onclick='showAccountTL(account_page_id, this)'>" +
            i18next.t('navigation.load_more') +
            '</button>';

        elemId('account_toot').innerHTML = reshtml;
        if (reload) reload();
        else if (!more_load) initph('acct');
        return true;
      }
    })
    .catch(function(error) {
      catchHttpErr('show_account_TL', error);
    });
}

function TL_prev() {
  var tab = elemId('tl_tabs');
  var index = tab.getActiveTabIndex();
  if (index >= 1) {
    tab.setActiveTab(index - 1);
  }
}

function TL_next() {
  var tab = elemId('tl_tabs');
  var index = tab.getActiveTabIndex();
  if (index !== -1 && index < timeline_config.length - 1) {
    tab.setActiveTab(index + 1);
  }
}

function TL_change(mode) {
  $('#TLChangeTab').hide();
  var tab = elemId('tl_tabs');
  tab.setActiveTab(mode);
}

function scrollTL() {
  $('.page__content').scrollTop(getConfig(1, 'chatmode') ? 99999999999999999999999 : 0);
}

function updateTLtrack() {
  var h = 0;
  if (getConfig(1, 'chatmode')) {
    h =
      $('.toot')
        .filter(':last')
        .offset().top - window.innerHeight;
    home_auto_mode = h < -10;
  } else {
    try {
      h = elemTimeline().scrollTop;
      home_auto_mode = h <= 100;
    } catch (e) {}
  }
}

function setTLheadcolor(mode) {
  try {
    var head = elemId('home_title');
    var unread = elemId('home_title_unread');
    if (mode) {
      //blue
      head.className = 'TL_reload';
      unread.innerHTML = home_auto_num;
      unread.className = 'notification';
    } else {
      head.className = '';
      unread.className = 'notification invisible';
    }
  } catch (e) {
    console.log(e);
  }
}

function TLident(mode) {
  var name,
    locale = {
      home: 'home',
      local: 'local',
      public: 'federated',
      local_media: 'local_media',
      public_media: 'federated_media',
      plus_local: '+ローカル',
    };

  if (!mode) return;
  if (locale[mode]) name = locale[mode];
  else if (mode.match(/hashtag:/i)) name = 'hashtag';
  else if (mode.match(/list:/i)) name = 'list';

  return name;
}

function TLname(mode) {
  var n = TLident(mode),
    text;
  if (n === 'hashtag') text = mode;
  else if (n === 'list') text = 'list:' + timeline_list_names['' + mode.split(':')[1]];
  else text = i18next.t('timeline.' + n);
  return text;
}

function initph(mode) {
  var id = '';
  if (mode === 'TL') id = 'TL' + timeline_now_tab + '_';
  else if (mode === 'alert') id = 'ph-alert';
  else if (mode === 'acct') id = 'ph-acct';

  try {
    var ph_alert = elemId(id);
    ph_alert.addEventListener('changestate', function(event) {
      var message = '';

      switch (event.state) {
        case 'initial':
          message = '<ons-icon icon="fa-refresh" class="white"></ons-icon>';
          break;
        case 'preaction':
          message = '<ons-icon icon="fa-refresh" class="white"></ons-icon>';
          break;
        case 'action':
          message =
            '<span class="fa fa-spin"><span class="fa fa-spin"><ons-icon icon="fa-refresh" class="white"></ons-icon></span></span>';
          break;
      }

      ph_alert.innerHTML = message;
    });
  } catch (e) {
    console.log('ERROR_Pull_hook1');
  }
  if (mode === 'TL') {
    try {
      ph_alert.onAction = function(done) {
        console.log('reload');
        showAlert(done);
      };
    } catch (e) {
      console.log('ERROR_Pull_hook2');
    }
  } else if (mode === 'acct') {
    try {
      ph_alert.onAction = function(done) {
        console.log('reload');
        showAccountTL(account_page_id, null, acct_mode, done);
      };
    } catch (e) {
      console.log('ERROR_Pull_hook3');
    }
  } else {
    try {
      ph_alert.onAction = function(done) {
        console.log('reload');
        showAlert(done);
      };
    } catch (e) {
      console.log('ERROR_Pull_hook3');
    }
  }
}

function initTLConf() {
  var i = 0,
    reshtml = '',
    dw = '',
    up = '',
    ch = '';

  while (timeline_config[i]) {
    dw =
      '<ons-button modifier="quiet" class="button button--quiet" onclick=\'editTLConf(' +
      i +
      ',1)\'><ons-icon icon="fa-angle-down" class="ons-icon fa-angle-down fa"></ons-icon></ons-button>\n';
    up =
      '<ons-button modifier="quiet" class="button button--quiet" onclick=\'editTLConf(' +
      i +
      ',0)\'><ons-icon icon="fa-angle-up" class="ons-icon fa-angle-up fa"></ons-icon></ons-button>\n';
    ch = '';

    if (i === timeline_config.length - 1) {
      dw =
        '<ons-button class="button button--quiet" disabled><ons-icon icon="fa-angle-down" class="ons-icon fa-angle-down fa"></ons-icon></ons-button>\n';
    } else if (i === 0) {
      up =
        '<ons-button class="button button--quiet" disabled><ons-icon icon="fa-angle-up" class="ons-icon fa-angle-up fa"></ons-icon></ons-button>\n';
    }
    if (timeline_default_tab === i) {
      ch = 'checked';
    }

    reshtml +=
      '<ons-list-item class="list-item">\n' +
      '<label class="left list-item__left"><ons-radio disabled name="tl_default" input-id="tl_default-' +
      i +
      '" ' +
      ch +
      ' class="radio-button">\n' +
      '<input type="radio" class="radio-button__input" id="tl_default-' +
      i +
      '" name="tl_default" disabled>\n' +
      '<span class="radio-button__checkmark"></span>\n' +
      '</ons-radio></label>\n' +
      '<label for="tl_default-' +
      i +
      '" class="center list-item__center" onclick="editTLConfigOption(' +
      i +
      ')">' +
      TLname(timeline_config[i]) +
      '</label>\n' +
      '<label class="right list-item__right">\n' +
      up +
      dw +
      '</label></ons-list-item>';
    i++;
  }
  elemId('tlconf-list').innerHTML = reshtml;
}

function editTLdel(i) {
  if (timeline_config.length < 2 || timeline_default_tab === i) {
    return;
  }
  if (timeline_default_tab > i) {
    timeline_default_tab--;
  }
  timeline_config.splice(i, 1);
  editTLSave();
}

function editTLConf(i, mode) {
  if (mode === 1) {
    //上げる
    timeline_config.splice(i, 2, timeline_config[i + 1], timeline_config[i]);
  } else {
    //下げる
    timeline_config.splice(i - 1, 2, timeline_config[i], timeline_config[i - 1]);
  }
  editTLSave();
}

function editTLSave() {
  var confdata = JSON.parse(localStorage.getItem('knzkapp_conf_mastodon_timeline'));
  var acct = now_userconf['username'] + '@' + inst;

  confdata[acct] = {
    config: timeline_config,
    default: timeline_default_tab,
    list_names: timeline_list_names,
  };

  localStorage.setItem('knzkapp_conf_mastodon_timeline', JSON.stringify(confdata));
  initTLConf();
}

function editTLConfD(i) {
  console.log('OK');
  timeline_default_tab = i;
  editTLSave();
}

function editTLConfAdd(name) {
  if (timeline_config.length >= 10) {
    ons.notification.alert(dialog_i18n('err_new_tl', 1), {
      title: dialog_i18n('err_new_tl'),
      modifier: 'material',
      cancelable: true,
    });
    return;
  }
  timeline_config.push(name);
  editTLSave();
  showtoast('ok_conf_2');
}

function closeAllws() {
  try {
    for (var i = 0; i <= timeline_config.length - 1; i++) {
      ws_leavePage = true;
      if (TL_websocket[i]) {
        TL_websocket[i].close();
        TL_websocket[i] = null;
      }
    }
    TL_websocket = {};
  } catch (e) {
    console.warn('TL切断失敗:', e);
  }
}

function AddTLConfig() {
  if (timeline_config.length >= 10) {
    ons.notification.alert(dialog_i18n('err_new_tl', 1), {
      title: dialog_i18n('err_new_tl'),
      modifier: 'material',
      cancelable: true,
    });
    return;
  }

  var buttons = [i18next.t('actionsheet.editTL.hashtag'), i18next.t('actionsheet.editTL.list')],
    defaultTL = ['home', 'local', 'public', 'local_media', 'public_media'],
    defaultTLdisable = [null, null],
    i = 0;
  while (defaultTL[i]) {
    if (timeline_config.indexOf(defaultTL[i]) === -1) {
      buttons.push(TLname(defaultTL[i]));
      defaultTLdisable.push(defaultTL[i]);
    }
    i++;
  }
  buttons.push({
    label: i18next.t('navigation.cancel'),
    icon: 'md-close',
  });

  ons
    .openActionSheet({
      title: i18next.t('actionsheet.editTL.title'),
      cancelable: true,
      buttons: buttons,
    })
    .then(function(index) {
      if (index === 0) addHashtag();
      else if (index === 1)
        ons.notification.alert(dialog_i18n('list_note', 1), {
          title: dialog_i18n('list_note'),
          modifier: 'material',
          cancelable: true,
        });
      else {
        if (defaultTLdisable[index]) {
          editTLConfAdd(defaultTLdisable[index]);
          initTLConf();
        }
      }
    });
}

function editTLConfigOption(id) {
  var buttons = [i18next.t('actionsheet.editTL.option.default')];

  if (timeline_config.length > 1 && timeline_default_tab !== id) {
    buttons.push(i18next.t('actionsheet.editTL.option.delete'));
  }

  buttons.push({
    label: i18next.t('navigation.cancel'),
    icon: 'md-close',
  });

  ons
    .openActionSheet({
      cancelable: true,
      buttons: buttons,
    })
    .then(function(index) {
      if (index === 0) editTLConfD(id);
      else if (index === 1) editTLdel(id);
    });
}

function addHashtag() {
  ons.notification
    .prompt(dialog_i18n('hashtag', 1), {
      title: dialog_i18n('hashtag'),
      modifier: 'material',
      cancelable: true,
    })
    .then(function(repcom) {
      if (repcom) {
        editTLConfAdd('hashtag:' + escapeHTML(repcom));
        initTLConf();
      }
    });
}

function addTagToTimeline(tag) {
  ons.notification
    .confirm(dialog_i18n('add_tag', 1), {
      title: dialog_i18n('add_tag'),
      modifier: 'material',
      cancelable: true,
    })
    .then(function(e) {
      if (e === 1) {
        editTLConfAdd('hashtag:' + escapeHTML(tag));
      }
    });
}
