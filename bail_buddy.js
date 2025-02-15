// ==UserScript==
// @name     Bail Buddy
// @namespace  http://tampermonkey.net/
// @version    1.0
// @description  A Torn.com bail estimator, filter, and bail-buy sniping tool
// @author     neth [3564828]
// @match    https://www.torn.com/jailview.php
// @icon     https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant    GM_setValue
// @grant    GM_getValue
// @grant    GM.setValue
// @grant    GM.getValue
// @grant    GM_log
// ==/UserScript==

// NOTE FOR LATER: URL is https://www.torn.com/jailview.php#start=50
// The #start=50 is important


// Example request of when there is pagination (from the 2nd page)
// When there are n pages "pagination" is not in data. IMPORTANT TODO (TODO so I see this later)
//{
//     "total": 2,
//     "success": true,
//     "data": {
//         "info_text": "<div class=\"info-msg-cont  border-round m-top10\">\r\n\t\t<div class=\"info-msg border-round\">\r\n\t\t\t<i class=\"info-icon\"></i>\r\n\t\t\t<div class=\"delimiter\">\r\n\t\t\t\t<div class=\"msg right-round\" role='alert' aria-live='polite'>\r\n\t\t\t\t\tYou take a trip down to the jail and take a look at the captives.\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div><hr class=\"page-head-delimiter m-top10 m-bottom10 \" />",
//         "is_player_exist": true,
//         "pagination": "<div class=\"gallery-wrapper pagination m-top10 \"> <div class=\"pagination-l\"></div><a href='#'><i class=\"pagination-left\"></i></a>\n        <a  page=\"1\" class=\"page-number first t-gray-3\" href=\"#\" style=\"display: inline-block;\">\n            <span class=\"left-end\"></span>\n            <span class=\"page-nb\">1</span>\n            <span class=\"right-end\"></span>\n        </a>\n        <span class=\"points t-gray-3\">...</span>\n\t\t\t\t<a page=\"1\" class=\"page-number\" href='#'>\n\t\t\t\t    <span class=\"left-end\"></span>\n\t\t\t\t    <span class=\"page-nb\">1</span>\n\t\t\t\t    <span class=\"right-end\"></span>\n                </a>\n\t\t\t\t<a page=\"2\" class=\"page-number active\">\n\t\t\t\t    <span class=\"left-end\"></span>\n\t\t\t\t    <span class=\"page-nb\">2</span>\n\t\t\t\t    <span class=\"right-end\"></span>\n\t\t\t\t</a>\n        <span class=\"points t-gray-3\">...</span>\n        <a page=\"2\" class=\"page-number last t-gray-3\" href=\"#start=50\" style=\"display: inline-block;\">\n            <span class=\"left-end\"></span>\n            <span class=\"page-nb\">2</span>\n            <span class=\"right-end\"></span>\n        </a><a class=\"disable\"><i class=\"pagination-right disable\"></i></a><div class=\"pagination-r\"></div></div>\n<div class=\"clear\"></div>",
//         "is_user_text_name": false,
//         "players": [
//             {
//                 "online_offline": "<ul id=\"iconTray\" class=\"big svg singleicon\" style=\"display: inline-block;\"><li id=\"icon1___4df87b69\" class=\"iconShow\" title=\"&lt;b&gt;Online&lt;/b&gt;\" style=\"\"></li></ul>",
//                 "print_tag": "<a class=\"user faction platinum\" rel=nofollow href=/factions.php?step=profile&ID=13851 ><img src=\"https://factiontags.torn.com/13851-63379.png\" border=\"0\" alt=\"NUKE\" title=\"NUKE\" style=\"opacity:0.6;filter:alpha(opacity=60)\" /></a>",
//                 "print_name": "<a class=\"user name \" data-placeholder=\"RedFireGhost [2552257]\" href=\"/profiles.php?XID=2552257\" title=\"RedFireGhost [2552257]\"  ><div class=\"honor-text-wrap default big\"><img srcset=\"/images/honors/267/f.png 1x, /images/honors/267/f@2x.png 2x, /images/honors/267/f@3x.png 3x, /images/honors/267/f@4x.png 4x\" src=\"/images/honors/267/f.png\" border=\"0\" alt=\"RedFireGhost [2552257]\"/> <span class=\"honor-text honor-text-svg\"><span data-char=\"R\"></span><span data-char=\"e\"></span><span data-char=\"d\"></span><span data-char=\"F\"></span><span data-char=\"i\"></span><span data-char=\"r\"></span><span data-char=\"e\"></span><span data-char=\"G\"></span><span data-char=\"h\"></span><span data-char=\"o\"></span><span data-char=\"s\"></span><span data-char=\"t\"></span></span><span class=\"honor-text\">RedFireGhost</span></div></a>",
//                 "time": "41m ",
//                 "level": "88",
//                 "jailreason": "Running an illegal street game",
//                 "user_id": "2552257"
//             },
//             {
//                 "online_offline": "<ul id=\"iconTray\" class=\"big svg singleicon\" style=\"display: inline-block;\"><li id=\"icon1___1bf52dff\" class=\"iconShow\" title=\"&lt;b&gt;Online&lt;/b&gt;\" style=\"\"></li></ul>",
//                 "print_tag": "<a class=\"user faction platinum\" rel=nofollow href=/factions.php?step=profile&ID=49319 ><img src=\"https://factiontags.torn.com/49319-63467.png\" border=\"0\" alt=\"\" title=\"\" style=\"opacity:0.6;filter:alpha(opacity=60)\" /></a>",
//                 "print_name": "<a class=\"user name \" data-placeholder=\"Drenaz [3365724]\" href=\"/profiles.php?XID=3365724\" title=\"Drenaz [3365724]\"  ><div class=\"honor-text-wrap default big\"><img srcset=\"/images/honors/251/f.png 1x, /images/honors/251/f@2x.png 2x, /images/honors/251/f@3x.png 3x, /images/honors/251/f@4x.png 4x\" src=\"/images/honors/251/f.png\" border=\"0\" alt=\"Drenaz [3365724]\"/> <span class=\"honor-text honor-text-svg\"><span data-char=\"D\"></span><span data-char=\"r\"></span><span data-char=\"e\"></span><span data-char=\"n\"></span><span data-char=\"a\"></span><span data-char=\"z\"></span></span><span class=\"honor-text\">Drenaz</span></div></a>",
//                 "time": "38m ",
//                 "level": "31",
//                 "jailreason": "Suspected abduction",
//                 "user_id": "3365724"
//             }
//         ]
//     }
// }

