



<!DOCTYPE html>
<html lang="en" class="   ">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# object: http://ogp.me/ns/object# article: http://ogp.me/ns/article# profile: http://ogp.me/ns/profile#">
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Language" content="en">
    
    
    <title>swaggplayer/adaptive-background.js at dev · jrayaustin/swaggplayer</title>
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="GitHub">
    <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub">
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-144.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144.png">
    <meta property="fb:app_id" content="1401488693436528">

      <meta content="@github" name="twitter:site" /><meta content="summary" name="twitter:card" /><meta content="jrayaustin/swaggplayer" name="twitter:title" /><meta content="swaggplayer - Javascript Music Player" name="twitter:description" /><meta content="https://avatars3.githubusercontent.com/u/479726?v=2&amp;s=400" name="twitter:image:src" />
<meta content="GitHub" property="og:site_name" /><meta content="object" property="og:type" /><meta content="https://avatars3.githubusercontent.com/u/479726?v=2&amp;s=400" property="og:image" /><meta content="jrayaustin/swaggplayer" property="og:title" /><meta content="https://github.com/jrayaustin/swaggplayer" property="og:url" /><meta content="swaggplayer - Javascript Music Player" property="og:description" />

    <link rel="assets" href="https://assets-cdn.github.com/">
    <link rel="conduit-xhr" href="https://ghconduit.com:25035">
    <link rel="xhr-socket" href="/_sockets">

    <meta name="msapplication-TileImage" content="/windows-tile.png">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="selected-link" value="repo_source" data-pjax-transient>
      <meta name="google-analytics" content="UA-3769691-2">

    <meta content="collector.githubapp.com" name="octolytics-host" /><meta content="collector-cdn.github.com" name="octolytics-script-host" /><meta content="github" name="octolytics-app-id" /><meta content="4431ECF7:7B5F:18897750:53F24A4D" name="octolytics-dimension-request_id" /><meta content="479726" name="octolytics-actor-id" /><meta content="jrayaustin" name="octolytics-actor-login" /><meta content="76360325fed811ce43f9f17448993c4541145a62779da9114e81ec11eb571658" name="octolytics-actor-hash" />
    

    
    
    <link rel="icon" type="image/x-icon" href="https://assets-cdn.github.com/favicon.ico">


    <meta content="authenticity_token" name="csrf-param" />
<meta content="bJeUpb5aTT7APJyxHkK2wZ7189/73mF/qTo06rwv9rtO3Hy3mhh41lqxvOUCYRs7PceA4IFhpPsv6WKYkMff9g==" name="csrf-token" />

    <link href="https://assets-cdn.github.com/assets/github-e3c1d787af4268efb148333bb4e620cf577eb0ba.css" media="all" rel="stylesheet" type="text/css" />
    <link href="https://assets-cdn.github.com/assets/github2-d8ce071f25d7eb48a922a87c5df3c69cdcb6cd8a.css" media="all" rel="stylesheet" type="text/css" />
    


    <meta http-equiv="x-pjax-version" content="120137975d6705fb768224ee02bf9c43">

      
  <meta name="description" content="swaggplayer - Javascript Music Player">


  <meta content="479726" name="octolytics-dimension-user_id" /><meta content="jrayaustin" name="octolytics-dimension-user_login" /><meta content="1076648" name="octolytics-dimension-repository_id" /><meta content="jrayaustin/swaggplayer" name="octolytics-dimension-repository_nwo" /><meta content="true" name="octolytics-dimension-repository_public" /><meta content="false" name="octolytics-dimension-repository_is_fork" /><meta content="1076648" name="octolytics-dimension-repository_network_root_id" /><meta content="jrayaustin/swaggplayer" name="octolytics-dimension-repository_network_root_nwo" />
  <link href="https://github.com/jrayaustin/swaggplayer/commits/dev.atom" rel="alternate" title="Recent Commits to swaggplayer:dev" type="application/atom+xml">

  </head>


  <body class="logged_in  env-production macintosh vis-public page-blob">
    <a href="#start-of-content" tabindex="1" class="accessibility-aid js-skip-to-content">Skip to content</a>
    <div class="wrapper">
      
      
      
      


      <div class="header header-logged-in true">
  <div class="container clearfix">

    <a class="header-logo-invertocat" href="https://github.com/" aria-label="Homepage">
  <span class="mega-octicon octicon-mark-github"></span>
</a>


        <a href="/notifications" aria-label="You have no unread notifications" class="notification-indicator tooltipped tooltipped-s" data-hotkey="g n">
        <span class="mail-status all-read"></span>
</a>

      <div class="command-bar js-command-bar  in-repository">
          <form accept-charset="UTF-8" action="/search" class="command-bar-form" id="top_search_form" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /></div>

<div class="commandbar">
  <span class="message"></span>
  <input type="text" data-hotkey="s, /" name="q" id="js-command-bar-field" placeholder="Search or type a command" tabindex="1" autocapitalize="off"
    
    data-username="jrayaustin"
    data-repo="jrayaustin/swaggplayer"
  >
  <div class="display hidden"></div>
</div>

    <input type="hidden" name="nwo" value="jrayaustin/swaggplayer">

    <div class="select-menu js-menu-container js-select-menu search-context-select-menu">
      <span class="minibutton select-menu-button js-menu-target" role="button" aria-haspopup="true">
        <span class="js-select-button">This repository</span>
      </span>

      <div class="select-menu-modal-holder js-menu-content js-navigation-container" aria-hidden="true">
        <div class="select-menu-modal">

          <div class="select-menu-item js-navigation-item js-this-repository-navigation-item selected">
            <span class="select-menu-item-icon octicon octicon-check"></span>
            <input type="radio" class="js-search-this-repository" name="search_target" value="repository" checked="checked">
            <div class="select-menu-item-text js-select-button-text">This repository</div>
          </div> <!-- /.select-menu-item -->

          <div class="select-menu-item js-navigation-item js-all-repositories-navigation-item">
            <span class="select-menu-item-icon octicon octicon-check"></span>
            <input type="radio" name="search_target" value="global">
            <div class="select-menu-item-text js-select-button-text">All repositories</div>
          </div> <!-- /.select-menu-item -->

        </div>
      </div>
    </div>

  <span class="help tooltipped tooltipped-s" aria-label="Show command bar help">
    <span class="octicon octicon-question"></span>
  </span>


  <input type="hidden" name="ref" value="cmdform">

