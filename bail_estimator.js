// ==UserScript==
// @name     Bail Buddy
// @namespace  http://tampermonkey.net/
// @version    1.0
// @description  A Torn.com Bail Buddy, filter, and bail-buy sniping tool
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

  const DISCOUNTS = Object.freeze({
    'administrative-law': Object.freeze({
      displayName: 'Administrative Law',
      category: 'Education',
      amount: .05,
      discountChecker: (response) => response.education_completed.includes(93),
    }),
    'use-of-force': Object.freeze({
      displayName: 'Use Of Force In International Law',
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
    quickBuy: false,
    minBailEstimate: 0.0,
    maxBailEstimate: 0.0,
    apiKey: '',
    showApiKey: true,
    discounts: Object.freeze({}),
  })

  const TIME_REGEX = /(?:(\d+)h )?(\d+)m/

  const DOLLAR_FORMAT = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

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
      gap: 4px;
    }
    
    .bb-horizontal-divider {
      border-bottom-style: solid;
      border-bottom-width: 1px;
      border-bottom-color: var(--title-divider-bottom-color);
      border-top-style: solid;
      border-top-width: 1px;
      border-top-color: var(--title-divider-top-color);
    }
    
    .bb-estimate-span {
      color: var(--default-green-color);
    }
    
    .bb-root {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    }
    
    .bb-root-toggle-button {
      width: 100%;
      cursor: pointer;
      background-clip: border-box;
      background-origin: border-box;
      background-image: ${titleBlackGradient};
      border-radius: 5px;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      padding: 2px 5px 2px 5px;
    }
    
    .bb-root-toggle-button-expanded {
      border-radius: 5px 5px 0px 0px !important;
    }
    
    .bb-root-toggle-button:hover {  
      background-image: ${titleBlackGradientReversed};
    }
    
    .bb-root-toggle-label {
      font-weight: bold;
      text-align: left;
      text-shadow: var(--tutorial-title-shadow);
      color: var(--tutorial-title-color);
    }
    
    .bb-content-container {
      background-color: var(--default-bg-panel-color);
      border-radius: 0px 0px 5px 5px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      padding: 5px;
    }
    
    .bb-content-container-collapsed {
      display: none !important;
    }
    
    .bb-api-key-container {
      display: inline-flex !important;
      padding-bottom: 4px;
      gap: 4px;
      align-items: start !important;
    }
    
    .bb-settings-label {
      font-size: 14px;
      color: var(--default-color);
      font-weight: bold;
    }
    
    .bb-api-key-tooltip-icon {
      padding: 1px;
      border: 1px solid var(--input-border-color);
      border-radius: 50%;
      cursor: pointer;
      text-align: center;
      width: 14px;
      height: 14px;
      line-height: 14px;
      background-color: var(--input-background-color);
    }
    
    .bb-api-key-tooltip {
      position: absolute;
      text-wrap: balance;
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
    
    .bb-api-key-input {
      min-width: 22%;
      padding: 2px;
      caret-color: var(--bbc-input-color);
      color: var(--bbc-input-color);
      background-color: var(--bbc-input-bg-color);
      border: 1px solid var(--bbc-input-border-color);
      border-radius: 4px;
    }
    
    .bb-api-key-hide-input-button {
      cursor: pointer;
      font-size: 16px;
      padding: 0px;
      border: none;
      text-align: center;
      line-height: 1;
      margin-left: -4px;
    }
    
    .bb-api-key-validate-button {
      padding: 2px;
      border: none;
      border-radius: 4px;
      background-color: var(--default-blue-color);
      color: var(--default-black-color);
      cursor: pointer;
    }
    
    .bb-api-key-validate-button:hover {
      background-color: var(--default-blue-hover-color);
    }
    
    .bb-api-key-validate-button-response {
      line-height: 1;
      font-size: 14px;
    }
    
    .bb-bail-discount-container {
      gap: 4px;
    }
    
    .bb-bail-discount {
      gap: 4px;
    }
    
    .bb-bail-filter-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-start !important;
      align-items: flex-start !important;
    }
    
  `
  document.head.appendChild(style)

  const rootContainer = document.createElement('div')
  rootContainer.innerHTML = `
  <div class="bb-root bb-flex-column">
    <button class="bb-root-toggle-button">
      <span class="bb-root-toggle-label">${PROJECT_NAME}</span>
    </button>
    <div class="bb-horizontal-divider"></div>
    <div class="bb-content-container">
      <div class="bb-flex-row bb-api-key-container">
        <label class="bb-api-key-label">API Key</label>
        <span class="bb-api-key-tooltip-icon">?</span>
        <div class="bb-api-key-tooltip">
          Optionally use a minimal access API key to update the below fields. The API Key is only stored in your browser 
          and no requests are made to Torn's API without clicking the Validate button. Remember to click it after 
          completing a bail-reducing education course or joining/leaving a Law Firm job.
        </div>
        <input class="bb-api-key-input" placeholder="Enter your API key" value="${settings.apiKey}" />
        <button class="bb-api-key-hide-input-button"></button>
        <button class="bb-api-key-validate-button">Validate</button>
        <span class="bb-api-key-validate-button-response"></span>
      </div>
      <div class="bb-flex-row">
        <div class="bb-bail-discount-container bb-flex-column">
          <span class="bb-settings-label">Bail Discounts</span>
        </div>
        <div class="bb-bail-filter-container">
          <span class="bb-settings-label">Bail Filter</span>
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
  document.querySelector('.bb-root-toggle-button').addEventListener('click', () => {
    settings.rootCollapsed = !settings.rootCollapsed
    updateRootCollapsed()
    saveSettings()
  })

  // Hovering/clicking of tooltip icon
  const apiKeyTooltipIcon = document.querySelector('.bb-api-key-tooltip-icon')
  const apiKeyTooltip = document.querySelector('.bb-api-key-tooltip')
  apiKeyTooltipIcon.addEventListener('mouseover', () => {
    apiKeyTooltip.style.display = 'block'
  })
  apiKeyTooltipIcon.addEventListener('mouseout', () => {
    apiKeyTooltip.style.display = 'none'
  })
  apiKeyTooltipIcon.addEventListener('click', () => {
    apiKeyTooltip.style.display = apiKeyTooltip.style.display === 'none' ? 'block' : 'none'
  })

  // Tooltip positioning
  apiKeyTooltipIcon.addEventListener('mousemove', (event) => {
    apiKeyTooltip.style.top = `${event.clientY + 15}px`
    apiKeyTooltip.style.left = `${event.clientX + 15}px`
  })

  // API Key input handling
  const apiKeyInput = document.querySelector('.bb-api-key-input')
  apiKeyInput.value = settings.apiKey
  apiKeyInput.addEventListener('input', () => {
    settings.apiKey = apiKeyInput.value
    saveSettings()
  })

  // API Key visibility handling
  document.querySelector('.bb-api-key-hide-input-button').addEventListener('click', () => {
    settings.showApiKey = !settings.showApiKey
    updateApiKeyInputVisibility()
    saveSettings()
  })

  // Validate button click handling
  const apiKeyValidateButton = document.querySelector('.bb-api-key-validate-button')
  apiKeyValidateButton.addEventListener('click', async () => {
    apiKeyValidateButton.disabled = true
    displayValidateResponseText('Validating...', 'var(--default-yellow-color)', 999_999)
    // Update the API
    const response = await validateAPIKey(settings.apiKey)
    if (response === "OK") {
      displayValidateResponseText('Bail Discounts Updated!', 'var(--default-green-color)')
    }
    else {
      displayValidateResponseText('Error: ' + response.message, 'var(--default-red-color)')
    }
    apiKeyValidateButton.disabled = false
  })

  // Add the discount elements
  const discountContainer = document.querySelector('.bb-bail-discount-container')
  for (const [discountId, discount] of Object.entries(DISCOUNTS)) {
    const discountElement = document.createElement('div')
    discountElement.innerHTML = `
    <div class="bb-bail-discount bb-flex-row">
        <input class="bb-checkbox" type="checkbox" id="discount-${discountId}"/>
        <label class="bb-generic-text" for="discount-${discountId}">${discount.displayName}</label>
    </div>
    `
    discountContainer.appendChild(discountElement)

    const checkboxElement = document.querySelector(`#discount-${discountId}`)
    // Update if it is checked or not
    checkboxElement.checked = discountId in settings.discounts
    checkboxElement.addEventListener('change', () => {
      setBailDiscount(discountId, checkboxElement.checked, false)
      updateAllDisplayedBails()
      saveSettings()
    })
  }

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

  /**
   * Handles a list of mutation records on the jailed user list by filtering for mutations of type 'childList'
   * and executing a handler function for each relevant mutation.
   *
   * @param {MutationRecord[]} mutationList - The list of mutation records to process.
   */
  function listMutationCallback(mutationList) {
    if (mutationList.filter((mutation) => mutation.type === 'childList').length > 0) {
      GM_log("Update displayed bails") // TODO remove
      updateAllDisplayedBails()
    }
  }


  /**
   * Updates the displayed information for all jailed users by iterating
   * through elements having the specified class and applying the
   * `updateDisplayedBail` function to each one.
   *
   * @return {void} Does not return a value.
   */
  function updateAllDisplayedBails() {
    // Select the list of jailed users
    const jailedUserList = document.querySelectorAll('.user-info-list-wrap > li')

    // Iterate the list of jailed users
    jailedUserList.forEach((bailElement, index) => updateDisplayedBail(bailElement))
  }

  /**
   * Updates the displayed bail information in the UI for a given bail element.
   * This includes extracting user data, saving it for functionality purposes, and updating or creating
   * necessary UI elements to reflect the latest data.
   *
   * @param {HTMLElement} bailElement - The HTML element containing bail information to be processed and updated.
   * @return {void}
   */
  function updateDisplayedBail(bailElement) {
    const userData = extractUserData(bailElement)

    // Store in bail data for bail sniper functionality
    bailData[userData.id] = userData

    // Find the estimate element
    let estimateElement = bailElement.querySelector('.info-wrap .reason .bb-estimate-span')

    // Create the reason element if not done
    if (estimateElement == null) {
      estimateElement = createEstimateSpanElement(userData.estimateString)
      const reasonElement = bailElement.querySelector('.info-wrap .reason')
      reasonElement.appendChild(document.createElement('br'))
      reasonElement.appendChild(estimateElement)
    }
    // Otherwise update it if the text content doesn't match the estimate string
    else if (estimateElement.textContent !== userData.estimateString) {
      // Update the estimate element
      estimateElement.textContent = userData.estimateString
    }
  }

  /**
   * Extracts the jailed user's data from the given element.
   *
   * @param {Element} element - The DOM element containing the user information.
   * @return {Object} An object containing the extracted user data, including:
   *                  - `id` (string): The user's unique identifier.
   *                  - `minutes` (number): The time remaining in jail, converted to minutes.
   *                  - `level` (number): The user's level as a numerical value.
   *                  - `estimate` (number): The calculated estimate based on level and remaining time.
   *                  - `estimateString` (string): The formatted estimate value.
   */
  function extractUserData(element) {
    // User ID
    const id = element.querySelector('.user.name').getAttribute('href').split('=')[1]

    // Time remaining in jail
    const timeElement = element.querySelector('.info-wrap .time')
    const timeString = timeElement.textContent.trim()
    const minutes = timeToMinutes(timeString).toFixed(0)

    // User level
    const levelElement = element.querySelector('.info-wrap .level')
    const level = parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim())

    // Estimate & estimate string
    const estimate = calculateEstimate(level, minutes)
    const estimateString = formatEstimate(estimate)

    return {
      id: id,
      minutes: minutes,
      level: level,
      estimate: estimate,
      estimateString: estimateString,
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
   * Toggles the discount setting for a specific discount ID and updates the UI element if specified.
   *
   * @param {string} discountId - The unique identifier for the discount.
   * @param {boolean} hasDiscount - Indicates whether the discount is active (true) or inactive (false).
   * @param {boolean} updateElement - Determines whether the corresponding UI element should be updated.
   * @return {void}
   */
  function setBailDiscount(discountId, hasDiscount, updateElement) {
    if (hasDiscount) {
      settings.discounts[discountId] = true
      saveSettings()
    }
    else {
      delete settings.discounts[discountId]
      saveSettings()
    }
    if (updateElement) {
      document.querySelector(`#discount-${discountId}`).checked = hasDiscount
    }
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

      for (const [discountId, discount] of Object.entries(DISCOUNTS)) {
        setBailDiscount(discountId, discount.discountChecker(json), true)
      }
      updateAllDisplayedBails()

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
    const responseElement = document.querySelector('.bb-api-key-validate-button-response')
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
    const contentContainer = document.querySelector('.bb-content-container')
    const contentDivider = document.querySelector('.bb-horizontal-divider')
    const rootToggleButton = document.querySelector('.bb-root-toggle-button')
    const rootToggleLabel = document.querySelector('.bb-root-toggle-label')

    if (settings.rootCollapsed) {
      contentContainer.classList.add('bb-content-container-collapsed')
      contentDivider.classList.add('bb-content-container-collapsed')
      rootToggleButton.classList.remove('bb-root-toggle-button-expanded')
    }
    else {
      contentContainer.classList.remove('bb-content-container-collapsed')
      contentDivider.classList.remove('bb-content-container-collapsed')
      rootToggleButton.classList.add('bb-root-toggle-button-expanded')
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
    document.querySelector('.bb-api-key-input').type = settings.showApiKey ? 'text' : 'password'
    document.querySelector('.bb-api-key-hide-input-button').textContent = settings.showApiKey ? '🙈' : '👁️'
  }

})()