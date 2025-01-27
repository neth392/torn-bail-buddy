// ==UserScript==
// @name         Jail Bail Estimator & Easy Bailer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Displays a bail estimate and provides buttons to quickly bail someone out.
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

    const discounts = {
        'administrative-law': {
            displayName: 'Administrative Law',
            category: 'Education',
            amount: .05,
        },
        'use-of-force': {
            displayName: 'Use Of Force In International Law',
            category: 'Education',
            amount: .1,
        },
        'bachelor-law': {
            displayName: 'Bachelor Of Law',
            category: 'Education',
            amount: .5,
        },
        'law-firm-job': {
            displayName: 'Law Firm Job',
            category: 'Job',
            amount: .5,
        },
    }


    const defaultSettings = {
        collapsed: false,
        autoScroll: false,
        quickBuy: false,
        minBailEstimate: 0.0,
        maxBailEstimate: 100_000.0,
        apiKey: '',
        discounts: {},
    }

    const bailData = {}

    const storage_key = 'jail_bail_estimator'
    const settings = loadSettings()

    sanitizeSettings()

    const dollarFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    })

    let scrolled = false

    function loadSettings() {
        return GM_getValue(storage_key, defaultSettings)
    }

    function saveSettings() {
        GM_setValue(storage_key, settings)
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
        updateDisplayedBails(false)
    }

    // TODO decide if forceUpdate is needed
    function updateDisplayedBails(forceUpdate) {
        // Select the list of jailed users
        let jailedUserList = document.querySelectorAll('.user-info-list-wrap > li')

        // Iterate the list of jailed users
        jailedUserList.forEach((element, index) => {

            // TODO is this needed?
            const userData = extractUserData(element)

            // Store for quick bail functionality
            bailData[userData.id] = userData

            // Find the estimate element
            let estimateElement = element.querySelector('.info-wrap .reason .estimate-span')

            // Create the reason element if not done
            if (estimateElement == null) {
                GM_log("NULL!")
                estimateElement = createEstimateElement(userData.estimate)
                const reasonElement = element.querySelector('.info-wrap .reason')
                reasonElement.appendChild(document.createElement('br'))
                reasonElement.appendChild(estimateElement)
            }
            // Otherwise update it
            else if (forceUpdate) {
                GM_log("UPDATE!")
                // Update the estimate element
                estimateElement.textContent = formatEstimate(userData.estimate)
            }
        })

        if (settings.autoScroll && !scrolled) {
            scrolled = true
            window.scrollTo({
                top: document.body.scrollHeight,
            })
        }
    }

    function extractUserData(element) {
        const id = element.querySelector('.user.name').getAttribute('href').split('=')[1]

        const timeElement = element.querySelector('.info-wrap .time')
        const timeString = timeElement ? timeElement.textContent.trim() : null
        const minutes = timeToMinutes(timeString).toFixed(0)
        const levelElement = element.querySelector('.info-wrap .level')
        const level = levelElement ? parseFloat(levelElement.textContent.replace(/[^0-9]/g, '').trim()) : null
        return {
            id: id,
            minutes: minutes,
            level: level,
            estimate: calculateEstimate(level, minutes),
        }
    }

    function createEstimateElement(estimate) {
        const estimateElement = document.createElement('span')
        estimateElement.classList.add('estimate-span')
        estimateElement.style.color = 'var(--default-green-color)'
        estimateElement.textContent = formatEstimate(estimate)
        return estimateElement
    }

    function calculateEstimate(level, minutes) {
        let estimate = 100.0 * level * minutes

        let discountMultiplier = 1.0
        for (const discountId of settings.discounts) {
            discountMultiplier *= 1.0 - discounts[discountId].amount
        }

        return estimate * discountMultiplier
    }

    const timeRegex = /(?:(\d+)h )?(\d+)m/
    function timeToMinutes(timeString) {
        const match = timeString.match(timeRegex)
        if (match) {
            const hours = parseInt(match[1] || '0', 10)
            const minutes = parseInt(match[2], 10)
            return (hours * 60) + minutes
        }
        return -1
    }

    function formatEstimate(estimate) {
        return dollarFormat.format(estimate)
    }

    function isAPIKeyValid(apiKey) {
        //TODO
    }

    function validateAPIKey(apiKey) {
        if (!isAPIKeyValid(apiKey)){
            //TODO api key not valid
        }

        // TODO
    }

    // Create the main container
    const container = document.createElement('div')
    container.style.width = '100%'
    container.style.color = 'var(--default-color, #333)'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'center'
    container.style.alignItems = 'stretch'

    // Create a collapsible toggle button
    const toggleButton = document.createElement('button')
    toggleButton.textContent = '▼ Bail Estimator'
    toggleButton.style.display = 'block'
    toggleButton.style.width = '100%'
    toggleButton.style.borderRadius = '5px 5px 0px 0px'
    toggleButton.style.padding = '5px 0px 5px 5px'
    toggleButton.style.color = 'var(--tutorial-title-color)'
    toggleButton.style.textShadow = 'var(--tutorial-title-shadow)'
    toggleButton.style.cursor = 'pointer'
    toggleButton.style.textAlign = 'left'
    toggleButton.style.fontWeight = 'bold'
    toggleButton.style.backgroundClip = 'border-box'
    toggleButton.style.backgroundOrigin = 'border-box'
    toggleButton.style.backgroundImage = 'var(--title-black-gradient)'

    const gradient = getComputedStyle(document.documentElement).getPropertyValue('--title-black-gradient').trim()
    const reversedGradient = gradient.replace(/(\d+)deg/, (match, angle) => {
        return `${(parseInt(angle, 10) + 180) % 360}deg`;
    });


    // Hover effect
    toggleButton.addEventListener('mouseover', () => {
        toggleButton.style.backgroundImage = reversedGradient
    })

    toggleButton.addEventListener('mouseout', () => {
        toggleButton.style.backgroundImage = 'var(--title-black-gradient)'
    })

    toggleButton.addEventListener('mousedown', () => {
        toggleButton.style.backgroundImage = reversedGradient
    })

    toggleButton.addEventListener('mouseup', () => {
        toggleButton.style.backgroundImage = 'var(--title-black-gradient)'
    })


    // Create the content container
    const content = document.createElement('div')
    content.style.backgroundColor = 'var(--default-bg-panel-color)'
    content.style.borderRadius = '0px 0px 5px 5px'

    const updateContent = () => {
        content.style.display = settings.collapsed ? 'none' : 'block'
        toggleButton.textContent = settings.collapsed ? '► Bail Estimator' : '▼ Bail Estimator'
        toggleButton.style.borderRadius = settings.collapsed ? '5px' : '5px 5px 0px 0px'
    }

    updateContent()

    // Collapsible functionality
    toggleButton.addEventListener('click', () => {
        settings.collapsed = !settings.collapsed
        saveSettings()
        updateContent()
    })

    container.appendChild(toggleButton)

    // Divider (for looks)
    const divider = document.createElement('div')
    divider.style.borderBottomStyle = 'solid'
    divider.style.borderBottomWidth = '1px'
    divider.style.borderBottomColor = 'var(--title-divider-bottom-color)'
    divider.style.borderTopStyle = 'solid'
    divider.style.borderTopWidth = '1px'
    divider.style.borderTopColor = 'var(--title-divider-top-color)'
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
    apiKeyLabel.style.display = 'inline-block'
    apiKeyContainer.appendChild(apiKeyLabel)

    // Create the question mark icon
    const questionMark = document.createElement('span')
    questionMark.textContent = '?'
    questionMark.style.padding = '1px'
    questionMark.style.border = '1px solid var(--input-border-color, #ccc)'
    questionMark.style.borderRadius = '50%'
    questionMark.style.cursor = 'pointer'
    questionMark.style.display = 'inline-block'
    questionMark.style.textAlign = 'center'
    questionMark.style.width = '14px'
    questionMark.style.height = '14px'
    questionMark.style.verticalAlign = 'middle'
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
    input.type = 'text'
    input.id = 'apiKeyInput'
    input.value = settings.apiKey
    input.placeholder = 'Enter your API key'
    input.style.width = '25%'
    input.style.padding = '2px'
    input.style.caretColor = 'var(--bbc-input-color)'
    input.style.color = 'var(--bbc-input-color)'
    input.style.backgroundColor = 'var(--bbc-input-bg-color)'
    input.style.border = '1px solid var(--bbc-input-border-color)'
    input.style.borderRadius = '2px'
    input.style.display = 'inline-block'
    input.style.marginLeft = '5px'
    apiKeyContainer.appendChild(input)

    input.addEventListener('input', () => {
        settings.apiKey = input.value
        saveSettings()
    })

    // Create the validate button
    const validateButton = document.createElement('button')
    validateButton.textContent = 'Validate'
    validateButton.style.padding = '2px'
    validateButton.style.border = 'none'
    validateButton.style.borderRadius = '4px'
    validateButton.style.marginLeft = '5px'
    validateButton.style.backgroundColor = 'var(--default-blue-color)'
    validateButton.style.color = 'var(--default-black-color)'
    validateButton.style.cursor = 'pointer'
    validateButton.style.display = 'inline-block'
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
    validateButton.addEventListener('mouseup', () => {
        validateButton.style.backgroundColor = 'var(--default-blue-color)'
        // Update the API
        validateAPIKey(input.value)
    })

    // Bail Discounts
    const bailDiscountsContainer = document.createElement('div')
    bailDiscountsContainer.style.display = 'flex'
    bailDiscountsContainer.style.flexDirection = 'row'
    bailDiscountsContainer.style.justifyContent = 'flex-start'
    bailDiscountsContainer.style.alignItems = 'center'

    for (const discountId in discounts) {
        const discountContainer = document.createElement('div')
        discountContainer.style.display = 'flex'
        discountContainer.style.flexDirection = 'row'
        discountContainer.style.justifyContent = 'flex-start'
        discountContainer.style.alignItems = 'center'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `discount-${discountId}`
        checkbox.checked = discountId in settings.discounts

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                settings.discounts[discountId] = true
                GM_log("ADD:" + discountId)
            }
            else {
                delete settings.discounts[discountId]
                GM_log("REMOVE:" + discountId)
            }
            saveSettings()
            GM_log("SAVE")
        })

        const discountLabel = document.createElement('label')
        discountLabel.textContent = discounts[discountId].displayName

        discountContainer.appendChild(checkbox)
        discountContainer.appendChild(discountLabel)
        bailDiscountsContainer.appendChild(discountContainer)

    }

    content.appendChild(bailDiscountsContainer)

    // Add the API Key container to content
    content.appendChild(apiKeyContainer)

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