</form>
        <ul class="top-nav">
          <li class="explore"><a href="/explore">Explore</a></li>
            <li><a href="https://gist.github.com">Gist</a></li>
            <li><a href="/blog">Blog</a></li>
          <li><a href="https://help.github.com">Help</a></li>
        </ul>
      </div>

    
<ul id="user-links">
  <li>
    <a href="/jrayaustin" class="name">
      <img alt="Johnny Ray" data-user="479726" height="20" src="https://avatars3.githubusercontent.com/u/479726?v=2&amp;s=40" width="20" /> jrayaustin
    </a>
  </li>

  <li class="new-menu dropdown-toggle js-menu-container">
    <a href="#" class="js-menu-target tooltipped tooltipped-s" aria-label="Create new...">
      <span class="octicon octicon-plus"></span>
      <span class="dropdown-arrow"></span>
    </a>

    <div class="new-menu-content js-menu-content">
    </div>
  </li>

  <li>
    <a href="/settings/profile" id="account_settings"
      class="tooltipped tooltipped-s"
      aria-label="Account settings ">
      <span class="octicon octicon-tools"></span>
    </a>
  </li>
  <li>
    <form accept-charset="UTF-8" action="/logout" class="logout-form" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="hCPinZVPKJyIIYwuY0VoxiLs6KZv7HbdgBC+8FcFUMIGefcqxOOPsTD03vAmvjOFerEFOUL4J4F8/a1aG4A1RA==" /></div>
      <button class="sign-out-button tooltipped tooltipped-s" aria-label="Sign out">
        <span class="octicon octicon-sign-out"></span>
      </button>
</form>  </li>

</ul>

<div class="js-new-dropdown-contents hidden">
  
<ul class="dropdown-menu">
  <li>
    <a href="/new"><span class="octicon octicon-repo"></span> New repository</a>
  </li>
  <li>
    <a href="/organizations/new"><span class="octicon octicon-organization"></span> New organization</a>
  </li>


    <li class="section-title">
      <span title="jrayaustin/swaggplayer">This repository</span>
    </li>
      <li>
        <a href="/jrayaustin/swaggplayer/issues/new"><span class="octicon octicon-issue-opened"></span> New issue</a>
      </li>
      <li>
        <a href="/jrayaustin/swaggplayer/settings/collaboration"><span class="octicon octicon-person"></span> New collaborator</a>
      </li>
</ul>

</div>


    
  </div>
</div>

      

        


      <div id="start-of-content" class="accessibility-aid"></div>
          <div class="site" itemscope itemtype="http://schema.org/WebPage">
    <div id="js-flash-container">
      
    </div>
    <div class="pagehead repohead instapaper_ignore readability-menu">
      <div class="container">
        
<ul class="pagehead-actions">

    <li class="subscription">
      <form accept-charset="UTF-8" action="/notifications/subscribe" class="js-social-container" data-autosubmit="true" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="OnX0bR/mNL5R4SLX8thNConqtmNUSil4/7ZOiAuaWQw/RS5sOv3dZr2EyypvW+qjZCSVqWw5cphnDyTsKgsiQQ==" /></div>  <input id="repository_id" name="repository_id" type="hidden" value="1076648" />

    <div class="select-menu js-menu-container js-select-menu">
      <a class="social-count js-social-count" href="/jrayaustin/swaggplayer/watchers">
        1
      </a>
      <a href="/jrayaustin/swaggplayer/subscription"
        class="minibutton select-menu-button with-count js-menu-target" role="button" tabindex="0" aria-haspopup="true">
        <span class="js-select-button">
          <span class="octicon octicon-eye"></span>
          Unwatch
        </span>
      </a>

      <div class="select-menu-modal-holder">
        <div class="select-menu-modal subscription-menu-modal js-menu-content" aria-hidden="true">
          <div class="select-menu-header">
            <span class="select-menu-title">Notifications</span>
            <span class="octicon octicon-x js-menu-close" role="button" aria-label="Close"></span>
          </div> <!-- /.select-menu-header -->

          <div class="select-menu-list js-navigation-container" role="menu">

            <div class="select-menu-item js-navigation-item " role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input id="do_included" name="do" type="radio" value="included" />
                <h4>Not watching</h4>
                <span class="description">Be notified when participating or @mentioned.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-eye"></span>
                  Watch
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

            <div class="select-menu-item js-navigation-item selected" role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input checked="checked" id="do_subscribed" name="do" type="radio" value="subscribed" />
                <h4>Watching</h4>
                <span class="description">Be notified of all conversations.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-eye"></span>
                  Unwatch
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

            <div class="select-menu-item js-navigation-item " role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input id="do_ignore" name="do" type="radio" value="ignore" />
                <h4>Ignoring</h4>
                <span class="description">Never be notified.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-mute"></span>
                  Stop ignoring
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

          </div> <!-- /.select-menu-list -->

        </div> <!-- /.select-menu-modal -->
      </div> <!-- /.select-menu-modal-holder -->
    </div> <!-- /.select-menu -->

</form>
    </li>

  <li>
    
  <div class="js-toggler-container js-social-container starring-container on">

    <form accept-charset="UTF-8" action="/jrayaustin/swaggplayer/unstar" class="js-toggler-form starred js-unstar-button" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="2sRFH9mjLvTg48ibjyYy8h/gT1Zyfx+90sv2Ot2b/SeLcaafXA2hJVrQOpAw/3rbnTBYMy4+T0+8wv828PmsIw==" /></div>
      <button
        class="minibutton with-count js-toggler-target star-button"
        aria-label="Unstar this repository" title="Unstar jrayaustin/swaggplayer">
        <span class="octicon octicon-star"></span>
        Unstar
      </button>
        <a class="social-count js-social-count" href="/jrayaustin/swaggplayer/stargazers">
          9
        </a>