(function() {

  // Project constants
  const PROJECT_NAME = 'Bail Buddy'
  const STORAGE_KEY = 'settings'
  const API_URL = 'https://api.torn.com/user/?selections=education,profile&key='

  const EVENT_ESTIMATE_UPDATED = 'bb-estimate-updated'
  const EVENT_DISCOUNTS_UPDATED = 'bb-discounts-updated'
  const EVENT_FILTERS_CHANGED = 'bb-filters-changed'
  const EVENT_FILTER_RESULT_CHANGED = 'bb-filter-result-changed'
  const EVENT_HIDE_NON_MATCHES_CHANGED = 'bb-hide-non-matches-changed'
  const EVENT_SORTER_CHANGED = 'bb-sorter-changed'
  const EVENT_DISPLAY_ESTIMATES_CHANGED = 'bb-display-estimates-changed'
  const EVENT_HIDE_REASONS_CHANGED = 'bb-hide-reasons-changed'

  const REGEX_NON_NUMBER = /[^0-9.]/g
  const REGEX_TIME = /(?:(\d+)h )?(\d+)m/

  const DISCOUNTS = {
    'administrative-law': {
      displayName: 'Administrative Law',
      category: 'Education',
      amount: .05,
      discountChecker: (response) => response.education_completed.includes(93),
    },
    'use-of-force': {
      displayName: 'Use Of Force In Int\'l Law',
      category: 'Education',
      amount: .1,
      discountChecker: (response) => response.education_completed.includes(98),
    },
    'bachelor-law': {
      displayName: 'Bachelor Of Law',
      category: 'Education',
      amount: .5,
      discountChecker: (response) => response.education_completed.includes(102),
    },
    'law-firm-job': {
      displayName: 'Law Firm Job',
      category: 'Job',
      amount: .5,
      discountChecker: (response) => response.job.company_type === 2 ,
    },
  }

  const FILTERS = { // TODO implement more filters
    minBail: {
      displayName: 'Min Bail',
      description: 'The maximum bail amount, any bail lesser is ignored. No value means no minimum bail.',
      inputType: 'text',
      htmlAttributes: {
        placeholder: 'Not Set'
      },
      eventName: 'input',
      setInputValue: (inputElement, value) => inputElement.value = value,
      parseInput: (inputElement) => {
        sanitizeCurrencyInput(inputElement)
        return inputElement.value === '' ? null : parseInt(inputElement.value)
      },
      filterChecker: (userData, value) => value === null || userData.estimate >= value,
    },
    maxBail: {
      displayName: 'Max Bail',
      description: 'The maximum bail amount, any bail greater is ignored. No value means no maximum bail.',
      inputType: 'text',
      htmlAttributes: {
        placeholder: 'Not Set'
      },
      eventName: 'input',
      setInputValue: (inputElement, value) => inputElement.value = value,
      parseInput: (inputElement) => {
        sanitizeCurrencyInput(inputElement)
        return inputElement.value === '' ? null : parseInt(inputElement.value)
      },
      filterChecker: (userData, value) => value === null || userData.estimate <= value,
    },
    hideOnlinePlayers: {
      displayName: 'Hide Online',
      description: 'If checked, players that are online are ignored.',
      inputType: 'checkbox',
      htmlAttributes: {},
      eventName: 'change',
      setInputValue: (inputElement, value) => inputElement.checked = value,
      parseInput: (inputElement) => inputElement.checked,
      filterChecker: (userData, value) => !(value && userData.online),
    },
    hideIdlePlayers: {
      displayName: 'Hide Idle',
      description: 'If checked, players that are idle are ignored.',
      inputType: 'checkbox',
      htmlAttributes: {},
      eventName: 'change',
      setInputValue: (inputElement, value) => inputElement.checked = value,
      parseInput: (inputElement) => inputElement.checked,
      filterChecker: (userData, value) => !(value && userData.idle),
    },
    hideOfflinePlayers: {
      displayName: 'Hide Offline',
      description: 'If checked, players that are offline are ignored.',
      inputType: 'checkbox',
      htmlAttributes: {},
      eventName: 'change',
      setInputValue: (inputElement, value) => inputElement.checked = value,
      parseInput: (inputElement) => inputElement.checked,
      filterChecker: (userData, value) => !(value && userData.offline),
    },
  }

  const DEFAULT_TORN_SORTER = 'time-descending'
  const SORTERS = {
    'bail-ascending': {
      displayName: 'Bail Ascending',
      sorterFunction: (a, b) => a.estimate - b.estimate,
    },
    'bail-descending': {
      displayName: 'Bail Descending',
      sorterFunction: (a, b) => b.estimate - a.estimate,
    },
    'time-ascending': {
      displayName: 'Time Ascending',
      sorterFunction: (a, b) => a.minutes - b.minutes,
    },
    'time-descending': {
      displayName: 'Time Descending',
      sorterFunction: (a, b) => b.minutes - a.minutes,
    },
    'level-ascending': {
      displayName: 'Level Ascending',
      sorterFunction: (a, b) => a.level - b.level,
    },
    'level-descending': {
      displayName: 'Level Descending',
      sorterFunction: (a, b) => b.level - a.level,
    },
    'reason': {
      displayName: 'Reason',
      sorterFunction: (a, b) => a.reasonText.localeCompare(b.reasonText),
    }
  }

  const DOLLAR_FORMAT = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const DEFAULT_SETTINGS = {
    settingsVersion: 1.02,
    rootCollapsed: false,
    autoScroll: false,
    apiKey: '',
    showApiKey: true,
    discounts: {},
    bailFilter: {
      hideNonMatches: false,
      minBail: null,
      maxBail: null,
      hideOnlinePlayers: false,
      hideIdlePlayers: false,
      hideOfflinePlayers: false,
    },
    sorter: DEFAULT_TORN_SORTER,
    disablePagination: true,
    displayEstimates: true,
    hideReasons: false,
  }

  // Load & sanitize the settings
  const settings = loadSettings()
  if (sanitizeSettings()) {
    saveSettings()
  }

  const style = document.createElement('style')
  style.type = 'text/css'

  // Get the title gradient used by Torn & reverse it for a hover/click effect
  const titleBlackGradient = getComputedStyle(document.documentElement).getPropertyValue('--title-black-gradient').trim()
  const titleBlackGradientReversed = titleBlackGradient.replace(/(\d+)deg/, (match, angle) => {
    return `${(parseInt(angle, 10) + 180) % 360}deg`;
  });

  // CSS code
  style.innerHTML = `
    .bb-toggle-menu-collapsed::before {
      content: '► ';
    }

    .bb-toggle-menu-expanded::before {
      content: '▼ ';
    }

    .bb-generic-text {
      font-size: 12px;
      color: var(--default-color);
    }

    .bb-italic-text {
      font-size: 12px;
      color: #999;
      font-style: italic;
    }

    .bb-settings-label {
      font-size: 14px;
      color: var(--default-color);
      font-weight: bold;
      text-wrap: nowrap;
    }

    .bb-checkbox {
      border-radius: 2px;
      margin-right: 2px;
    }

    .bb-flex-column {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    }

    .bb-flex-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: center;
    }

    .bb-inline-flex-row {
      display: inline-flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;
    }

    .bb-flex-gap4 {
      gap: 4px;
    }

    .bb-flex-gap2 {
      gap: 2px;
    }

    .bb-settings-container {
      align-items: flex-start !important;
      justify-content: flex-start !important;
      gap: 24px;
    }

    .bb-horizontal-divider {
      border-bottom-style: solid;
      border-bottom-width: 1px;
      border-bottom-color: var(--title-divider-bottom-color);
      border-top-style: solid;
      border-top-width: 1px;
      border-top-color: var(--title-divider-top-color);
    }

    .bb-tooltip-trigger {
      padding: 1px;
      border: 1px solid var(--default-color);
      background-color: var(--default-color);
      color: var(--default-bg-panel-color);
      border-radius: 50%;
      cursor: pointer;
      text-align: center;
      width: 10px;
      height: 10px;
      line-height: 10px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
    }

    .bb-tooltip-trigger::before {
      content: '?';
    }

    .bb-tooltip-popup {
      position: absolute;
      text-wrap: pretty;
      max-width: 25%;
      border-radius: 4px;
      padding: 5px;
      font-size: 14px;
      border-color: var(--tooltip-border-color);
      background-color: var(--tooltip-bg-color);
      color: var(--default-color);
      box-shadow: var(--tooltip-shadow);
      box-sizing: border-box;
      z-index: 10;
      display: none;
    }

    @media (max-width: 768px) {
      .bb-tooltip-popup {
        max-width: 50%;
      }
    }

    @media (max-width: 480px) {
      .bb-tooltip-popup {
        max-width: 70%;
      }
    }

    .bb-estimate-span {
      color: var(--default-green-color);
    }

    .bb-collapsed {
      display: none !important;
    }
    
    .bb-input {
      padding: 1px 2px 1px 2px;
      caret-color: var(--bbc-input-color);
      color: var(--bbc-input-color);
      background-color: var(--bbc-input-bg-color);
      border: 1px solid var(--bbc-input-border-color);
      border-radius: 4px;
    }
    
    .bb-select {
      color: var(--bbc-input-color);
      background-color: var(--bbc-input-bg-color);
      border: 1px solid var(--bbc-input-border-color);
      border-radius: 4px;
    }
    
    .bb-bail-filter {
     /* TODO remove? */
    }
    
    .bb-bail-filter input {
      max-width: 10ch;
    }
    
    #bb-root {
      width: 100%;
    }

    #bb-root-toggle-button {
      width: 100%;
      cursor: pointer;
      background-clip: border-box;
      background-origin: border-box;
      background-image: ${titleBlackGradient};
      border-radius: 5px;
      padding: 2px 5px 2px 5px;
      margin-top: 8px;
    }

    #bb-root-toggle-button:hover {
      background-image: ${titleBlackGradientReversed};
    }

    #bb-root-toggle-button[data-expanded="true"] {
      border-radius: 5px 5px 0px 0px !important;
    }

    .bb-root-toggle-label {
      font-weight: bold;
      text-align: left;
      text-shadow: var(--tutorial-title-shadow);
      color: var(--tutorial-title-color);
    }

    #bb-content-container {
      background-color: var(--default-bg-panel-color);
      border-radius: 0px 0px 5px 5px;
      padding: 5px;
    }

    #bb-api-key-container {
      padding-bottom: 4px;
    }

    #bb-api-key-input {
      width: fit-content;
      min-width: 16ch;
      padding-right: 24px;
    }
    
    #bb-api-key-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    #bb-api-key-hide-input-button {
      position: absolute;
      right: 2px;
      top: 8px;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 13px;
      padding: 0px;
      border: none;
      line-height: 1;
      z-index: 10;
    }

    #bb-api-key-validate-button {
      line-height: normal;
      height: auto;
      font-size: 13px;
    }
  
    #bb-api-key-validate-button-response {
      line-height: normal;
      font-size: 14px;
    }
    
    #bb-sort-select {
      max-width: 18ch;
    }

  `

  let filtersTooltipText = `
    Any bail not within the scope of the configured filters will be ignored by the bail sniper. You can also
    optionally hide them from the list by enabling <strong>Hide Non-Matches</strong>.<br><br>
  `
  for (const filter of Object.values(FILTERS)) {
    filtersTooltipText += `<strong>${filter.displayName}</strong> - ${filter.description}<br><br>`
  }
  
  document.head.appendChild(style)

  const rootContainer = document.createElement('div')
  rootContainer.innerHTML = `
  <div id="bb-root" class="bb-flex-column">
    <button id="bb-root-toggle-button" class="bb-flex-row">
      <span class="bb-root-toggle-label">${PROJECT_NAME}</span>
    </button>
    <div id="bb-content-divider" class="bb-horizontal-divider"></div>
    <div id="bb-content-container" class="bb-flex-column">
      <div id="bb-api-key-container" class="bb-flex-row bb-flex-gap4">
        <label class="bb-settings-label">API Key</label>
        <span class="bb-tooltip-trigger" data-tooltip-id="api-key"></span>
        <div class="bb-tooltip-popup" data-tooltip-id="api-key">
          Optionally use a minimal access API key to update your bail discounts. The API Key is only stored in
          your browser and no requests are made to Torn's API without clicking Validate. Remember to click it after
          completing a bail reducing education course or joining/leaving a Law Firm job.
        </div>
        <div id="bb-api-key-input-wrapper">
          <input id="bb-api-key-input" class="bb-input" maxlength="16" size="16" placeholder="Enter your API key" value="${settings.apiKey}" />
          <button id="bb-api-key-hide-input-button"></button>
        </div>
        <button id="bb-api-key-validate-button" class="torn-btn">Validate</button>
        <span id="bb-api-key-validate-button-response"></span>
      </div>
      <div class="bb-flex-row bb-settings-container">
        <div id="bb-bail-discount-container" class="bb-flex-column bb-flex-gap4">
          <div class="bb-inline-flex-row bb-flex-gap4">
            <span class="bb-settings-label">Bail Discounts</span>
            <span class="bb-tooltip-trigger" data-tooltip-id="bail-discounts"></span>
            <div class="bb-tooltip-popup" data-tooltip-id="bail-discounts">
              The discount perks you have (or don't have) which are used in the bail estimate calculation. It is very
              important to make sure these are accurate. Use the above API Key field to help out!
            </div>
          </div>
        </div>
        <div id="bb-bail-filters" class="bb-flex-column bb-flex-gap2">
          <div class="bb-inline-flex-row bb-flex-gap4">
            <span class="bb-settings-label">Bail Filter</span>
            <span class="bb-tooltip-trigger" data-tooltip-id="bail-filters"></span>
            <div class="bb-tooltip-popup" data-tooltip-id="bail-filters">
              ${filtersTooltipText}
            </div>
          </div>
          <div class="bb-inline-flex-row bb-flex-gap4">
            <input id="bb-filter-hide-non-matches" type="checkbox" ${settings.bailFilter.hideNonMatches ? "checked" : ""}/>
            <label for="bb-filter-hide-non-matches">Hide Non-Matches</label>
          </div>
        </div>
        <div class="bb-flex-column bb-flex-gap4">
          <div class="bb-inline-flex-row bb-flex-gap4">
            <span class="bb-settings-label">Sorting</span>
            <span class="bb-tooltip-trigger" data-tooltip-id="bail-sorting"></span>
            <div class="bb-tooltip-popup" data-tooltip-id="bail-sorting">
              Defines how the bail list below is sorted. Default means Torn's default sorting.
            </div>
          </div>
          <select name="bb-sort" id="bb-sort-select" class="bb-select"></select>
        </div class="bb-flex-column bb-flex-gap4">
        <div class="bb-flex-column bb-flex-gap4">
          <div class="bb-inline-flex-row bb-flex-gap4">
            <span class="bb-settings-label">Misc.</span>
            <span class="bb-tooltip-trigger" data-tooltip-id="misc-settings"></span>
            <div class="bb-tooltip-popup" data-tooltip-id="misc-settings">
              <strong>Disable Pages</strong> - Disables the pagination of the baillist. This ensures that all jailed users
              are present on this page.
            </div>
          </div>
          <div class="bb-inline-flex-row bb-flex-gap4">
              <input id="bb-display-bail-estimates-checkbox" type="checkbox" ${settings.displayEstimates ? "checked" : ""} />
              <label for="bb-display-bail-estimates-checkbox">Display Estimates</label> 
          </div>
          <div class="bb-inline-flex-row bb-flex-gap4">
              <input id="bb-hide-reasons-checkbox" type="checkbox" ${settings.hideReasons ? "checked" : ""} />
              <label for="bb-hide-reasons-checkbox">Hide Reasons</label> 
          </div>
          <div class="bb-inline-flex-row bb-flex-gap4">
              <input id="bb-disable-pagination-checkbox" type="checkbox" ${settings.disablePagination ? "checked" : ""} />
              <label for="bb-disable-pagination-checkbox">Disable Pages</label> 
          </div>
        </div>
      </div>
    </div>
  </div>
  `

  const eventTarget = new EventTarget()
  const bailData = {}

  // Add root to DOM
  const userListWrapperElement = document.querySelector('.userlist-wrapper')
  userListWrapperElement.insertBefore(rootContainer, userListWrapperElement.firstChild)

  // Update elements based on current settings
  updateApiKeyInputVisibility()
  updateRootCollapsed()

  // Collapsible UI functionality
  document.getElementById('bb-root-toggle-button').addEventListener('click', () => {
    settings.rootCollapsed = !settings.rootCollapsed
    updateRootCollapsed()
    saveSettings()
  })

  // Functionality for all tooltips
  rootContainer.querySelectorAll('.bb-tooltip-trigger').forEach((tooltipTrigger) => {
    const tooltipId = tooltipTrigger.dataset.tooltipId
    const getTooltipPopup = () => rootContainer.querySelector(`.bb-tooltip-popup[data-tooltip-id="${tooltipId}"]`)

    // Show tooltip popup on hovering/clicking of tooltip trigger
    tooltipTrigger.addEventListener('mouseover', () => {
      getTooltipPopup().style.display = 'block'
    })
    tooltipTrigger.addEventListener('mouseout', () => {
      getTooltipPopup().style.display = 'none'
    })
    tooltipTrigger.addEventListener('click', () => {
      const tooltipPopup = getTooltipPopup()
      tooltipPopup.style.display = tooltipPopup.style.display === 'none' ? 'block' : 'none'
    })

    // Tooltip positioning
    tooltipTrigger.addEventListener('mousemove', (event) => {
      const tooltipPopup = getTooltipPopup();
      const cursorX = event.pageX;
      const cursorY = event.pageY;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const tooltipWidth = tooltipPopup.offsetWidth;
      const tooltipHeight = tooltipPopup.offsetHeight;

      const windowCenter = windowWidth / 2;
      let left, top;

      if (cursorX < windowCenter) {
        left = cursorX + 15;
        if (left + tooltipWidth > windowWidth) {
          left = windowWidth - tooltipWidth - 15;
        }
      } else {
        left = cursorX - tooltipWidth - 15;
        if (left < 0) {
          left = 15;
        }
      }

      top = cursorY + 15;

      if (top + tooltipHeight > windowHeight) {
        top = windowHeight - tooltipHeight - 15;
      }

      if (top < 0) {
        top = 15;
      }

      tooltipPopup.style.left = `${left}px`;
      tooltipPopup.style.top = `${top}px`;
    })
  })

  // API Key input handling
  const apiKeyInput = document.getElementById('bb-api-key-input')
  apiKeyInput.value = settings.apiKey
  apiKeyInput.addEventListener('input', () => {
    settings.apiKey = apiKeyInput.value
    saveSettings()
  })

  // API Key visibility handling
  document.getElementById('bb-api-key-hide-input-button').addEventListener('click', () => {
    settings.showApiKey = !settings.showApiKey
    updateApiKeyInputVisibility()
    saveSettings()
  })

  // Validate button click handling
  const apiKeyValidateButton = document.getElementById('bb-api-key-validate-button')
  apiKeyValidateButton.addEventListener('click', async () => {
    apiKeyValidateButton.disabled = true
    displayValidateResponseText('Validating...', 'var(--default-yellow-color)', 999_999)
    // Update the API
    const response = await validateAPIKey(settings.apiKey)
    if (response === "OK") {
      displayValidateResponseText('Bail Discounts Updated!', 'var(--default-green-color)')
    }
    else {
      displayValidateResponseText(`Error: ${response.message}`, 'var(--default-red-color)')
    }
    apiKeyValidateButton.disabled = false
  })

  // Add the discount elements
  const discountContainer = document.getElementById('bb-bail-discount-container')
  for (const [discountId, discount] of Object.entries(DISCOUNTS)) {
    const discountElement = document.createElement('div')
    discountElement.innerHTML = `
    <div class="bb-flex-row bb-flex-gap4">
        <input class="bb-checkbox" type="checkbox" id="discount-${discountId}"/>
        <label for="discount-${discountId}">
          <span class="bb-italic-text">(${(discount.amount * 100).toFixed(0).padStart(2, '0')}%)</span>
          <span class="bb-generic-text">${discount.displayName}</span>
        </label>
    </div>
    `
    discountContainer.appendChild(discountElement)

    const checkboxElement = document.getElementById(`discount-${discountId}`)
    // Update if it is checked or not
    checkboxElement.checked = discountId in settings.discounts
    checkboxElement.addEventListener('change', () => {
      setBailDiscount(discountId, checkboxElement.checked, {
        updateElement: false
      })
    })
  }

  // Filter hide non matches
  const hideNonMatchesCheckbox = document.getElementById('bb-filter-hide-non-matches')
  hideNonMatchesCheckbox.addEventListener('change', () => {
    setHideNonMatches(hideNonMatchesCheckbox.checked)
  })

  // Add the filter elements
  const filtersContainer = document.getElementById('bb-bail-filters')
  for (const [filterId, filter] of Object.entries(FILTERS)) {
    const filterElement = document.createElement('div')
    filterElement.classList.add('bb-bail-filter', 'bb-inline-flex-row', 'bb-flex-gap4')

    const inputElementId = `bb-filter-${filterId}`

    // Filter label
    const filterLabelElement = document.createElement('label')
    filterLabelElement.textContent = filter.displayName
    filterLabelElement.htmlFor = inputElementId

    // Filter input
    const filterInputElement = document.createElement('input')
    filterInputElement.classList.add('bb-input')
    filterInputElement.id = inputElementId
    filterInputElement.type = filter.inputType

    // noinspection JSValidateTypes
    filter.setInputValue(filterInputElement, settings.bailFilter[filterId])

    // Set HTML attributes
    for (const [attributeName, attributeValue] of Object.entries(filter.htmlAttributes)) {
      // noinspection JSCheckFunctionSignatures
      filterInputElement.setAttribute(attributeName, attributeValue)
    }

    // Handle filter input
    filterInputElement.addEventListener(filter.eventName, () => {
      const inputValue = filter.parseInput(filterInputElement)
      setBailFilter(filterId, inputValue)
    })

    filterElement.append(filterInputElement, filterLabelElement)
    filtersContainer.appendChild(filterElement)
  }

  // Sorting
  const bbSortSelectElement = document.getElementById('bb-sort-select')
  for (const [sorterId, sorter] of Object.entries(SORTERS)) {
    const sorterOptionElement = document.createElement('option')
    sorterOptionElement.id = `bb-sorter-${sorterId}`
    sorterOptionElement.value = sorterId
    sorterOptionElement.label = sorter.displayName
    if (DEFAULT_TORN_SORTER === sorterId) {
      sorterOptionElement.label += ' (Default)'
    }
    if (settings.sorter === sorterId || (settings.sorter == null && sorterId === DEFAULT_TORN_SORTER)) {
      sorterOptionElement.selected = true
    }
    bbSortSelectElement.appendChild(sorterOptionElement)
  }

  bbSortSelectElement.addEventListener('change', () => setSorter(bbSortSelectElement.value))

  // Misc Settings
  const displayBailEstimatesCheckbox = document.getElementById('bb-display-bail-estimates-checkbox')
  displayBailEstimatesCheckbox.addEventListener('change', () => {
    setEstimateVisibility(displayBailEstimatesCheckbox.checked)
  })

  const hideReasonsCheckbox = document.getElementById('bb-hide-reasons-checkbox')
  hideReasonsCheckbox.addEventListener('change', () => {
    setHideReasons(hideReasonsCheckbox.checked)
  })

  // Update reason title
  updateReasonTitle()

  // Listen to custom events
  eventTarget.addEventListener(EVENT_ESTIMATE_UPDATED, onEstimateUpdated)
  eventTarget.addEventListener(EVENT_DISCOUNTS_UPDATED, onDiscountsUpdated)
  eventTarget.addEventListener(EVENT_FILTERS_CHANGED, onFiltersUpdated)
  eventTarget.addEventListener(EVENT_FILTER_RESULT_CHANGED, onFilterResultUpdated)
  eventTarget.addEventListener(EVENT_HIDE_NON_MATCHES_CHANGED, onHideNonMatchesUpdated)
  eventTarget.addEventListener(EVENT_SORTER_CHANGED, onSorterChanged)
  eventTarget.addEventListener(EVENT_DISPLAY_ESTIMATES_CHANGED, onDisplayEstimatesChanged)
  eventTarget.addEventListener(EVENT_HIDE_REASONS_CHANGED, onHideReasonsChanged)

  // Observe the jailed user list for changes
  const listObserverConfig = { childList: true, subtree: true }
  const listObserver = new MutationObserver(listMutationCallback)
  const listNode = document.querySelector('.user-info-list-wrap')
  listObserver.observe(listNode, listObserverConfig)

  // Intercept network requests to get all bailed users

  // TODO docs
  function loadSettings() {
    return GM_getValue(STORAGE_KEY, {})
  }

  /**
   * Saves settings to persistent storage.
   *
   * @return {void}
   */
  function saveSettings() {
    GM_setValue(STORAGE_KEY, settings)
  }

  // TODO docs
  function sanitizeSettings() {
    // Only sanitize if settings version hasn't changed.
    if (settings.settingsVersion === DEFAULT_SETTINGS.settingsVersion) {
      return false
    }
    // Sanitize the settings
    _sanitizeObjectSetting(settings, DEFAULT_SETTINGS)
    // Update the version
    settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion
    return true
  }

  function _sanitizeObjectSetting(got, expected) {
    // Delete keys that shouldn't exist
    for (const key in got) {
      if (!(key in expected)) {
        delete got[key]
      }
    }
    // Add missing keys
    for (const key in expected) {
      if (!(key in got)) {
        got[key] = expected[key]
      }
    }
    // Handle nested objects of current
    for (const [key, value] of Object.entries(got)) {
      if (value instanceof Object) {
        const expectedValue = expected[key]
        _sanitizeObjectSetting(value, expectedValue)
      }
    }
  }

  // TODO updated docs
  function listMutationCallback(mutationList) {
    const bailElements = mutationList
      .filter(mutation => mutation.type === 'childList')
      .flatMap(mutation => Array.from(mutation.addedNodes))
      .filter(node => node instanceof Element && node.parentNode instanceof Element)
      .filter(node => !('bbId' in node.dataset))
      .filter(element => element.parentNode.classList.contains('user-info-list-wrap'))
      bailElements.forEach(element => {
        // Extract the user data & handle estimate element
        const userData = extractUserData(element)
        if (userData == null) {
          return
        }
        element.dataset.bbId = userData.id
        bailData[userData.id] = userData
        updateEstimate(userData)
        updateReasonVisibility(userData)
      });

      if (bailElements.length > 0 && settings.sorter !== DEFAULT_TORN_SORTER) {
        sortBailList()
      }
  }

  function updateAllEstimates() {
    Object.values(bailData).forEach(updateEstimate)
  }

  function updateEstimate(userData) {
    const prevEstimate = userData.estimate
    userData.estimate = calculateEstimate(userData.level, userData.minutes)
    if (prevEstimate !== userData.estimate || userData.estimateString === undefined) {
      userData.estimateString = formatEstimate(userData.estimate)
      eventTarget.dispatchEvent(new CustomEvent(EVENT_ESTIMATE_UPDATED, { detail: { userData: userData } }))
    }
  }

  function getEstimateSpan(userData) {
    return userData.bailElement.querySelector('.info-wrap .reason .bb-estimate-span')
  }

  function getReasonElement(bailElement) {
    return bailElement.querySelector('.info-wrap .reason')
  }

  function updateEstimateSpan(userData) {
    // Find the estimate element
    let estimateElement = getEstimateSpan(userData)

    // Create the reason element if not done
    if (estimateElement == null) {
      estimateElement = createEstimateSpanElement(userData.estimateString)
      updateEstimateVisibility(estimateElement)
      const reasonElement = getReasonElement(userData.bailElement)
      reasonElement.appendChild(document.createElement('br'))
      reasonElement.appendChild(estimateElement)
    }
    // Otherwise update it if the text content doesn't match the estimate string
    else if (estimateElement.textContent !== userData.estimateString) {
      // Update the estimate element
      estimateElement.textContent = userData.estimateString
    }
  }

  function updateAllFilterResults() {
    Object.values(bailData).forEach(updateFilterResult)
  }

  function updateFilterResult(userData) {
    const lastResult = userData.filterResult
    userData.filterResult = true
    for (const [filterId, filter] of Object.entries(FILTERS)) {
      const filterValue = settings.bailFilter[filterId]
      if (!filter.filterChecker(userData, filterValue)) {
        userData.filterResult = false
        break
      }
    }
    if (lastResult !== userData.filterResult) {
      eventTarget.dispatchEvent(new CustomEvent(EVENT_FILTER_RESULT_CHANGED, { detail: { userData: userData } }))
    }
  }

  function updateBailVisibility(userData) {
    userData.bailElement.style.display = (settings.bailFilter.hideNonMatches && !userData.filterResult) ? 'none' : 'list-item'
  }

  function setHideNonMatches(hideNonMatches) {
    if (settings.bailFilter.hideNonMatches === hideNonMatches) {
      // Do nothing if provided value is the same as current
      return
    }
    settings.bailFilter.hideNonMatches = hideNonMatches
    eventTarget.dispatchEvent(new CustomEvent(EVENT_HIDE_NON_MATCHES_CHANGED))
    saveSettings()
  }

  // TODO updated docs
  function extractUserData(bailElement) {
    // User ID & name
    const userNameElement = bailElement.querySelector('.user.name')
    if (userNameElement == null || userNameElement.href == null) {
      return null
    }

    const id = userNameElement.href.split('=')[1]
    const name = userNameElement.title.split('[')[0].trim()

    // Time remaining in jail
    const timeElement = bailElement.querySelector('.info-wrap .time')
    const timeString = timeElement.textContent.trim()
    const minutes = timeToMinutes(timeString).toFixed(0)

    // User level
    const levelElement = bailElement.querySelector('.info-wrap .level')
    const level = parseInt(levelElement.textContent.replace(/[^0-9]/g, '').trim())

    // Online status
    const userOnlineStatus = bailElement.querySelector('.iconShow')
    const online = userOnlineStatus.title.includes('Online')
    const offline = userOnlineStatus.title.includes('Offline')
    const idle = userOnlineStatus.title.includes('Idle')

    // Reason
    const reasonElement = getReasonElement(bailElement)
    const reasonText = reasonElement.textContent
    const reasonParts = Array.from(reasonElement.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)

    return {
      id: id,
      name: name,
      minutes: minutes,
      level: level,
      bailElement: bailElement,
      online: online,
      offline: offline,
      idle: idle,
      reasonText: reasonText,
      reasonParts: reasonParts,
    }
  }

  /**
   * Creates the span element used to display the estimate.
   *
   * @param {string} estimateString - The estimate string to be set as the text content of the span element.
   * @return {HTMLElement} The newly created span element with the class and text content applied.
   */
  function createEstimateSpanElement(estimateString) {
    const estimateElement = document.createElement('span')
    estimateElement.classList.add('bb-estimate-span')
    estimateElement.textContent = estimateString
    return estimateElement
  }

  /**
   * Calculates the torn $ estimate based on the level, time in minutes, and applicable discounts.
   *
   * @param {number} level - The jailed user's level.
   * @param {number} minutes - The time in minutes remaining for the jailed user.
   * @return {number} The calculated estimate.
   */
  function calculateEstimate(level, minutes) {
    let estimate = 100.0 * level * minutes

    let discountMultiplier = 1.0
    for (const discountId in settings.discounts) {
      discountMultiplier *= 1.0 - DISCOUNTS[discountId].amount
    }

    return estimate * discountMultiplier
  }

  /**
   * Converts a time string in the format "HH:MM" to the total number of minutes.
   * If the input does not match the expected format, it returns -1.
   *
   * @param {string} timeString - A string representing time in "HH:MM" format.
   * @return {number} The total number of minutes represented by the given time string,
   * or -1 if the input format is invalid.
   */
  function timeToMinutes(timeString) {
    const match = timeString.match(REGEX_TIME)
    if (match) {
      const hours = parseInt(match[1] || '0', 10)
      const minutes = parseInt(match[2], 10)
      return (hours * 60) + minutes
    }
    return -1
  }

  /**
   * Formats a numeric estimate into a currency string using a predefined dollar format.
   *
   * @param {number} estimate - The numeric value representing the estimate to be formatted.
   * @return {string} The formatted estimate as a string in dollar currency format.
   */
  function formatEstimate(estimate) {
    return DOLLAR_FORMAT.format(estimate)
  }

  // TODO docs
  function setBailDiscount(discountId, hasDiscount, options = {}) {
    if (hasDiscount === (discountId in settings.discounts)) {
      // Do nothing if set
      return false
    }

    // Set options
    const defaultOptions = {
      updateElement: true,
      saveSettings: true,
      emitEvent: true,
    }
    options = { ...defaultOptions, ...options }


    // Set in settings
    if (hasDiscount) {
      settings.discounts[discountId] = true
    }
    else {
      delete settings.discounts[discountId]
    }

    // Update the discount checkbox element
    if (options.updateElement) {
      document.getElementById(`discount-${discountId}`).checked = hasDiscount
    }

    // Emit event
    if (options.emitEvent) {
      eventTarget.dispatchEvent(new CustomEvent(EVENT_DISCOUNTS_UPDATED))
    }

    // Save settings
    if (options.saveSettings) {
      saveSettings()
    }

    return true
  }

  function setBailFilter(filterId, filterValue) {
    const currentValue = settings.bailFilter[filterId]
    GM_log("SET BAIL FILTER: filterId=" + filterId +", filterValue=" + filterValue)
    if (currentValue === filterValue) {
      GM_log("SKIP BAIL FILTER")
      return
    }
    settings.bailFilter[filterId] = filterValue
    eventTarget.dispatchEvent(new CustomEvent(EVENT_FILTERS_CHANGED))
    saveSettings()
  }

  /**
   * Validates the provided API key by sending a request to the API endpoint.
   *
   * @param {string} apiKey - The API key to be validated.
   * @return {Promise<string|Error>} A promise that resolves to "OK" if the API key is valid,
   *                                 an Error object with details if the validation fails,
   *                                 or an Error object in case of any other issues during the process.
   */
  async function validateAPIKey(apiKey) {
    try {
      const response = await fetch(API_URL + apiKey, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json =  await response.json()
      if ("error" in json) {
        return new Error(json.error.error)
      }

      let discountsChanged = false
      for (const [discountId, discount] of Object.entries(DISCOUNTS)) {
        discountsChanged = setBailDiscount(discountId, discount.discountChecker(json),  {
          saveSettings: false,
          emitEvent: false,
        }) || discountsChanged
      }

      if (discountsChanged) {
        eventTarget.dispatchEvent(new CustomEvent(EVENT_DISCOUNTS_UPDATED))
        saveSettings()
      }

      return "OK"
    }
    catch (error) {
      return error
    }
  }

  /**
   * Displays a validation response message in the relevant HTML element,
   * sets its text content and color, and clears it after a specified duration.
   *
   * @param {string} text - The validation response text to be displayed.
   * @param {string} color - The color to apply to the text content.
   * @param {number} [displayTime=5000] - Duration in milliseconds for which the message is displayed, defaults to 5000ms.
   * @return {void} This function does not return any value.
   */
  function displayValidateResponseText(text, color, displayTime = 5_000) {
    const responseElement = document.getElementById('bb-api-key-validate-button-response')
    clearValidateResponseText(responseElement)
    responseElement.textContent = text
    responseElement.style.color = color
    const timeoutId = setTimeout(clearValidateResponseText, displayTime, responseElement)
    responseElement.setAttribute('timeout-id', timeoutId.toString())
  }

  /**
   * Clears the validation response text from a given response element.
   * If there is an existing timeout associated with the response element, it clears the timeout as well.
   *
   * @param {HTMLElement} responseElement - The DOM element containing the API Key validation response.
   * @return {void}
   */
  function clearValidateResponseText(responseElement){
    if (responseElement.hasAttribute('timeout-id')) {
      const existingTimeoutId = responseElement.getAttribute('timeout-id')
      clearTimeout(parseInt(existingTimeoutId))
    }
    responseElement.textContent = ''
  }

  /**
   * Updates the state of the root element's collapsed or expanded state in the UI based on the `settings.rootCollapsed` property.
   * This method modifies the classes of various elements to reflect the current state.
   *
   * @return {void}
   */
  function updateRootCollapsed() {
    const contentContainer = document.getElementById('bb-content-container')
    const contentDivider = document.getElementById('bb-content-divider')
    const rootToggleButton = document.getElementById('bb-root-toggle-button')
    const rootToggleLabel = rootContainer.querySelector('.bb-root-toggle-label')

    if (settings.rootCollapsed) {
      contentContainer.classList.add('bb-collapsed')
      contentDivider.classList.add('bb-collapsed')
      delete rootToggleButton.dataset.expanded
    }
    else {
      contentContainer.classList.remove('bb-collapsed')
      contentDivider.classList.remove('bb-collapsed')
      rootToggleButton.dataset.expanded = 'true'
    }

    rootToggleLabel.classList.add('bb-toggle-menu-' + (settings.rootCollapsed ? 'collapsed' : 'expanded'))
    rootToggleLabel.classList.remove('bb-toggle-menu-' + (!settings.rootCollapsed ? 'collapsed' : 'expanded'))
  }

  /**
   * Updates the visibility of the API key input field and the associated button icon.
   * Toggles the input type between 'text' and 'password' based on the `showApiKey` setting.
   * Adjusts the button icon accordingly to indicate the current visibility state.
   *
   * @return {void}
   */
  function updateApiKeyInputVisibility() {
    document.getElementById('bb-api-key-input').type = settings.showApiKey ? 'text' : 'password'
    document.getElementById('bb-api-key-hide-input-button').textContent = settings.showApiKey ? '🙉' : '🙈'
  }


  function setSorter(sorterId) {
    if (settings.sorter === sorterId) {
      return
    }
    settings.sorter = sorterId
    eventTarget.dispatchEvent(new CustomEvent(EVENT_SORTER_CHANGED))
    saveSettings()
  }

  function sortBailList() {
    const sorter = SORTERS[settings.sorter == null ? DEFAULT_TORN_SORTER : settings.sorter]
    const bailList = document.querySelector('.user-info-list-wrap')

    Array.from(bailList.children)
      .map(element => bailData[element.dataset.bbId])
      .filter(userData => userData != null && userData.bailElement != null)
      .sort(sorter.sorterFunction)
      .forEach(userData => bailList.appendChild(userData.bailElement))
  }

  function findCheapestBail() { //TODO ensure being used
    let cheapest = null
    for (const userData of Object.values(bailData)) {
      if (userData.filterResult && (cheapest === null || userData.estimate < cheapest.estimate)) {
        cheapest = userData
      }
    }
    return cheapest
  }

  function sanitizeCurrencyInput(inputElement) {
    inputElement.value = inputElement.value.replace(REGEX_NON_NUMBER, '')
  }

  function setEstimateVisibility(value) {
    if (settings.displayEstimates === value) {
      return
    }
    settings.displayEstimates = value
    eventTarget.dispatchEvent(new CustomEvent(EVENT_DISPLAY_ESTIMATES_CHANGED))
    saveSettings()
  }


  function setHideReasons(value) {
    if (settings.hideReasons === value) {
      return
    }
    settings.hideReasons = value
    eventTarget.dispatchEvent(new CustomEvent(EVENT_HIDE_REASONS_CHANGED))
    saveSettings()
  }


  function updateAllEstimateVisibilities() {
    for (const userData of Object.values(bailData)) {
      const estimateSpan = getEstimateSpan(userData)
      if (estimateSpan != null) {
        updateEstimateVisibility(estimateSpan)
      }
    }
  }

  function updateEstimateVisibility(estimateSpan) {
    estimateSpan.style.display = settings.displayEstimates ? 'inline-block' : 'none'
  }

  function updateAllReasonVisibilities() {
    Object.values(bailData).forEach(updateReasonVisibility)
  }

  function updateReasonVisibility(userData) {
    const reasonElement = getReasonElement(userData.bailElement)
    let reasonPart = 0
    for (const childNode of Array.from(reasonElement.childNodes)) {
      if (childNode.nodeType === Node.TEXT_NODE) { // Hide the reason
        childNode.textContent = settings.hideReasons ?  '' : userData.reasonParts[reasonPart]
        reasonPart++
      }
      else if (childNode.nodeName === 'A' || childNode.nodeName === 'BR') { // Hide any player name links in the reason
        childNode.style.display = settings.hideReasons ? 'none' : 'inline'
      }
    }
  }


  function updateReasonTitle() {
    // Determine title
    let title = ""
    if (!settings.hideReasons && settings.displayEstimates) {
      title = "Reason & Estimate"
    }
    else if (settings.displayEstimates) {
      title = "Estimate"
    }
    else if (!settings.hideReasons) {
      title = "Reason"
    }

    // Modify the reason to include/exclude estimate
    document.querySelector('.reason.title-divider.divider-spiky').textContent = title
  }

  // EVENT HANDLERS

  function onEstimateUpdated(event) {
    updateEstimateSpan(event.detail.userData)
    updateFilterResult(event.detail.userData)
  }

  function onDiscountsUpdated() {
    updateAllEstimates()
  }

  function onFiltersUpdated() {
    updateAllFilterResults()
  }

  function onFilterResultUpdated(event) {
    updateBailVisibility(event.detail.userData)
  }

  function onHideNonMatchesUpdated() {
    Object.values(bailData).forEach(updateBailVisibility)
  }

  function onSorterChanged() {
    sortBailList()
  }

  function onDisplayEstimatesChanged() {
    updateAllEstimateVisibilities()
    updateReasonTitle()
  }

  function onHideReasonsChanged() {
    updateAllReasonVisibilities()
    updateReasonTitle()
  }

})()