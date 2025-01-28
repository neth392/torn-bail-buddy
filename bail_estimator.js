// ==UserScript==
// @name         Bail Buddy
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A Torn.com Bail Buddy, filter, and bail-buy sniping tool
// @author       neth [3564828]
// @match        https://www.torn.com/jailview.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_log
// ==/UserScript==

(function() {

    // TODO remove
    GM_log('STARTING!')

    const style = document.createElement('style')
    style.type = 'text/css'


    style.innerHTML = `
        .bb-togglebar {
        }
        
        .bb-container {
          display: flex;  
        }
        
        .bb-container-toggle {
          width: 100%;
          border-radius: 5px 5px 0px 0px;
          color: var(--default-color);
          font-weight: bold;
          text-align: left;
          padding: 5px;
          cursor: pointer;
          text-shadow: var(--tutorial-title-shadow);
          background-clip: border-box;
          background-origin: border-box;
        }
        
        .bb-container-not-hovered {
          background-image: var(--title-background-gradient);
        }
        
        .bb-container-hovered {    
          background-image: var(--btn-active-background);
        }
        
        .bb-generic-text {
          font-size: 12px;
          color: var(--default-color);
        }
        
        .bb-horizontal-divider {
            bottom-border-width: 1px;
            bottom-border-color: var(--title-divider-bottom-color);
            top-border-style: solid;
            top-border-width: 1px;
            top-border-color: var(--title-divider-top-color);
        }
        
        .bb-api-key-input {
          width: 22%;
          padding: 2px;
          caret-color: var(--bbc-input-color);
          color: var(--bbc-input-color);
          background-color: var(--bbc-input-bg-color);
          border: 1px solid var(--bbc-input-border-color);
          border-radius: 2px;
          margin-left: 5px; 
        }
        
        .bb-validate-api-key-button {
          padding: 2px;
          border: none;
          border-radius: 4px;
          margin-left: 5px;
          background-color: var(--default-blue-color);
          color: var(--default-black-color);
          cursor: pointer;
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

    // Create the main container
    const container = document.createElement('div')
    container.classList.add('bb-container')
    container.style.width = '100%'
    container.style.color = 'var(--default-color, #333)'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'stretch'

    // Create a collapsible toggle button
    const containerToggle = document.createElement('button')
    containerToggle.classList.add('bb-container-toggle', 'bb-container-not-hovered')


    // Hover effect
    containerToggle.addEventListener('mouseover', () => {
        containerToggle.classList.add('bb-container-hovered')
        containerToggle.classList.remove('bb-container-not-hovered')
    })

    containerToggle.addEventListener('mousedown', () => {
        containerToggle.classList.add('bb-container-hovered')
        containerToggle.classList.remove('bb-container-not-hovered')
    })

    containerToggle.addEventListener('mouseout', () => {
        containerToggle.classList.add('bb-container-not-hovered')
        containerToggle.classList.remove('bb-container-hovered')
    })

    containerToggle.addEventListener('mouseup', () => {
        containerToggle.classList.add('bb-container-not-hovered')
        containerToggle.classList.remove('bb-container-hovered')
    })


    // Create the content container
    const content = document.createElement('div')
    content.style.backgroundColor = 'var(--default-bg-panel-color)'
    content.style.borderRadius = '0px 0px 5px 5px'

    const updateContent = () => {
        content.style.display = settings.collapsed ? 'none' : 'block'
        containerToggle.textContent = (settings.collapsed ? '► ' : '▼ ') + 'Bail Buddy'
        containerToggle.style.borderRadius = settings.collapsed ? '5px' : '5px 5px 0px 0px'
    }

    updateContent()

    // Collapsible functionality
    containerToggle.addEventListener('click', () => {
        settings.collapsed = !settings.collapsed
        saveSettings()
        updateContent()
    })

    container.appendChild(containerToggle)

    // Divider (for looks)
    const divider = document.createElement('div')
    divider.classList.add('bb-horizontal-divider')
    content.appendChild(divider)

    // API Key container
    const apiKeyContainer = document.createElement('div')
    apiKeyContainer.style.padding = '5px 0px 5px 5px'
    apiKeyContainer.style.display = 'flex'
    apiKeyContainer.style.flexDirection = 'row'
    apiKeyContainer.style.justifyContent = 'flex-start'
    apiKeyContainer.style.alignItems = 'center'

    // Create the label for the API key field
    const apiKeyLabel = document.createElement('apiKeyLabel')
    apiKeyLabel.textContent = 'API Key'
    apiKeyLabel.style.fontSize = '14px'
    apiKeyLabel.style.textWrap = 'nowrap'
    apiKeyContainer.appendChild(apiKeyLabel)

    // Create the question mark icon
    const questionMark = document.createElement('span')
    questionMark.textContent = '?'
    questionMark.style.padding = '1px'
    questionMark.style.border = '1px solid var(--input-border-color, #ccc)'
    questionMark.style.borderRadius = '50%'
    questionMark.style.cursor = 'pointer'
    questionMark.style.textAlign = 'center'
    questionMark.style.width = '14px'
    questionMark.style.height = '14px'
    questionMark.style.lineHeight = '14px'
    questionMark.style.marginLeft = '4px'
    questionMark.style.backgroundColor = 'var(--input-background-color, #fff)'

    // Tooltip functionality
    const tooltip = document.createElement('div')
    tooltip.textContent = 'Optionally use a minimal access API key to update the below fields. The API Key is only ' +
        'stored in your browser and no requests are made to Torn\'s API without clicking the Validate button. Remember to click it ' +
        'after completing a bail-reducing education course or joining/leaving a Law Firm job.'
    tooltip.style.position = 'absolute'
    tooltip.style.textWrap = 'balance'
    tooltip.style.maxWidth = '25%'
    tooltip.style.borderRadius = '4px'
    tooltip.style.padding = '5px'
    tooltip.style.fontSize = '14px'
    tooltip.style.borderColor = 'var(--tooltip-border-color)'
    tooltip.style.backgroundColor = 'var(--tooltip-bg-color)'
    tooltip.style.color = 'var(--default-color)'
    tooltip.style.boxShadow = 'var(--tooltip-shadow)'
    tooltip.style.display = 'none'
    tooltip.style.boxSizing = 'border-box'
    tooltip.style.zIndex = '10'

    // Hover effect
    questionMark.addEventListener('mouseover', () => {
        tooltip.style.display = 'block'
    })
    questionMark.addEventListener('mouseout', () => {
        tooltip.style.display = 'none'
    })
    questionMark.addEventListener('click', () => {
        tooltip.style.display = tooltip.style.display === 'none' ? 'block' : 'none'
    })

    // Position the tooltip
    questionMark.addEventListener('mousemove', (e) => {
        tooltip.style.top = `${e.clientY + 15}px`
        tooltip.style.left = `${e.clientX + 15}px`
    })

    // Append the tooltip and question mark
    apiKeyContainer.appendChild(questionMark)
    apiKeyContainer.appendChild(tooltip)

    // Create the input field for the API key
    const input = document.createElement('input')
    input.id = 'apiKeyInput'
    input.value = settings.apiKey
    input.placeholder = 'Enter your API key'
    input.classList.add('bb-api-key-input')

    input.addEventListener('input', () => {
        settings.apiKey = input.value
        saveSettings()
    })

    // Toggle showing/hiding API key (for security purposes)
    const hideInputToggle = document.createElement('button')
    hideInputToggle.style.cursor = 'pointer'
    hideInputToggle.style.fontSize = '16px'

    const updateHideApiKeyToggle = () => {
        hideInputToggle.innerHTML = settings.showApiKey ? '🙈' : '👁️'
        input.type = settings.showApiKey ? 'text' : 'password'
    }

    updateHideApiKeyToggle()

    hideInputToggle.addEventListener('click', () => {
        settings.showApiKey = !settings.showApiKey
        saveSettings()
        updateHideApiKeyToggle()
    })

    apiKeyContainer.appendChild(input)
    apiKeyContainer.appendChild(hideInputToggle)

    // Create the validate button
    const validateButton = document.createElement('button')
    validateButton.textContent = 'Validate'
    validateButton.classList.add('bb-validate-api-key-button')
    apiKeyContainer.appendChild(validateButton)

    // Validate button response
    const validateButtonResponse = document.createElement('span')
    validateButtonResponse.textContent = ''
    validateButtonResponse.style.marginLeft = '5px'
    validateButtonResponse.style.color = 'var(--default-color)'
    apiKeyContainer.appendChild(validateButtonResponse)

    // Validate button click handling
    validateButton.addEventListener('mousedown', () => {
        validateButton.style.backgroundColor = 'var(--default-blue-hover-color)'
    })
    validateButton.addEventListener('mouseup', async () => {
        validateButton.style.backgroundColor = 'var(--default-blue-color)'
        validateButton.disabled = true
        GM_log("PRESSED")
        displayValidateResponseText('Validating...', 'var(--default-yellow-color)', 999_999)
        // Update the API
        const response = await validateAPIKey(input.value)
        if (response === "OK") {
            displayValidateResponseText('Bail Discounts Updated!', 'var(--default-green-color)')
        }
        else {
            displayValidateResponseText('Error: ' + response.message, 'var(--default-red-color)')
        }
        validateButton.disabled = false
    })

    let validateButtonTimeoutId = null

    function displayValidateResponseText(text, color, displayTime = 5_000) {
        clearValidateResponseText()
        validateButtonResponse.textContent = text
        validateButtonResponse.style.color = color
        validateButtonTimeoutId = setTimeout(clearValidateResponseText, displayTime)
    }

    function clearValidateResponseText() {
        if (validateButtonTimeoutId != null) {
            clearTimeout(validateButtonTimeoutId)
            validateButtonTimeoutId = null
        }
        validateButtonResponse.textContent = ''
    }


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

    // Add the API Key container to content
    content.appendChild(apiKeyContainer)

    // Add the bail discounts container
    content.appendChild(bailDiscountsContainer)

    // Append the content container to the main container
    container.appendChild(content)

    // Add the container to the page
    const userListWrapperElement = document.querySelector('.userlist-wrapper')
    userListWrapperElement.insertBefore(container, userListWrapperElement.firstChild)

    // Observe the list for changes
    const listObserverConfig = { childList: true, subtree: true }
    const listObserver = new MutationObserver(listMutationCallback)
    const listNode = document.querySelector('.user-info-list-wrap')
    listObserver.observe(listNode, listObserverConfig)

    // TODO remove
    GM_log('ENDED!')

})()