</form>
    <form accept-charset="UTF-8" action="/jrayaustin/swaggplayer/star" class="js-toggler-form unstarred js-star-button" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="FMhotV8t3Vgm6eGWs5LfIMJySJ15GSH8TxTWefTezHn2zjZdtY4D728IzvK33XapGzbyhqBK/4fy9eDxycGJVg==" /></div>
      <button
        class="minibutton with-count js-toggler-target star-button"
        aria-label="Star this repository" title="Star jrayaustin/swaggplayer">
        <span class="octicon octicon-star"></span>
        Star
      </button>
        <a class="social-count js-social-count" href="/jrayaustin/swaggplayer/stargazers">
          9
        </a>
</form>  </div>

  </li>


        <li>
          <a href="/jrayaustin/swaggplayer/fork" class="minibutton with-count js-toggler-target fork-button tooltipped-n" title="Fork your own copy of jrayaustin/swaggplayer to your account" aria-label="Fork your own copy of jrayaustin/swaggplayer to your account" rel="facebox nofollow">
            <span class="octicon octicon-repo-forked"></span>
            Fork
          </a>
          <a href="/jrayaustin/swaggplayer/network" class="social-count">1</a>
        </li>

</ul>

        <h1 itemscope itemtype="http://data-vocabulary.org/Breadcrumb" class="entry-title public">
          <span class="mega-octicon octicon-repo"></span>
          <span class="author"><a href="/jrayaustin" class="url fn" itemprop="url" rel="author"><span itemprop="title">jrayaustin</span></a></span><!--
       --><span class="path-divider">/</span><!--
       --><strong><a href="/jrayaustin/swaggplayer" class="js-current-repository js-repo-home-link">swaggplayer</a></strong>

          <span class="page-context-loader">
            <img alt="" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
          </span>

        </h1>
      </div><!-- /.container -->
    </div><!-- /.repohead -->

    <div class="container">
      <div class="repository-with-sidebar repo-container new-discussion-timeline  ">
        <div class="repository-sidebar clearfix">
            
<div class="sunken-menu vertical-right repo-nav js-repo-nav js-repository-container-pjax js-octicon-loaders" data-issue-count-url="/jrayaustin/swaggplayer/issues/counts">
  <div class="sunken-menu-contents">
    <ul class="sunken-menu-group">
      <li class="tooltipped tooltipped-w" aria-label="Code">
        <a href="/jrayaustin/swaggplayer/tree/dev" aria-label="Code" class="selected js-selected-navigation-item sunken-menu-item" data-hotkey="g c" data-pjax="true" data-selected-links="repo_source repo_downloads repo_commits repo_releases repo_tags repo_branches /jrayaustin/swaggplayer/tree/dev">
          <span class="octicon octicon-code"></span> <span class="full-word">Code</span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

        <li class="tooltipped tooltipped-w" aria-label="Issues">
          <a href="/jrayaustin/swaggplayer/issues" aria-label="Issues" class="js-selected-navigation-item sunken-menu-item js-disable-pjax" data-hotkey="g i" data-selected-links="repo_issues repo_labels repo_milestones /jrayaustin/swaggplayer/issues">
            <span class="octicon octicon-issue-opened"></span> <span class="full-word">Issues</span>
            <span class="js-issue-replace-counter"></span>
            <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>        </li>

      <li class="tooltipped tooltipped-w" aria-label="Pull Requests">
        <a href="/jrayaustin/swaggplayer/pulls" aria-label="Pull Requests" class="js-selected-navigation-item sunken-menu-item js-disable-pjax" data-hotkey="g p" data-selected-links="repo_pulls /jrayaustin/swaggplayer/pulls">
            <span class="octicon octicon-git-pull-request"></span> <span class="full-word">Pull Requests</span>
            <span class="js-pull-replace-counter"></span>
            <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>


        <li class="tooltipped tooltipped-w" aria-label="Wiki">
          <a href="/jrayaustin/swaggplayer/wiki" aria-label="Wiki" class="js-selected-navigation-item sunken-menu-item js-disable-pjax" data-hotkey="g w" data-selected-links="repo_wiki /jrayaustin/swaggplayer/wiki">
            <span class="octicon octicon-book"></span> <span class="full-word">Wiki</span>
            <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>        </li>
    </ul>
    <div class="sunken-menu-separator"></div>
    <ul class="sunken-menu-group">

      <li class="tooltipped tooltipped-w" aria-label="Pulse">
        <a href="/jrayaustin/swaggplayer/pulse/weekly" aria-label="Pulse" class="js-selected-navigation-item sunken-menu-item" data-pjax="true" data-selected-links="pulse /jrayaustin/swaggplayer/pulse/weekly">
          <span class="octicon octicon-pulse"></span> <span class="full-word">Pulse</span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

      <li class="tooltipped tooltipped-w" aria-label="Graphs">
        <a href="/jrayaustin/swaggplayer/graphs" aria-label="Graphs" class="js-selected-navigation-item sunken-menu-item" data-pjax="true" data-selected-links="repo_graphs repo_contributors /jrayaustin/swaggplayer/graphs">
          <span class="octicon octicon-graph"></span> <span class="full-word">Graphs</span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>
    </ul>


      <div class="sunken-menu-separator"></div>
      <ul class="sunken-menu-group">
        <li class="tooltipped tooltipped-w" aria-label="Settings">
          <a href="/jrayaustin/swaggplayer/settings" aria-label="Settings" class="js-selected-navigation-item sunken-menu-item" data-pjax="true" data-selected-links="repo_settings /jrayaustin/swaggplayer/settings">
            <span class="octicon octicon-tools"></span> <span class="full-word">Settings</span>
            <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" />
</a>        </li>
      </ul>
  </div>
</div>

              <div class="only-with-full-nav">
                
  
<div class="clone-url "
  data-protocol-type="http"
  data-url="/users/set_protocol?protocol_selector=http&amp;protocol_type=push">
  <h3><strong>HTTPS</strong> clone URL</h3>
  <div class="input-group">
    <input type="text" class="input-mini input-monospace js-url-field"
           value="https://github.com/jrayaustin/swaggplayer.git" readonly="readonly">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-clipboard-text="https://github.com/jrayaustin/swaggplayer.git" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>

  
