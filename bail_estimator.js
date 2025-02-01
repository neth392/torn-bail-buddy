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

(function() {
  // Project constants
  const PROJECT_NAME = 'Bail Buddy'
  const STORAGE_KEY = 'settings'
  const API_URL = 'https://api.torn.com/user/?selections=education,profile&key='

  const EVENT_ESTIMATE_UPDATED = 'bb-estimate-updated'
  const EVENT_FILTER_RESULT_UPDATED = 'bb-filter-result-updated'
  const EVENT_HIDE_NON_MATCHES_UPDATED = 'bb-hide-non-matches-updated'
  const EVENT_FILTERS_UPDATED = 'bb-filters-updated'
  const EVENT_DISCOUNTS_UPDATED = 'bb-discounts-updated'

  const DISCOUNTS = Object.freeze({
    'administrative-law': Object.freeze({
      displayName: 'Administrative Law',
      category: 'Education',
      amount: .05,
      discountChecker: (response) => response.education_completed.includes(93),
    }),
    'use-of-force': Object.freeze({
      displayName: 'Use Of Force In Int\'l Law',
      category: 'Education',
      amount: .1,
      discountChecker: (response) => response.education_completed.includes(98),
    }),
    'bachelor-law': Object.freeze({
      displayName: 'Bachelor Of Law',
      category: 'Education',
      amount: .5,
      discountChecker: (response) => response.education_completed.includes(102),
    }),
    'law-firm-job': Object.freeze({
      displayName: 'Law Firm Job',
      category: 'Job',
      amount: .5,
      discountChecker: (response) => response.job.company_type === 2 ,
    }),
  })

  const DEFAULT_SETTINGS = Object.freeze({
    rootCollapsed: false,
    autoScroll: false,
    apiKey: '',
    showApiKey: true,
    discounts: Object.freeze({}),
    bailFilter: Object.freeze({
      enabled: false,
      hideNonMatches: false,
      minBail: null,
      maxBail: null,
    }),
  })

  const FILTERS = Object.freeze({ // TODO implement filters
    minBail: Object.freeze({
      displayName: 'Min Bail',
      valueType: 'number',
      htmlAttributes: Object.freeze({
        type: 'number',
        min: '0',
      }),
      filterChecker: (userData, value) => value === null || userData.estimate >= value,
    }),
    maxBail: Object.freeze({
      displayName: 'Max Bail',
      inputType: 'text',
      htmlAttributes: Object.freeze({
        type: 'number',
        min: '0',
      }),
      filterChecker: (userData, value) => value === null || userData.estimate <= value,
    })
  })

  const TIME_REGEX = /(?:(\d+)h )?(\d+)m/

  const DOLLAR_FORMAT = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const eventTarget = new EventTarget()

  const style = document.createElement('style')
  style.type = 'text/css'

  // Get the title gradient used by Torn & reverse it for a hover/click effect
  const titleBlackGradient = getComputedStyle(document.documentElement).getPropertyValue('--title-black-gradient').trim()
  const titleBlackGradientReversed = titleBlackGradient.replace(/(\d+)deg/, (match, angle) => {
    return `${(parseInt(angle, 10) + 180) % 360}deg`;
  });


  // Load & sanitize the settings
  const settings = loadSettings()
  if (sanitizeSettings(settings)) {
    saveSettings()
  }

  const bailData = {}

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
      min-width: 22%;
      padding: 2px;
      caret-color: var(--bbc-input-color);
      color: var(--bbc-input-color);
      background-color: var(--bbc-input-bg-color);
      border: 1px solid var(--bbc-input-border-color);
      border-radius: 4px;
    }

    #bb-api-key-hide-input-button {
      cursor: pointer;
      font-size: 16px;
      padding: 0px;
      border: none;
      text-align: center;
      line-height: 1;
      margin-left: -4px;
    }

    #bb-api-key-validate-button {
      padding: 2px;
      border: none;
      border-radius: 4px;
      background-color: var(--default-blue-color);
      color: var(--default-black-color);
      cursor: pointer;
    }

    #bb-api-key-validate-button:hover {
      background-color: var(--default-blue-hover-color);
    }

    #bb-api-key-validate-button-response {
      line-height: 1;
      font-size: 14px;
    }


  `
  document.head.appendChild(style)

  const rootContainer = document.createElement('div')
  rootContainer.innerHTML = `
  <div id="bb-root" class="bb-flex-column">
    <button id="bb-root-toggle-button" class="bb-flex-row">
      <span class="bb-root-toggle-label">${PROJECT_NAME}</span>
    </button>
    <div id="bb-content-divider" class="bb-horizontal-divider"></div>
    <div id="bb-content-container" class="bb-flex-column">
      <div id="bb-api-key-container" class="bb-inline-flex-row bb-flex-gap4">
        <label class="bb-settings-label">API Key</label>
        <span class="bb-tooltip-trigger" data-tooltip-id="api-key"></span>
        <div class="bb-tooltip-popup" data-tooltip-id="api-key">
          Optionally use a minimal access API key to update your bail discounts. The API Key is only stored in
          your browser and no requests are made to Torn's API without clicking Validate. Remember to click it after
          completing a bail reducing education course or joining/leaving a Law Firm job.
        </div>
        <input id="bb-api-key-input" placeholder="Enter your API key" value="${settings.apiKey}" />
        <button id="bb-api-key-hide-input-button"></button>
        <button id="bb-api-key-validate-button">Validate</button>
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
        <div class="bb-flex-column bb-flex-gap4">
          <div class="bb-inline-flex-row bb-flex-gap4">
            <span class="bb-settings-label">Bail Filter</span>
            <span class="bb-tooltip-trigger" data-tooltip-id="bail-filters"></span>
            <div class="bb-tooltip-popup" data-tooltip-id="bail-filters">
              Any bail not within the scope of the configured filters will be ignored by the bail sniper. You can also
              optionally hide them from the list by enabling 'Hide Non-Matches'.
            </div>
          </div>
          <div class="bb-inline-flex-row bb-flex-gap4">
            <input id="bb-filter-hide-non-matches" type="checkbox" checked=${settings.bailFilter.hideNonMatches} />
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
        </div>
      </div>
    </div>
  </div>
  `

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
  document.querySelectorAll('.bb-tooltip-trigger').forEach((tooltipTrigger) => {
    const tooltipId = tooltipTrigger.dataset.tooltipId
    const getTooltipPopup = () => document.querySelector(`.bb-tooltip-popup[data-tooltip-id="${tooltipId}"]`)

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
      const tooltipPopup = getTooltipPopup()
      tooltipPopup.style.top = `${event.pageY + 15}px`
      tooltipPopup.style.left = `${event.pageX + 15}px`
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
      setBailDiscount(discountId, checkboxElement.checked, false)
      updateAllEstimateSpans()

      saveSettings()
    })
  }

  // Add the filter elements
  // TODO

  // Modify the reason to include estimate
  document.querySelector('.reason.title-divider.divider-spiky').textContent = "Reason & Estimate"

  // Listen to custom events
  eventTarget.addEventListener(EVENT_ESTIMATE_UPDATED, onEstimateUpdated)
  eventTarget.addEventListener(EVENT_FILTER_RESULT_UPDATED, onFilterResultUpdated)
  eventTarget.addEventListener(EVENT_HIDE_NON_MATCHES_UPDATED, onHideNonMatchesUpdated)

  // Observe the jailed user list for changes
  const listObserverConfig = { childList: true, subtree: true }
  const listObserver = new MutationObserver(listMutationCallback)
  const listNode = document.querySelector('.user-info-list-wrap')
  listObserver.observe(listNode, listObserverConfig)

  /**
   * Loads and retrieves the settings from storage.
   *
   * @return {Object} Returns the stored settings object, or the default settings if no stored settings are found.
   */
  function loadSettings() {
    return GM_getValue(STORAGE_KEY, {})
  }

  /**
   * Saves settings to persistent storage using a predefined storage key.
   *
   * @return {void}
   */
  function saveSettings() {
    GM_setValue(STORAGE_KEY, settings)
  }

  /**
   * Sanitizes the given settings object by ensuring it matches the structure of the DEFAULT_SETTINGS object.
   * Missing keys from the DEFAULT_SETTINGS object are added, and extraneous keys not in DEFAULT_SETTINGS are removed.
   *
   * @param {Object} settings - The settings object to be sanitized.
   * @return {boolean} Returns true if the settings object was modified, false otherwise.
   */
  function sanitizeSettings(settings) {
    let settingsModified = false
    // Add missing settings
    for (const key in DEFAULT_SETTINGS) {
      if (!(key in settings)) {
        settings[key] = DEFAULT_SETTINGS[key]
        settingsModified = true
      }
    }
    // Remove old settings
    for (const key in settings) {
      if (!(key in DEFAULT_SETTINGS)) {
        delete settings[key]
        settingsModified = true
      }
    }
    return settingsModified
  }

  // TODO updated docs
  function listMutationCallback(mutationList) {
    mutationList
      .filter(mutation => mutation.type === 'childList')
      .flatMap(mutation => Array.from(mutation.addedNodes))
      .filter(node => node instanceof Element && node.parentNode instanceof Element)
      .filter(element => element.parentNode.classList.contains('user-info-list-wrap'))
      .forEach(element => {
        const userData = extractUserData(element)
        bailData[userData.id] = userData
        updateEstimate(userData)
      });
  }

  function updateAllEstimates() {
    bailData.values().forEach(updateEstimate)
  }

  function updateEstimate(userData) {
    const prevEstimate = bailData.estimate
    bailData.estimate = calculateEstimate(bailData.level, bailData.minutes)
    if (prevEstimate !== bailData.estimate) {
      bailData.estimateString = formatEstimate(bailData.estimate)
      const event = new CustomEvent(EVENT_ESTIMATE_UPDATED, { userData: userData })
      eventTarget.dispatchEvent(event)
    }
  }

  function updateEstimateSpan(userData) {
    // Find the estimate element
    let estimateElement = userData.bailElement.querySelector('.info-wrap .reason .bb-estimate-span')

    // Create the reason element if not done
    if (estimateElement == null) {
      estimateElement = createEstimateSpanElement(userData.estimateString)
      const reasonElement = userData.bailElement.querySelector('.info-wrap .reason')
      reasonElement.appendChild(document.createElement('br'))
      reasonElement.appendChild(estimateElement)
    }
    // Otherwise update it if the text content doesn't match the estimate string
    else if (estimateElement.textContent !== userData.estimateString) {
      // Update the estimate element
      estimateElement.textContent = userData.estimateString
    }
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
      eventTarget.dispatchEvent(new CustomEvent(EVENT_FILTER_RESULT_UPDATED, { userData: userData }))
    }
  }

  function updateBailVisibility(userData) {
    bailData.bailElement.style.display = (settings.filter.hideNonMatches && !userData.filterResult) ? 'none' : 'list-item'
  }

  function setHideNonMatches(hideNonMatches) {
    if (settings.filter.hideNonMatches === hideNonMatches) {
      return
    }
    settings.filter.hideNonMatches = hideNonMatches
    saveSettings()
    const event = new CustomEvent(EVENT_HIDE_NON_MATCHES_UPDATED, hideNonMatches)
    eventTarget.dispatchEvent(event)
  }

  // TODO updated docs
  function extractUserData(bailElement) {
    // User ID & name
    const userNameElement = bailElement.querySelector('.user.name')
    const id = userNameElement.href.split('=')[1]
    const name = userNameElement.title.split('[')[0].trim()

    // Time remaining in jail
    const timeElement = bailElement.querySelector('.info-wrap .time')
    const timeString = timeElement.textContent.trim()
    const minutes = timeToMinutes(timeString).toFixed(0)

    // User level
    const levelElement = bailElement.querySelector('.info-wrap .level')
    const level = parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim())

    const userData = {
      id: id,
      name: name,
      minutes: minutes,
      level: level,
      bailElement: bailElement,
    }

    GM_log("ESTIMATE EXTRACTED: " + userData.name+", estimate=" + userData.estimate)

    userData.true = matchesFilters(userData)

    return userData
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
    const match = timeString.match(TIME_REGEX)
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

  /**
   * Toggles the discount setting for a specific discount ID and updates the UI element if specified.
   *
   * @param {string} discountId - The unique identifier for the discount.
   * @param {boolean} hasDiscount - Indicates whether the discount is active (true) or inactive (false).
   * @param {boolean} updateElement - Determines whether the corresponding UI element should be updated.
   * @return {boolean} Returns true if settings was updated, false if not.
   */
  function setBailDiscount(discountId, hasDiscount, updateElement) {
    if (hasDiscount === discountId in settings.discounts) {
      return false
    }

    if (hasDiscount) {
      settings.discounts[discountId] = true
    }
    else {
      delete settings.discounts[discountId]
    }
    if (updateElement) {
      document.getElementById(`discount-${discountId}`).checked = hasDiscount
    }
    return true
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

      let settingsModified = false
      for (const [discountId, discount] of Object.entries(DISCOUNTS)) {
        settingsModified = setBailDiscount(discountId, discount.discountChecker(json), true) || settingsModified
      }

      if (settingsModified) {
        GM_log("SETTINGS MODIFIED, UPDATING ESTIMATE SPANS")
        updateAllEstimateSpans()
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
    const rootToggleLabel = document.querySelector('.bb-root-toggle-label')

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


  function findCheapestBail() { //TODO ensure being used
    let cheapest = null
    for (const userData of bailData.values()) {
      if (userData.matchesFilters && (cheapest === null || userData.estimate < cheapest.estimate)) {
        cheapest = userData
      }
    }
    return cheapest
  }

  // EVENT HANDLERS

  function onEstimateUpdated(event) {
    updateEstimateSpan(event.userData)
    updateFilterResult(event.userData)
  }

  function onFilterResultUpdated(event) {
    updateBailVisibility(event.userData)
  }

  function onHideNonMatchesUpdated(event) {
    bailData.values().forEach(updateBailVisibility)
  }

  function onBailVisibilityUpdated(event) {
    event.userData.bailElement.display = event.userData.visible
  }

})()