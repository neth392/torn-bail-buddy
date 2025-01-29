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

  // TODO remove
  GM_log('STARTING!')

  const projectName = 'Bail Buddy'

  const style = document.createElement('style')
  style.type = 'text/css'

  const titleBlackGradient = getComputedStyle(document.documentElement).getPropertyValue('--title-black-gradient').trim()
  const titleBlackGradientReversed = titleBlackGradient.replace(/(\d+)deg/, (match, angle) => {
    return `${(parseInt(angle, 10) + 180) % 360}deg`;
  });


  style.innerHTML = `
  
    .bb-root {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
    }
    
    .bb-root-toggle-button {
      width: 100%;
      cursor: pointer;
      background-clip: border-box;
      background-origin: border-box;
      background-image: var(--title-black-gradient);
      border-radius: 5px 5px 5px 5px;
      display: flex;
      flex-direction: row;
      justify-content: flex-start';
      align-items: 'center';
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
    
    .bb-root-toggle-label::after {
      content: '${projectName}';
    }
    
    .bb-content-container {
      background-color: var(--default-bg-panel-color);
      border-radius: 0px 0px 5px 5px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    }
    
    .bb-content-container-collapsed {
      display: none !important;
    }
    
    .bb-generic-text {
      font-size: 12px;
      color: var(--default-color);
    }
    
    .bb-horizontal-divider {
      border-bottom-style: solid;
      border-bottom-width: 1px;
      border-bottom-color: var(--title-divider-bottom-color);
      border-top-style: solid;
      border-top-width: 1px;
      border-top-color: var(--title-divider-top-color);
    }
    
    .bb-api-key-container {
      padding: 5px 0px 5px 5px;
      display: inline-flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: center;
      gap: 4px;
    }
    
    .bb-api-key-label {
      font-size: 14px;
      color: var(--default-color);
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
    
    .bb-toggle-menu-collapsed::before {
      content: '► ';
    }
    
    .bb-toggle-menu-expanded::before {
      content: '▼ ';
    }
    
  `

  document.head.appendChild(style)

  const apiURL = 'https://api.torn.com/user/?selections=education,profile&key='

  const discounts = {
    'administrative-law': {
      displayName: 'Administrative Law',
      category: 'Education',
      amount: .05,
      discountChecker: (response) => response.education_completed.includes(93),
    },
    'use-of-force': {
      displayName: 'Use Of Force In International Law',
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

  Object.freeze(discounts)


  const defaultSettings = {
    collapsed: false,
    autoScroll: false,
    quickBuy: false,
    minBailEstimate: 0.0,
    maxBailEstimate: 0.0,
    apiKey: '',
    showApiKey: true,
    discounts: {},
  }

  Object.freeze(defaultSettings)

  const timeRegex = /(?:(\d+)h )?(\d+)m/

  const dollarFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const bailData = {}

  const storageKey = 'jail_bail_estimator'
  const settings = loadSettings()

  sanitizeSettings()

  function loadSettings() {
    return GM_getValue(storageKey, defaultSettings)
  }

  function saveSettings() {
    GM_setValue(storageKey, settings)
  }

  function sanitizeSettings() {
    let saveRequired = false
    // Add missing settings
    for (const key in defaultSettings) {
      if (!(key in settings)) {
        settings[key] = defaultSettings[key]
        saveRequired = true
      }
    }
    // Remove old settings
    for (const key in settings) {
      if (!(key in defaultSettings)) {
        delete settings[key]
        saveRequired = true
      }
    }
    if (saveRequired) {
      saveSettings()
    }
  }

  function listMutationCallback(mutationList, observer) {
    mutationList.filter((mutation) => mutation.type === 'childList').forEach(handleListMutation)
  }

  function handleListMutation(mutation) {
    updateAllDisplayedBails()
  }

  // TODO decide if forceUpdate is needed
  function updateAllDisplayedBails() {
    // Select the list of jailed users
    const jailedUserList = document.querySelectorAll('.user-info-list-wrap > li')

    // Iterate the list of jailed users
    jailedUserList.forEach((bailElement, index) => updateDisplayedBail(bailElement))
  }

  function updateDisplayedBail(bailElement) {
    // TODO is this needed?
    const userData = extractUserData(bailElement)

    // Store for quick bail functionality
    bailData[userData.id] = userData

    // Find the estimate element
    let estimateElement = bailElement.querySelector('.info-wrap .reason .estimate-span')

    // Create the reason element if not done
    if (estimateElement == null) {
      estimateElement = createEstimateElement(userData.estimateString)
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

  // Extracts the userdata from the element
  function extractUserData(element) {
    // User ID
    const id = element.querySelector('.user.name').getAttribute('href').split('=')[1]

    // Time remaining in jail
    const timeElement = element.querySelector('.info-wrap .time')
    const timeString = timeElement ? timeElement.textContent.trim() : null
    const minutes = timeToMinutes(timeString).toFixed(0)

    // User level
    const levelElement = element.querySelector('.info-wrap .level')
    const level = levelElement ? parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim()) : null

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

  // Constructs the estimate element with the estimateString displayed
  function createEstimateElement(estimateString) {
    const estimateElement = document.createElement('span')
    estimateElement.classList.add('estimate-span')
    estimateElement.style.color = 'var(--default-green-color)'
    estimateElement.textContent = estimateString
    return estimateElement
  }

  // Calculates the estimate based on level & minutes, accounting for discounts in settings
  function calculateEstimate(level, minutes) {
    let estimate = 100.0 * level * minutes

    let discountMultiplier = 1.0
    for (const discountId in settings.discounts) {
      discountMultiplier *= 1.0 - discounts[discountId].amount
    }

    return estimate * discountMultiplier
  }


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


  // Converts time to minutes
  function timeToMinutes(timeString) {
    const match = timeString.match(timeRegex)
    if (match) {
      const hours = parseInt(match[1] || '0', 10)
      const minutes = parseInt(match[2], 10)
      return (hours * 60) + minutes
    }
    return -1
  }

  // Formats the estimate into a US dollar format
  function formatEstimate(estimate) {
    return dollarFormat.format(estimate)
  }

  async function validateAPIKey(apiKey) {
    try {
      GM_log("API START")
      const response = await fetch(apiURL + apiKey, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json =  await response.json()
      if ("error" in json) {
        return new Error(json.error.error)
      }

      for (const [discountId, discount] of Object.entries(discounts)) {
        setBailDiscount(discountId, discount.discountChecker(json), true)
        updateAllDisplayedBails()
      }

      return "OK"
    }
    catch (error) {
      return error
    }
  }

  // Updates the root toggle button's style
  function updateRootToggleButton() {
    const rootToggleButton = document.querySelector('.bb-root-toggle-button')
    if (settings.collapsed) {
      rootToggleButton.classList.remove('bb-root-toggle-button-expanded')
    }
    else {
      rootToggleButton.classList.add('bb-root-toggle-button-expanded')
    }
  }

  updateRootToggleButton()

  function updateRootToggleLabel() {
    const rootToggleLabel = document.querySelector('.bb-root-toggle-label')
    rootToggleLabel.classList.add('bb-toggle-menu-' + (settings.collapsed ? 'collapsed' : 'expanded'))
    rootToggleLabel.classList.remove('bb-toggle-menu-' + (!settings.collapsed ? 'collapsed' : 'expanded'))
  }

  updateRootToggleLabel()

  function updateContentContainer() {
    const contentContainer = document.querySelector('.bb-content-container')
    if (settings.collapsed) {
      contentContainer.classList.add('bb-content-container-collapsed')
    }
    else {
      contentContainer.classList.remove('bb-content-container-collapsed')
    }
    contentContainer.style.display = settings.collapsed ? 'none' : 'block'
  }

  updateContentContainer()

  // Collapsible UI functionality
  document.querySelector('.bb-root-toggle-button').addEventListener('click', () => {
    settings.collapsed = !settings.collapsed
    updateRootToggleButton()
    updateRootToggleLabel()
    updateContentContainer()
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
  // Position the tooltip
  apiKeyTooltipIcon.addEventListener('mousemove', (event) => {
    apiKeyTooltip.style.top = `${event.clientY + 15}px`
    apiKeyTooltip.style.left = `${event.clientX + 15}px`
  })

  const apiKeyInput = document.querySelector('.bb-api-key-input')
  apiKeyInput.value = settings.apiKey

  apiKeyInput.addEventListener('input', () => {
    settings.apiKey = apiKeyInput.value
    saveSettings()
  })

  function updateApiKeyInput () {
    const apiKeyInput = document.querySelector('.bb-api-key-input')
    apiKeyInput.type = settings.showApiKey ? 'text' : 'password'
  }

  updateApiKeyInput()

  function updateHideApiKeyButton() {
    document.querySelector('.bb-api-key-hide-input-button').textContent = settings.showApiKey ? '🙈' : '👁️'
  }

  updateHideApiKeyButton()

  document.querySelector('bb-api-key-hide-input-button').addEventListener('click', () => {
    settings.showApiKey = !settings.showApiKey
    updateHideApiKeyButton()
    updateApiKeyInput()
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

  let apiKeyValidateButtonTimeoutId = null

  function displayValidateResponseText(text, color, displayTime = 5_000) {
    clearValidateResponseText()
    const apiKeyValidateResponse = document.querySelector('.bb-api-key-validate-button-response')
    apiKeyValidateResponse.textContent = text
    apiKeyValidateResponse.style.color = color
    apiKeyValidateButtonTimeoutId = setTimeout(clearValidateResponseText, displayTime)
  }

  function clearValidateResponseText(){
    if (apiKeyValidateButtonTimeoutId != null) {
      clearTimeout(apiKeyValidateButtonTimeoutId)
      apiKeyValidateButtonTimeoutId = null
    }
    document.querySelector('.bb-api-key-validate-button-response').textContent = ''
  }

  const rootContainer = document.createElement('div')
  rootContainer.innerHTML = `
  <div class="bb-root">
    <button class="bb-root-toggle-button"/>
    <span class="bb-root-toggle-label"/>
    <div class="bb-content-container">
      <div class="bb-horizontal-divider"/>
      
      <div class="bb-api-key-container">
        <label class="bb-api-key-label">API Key</label>
        <span class="bb-api-key-tooltip-icon">?</span>
        <div class="bb-api-key-tooltip">
          Optionally use a minimal access API key to update the below fields. The API Key is only stored in your browser 
          and no requests are made to Torn's API without clicking the Validate button. Remember to click it after 
          completing a bail-reducing education course or joining/leaving a Law Firm job.
        </div>
        <input class="bb-api-key-input" placeholder="Enter your API key" />
        <button class="bb-api-key-hide-input-button" />
        <button class="bb-api-key-validate-button">Validate</button>
        <span class="bb-api-key-validate-button-response" />
      </div>
      
    </div>
  </div>
  `

  // Bail Discounts
  const bailDiscountsContainer = document.createElement('div')
  bailDiscountsContainer.textContent = 'Bail Discounts'
  bailDiscountsContainer.style.fontSize = '12px'
  bailDiscountsContainer.style.fontWeight = 'bold'
  bailDiscountsContainer.style.display = 'flex'
  bailDiscountsContainer.style.flexDirection = 'column'
  bailDiscountsContainer.style.justifyContent = 'center'
  bailDiscountsContainer.style.alignItems = 'flex-start'
  bailDiscountsContainer.style.padding = '5px'

  for (const [discountId, discount] of Object.entries(discounts)) {
    const discountContainer = document.createElement('div')
    discountContainer.style.display = 'flex'
    discountContainer.style.flexDirection = 'row'
    discountContainer.style.justifyContent = 'flex-start'
    discountContainer.style.alignItems = 'center'
    discountContainer.style.gap = '4px'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = `discount-${discountId}`
    checkbox.checked = discountId in settings.discounts

    checkbox.addEventListener('change', () => {
      setBailDiscount(discountId, checkbox.checked)
      saveSettings()
      updateAllDisplayedBails()
      GM_log("SAVE")
    })

    discountContainer.appendChild(checkbox)

    const discountLabel = document.createElement('label')
    discountLabel.textContent = discount.displayName
    discountLabel.style.color = 'var(--default-color)'
    discountLabel.style.fontSize = '12px'
    discountLabel.style.fontWeight = 'normal'
    discountContainer.appendChild(discountLabel)

    bailDiscountsContainer.appendChild(discountContainer)

  }

  // Add the bail discounts container
  contentContainer.appendChild(bailDiscountsContainer)

  // Append the content container to the main container
  rootContainer.appendChild(contentContainer)

  // Add the container to the page
  const userListWrapperElement = document.querySelector('.userlist-wrapper')
  userListWrapperElement.insertBefore(rootContainer, userListWrapperElement.firstChild)

  // Observe the list for changes
  const listObserverConfig = { childList: true, subtree: true }
  const listObserver = new MutationObserver(listMutationCallback)
  const listNode = document.querySelector('.user-info-list-wrap')
  listObserver.observe(listNode, listObserverConfig)

  // TODO remove
  GM_log('ENDED!')

})()