<div class="clone-url open"
  data-protocol-type="ssh"
  data-url="/users/set_protocol?protocol_selector=ssh&amp;protocol_type=push">
  <h3><strong>SSH</strong> clone URL</h3>
  <div class="input-group">
    <input type="text" class="input-mini input-monospace js-url-field"
           value="git@github.com:jrayaustin/swaggplayer.git" readonly="readonly">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-clipboard-text="git@github.com:jrayaustin/swaggplayer.git" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>

  
<div class="clone-url "
  data-protocol-type="subversion"
  data-url="/users/set_protocol?protocol_selector=subversion&amp;protocol_type=push">
  <h3><strong>Subversion</strong> checkout URL</h3>
  <div class="input-group">
    <input type="text" class="input-mini input-monospace js-url-field"
           value="https://github.com/jrayaustin/swaggplayer" readonly="readonly">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-clipboard-text="https://github.com/jrayaustin/swaggplayer" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>


<p class="clone-options">You can clone with
      <a href="#" class="js-clone-selector" data-protocol="http">HTTPS</a>,
      <a href="#" class="js-clone-selector" data-protocol="ssh">SSH</a>,
      or <a href="#" class="js-clone-selector" data-protocol="subversion">Subversion</a>.
  <a href="https://help.github.com/articles/which-remote-url-should-i-use" class="help tooltipped tooltipped-n" aria-label="Get help on which URL is right for you.">
    <span class="octicon octicon-question"></span>
  </a>
</p>

  <a href="http://mac.github.com" data-url="github-mac://openRepo/https://github.com/jrayaustin/swaggplayer" class="minibutton sidebar-button js-conduit-rewrite-url" title="Save jrayaustin/swaggplayer to your computer and use it in GitHub Desktop." aria-label="Save jrayaustin/swaggplayer to your computer and use it in GitHub Desktop.">
    <span class="octicon octicon-device-desktop"></span>
    Clone in Desktop
  </a>


                <a href="/jrayaustin/swaggplayer/archive/dev.zip"
                   class="minibutton sidebar-button"
                   aria-label="Download jrayaustin/swaggplayer as a zip file"
                   title="Download jrayaustin/swaggplayer as a zip file"
                   rel="nofollow">
                  <span class="octicon octicon-cloud-download"></span>
                  Download ZIP
                </a>
              </div>
        </div><!-- /.repository-sidebar -->

        <div id="js-repo-pjax-container" class="repository-content context-loader-container" data-pjax-container>
          

<a href="/jrayaustin/swaggplayer/blob/0986ef35dc9d4cac3bfc1174214a0ee3927aea60/web/js/adaptive-background.js" class="hidden js-permalink-shortcut" data-hotkey="y">Permalink</a>

<!-- blob contrib key: blob_contributors:v21:66f7a82fcce1ffc378f9938d2b607c1d -->

<div class="file-navigation">
  
<div class="select-menu js-menu-container js-select-menu left">
  <span class="minibutton select-menu-button js-menu-target css-truncate" data-hotkey="w"
    data-master-branch="master"
    data-ref="dev"
    title="dev"
    role="button" aria-label="Switch branches or tags" tabindex="0" aria-haspopup="true">
    <span class="octicon octicon-git-branch"></span>
    <i>branch:</i>
    <span class="js-select-button css-truncate-target">dev</span>
  </span>

  <div class="select-menu-modal-holder js-menu-content js-navigation-container" data-pjax aria-hidden="true">

    <div class="select-menu-modal">
      <div class="select-menu-header">
        <span class="select-menu-title">Switch branches/tags</span>
        <span class="octicon octicon-x js-menu-close" role="button" aria-label="Close"></span>
      </div> <!-- /.select-menu-header -->

      <div class="select-menu-filters">
        <div class="select-menu-text-filter">
          <input type="text" aria-label="Find or create a branch…" id="context-commitish-filter-field" class="js-filterable-field js-navigation-enable" placeholder="Find or create a branch…">
        </div>
        <div class="select-menu-tabs">
          <ul>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="branches" class="js-select-menu-tab">Branches</a>
            </li>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="tags" class="js-select-menu-tab">Tags</a>
            </li>
          </ul>
        </div><!-- /.select-menu-tabs -->
      </div><!-- /.select-menu-filters -->

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="branches">

        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-item js-navigation-item selected">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jrayaustin/swaggplayer/blob/dev/web/js/adaptive-background.js"
                 data-name="dev"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="dev">dev</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jrayaustin/swaggplayer/blob/gh-pages/web/js/adaptive-background.js"
                 data-name="gh-pages"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="gh-pages">gh-pages</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jrayaustin/swaggplayer/blob/master/web/js/adaptive-background.js"
                 data-name="master"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="master">master</a>
            </div> <!-- /.select-menu-item -->
        </div>

          <form accept-charset="UTF-8" action="/jrayaustin/swaggplayer/branches" class="js-create-branch select-menu-item select-menu-new-item-form js-navigation-item js-new-item-form" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="2vaY+MXjg5rA4BeDTlO6yRqpiGUDuk3r6HlQFm6kAAFq1Jyb2J4GBoPHbDBC/FIZLeLPwQzDdkYrps9MlH6zuQ==" /></div>
            <span class="octicon octicon-git-branch select-menu-item-icon"></span>
            <div class="select-menu-item-text">
              <h4>Create branch: <span class="js-new-item-name"></span></h4>
              <span class="description">from ‘dev’</span>
            </div>
            <input type="hidden" name="name" id="name" class="js-new-item-value">
            <input type="hidden" name="branch" id="branch" value="dev">
            <input type="hidden" name="path" id="path" value="web/js/adaptive-background.js">
          </form> <!-- /.select-menu-item -->

      </div> <!-- /.select-menu-list -->

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="tags">
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


        </div>

        <div class="select-menu-no-results">Nothing to show</div>
      </div> <!-- /.select-menu-list -->

    </div> <!-- /.select-menu-modal -->
  </div> <!-- /.select-menu-modal-holder -->
</div> <!-- /.select-menu -->

  <div class="button-group right">
    <a href="/jrayaustin/swaggplayer/find/dev"
          class="js-show-file-finder minibutton empty-icon tooltipped tooltipped-s"
          data-pjax
          data-hotkey="t"
          aria-label="Quickly jump between files">
      <span class="octicon octicon-list-unordered"></span>
    </a>
    <button class="js-zeroclipboard minibutton zeroclipboard-button"
          data-clipboard-text="web/js/adaptive-background.js"
          aria-label="Copy to clipboard"
          data-copied-hint="Copied!">
      <span class="octicon octicon-clippy"></span>
    </button>
  </div>

  <div class="breadcrumb">
    <span class='repo-root js-repo-root'><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/jrayaustin/swaggplayer/tree/dev" class="" data-branch="dev" data-direction="back" data-pjax="true" itemscope="url"><span itemprop="title">swaggplayer</span></a></span></span><span class="separator"> / </span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/jrayaustin/swaggplayer/tree/dev/web" class="" data-branch="dev" data-direction="back" data-pjax="true" itemscope="url"><span itemprop="title">web</span></a></span><span class="separator"> / </span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/jrayaustin/swaggplayer/tree/dev/web/js" class="" data-branch="dev" data-direction="back" data-pjax="true" itemscope="url"><span itemprop="title">js</span></a></span><span class="separator"> / </span><strong class="final-path">adaptive-background.js</strong>
  </div>
</div>


  <div class="commit file-history-tease">
      <img alt="Johnny Ray" class="main-avatar" data-user="479726" height="24" src="https://avatars1.githubusercontent.com/u/479726?v=2&amp;s=48" width="24" />
      <span class="author"><a href="/jrayaustin" rel="author">jrayaustin</a></span>
      <time datetime="2014-08-17T19:25:04-04:00" is="relative-time">August 17, 2014</time>
      <div class="commit-title">
          <a href="/jrayaustin/swaggplayer/commit/0986ef35dc9d4cac3bfc1174214a0ee3927aea60" class="message" data-pjax="true" title="demo">demo</a>
      </div>

    <div class="participation">
      <p class="quickstat"><a href="#blob_contributors_box" rel="facebox"><strong>1</strong>  contributor</a></p>
      

    </div>
    <div id="blob_contributors_box" style="display:none">
      <h2 class="facebox-header">Users who have contributed to this file</h2>
      <ul class="facebox-user-list">
          <li class="facebox-user-list-item">
            <img alt="Johnny Ray" data-user="479726" height="24" src="https://avatars1.githubusercontent.com/u/479726?v=2&amp;s=48" width="24" />
            <a href="/jrayaustin">jrayaustin</a>
          </li>
      </ul>
    </div>
  </div>

<div class="file-box">
  <div class="file">
    <div class="meta clearfix">
      <div class="info file-name">
          <span>2 lines (2 sloc)</span>
          <span class="meta-divider"></span>
        <span>2.322 kb</span>
      </div>
      <div class="actions">
        <div class="button-group">
          <a href="/jrayaustin/swaggplayer/raw/dev/web/js/adaptive-background.js" class="minibutton " id="raw-url">Raw</a>
            <a href="/jrayaustin/swaggplayer/blame/dev/web/js/adaptive-background.js" class="minibutton js-update-url-with-hash">Blame</a>
          <a href="/jrayaustin/swaggplayer/commits/dev/web/js/adaptive-background.js" class="minibutton " rel="nofollow">History</a>
        </div><!-- /.button-group -->

          <a class="octicon-button tooltipped tooltipped-nw js-conduit-openfile-check"
             href="http://mac.github.com"
             data-url="github-mac://openRepo/https://github.com/jrayaustin/swaggplayer?branch=dev&amp;filepath=web%2Fjs%2Fadaptive-background.js"
             aria-label="Open this file in GitHub for Mac"
             data-failed-title="Your version of GitHub for Mac is too old to open this file. Try checking for updates.">
              <span class="octicon octicon-device-desktop"></span>
          </a>

              <a class="octicon-button js-update-url-with-hash"
                 href="/jrayaustin/swaggplayer/edit/dev/web/js/adaptive-background.js"
                 data-method="post" rel="nofollow" data-hotkey="e"><span class="octicon octicon-pencil"></span></a>

            <a class="octicon-button danger"
               href="/jrayaustin/swaggplayer/delete/dev/web/js/adaptive-background.js"
               data-method="post" data-test-id="delete-blob-file" rel="nofollow">
          <span class="octicon octicon-trashcan"></span>
        </a>
      </div><!-- /.actions -->
    </div>
      
  <div class="blob-wrapper data type-javascript">
      <table class="highlight tab-size-8 js-file-line-container">
      <tr>
        <td id="L1" class="blob-line-num js-line-number" data-line-number="1"></td>
        <td id="LC1" class="blob-line-code js-file-line"><span class="cm">/*! Brian Gonzalez by jquery.adaptive-backgrounds.js 23-01-2014 */</span></td>
      </tr>
      <tr>
        <td id="L2" class="blob-line-num js-line-number" data-line-number="2"></td>
        <td id="LC2" class="blob-line-code js-file-line"><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">e</span><span class="p">){</span><span class="kd">var</span> <span class="nx">c</span><span class="o">=</span><span class="s2">&quot;data-ab-color&quot;</span><span class="p">,</span><span class="nx">d</span><span class="o">=</span><span class="s2">&quot;data-ab-parent&quot;</span><span class="p">,</span><span class="nx">f</span><span class="o">=</span><span class="s2">&quot;data-ab-css-background&quot;</span><span class="p">,</span><span class="nx">b</span><span class="o">=</span><span class="s2">&quot;ab-color-found&quot;</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="p">{</span><span class="nx">selector</span><span class="o">:</span><span class="s1">&#39;[data-adaptive-background=&quot;1&quot;]&#39;</span><span class="p">,</span><span class="nx">parent</span><span class="o">:</span><span class="kc">null</span><span class="p">,</span><span class="nx">normalizeTextColor</span><span class="o">:!</span><span class="mi">1</span><span class="p">,</span><span class="nx">normalizedTextColors</span><span class="o">:</span><span class="p">{</span><span class="nx">light</span><span class="o">:</span><span class="s2">&quot;#fff&quot;</span><span class="p">,</span><span class="nx">dark</span><span class="o">:</span><span class="s2">&quot;#000&quot;</span><span class="p">},</span><span class="nx">lumaClasses</span><span class="o">:</span><span class="p">{</span><span class="nx">light</span><span class="o">:</span><span class="s2">&quot;ab-light&quot;</span><span class="p">,</span><span class="nx">dark</span><span class="o">:</span><span class="s2">&quot;ab-dark&quot;</span><span class="p">}};</span><span class="o">!</span><span class="kd">function</span><span class="p">(</span><span class="nx">j</span><span class="p">){</span><span class="kd">var</span> <span class="nx">i</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nb">document</span><span class="p">.</span><span class="nx">createElement</span><span class="p">(</span><span class="s2">&quot;canvas&quot;</span><span class="p">).</span><span class="nx">getContext</span><span class="p">(</span><span class="s2">&quot;2d&quot;</span><span class="p">)},</span><span class="nx">p</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">g</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">q</span><span class="o">=</span><span class="k">new</span> <span class="nx">Image</span><span class="p">,</span><span class="nx">h</span><span class="o">=</span><span class="nx">g</span><span class="p">.</span><span class="nx">src</span><span class="o">||</span><span class="nx">g</span><span class="p">;</span><span class="s2">&quot;data:&quot;</span><span class="o">!==</span><span class="nx">h</span><span class="p">.</span><span class="nx">substring</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">5</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">q</span><span class="p">.</span><span class="nx">crossOrigin</span><span class="o">=</span><span class="s2">&quot;Anonymous&quot;</span><span class="p">),</span><span class="nx">q</span><span class="p">.</span><span class="nx">onload</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">s</span><span class="o">=</span><span class="nx">i</span><span class="p">();</span><span class="nx">s</span><span class="p">.</span><span class="nx">drawImage</span><span class="p">(</span><span class="nx">q</span><span class="p">,</span><span class="mi">0</span><span class="p">,</span><span class="mi">0</span><span class="p">);</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">s</span><span class="p">.</span><span class="nx">getImageData</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">0</span><span class="p">,</span><span class="nx">q</span><span class="p">.</span><span class="nx">width</span><span class="p">,</span><span class="nx">q</span><span class="p">.</span><span class="nx">height</span><span class="p">);</span><span class="nx">r</span><span class="o">&amp;&amp;</span><span class="nx">r</span><span class="p">(</span><span class="nx">t</span><span class="p">.</span><span class="nx">data</span><span class="p">)},</span><span class="nx">q</span><span class="p">.</span><span class="nx">src</span><span class="o">=</span><span class="nx">h</span><span class="p">},</span><span class="nx">o</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">g</span><span class="p">){</span><span class="k">return</span><span class="p">[</span><span class="s2">&quot;rgb(&quot;</span><span class="p">,</span><span class="nx">g</span><span class="p">,</span><span class="s2">&quot;)&quot;</span><span class="p">].</span><span class="nx">join</span><span class="p">(</span><span class="s2">&quot;&quot;</span><span class="p">)},</span><span class="nx">n</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">g</span><span class="p">){</span><span class="k">return</span> <span class="nx">g</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">h</span><span class="p">){</span><span class="k">return</span> <span class="nx">o</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">name</span><span class="p">)})},</span><span class="nx">m</span><span class="o">=</span><span class="mi">5</span><span class="p">,</span><span class="nx">l</span><span class="o">=</span><span class="mi">10</span><span class="p">,</span><span class="nx">k</span><span class="o">=</span><span class="p">{};</span><span class="nx">k</span><span class="p">.</span><span class="nx">colors</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">q</span><span class="p">,</span><span class="nx">g</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="nx">p</span><span class="p">(</span><span class="nx">q</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">y</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">,</span><span class="nx">w</span><span class="o">=</span><span class="p">{},</span><span class="nx">v</span><span class="o">=</span><span class="s2">&quot;&quot;</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="p">[],</span><span class="nx">s</span><span class="o">=</span><span class="p">{</span><span class="nx">dominant</span><span class="o">:</span><span class="p">{</span><span class="nx">name</span><span class="o">:</span><span class="s2">&quot;&quot;</span><span class="p">,</span><span class="nx">count</span><span class="o">:</span><span class="mi">0</span><span class="p">},</span><span class="nx">palette</span><span class="o">:</span><span class="nb">Array</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="kc">null</span><span class="p">,</span><span class="nb">Array</span><span class="p">(</span><span class="nx">r</span><span class="o">||</span><span class="nx">l</span><span class="p">)).</span><span class="nx">map</span><span class="p">(</span><span class="nb">Boolean</span><span class="p">).</span><span class="nx">map</span><span class="p">(</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span><span class="p">{</span><span class="nx">name</span><span class="o">:</span><span class="s2">&quot;0,0,0&quot;</span><span class="p">,</span><span class="nx">count</span><span class="o">:</span><span class="mi">0</span><span class="p">}})},</span><span class="nx">h</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">y</span><span class="o">&gt;</span><span class="nx">h</span><span class="p">;){</span><span class="k">if</span><span class="p">(</span><span class="nx">u</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">h</span><span class="p">],</span><span class="nx">u</span><span class="p">[</span><span class="mi">1</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">h</span><span class="o">+</span><span class="mi">1</span><span class="p">],</span><span class="nx">u</span><span class="p">[</span><span class="mi">2</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">h</span><span class="o">+</span><span class="mi">2</span><span class="p">],</span><span class="nx">v</span><span class="o">=</span><span class="nx">u</span><span class="p">.</span><span class="nx">join</span><span class="p">(</span><span class="s2">&quot;,&quot;</span><span class="p">),</span><span class="nx">w</span><span class="p">[</span><span class="nx">v</span><span class="p">]</span><span class="o">=</span><span class="nx">v</span> <span class="k">in</span> <span class="nx">w</span><span class="o">?</span><span class="nx">w</span><span class="p">[</span><span class="nx">v</span><span class="p">]</span><span class="o">+</span><span class="mi">1</span><span class="o">:</span><span class="mi">1</span><span class="p">,</span><span class="s2">&quot;0,0,0&quot;</span><span class="o">!==</span><span class="nx">v</span><span class="o">&amp;&amp;</span><span class="s2">&quot;255,255,255&quot;</span><span class="o">!==</span><span class="nx">v</span><span class="p">){</span><span class="kd">var</span> <span class="nx">x</span><span class="o">=</span><span class="nx">w</span><span class="p">[</span><span class="nx">v</span><span class="p">];</span><span class="nx">x</span><span class="o">&gt;</span><span class="nx">s</span><span class="p">.</span><span class="nx">dominant</span><span class="p">.</span><span class="nx">count</span><span class="o">?</span><span class="p">(</span><span class="nx">s</span><span class="p">.</span><span class="nx">dominant</span><span class="p">.</span><span class="nx">name</span><span class="o">=</span><span class="nx">v</span><span class="p">,</span><span class="nx">s</span><span class="p">.</span><span class="nx">dominant</span><span class="p">.</span><span class="nx">count</span><span class="o">=</span><span class="nx">x</span><span class="p">)</span><span class="o">:</span><span class="nx">s</span><span class="p">.</span><span class="nx">palette</span><span class="p">.</span><span class="nx">some</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">z</span><span class="p">){</span><span class="k">return</span> <span class="nx">x</span><span class="o">&gt;</span><span class="nx">z</span><span class="p">.</span><span class="nx">count</span><span class="o">?</span><span class="p">(</span><span class="nx">z</span><span class="p">.</span><span class="nx">name</span><span class="o">=</span><span class="nx">v</span><span class="p">,</span><span class="nx">z</span><span class="p">.</span><span class="nx">count</span><span class="o">=</span><span class="nx">x</span><span class="p">,</span><span class="o">!</span><span class="mi">0</span><span class="p">)</span><span class="o">:</span><span class="k">void</span> <span class="mi">0</span><span class="p">})}</span><span class="nx">h</span><span class="o">+=</span><span class="mi">4</span><span class="o">*</span><span class="nx">m</span><span class="p">}</span><span class="nx">g</span><span class="o">&amp;&amp;</span><span class="nx">g</span><span class="p">({</span><span class="nx">dominant</span><span class="o">:</span><span class="nx">o</span><span class="p">(</span><span class="nx">s</span><span class="p">.</span><span class="nx">dominant</span><span class="p">.</span><span class="nx">name</span><span class="p">),</span><span class="nx">palette</span><span class="o">:</span><span class="nx">n</span><span class="p">(</span><span class="nx">s</span><span class="p">.</span><span class="nx">palette</span><span class="p">)})})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">RGBaster</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">RGBaster</span><span class="o">||</span><span class="nx">k</span><span class="p">}(</span><span class="nb">window</span><span class="p">);</span><span class="nx">e</span><span class="p">.</span><span class="nx">adaptiveBackground</span><span class="o">=</span><span class="p">{</span><span class="nx">run</span><span class="o">:</span><span class="kd">function</span><span class="p">(</span><span class="nx">g</span><span class="p">){</span><span class="kd">var</span> <span class="nx">h</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">extend</span><span class="p">({},</span><span class="nx">a</span><span class="p">,</span><span class="nx">g</span><span class="p">);</span><span class="nx">e</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">selector</span><span class="p">).</span><span class="nx">each</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">j</span><span class="p">,</span><span class="nx">m</span><span class="p">){</span><span class="kd">var</span> <span class="nx">n</span><span class="o">=</span><span class="nx">e</span><span class="p">(</span><span class="k">this</span><span class="p">);</span><span class="kd">var</span> <span class="nx">l</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">o</span><span class="o">=</span><span class="nx">k</span><span class="p">()</span><span class="o">?</span><span class="nx">i</span><span class="p">()</span><span class="o">:</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">];</span><span class="nx">RGBaster</span><span class="p">.</span><span class="nx">colors</span><span class="p">(</span><span class="nx">o</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">p</span><span class="p">){</span><span class="nx">n</span><span class="p">.</span><span class="nx">attr</span><span class="p">(</span><span class="nx">c</span><span class="p">,</span><span class="nx">p</span><span class="p">.</span><span class="nx">dominant</span><span class="p">);</span><span class="nx">n</span><span class="p">.</span><span class="nx">trigger</span><span class="p">(</span><span class="nx">b</span><span class="p">,{</span><span class="nx">color</span><span class="o">:</span><span class="nx">p</span><span class="p">.</span><span class="nx">dominant</span><span class="p">,</span><span class="nx">palette</span><span class="o">:</span><span class="nx">p</span><span class="p">.</span><span class="nx">palette</span><span class="p">})},</span><span class="mi">20</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">k</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">attr</span><span class="p">(</span><span class="nx">f</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">i</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">css</span><span class="p">(</span><span class="s2">&quot;background-image&quot;</span><span class="p">).</span><span class="nx">replace</span><span class="p">(</span><span class="s2">&quot;url(&quot;</span><span class="p">,</span><span class="s2">&quot;&quot;</span><span class="p">).</span><span class="nx">replace</span><span class="p">(</span><span class="s2">&quot;)&quot;</span><span class="p">,</span><span class="s2">&quot;&quot;</span><span class="p">)};</span><span class="nx">n</span><span class="p">.</span><span class="nx">on</span><span class="p">(</span><span class="nx">b</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">q</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">o</span><span class="o">=</span><span class="nx">r</span><span class="p">;</span><span class="kd">var</span> <span class="nx">u</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">parent</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">parents</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">parent</span><span class="p">).</span><span class="nx">length</span><span class="p">){</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">parents</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">parent</span><span class="p">)}</span><span class="k">else</span><span class="p">{</span><span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">attr</span><span class="p">(</span><span class="nx">d</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">parents</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">attr</span><span class="p">(</span><span class="nx">d</span><span class="p">)).</span><span class="nx">length</span><span class="p">){</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">parents</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">attr</span><span class="p">(</span><span class="nx">d</span><span class="p">))}</span><span class="k">else</span><span class="p">{</span><span class="k">if</span><span class="p">(</span><span class="nx">k</span><span class="p">()){</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">}</span><span class="k">else</span><span class="p">{</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">parent</span><span class="p">()}}}</span><span class="nx">u</span><span class="p">.</span><span class="nx">css</span><span class="p">({</span><span class="nx">backgroundColor</span><span class="o">:</span><span class="nx">r</span><span class="p">.</span><span class="nx">color</span><span class="p">});</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">v</span><span class="p">){</span><span class="kd">var</span> <span class="nx">w</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">color</span><span class="p">.</span><span class="nx">match</span><span class="p">(</span><span class="sr">/\d+/g</span><span class="p">);</span><span class="k">return</span><span class="p">((</span><span class="nx">w</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">*</span><span class="mi">299</span><span class="p">)</span><span class="o">+</span><span class="p">(</span><span class="nx">w</span><span class="p">[</span><span class="mi">1</span><span class="p">]</span><span class="o">*</span><span class="mi">587</span><span class="p">)</span><span class="o">+</span><span class="p">(</span><span class="nx">w</span><span class="p">[</span><span class="mi">2</span><span class="p">]</span><span class="o">*</span><span class="mi">114</span><span class="p">))</span><span class="o">/</span><span class="mi">1000</span><span class="p">};</span><span class="kd">var</span> <span class="nx">s</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">v</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="p">(</span><span class="nx">v</span><span class="p">)</span><span class="o">&gt;=</span><span class="mi">128</span><span class="o">?</span><span class="nx">h</span><span class="p">.</span><span class="nx">normalizedTextColors</span><span class="p">.</span><span class="nx">dark</span><span class="o">:</span><span class="nx">h</span><span class="p">.</span><span class="nx">normalizedTextColors</span><span class="p">.</span><span class="nx">light</span><span class="p">};</span><span class="kd">var</span> <span class="nx">p</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">v</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="p">(</span><span class="nx">v</span><span class="p">)</span><span class="o">&lt;=</span><span class="mi">128</span><span class="o">?</span><span class="nx">h</span><span class="p">.</span><span class="nx">lumaClasses</span><span class="p">.</span><span class="nx">dark</span><span class="o">:</span><span class="nx">h</span><span class="p">.</span><span class="nx">lumaClasses</span><span class="p">.</span><span class="nx">light</span><span class="p">};</span><span class="k">if</span><span class="p">(</span><span class="nx">h</span><span class="p">.</span><span class="nx">normalizeTextColor</span><span class="p">){</span><span class="nx">u</span><span class="p">.</span><span class="nx">css</span><span class="p">({</span><span class="nx">color</span><span class="o">:</span><span class="nx">s</span><span class="p">(</span><span class="nx">r</span><span class="p">.</span><span class="nx">color</span><span class="p">)})}</span><span class="nx">u</span><span class="p">.</span><span class="nx">addClass</span><span class="p">(</span><span class="nx">p</span><span class="p">(</span><span class="nx">r</span><span class="p">.</span><span class="nx">color</span><span class="p">)).</span><span class="nx">attr</span><span class="p">(</span><span class="s2">&quot;data-ab-yaq&quot;</span><span class="p">,</span><span class="nx">t</span><span class="p">(</span><span class="nx">r</span><span class="p">.</span><span class="nx">color</span><span class="p">))});</span><span class="nx">l</span><span class="p">()})}}})(</span><span class="nx">jQuery</span><span class="p">);</span></td>
      </tr>
</table>

  </div>

  </div>
</div>

<a href="#jump-to-line" rel="facebox[.linejump]" data-hotkey="l" style="display:none">Jump to Line</a>
<div id="jump-to-line" style="display:none">
  <form accept-charset="UTF-8" class="js-jump-to-line-form">
    <input class="linejump-input js-jump-to-line-field" type="text" placeholder="Jump to line&hellip;" autofocus>
    <button type="submit" class="button">Go</button>
  </form>
</div>

        </div>

      </div><!-- /.repo-container -->
      <div class="modal-backdrop"></div>
    </div><!-- /.container -->
  </div><!-- /.site -->


    </div><!-- /.wrapper -->

      <div class="container">
  <div class="site-footer">
    <ul class="site-footer-links right">
      <li><a href="https://status.github.com/">Status</a></li>
      <li><a href="http://developer.github.com">API</a></li>
      <li><a href="http://training.github.com">Training</a></li>
      <li><a href="http://shop.github.com">Shop</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/about">About</a></li>

    </ul>

    <a href="/" aria-label="Homepage">
      <span class="mega-octicon octicon-mark-github" title="GitHub"></span>
    </a>

    <ul class="site-footer-links">
      <li>&copy; 2014 <span title="0.03525s from github-fe124-cp1-prd.iad.github.net">GitHub</span>, Inc.</li>
        <li><a href="/site/terms">Terms</a></li>
        <li><a href="/site/privacy">Privacy</a></li>
        <li><a href="/security">Security</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
  </div><!-- /.site-footer -->
</div><!-- /.container -->


    <div class="fullscreen-overlay js-fullscreen-overlay" id="fullscreen_overlay">
  <div class="fullscreen-container js-suggester-container">
    <div class="textarea-wrap">
      <textarea name="fullscreen-contents" id="fullscreen-contents" class="fullscreen-contents js-fullscreen-contents js-suggester-field" placeholder=""></textarea>
    </div>
  </div>
  <div class="fullscreen-sidebar">
    <a href="#" class="exit-fullscreen js-exit-fullscreen tooltipped tooltipped-w" aria-label="Exit Zen Mode">
      <span class="mega-octicon octicon-screen-normal"></span>
    </a>
    <a href="#" class="theme-switcher js-theme-switcher tooltipped tooltipped-w"
      aria-label="Switch themes">
      <span class="octicon octicon-color-mode"></span>
    </a>
  </div>
</div>



    <div id="ajax-error-message" class="flash flash-error">
      <span class="octicon octicon-alert"></span>
      <a href="#" class="octicon octicon-x close js-ajax-error-dismiss" aria-label="Dismiss error"></a>
      Something went wrong with that request. Please try again.
    </div>


      <script crossorigin="anonymous" src="https://assets-cdn.github.com/assets/frameworks-12d5fda141e78e513749dddbc56445fe172cbd9a.js" type="text/javascript"></script>
      <script async="async" crossorigin="anonymous" src="https://assets-cdn.github.com/assets/github-41dd8db0828df06456337006ee18d4eba9443071.js" type="text/javascript"></script>
      
      
        <script async src="https://www.google-analytics.com/analytics.js"></script>
  </body>
</html>

